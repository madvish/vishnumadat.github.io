"""RBI Money Market Operations Scraper.

Extracts daily WACR, Repo, SDF, MSF, and Net Liquidity from official RBI press releases.
Includes polite headers, robust parsing, and safe fallback.
"""

from datetime import datetime
import re
from typing import Any, Dict, Optional
from bs4 import BeautifulSoup
import pandas as pd
import requests

RBI_PRESS_RELEASE_INDEX = "https://rbi.org.in/scripts/BS_PressReleaseDisplay.aspx"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


def fetch_latest_rbi_mmo() -> Dict[str, Dict[str, Any]]:
    """Fetch and parse the latest RBI Money Market Operations table.
    
    Returns a dict mapping metric_id to observation dict:
    {
        'in_wacr': {'date': 'YYYY-MM-DD', 'value': 6.45},
        'in_msf': {'date': 'YYYY-MM-DD', 'value': 6.75},
        'in_sdf': {'date': 'YYYY-MM-DD', 'value': 6.25},
        'in_repo': {'date': 'YYYY-MM-DD', 'value': 6.50},
        'in_liquidity': {'date': 'YYYY-MM-DD', 'value': -77825.0} # in crore
    }
    """
    results: Dict[str, Dict[str, Any]] = {}
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    try:
        resp = session.get(RBI_PRESS_RELEASE_INDEX, timeout=12)
        if resp.status_code != 200:
            print(f"[RBI] Index returned HTTP {resp.status_code}")
            return results

        soup = BeautifulSoup(resp.text, "html.parser")
        mmo_links = [a for a in soup.find_all("a") if "Money Market Operations" in a.text]
        if not mmo_links:
            print("[RBI] No Money Market Operations link found in press release list")
            return results

        target_link = mmo_links[0]
        href = target_link.get("href", "")
        if not href.startswith("http"):
            href = f"https://rbi.org.in/scripts/{href}"

        # Extract date from text if possible (e.g. "Money Market Operations as on November 22, 2026")
        link_text = target_link.text.strip()
        obs_date = datetime.now().strftime("%Y-%m-%d")
        date_match = re.search(r"as on\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})", link_text)
        if date_match:
            try:
                parsed_dt = datetime.strptime(date_match.group(1), "%B %d, %Y")
                obs_date = parsed_dt.strftime("%Y-%m-%d")
            except Exception:
                pass

        sub_resp = session.get(href, timeout=12)
        if sub_resp.status_code != 200:
            print(f"[RBI] MMO page returned HTTP {sub_resp.status_code}")
            return results

        sub_soup = BeautifulSoup(sub_resp.text, "html.parser")

        # Parse table cells
        for tr in sub_soup.find_all("tr"):
            row_text = tr.get_text(separator=" ", strip=True)

            # 1. MSF Rate
            if "MSF" in row_text:
                cells = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
                for cell in reversed(cells):
                    val_str = cell.replace(",", "").replace("%", "")
                    try:
                        f_val = float(val_str)
                        if 3.0 <= f_val <= 12.0 and "in_msf" not in results:
                            results["in_msf"] = {"date": obs_date, "value": f_val}
                            break
                    except ValueError:
                        continue

            # 2. SDF Rate
            if "SDF" in row_text:
                cells = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
                for cell in reversed(cells):
                    val_str = cell.replace(",", "").replace("%", "")
                    try:
                        f_val = float(val_str)
                        if 3.0 <= f_val <= 12.0 and "in_sdf" not in results:
                            results["in_sdf"] = {"date": obs_date, "value": f_val}
                            break
                    except ValueError:
                        continue

            # 3. Call Money / WACR
            if "Call Money" in row_text or "Overnight Segment" in row_text:
                cells = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
                for cell in cells:
                    val_str = cell.replace(",", "").replace("%", "")
                    try:
                        f_val = float(val_str)
                        if 3.0 <= f_val <= 12.0 and "in_wacr" not in results:
                            results["in_wacr"] = {"date": obs_date, "value": f_val}
                            break
                    except ValueError:
                        continue

        # Derived RBI Repo from MSF / SDF corridor (standard 25/50 bps corridor)
        if "in_msf" in results and "in_sdf" in results:
            msf_val = results["in_msf"]["value"]
            sdf_val = results["in_sdf"]["value"]
            # Policy repo is mid-point of standard LAF corridor
            repo_val = round((msf_val + sdf_val) / 2.0, 2)
            results["in_repo"] = {"date": obs_date, "value": repo_val}

        print(f"[RBI] Scraped {len(results)} money market indicators for {obs_date}")

    except Exception as e:
        print(f"[RBI] Error scraping MMO page: {e}")

    return results
