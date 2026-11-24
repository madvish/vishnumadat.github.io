"""Moneycontrol commodity data fetcher."""

from datetime import datetime
import json
from typing import Any, Dict
import urllib.request

MC_COMMODITY_URL = "https://priceapi.moneycontrol.com/technicalCompanyData/commodity/getMajorCommodities?tabName={tab}&deviceType=W"

MCX_MAP = {
    "GOLD": "mcx_gold",
    "SILVER": "mcx_silver",
    "COPPER": "mcx_copper",
    "CRUDEOIL": "mcx_crude",
    "NATURALGAS": "mcx_natgas",
    "ELECDMBL": "mcx_elec",
}

SPOT_MAP = {
    "GOLD": "spot_gold",
    "SILVER": "spot_silver",
    "COPPER": "spot_copper",
    "CRUDEOIL": "spot_crude",
    "NATURALGAS": "spot_natgas",
}

NCDEX_MAP = {
    "TMCFGRNZM": "ncdex_turmeric",
    "DHANIYA": "ncdex_dhaniya",
    "GUARGUM5": "ncdex_guargum",
    "GUARSEED10": "ncdex_guarseed",
    "COCUDAKL": "ncdex_cocudakl",
    "CASTOR": "ncdex_castor",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.moneycontrol.com/commodity/",
}


def fetch_moneycontrol_tab(tab_name: str) -> list:
    """Fetch raw commodity list for a specific tab from Moneycontrol."""
    url = MC_COMMODITY_URL.format(tab=tab_name)
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("data", {}).get("list", [])
    except Exception as e:
        print(f"[Moneycontrol] Warning: Failed to fetch {tab_name} commodities: {e}")
        return []


def fetch_moneycontrol_commodities() -> Dict[str, Dict[str, Any]]:
    """Fetch all commodities from Moneycontrol (MCX, SPOT, NCDEX).
    
    Returns dict: {metric_id: {'date': 'YYYY-MM-DD', 'value': float, 'change': float, 'pct': float}}
    """
    today_str = datetime.now().strftime("%Y-%m-%d")
    results: Dict[str, Dict[str, Any]] = {}

    # 1. Fetch MCX Futures
    mcx_items = fetch_moneycontrol_tab("MCX")
    for item in mcx_items:
        sym = item.get("symbol", "").upper().strip()
        if sym in MCX_MAP:
            metric_id = MCX_MAP[sym]
            try:
                price = float(item.get("lastPrice", 0))
                chg = float(item.get("priceChange", 0))
                pct = float(item.get("priceChangePercentage", 0))
                if price > 0:
                    results[metric_id] = {
                        "date": today_str,
                        "value": price,
                        "change": chg,
                        "pct": pct,
                        "expiry": item.get("expDate"),
                    }
            except (ValueError, TypeError):
                pass

    # 2. Fetch Spot Rates
    spot_items = fetch_moneycontrol_tab("SPOT")
    for item in spot_items:
        sym = item.get("symbol", "").upper().strip()
        if sym in SPOT_MAP:
            metric_id = SPOT_MAP[sym]
            try:
                price = float(item.get("lastPrice", 0))
                chg = float(item.get("priceChange", 0))
                pct = float(item.get("priceChangePercentage", 0))
                if price > 0:
                    results[metric_id] = {
                        "date": today_str,
                        "value": price,
                        "change": chg,
                        "pct": pct,
                    }
            except (ValueError, TypeError):
                pass

    # 3. Fetch NCDEX Commodities
    ncdex_items = fetch_moneycontrol_tab("NCDEX")
    for item in ncdex_items:
        sym = item.get("symbol", "").upper().strip()
        if sym in NCDEX_MAP:
            metric_id = NCDEX_MAP[sym]
            try:
                price = float(item.get("lastPrice", 0))
                chg = float(item.get("priceChange", 0))
                pct = float(item.get("priceChangePercentage", 0))
                if price > 0:
                    results[metric_id] = {
                        "date": today_str,
                        "value": price,
                        "change": chg,
                        "pct": pct,
                    }
            except (ValueError, TypeError):
                pass

    print(f"[Moneycontrol] Fetched {len(results)} automated commodity quotes.")
    return results




def fetch_moneycontrol_fii_dii():
    """Fetch daily FII and DII net cash purchases/sales and aggregate into weekly flows.
    
    Returns:
        dict: {'in_fpi_equity': DataFrame(date, value), 'in_dii_equity': DataFrame(date, value)}
    """
    import re
    from datetime import timedelta
    import pandas as pd
    
    url = "https://www.moneycontrol.com/markets/fii-dii-data/cash/"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
        m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html)
        if not m:
            return {}
        data = json.loads(m.group(1))
        fii_list = data.get("props", {}).get("pageProps", {}).get("FiiDiiData", {}).get("fiiDiiData", [])
        if not fii_list:
            return {}
        
        rows = []
        for item in fii_list:
            d_str = item.get("date")
            fii_net_str = item.get("fiiNet", "0").replace(",", "").strip()
            dii_net_str = item.get("diiNet", "0").replace(",", "").strip()
            try:
                fii_net = float(fii_net_str)
                dii_net = float(dii_net_str)
                rows.append({"date": d_str, "fii_net": fii_net, "dii_net": dii_net})
            except (ValueError, TypeError):
                continue
        
        if not rows:
            return {}

        df = pd.DataFrame(rows).sort_values(by="date")
        df["dt"] = pd.to_datetime(df["date"])
        
        # Calendar week grouping (Monday to Friday)
        df["week_start"] = df["dt"].apply(lambda d: d - timedelta(days=d.weekday()))
        df["week_end"] = df["week_start"] + timedelta(days=4)

        weekly_records = []
        for (w_start, w_end), group in df.groupby(["week_start", "week_end"]):
            max_d = group["date"].max()
            fii_sum = group["fii_net"].sum()
            dii_sum = group["dii_net"].sum()
            weekly_records.append({
                "date": max_d,
                "fii_net": round(fii_sum, 2),
                "dii_net": round(dii_sum, 2),
            })

        wdf = pd.DataFrame(weekly_records).sort_values(by="date")
        fpi_df = pd.DataFrame({"date": wdf["date"], "value": wdf["fii_net"]})
        dii_df = pd.DataFrame({"date": wdf["date"], "value": wdf["dii_net"]})
        
        print(f"[Moneycontrol] Successfully aggregated {len(wdf)} weekly FPI/DII net cash flow records.")
        return {"in_fpi_equity": fpi_df, "in_dii_equity": dii_df}

    except Exception as e:
        print(f"[Moneycontrol] Warning: Failed to fetch FII/DII cash flows: {e}")
        return {}


if __name__ == "__main__":
    res = fetch_moneycontrol_commodities()
    for k, v in res.items():
        print(f"  {k:<18}: {v['value']:>10.2f} (change: {v.get('change', 0):>+8.2f}, {v.get('pct', 0):>+6.2f}%)")
