"""Investing.com & US Treasury scraper for rates and benchmarks."""

from datetime import datetime
import re
from typing import Any, Dict
import urllib.request
import xml.etree.ElementTree as ET

INVESTING_BONDS_URL = "https://m.investing.com/rates-bonds/usa-government-bonds"
TREASURY_XML_URL = "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_bill_rates&field_tdr_date_value={year}"

MOBILE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


def fetch_investing_us_bonds() -> Dict[str, Dict[str, Any]]:
    """Scrape US Treasury yields from Investing.com mobile bond page.
    
    Returns dict: {metric_id: {'date': 'YYYY-MM-DD', 'value': float}}
    """
    results: Dict[str, Dict[str, Any]] = {}
    today_str = datetime.now().strftime("%Y-%m-%d")

    try:
        req = urllib.request.Request(INVESTING_BONDS_URL, headers=MOBILE_HEADERS)
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

        rows = re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.DOTALL)
        for r in rows:
            clean = re.sub(r'<[^>]+>', ' ', r).strip()
            clean = re.sub(r'\s+', ' ', clean)
            
            # e.g. "U.S. 2M 4.206 4.189 4.211 4.199 +0.017 +0.41% 04:45:28"
            if "U.S. 2M" in clean:
                parts = clean.split()
                # Find the yield number
                idx = parts.index("2M") if "2M" in parts else -1
                if idx != -1 and idx + 1 < len(parts):
                    try:
                        val = float(parts[idx + 1])
                        results["ust_2m"] = {"date": today_str, "value": val}
                    except ValueError:
                        pass
            elif "U.S. 4M" in clean:
                parts = clean.split()
                idx = parts.index("4M") if "4M" in parts else -1
                if idx != -1 and idx + 1 < len(parts):
                    try:
                        val = float(parts[idx + 1])
                        results["ust_4m"] = {"date": today_str, "value": val}
                    except ValueError:
                        pass

        if "ust_2m" in results and "ust_4m" in results:
            print(f"[Investing] Successfully scraped US 2M ({results['ust_2m']['value']}%) and 4M ({results['ust_4m']['value']}%) from investing.com")
            return results

    except Exception as e:
        print(f"[Investing] Warning: Scraper encountered {e}. Falling back to official US Treasury XML.")

    # Fallback to US Treasury Daily Bill Rates XML
    try:
        year = datetime.now().year
        url = TREASURY_XML_URL.format(year=year)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            xml_data = resp.read()

        root = ET.fromstring(xml_data)
        entries = root.findall(".//{http://www.w3.org/2005/Atom}entry")
        if entries:
            last_entry = entries[-1]
            content = last_entry.find(".//{http://www.w3.org/2005/Atom}content")
            props = content.find("{http://schemas.microsoft.com/ado/2007/08/dataservices/metadata}properties")
            
            # Extract date
            idx_date = None
            date_elem = props.find("{http://schemas.microsoft.com/ado/2007/08/dataservices}INDEX_DATE")
            if date_elem is not None and date_elem.text:
                idx_date = date_elem.text.split("T")[0]
            else:
                idx_date = today_str

            # 8WK (2M) and 17WK (4M) yields
            elem_2m = props.find("{http://schemas.microsoft.com/ado/2007/08/dataservices}ROUND_B1_YIELD_8WK_2")
            if elem_2m is None or not elem_2m.text:
                elem_2m = props.find("{http://schemas.microsoft.com/ado/2007/08/dataservices}CS_8WK_YIELD_AVG")

            elem_4m = props.find("{http://schemas.microsoft.com/ado/2007/08/dataservices}ROUND_B1_YIELD_17WK_2")
            if elem_4m is None or not elem_4m.text:
                elem_4m = props.find("{http://schemas.microsoft.com/ado/2007/08/dataservices}CS_17WK_YIELD_AVG")

            if elem_2m is not None and elem_2m.text and "ust_2m" not in results:
                results["ust_2m"] = {"date": idx_date, "value": float(elem_2m.text)}
            if elem_4m is not None and elem_4m.text and "ust_4m" not in results:
                results["ust_4m"] = {"date": idx_date, "value": float(elem_4m.text)}

            print(f"[Investing/Treasury] Recovered from official US Treasury XML: 2M={results.get('ust_2m')}, 4M={results.get('ust_4m')}")

    except Exception as e2:
        print(f"[Investing/Treasury] Error in Treasury XML fallback: {e2}")

    return results


if __name__ == "__main__":
    res = fetch_investing_us_bonds()
    print("Result:", res)
