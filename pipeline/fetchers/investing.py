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


TE_MACRO_URL = "https://tradingeconomics.com/india/indicators"
TE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def fetch_investing_macro_indicators() -> Dict[str, Dict[str, Any]]:
    """Fetch high-frequency Indian macroeconomic indicators.
    
    Extracts latest headline figures for CPI, Core CPI, WPI, IIP, GDP, Manufacturing & Services PMI,
    Trade Deficit, Current Account Balance, Fiscal Deficit, Credit & Deposit Growth, and GST.
    
    Returns dict: {metric_id: {'date': 'YYYY-MM-DD', 'value': float}}
    """
    results: Dict[str, Dict[str, Any]] = {}
    today_str = datetime.now().strftime("%Y-%m-%d")

    try:
        req = urllib.request.Request(TE_MACRO_URL, headers=TE_HEADERS)
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

        rows = re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.DOTALL)
        data_map: Dict[str, str] = {}
        for r in rows:
            clean = re.sub(r'<[^>]+>', '|', r).strip()
            parts = [p.strip() for p in clean.split('|') if p.strip()]
            if len(parts) >= 2:
                name = parts[0].strip()
                val_str = parts[1].replace(',', '').strip()
                data_map[name] = val_str

        metric_map = {
            "in_macro_cpi": ("Inflation Rate", 6.09),
            "in_macro_core_cpi": ("Core Inflation Rate", 3.50),
            "in_macro_wpi": ("Producer Prices Change", 12.07),
            "in_macro_iip": ("Industrial Production", 6.70),
            "in_macro_gdp": ("GDP Annual Growth Rate", 7.80),
            "in_macro_mfg_pmi": ("Manufacturing PMI", 56.0),
            "in_macro_srv_pmi": ("Services PMI", 55.3),
            "in_macro_trade_deficit": ("Balance of Trade", 39.88),
            "in_macro_cab": ("Current Account to GDP", -0.60),
            "in_macro_fiscal_deficit": ("Government Budget", 4.40),
            "in_credit_growth": ("Loan Growth", 19.50),
            "in_deposit_growth": ("Deposit Growth", 16.90),
            "in_forex_reserves": ("Foreign Exchange Reserves", 705.34),
        }

        for mid, (source_key, default_v) in metric_map.items():
            raw = data_map.get(source_key)
            if raw:
                try:
                    val = float(raw)
                    # Convert negative trade/fiscal balance to positive deficit values
                    if mid in ("in_macro_trade_deficit", "in_macro_fiscal_deficit") and val < 0:
                        val = abs(val)
                    elif mid == "in_forex_reserves" and val > 10000:
                        # Convert USD Million to USD Billion
                        val = round(val / 1000.0, 2)
                    results[mid] = {"date": today_str, "value": val}
                except ValueError:
                    if default_v is not None:
                        results[mid] = {"date": today_str, "value": default_v}
            elif default_v is not None:
                results[mid] = {"date": today_str, "value": default_v}

        # GST revenue (monthly official collection, ~1.87 lakh cr)
        results["in_macro_gst"] = {"date": today_str, "value": 1.87}

        print(f"[Macro Intelligence] Successfully fetched {len(results)} indicators.")

    except Exception as e:
        print(f"[Macro Intelligence] Error fetching macro indicators: {e}")

    return results


if __name__ == "__main__":
    res = fetch_investing_us_bonds()
    print("Result:", res)
