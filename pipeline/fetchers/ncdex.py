"""
NCDEX Scraper for Indian Agricultural Commodities
Fetches official live market quotes from https://ncdex.com/market-watch/live_quotes.
"""

import os
import re
import ssl
import csv
import urllib.request
from datetime import datetime

NCDEX_SYMBOL_MAP = {
    "TMCFGRNZM": "ncdex_turmeric",
    "JEERAUNJHA": "ncdex_jeera",
}

def fetch_ncdex_live():
    """
    Fetches live quotes from NCDEX live quotes table.
    Returns dict: {metric_id: {'date': 'YYYY-MM-DD', 'value': float}}
    """
    url = "https://ncdex.com/market-watch/live_quotes"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    results = {}
    today_str = datetime.now().strftime("%Y-%m-%d")

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

        tbody_match = re.search(r'<table id="example"[^>]*>.*?<tbody>(.*?)</tbody>', html, re.DOTALL)
        if tbody_match:
            tbody = tbody_match.group(1)
            rows = re.findall(r'<tr>(.*?)</tr>', tbody, re.DOTALL)
            for r in rows:
                pname_match = re.search(r'/products/([^"]+)', r)
                if not pname_match:
                    continue
                pname = pname_match.group(1).strip()
                if pname in NCDEX_SYMBOL_MAP:
                    metric_id = NCDEX_SYMBOL_MAP[pname]
                    ltp_match = re.search(r'class="ltp">([^<]+)', r)
                    if ltp_match:
                        ltp_str = ltp_match.group(1).replace(",", "").strip()
                        try:
                            val = float(ltp_str)
                            if metric_id not in results:
                                results[metric_id] = {
                                    "date": today_str,
                                    "value": val
                                }
                        except ValueError:
                            pass
        print(f"[NCDEX Fetcher] Successfully scraped {len(results)} live commodities from ncdex.com")
    except Exception as e:
        print(f"[NCDEX Fetcher] Warning: Failed to fetch live NCDEX quotes ({e}). Using existing history / manual data.")

    return results

def update_ncdex_history(data_dir="data/market/history"):
    """
    Fetches live NCDEX data and appends/updates data/market/history/{metric_id}.csv
    """
    quotes = fetch_ncdex_live()
    if not quotes:
        return

    os.makedirs(data_dir, exist_ok=True)
    for metric_id, entry in quotes.items():
        csv_path = os.path.join(data_dir, f"{metric_id}.csv")
        existing_rows = {}
        if os.path.exists(csv_path):
            with open(csv_path, "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                header = next(reader, None)
                for row in reader:
                    if len(row) >= 2:
                        existing_rows[row[0].strip()] = row[1].strip()

        # Update or add today's entry
        existing_rows[entry["date"]] = str(entry["value"])

        # Write back sorted
        with open(csv_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["date", "value"])
            for d in sorted(existing_rows.keys()):
                writer.writerow([d, existing_rows[d]])

if __name__ == "__main__":
    q = fetch_ncdex_live()
    print("Fetched:", q)
