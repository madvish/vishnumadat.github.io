import sys
sys.stdout.reconfigure(encoding="utf-8")
import urllib.request
import re
from datetime import datetime
from bs4 import BeautifulSoup
from typing import Any, Dict

DAMODARAN_CTRYPREM_URL = "https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/ctryprem.html"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def fetch_damodaran_erp() -> Dict[str, Dict[str, Any]]:
    """Scrape India Equity Risk Premium & Country Risk Premium from Prof. Damodaran's NYU Stern table."""
    results: Dict[str, Dict[str, Any]] = {}
    today_str = datetime.now().strftime("%Y-%m-%d")
    obs_date = today_str
    
    try:
        req = urllib.request.Request(DAMODARAN_CTRYPREM_URL, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

        soup = BeautifulSoup(html, "html.parser")
        
        # Check last updated date
        date_match = re.search(r'Last updated:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})', html, re.I)
        if date_match:
            try:
                dt = datetime.strptime(date_match.group(1), "%B %d, %Y")
                obs_date = dt.strftime("%Y-%m-%d")
            except Exception:
                pass
                
        # Parse table for India
        for tr in soup.find_all("tr"):
            cells = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
            if cells and cells[0].strip() == "India" and len(cells) >= 5:
                # Column 3 is Country Risk Premium, Column 4 is Equity Risk Premium
                # e.g. ['India', 'Baa3', '1.87%', '2.85%', '7.08%', ...]
                crp_str = cells[3].replace("%", "").strip()
                erp_str = cells[4].replace("%", "").strip()
                
                try:
                    erp_val = float(erp_str)
                    results["in_nifty_erp"] = {"date": today_str, "value": erp_val}
                except ValueError:
                    pass

                try:
                    crp_val = float(crp_str)
                    results["in_crp_damodaran"] = {"date": today_str, "value": crp_val}
                except ValueError:
                    pass
                break
                
        if "in_nifty_erp" in results:
            print(f"[Damodaran] Successfully extracted India ERP: {results['in_nifty_erp']['value']}% (table dated {obs_date})")
            return results
            
    except Exception as e:
        print(f"[Damodaran] Warning: Could not fetch ctryprem.html ({e}). Using official 7.08% fallback.")

    # Fallback to official Damodaran Jan 2026 print
    results["in_nifty_erp"] = {"date": today_str, "value": 7.08}
    results["in_crp_damodaran"] = {"date": today_str, "value": 2.85}
    return results

if __name__ == "__main__":
    res = fetch_damodaran_erp()
    print("Fetched:", res)
