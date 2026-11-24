"""Main runner for Market Data Pipeline.

Orchestrates fetching, manual input loading, history persistence,
metric computation, validation, and latest.json generation.
"""

from datetime import datetime
import json
from pathlib import Path
import sys
from typing import Any, Dict, List
import pandas as pd
import yaml

# Add pipeline directory to path for imports
BASE_DIR = Path(__file__).resolve().parent.parent
PIPELINE_DIR = BASE_DIR / "pipeline"
if str(PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(PIPELINE_DIR))

from compute import compute_derived_history, compute_metric_stats
from fetchers.fred import fetch_fred_series
from fetchers.yahoo import fetch_yahoo_series
from fetchers.rbi import fetch_latest_rbi_mmo
from fetchers.ncdex import fetch_ncdex_live
from validate import validate_all_manual_inputs

CONFIG_PATH = PIPELINE_DIR / "config" / "metrics.yml"
DATA_DIR = BASE_DIR / "data" / "market"
HISTORY_DIR = DATA_DIR / "history"
MANUAL_DIR = DATA_DIR / "manual"
LATEST_JSON_PATH = DATA_DIR / "latest.json"

TAB_LABELS = {
    "global_markets": "Global Markets",
    "us_rates_equity": "US Rates & Equity",
    "us_real_credit_commodities": "US Real / Credit / Commodities",
    "india_rates_equity": "India Rates & Equity",
    "india_real_credit_commodities": "India Real / Credit / Commodities",
    "india_flows_macro": "India Flows & Macro",
}

SECTION_LABELS = {
    "global_india": "India Key Benchmarks & Volatility",
    "global_macro": "Global Equities, Sovereign Yields & Macro Assets",
    "global_forex": "Foreign Exchange (FX)",
    "par_rates": "US Treasury Par Rates (Bills)",
    "par_yields": "US Treasury Par Yields (Coupons)",
    "slopes": "Yield Curve Slopes",
    "us_equity": "US Equity & Fixed Income Proxies",
    "real_yields": "US Real Yields (TIPS)",
    "breakevens": "US Breakeven Inflation Rates",
    "credit_oas": "US Corporate Credit OAS Spreads",
    "housing": "US Housing & Mortgage Spreads",
    "metals": "Precious & Industrial Metals ($)",
    "energy": "Global Energy Commodities ($)",
    "global_agri": "Global Agricultural Commodities ($)",
    "mortgage_reits": "Mortgage REITs & Agency MBS",
    "in_policy": "Policy & Money Market Rates",
    "in_gsec_yields": "G-Sec Benchmark Yield Curve",
    "in_slopes": "Curve Slopes & Liquidity Gauges",
    "in_equity": "India Equity Benchmarks & Sector Indices",
    "in_real_yields": "India Real Yields & Inflation Compensation",
    "in_credit_spreads": "Corporate Credit & SDL Spreads",
    "in_housing_reits": "Retail Home Loan Rates & Housing REITs",
    "in_energy": "Energy Benchmarks (Crude & Gas)",
    "in_ncdex_agri": "NCDEX Agricultural Commodities",
    "in_cross_market": "Cross-Market Spreads & Policy Differentials",
    "in_flows": "Institutional Capital Flows & System Liquidity",
    "in_valuation": "Valuation Multiples & Equity Risk Premium",
    "in_macro": "High-Frequency Macroeconomic Intelligence",
}


def load_config() -> List[Dict[str, Any]]:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data.get("metrics", [])


def load_existing_history(metric_id: str) -> pd.DataFrame:
    file_path = HISTORY_DIR / f"{metric_id}.csv"
    if file_path.exists():
        try:
            df = pd.read_csv(file_path)
            if not df.empty and "date" in df.columns and "value" in df.columns:
                df["date"] = df["date"].astype(str)
                df["value"] = pd.to_numeric(df["value"], errors="coerce")
                return df.dropna(subset=["date", "value"]).sort_values(by="date")
        except Exception as e:
            print(f"[History] Error reading history for {metric_id}: {e}")
    return pd.DataFrame(columns=["date", "value"])


def save_history(metric_id: str, new_df: pd.DataFrame) -> pd.DataFrame:
    """Merge new_df with existing history on disk, deduplicate, sort, and save."""
    existing_df = load_existing_history(metric_id)
    if new_df is None or new_df.empty:
        return existing_df

    combined = pd.concat([existing_df, new_df], ignore_index=True)
    combined["date"] = combined["date"].astype(str)
    combined["value"] = pd.to_numeric(combined["value"], errors="coerce")
    combined = combined.dropna(subset=["date", "value"])
    # Drop duplicates by date, keeping the latest value
    combined = combined.drop_duplicates(subset=["date"], keep="last")
    combined = combined.sort_values(by="date")

    file_path = HISTORY_DIR / f"{metric_id}.csv"
    combined.to_csv(file_path, index=False)
    return combined


def load_manual_data() -> Dict[str, pd.DataFrame]:
    """Load manual inputs from data/market/manual/*.csv into {metric_id: DataFrame(date, value)}."""
    results: Dict[str, pd.DataFrame] = {}
    if not MANUAL_DIR.exists():
        return results

    for csv_file in MANUAL_DIR.glob("*.csv"):
        try:
            df = pd.read_csv(csv_file)
            if df.empty or "metric_id" not in df.columns:
                continue
            for m_id, group in df.groupby("metric_id"):
                clean = group[["date", "value"]].dropna()
                clean["date"] = clean["date"].astype(str)
                clean["value"] = pd.to_numeric(clean["value"], errors="coerce")
                clean = clean.dropna().sort_values(by="date")
                if not clean.empty:
                    results[str(m_id)] = clean
        except Exception as e:
            print(f"[Manual] Error loading manual file {csv_file.name}: {e}")
    return results


def run_pipeline():
    print("=" * 60)
    print("Starting Market Data Pipeline Run")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 60)

    # 1. Ensure directories exist
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    MANUAL_DIR.mkdir(parents=True, exist_ok=True)

    # 2. Validate manual inputs
    print("\n--- Validating Manual Inputs ---")
    val_errors, val_warns = validate_all_manual_inputs(MANUAL_DIR)
    if val_errors:
        print(f"[Validation] Found {len(val_errors)} errors:")
        for err in val_errors:
            print(f"  ERROR: {err}")
    if val_warns:
        print(f"[Validation] Found {len(val_warns)} warnings:")
        for w in val_warns:
            print(f"  WARN: {w}")

    # 3. Load Metrics Config
    metrics_cfg = load_config()
    print(f"[Config] Loaded {len(metrics_cfg)} metrics from config")

    # Group metrics by source
    fred_metrics = [m for m in metrics_cfg if m.get("source") == "fred" and m.get("ticker")]
    yahoo_metrics = [m for m in metrics_cfg if m.get("source") == "yahoo" and m.get("ticker")]
    rbi_metrics = [m for m in metrics_cfg if m.get("source") == "rbi"]
    ncdex_metrics = [m for m in metrics_cfg if m.get("source") == "ncdex"]
    computed_metrics = [m for m in metrics_cfg if m.get("source") == "computed"]
    manual_metrics = [m for m in metrics_cfg if m.get("source") == "manual"]

    metric_histories: Dict[str, pd.DataFrame] = {}

    # 4. Fetch FRED Data
    if fred_metrics:
        print(f"\n--- Fetching FRED Series ({len(fred_metrics)} series) ---")
        fred_ids = list(set(m["ticker"] for m in fred_metrics))
        fetched_fred = fetch_fred_series(fred_ids, start_date="2023-01-01")
        for m in fred_metrics:
            mid = m["id"]
            ticker = m["ticker"]
            new_data = fetched_fred.get(ticker, pd.DataFrame(columns=["date", "value"]))
            metric_histories[mid] = save_history(mid, new_data)

    # 5. Fetch Yahoo Data
    if yahoo_metrics:
        print(f"\n--- Fetching Yahoo Series ({len(yahoo_metrics)} series) ---")
        yahoo_tickers = list(set(m["ticker"] for m in yahoo_metrics))
        fetched_yahoo = fetch_yahoo_series(yahoo_tickers, start_date="2023-01-01")
        for m in yahoo_metrics:
            mid = m["id"]
            ticker = m["ticker"]
            new_data = fetched_yahoo.get(ticker, pd.DataFrame(columns=["date", "value"]))
            metric_histories[mid] = save_history(mid, new_data)

    # 5b. Fetch RBI Money Market Operations Data
    if rbi_metrics:
        print(f"\n--- Scraping RBI Money Market Operations ({len(rbi_metrics)} series) ---")
        rbi_data = fetch_latest_rbi_mmo()
        for m in rbi_metrics:
            mid = m["id"]
            if mid in rbi_data:
                obs = rbi_data[mid]
                new_data = pd.DataFrame([{"date": obs["date"], "value": obs["value"]}])
                metric_histories[mid] = save_history(mid, new_data)
            else:
                metric_histories[mid] = load_existing_history(mid)

    # 5c. Fetch NCDEX Agricultural Quotes
    if ncdex_metrics:
        print(f"\n--- Scraping NCDEX Agricultural Quotes ({len(ncdex_metrics)} series) ---")
        ncdex_data = fetch_ncdex_live()
        for m in ncdex_metrics:
            mid = m["id"]
            if mid in ncdex_data:
                obs = ncdex_data[mid]
                new_data = pd.DataFrame([{"date": obs["date"], "value": obs["value"]}])
                metric_histories[mid] = save_history(mid, new_data)
            else:
                metric_histories[mid] = load_existing_history(mid)

    # 6. Load Manual Inputs
    print("\n--- Loading Manual Inputs ---")
    manual_data = load_manual_data()
    for m in manual_metrics:
        mid = m["id"]
        if mid in manual_data:
            metric_histories[mid] = save_history(mid, manual_data[mid])
        else:
            metric_histories[mid] = load_existing_history(mid)

    # 7. Compute Derived Series
    print("\n--- Computing Derived Series ---")
    # Multiple passes to allow forward formulas (e.g. breakevens depend on nominal and real, F5Y5Y BE depends on BE)
    for _ in range(3):
        for m in computed_metrics:
            mid = m["id"]
            formula = m.get("compute_formula")
            if formula:
                derived_df = compute_derived_history(formula, metric_histories)
                if not derived_df.empty:
                    metric_histories[mid] = save_history(mid, derived_df)

    # 8. Compute Statistics & Build Output JSON
    print("\n--- Generating Metrics JSON ---")
    current_year = datetime.now().year
    
    # Organize by tabs and sections
    tabs_dict: Dict[str, Dict[str, Any]] = {}

    total_metrics = 0
    ok_metrics = 0
    stale_metrics = 0
    missing_metrics = 0

    for m in metrics_cfg:
        mid = m["id"]
        tab_id = m.get("tab", "us_rates_equity")
        sec_id = m.get("section", "default")

        m_history = metric_histories.get(mid, load_existing_history(mid))
        stats = compute_metric_stats(m, m_history, current_year=current_year)

        total_metrics += 1
        if stats["status"] == "ok":
            ok_metrics += 1
        elif stats["status"] == "stale":
            stale_metrics += 1
        else:
            missing_metrics += 1

        # Initialize tab structure if needed
        if tab_id not in tabs_dict:
            tabs_dict[tab_id] = {
                "id": tab_id,
                "label": TAB_LABELS.get(tab_id, tab_id.replace("_", " ").title()),
                "sections": {}
            }

        sec_dict = tabs_dict[tab_id]["sections"]
        if sec_id not in sec_dict:
            sec_dict[sec_id] = {
                "id": sec_id,
                "label": SECTION_LABELS.get(sec_id, sec_id.replace("_", " ").title()),
                "display_type": m.get("display_type", "rate"),
                "metrics": []
            }

        sec_dict[sec_id]["metrics"].append(stats)

    # Format JSON structure
    output_tabs = []
    tab_order = [
        "global_markets",
        "india_flows_macro",
        "india_real_credit_commodities",
        "india_rates_equity",
        "us_rates_equity",
        "us_real_credit_commodities",
    ]
    for tab_id in tab_order:
        if tab_id in tabs_dict:
            tab_data = tabs_dict[tab_id]
            sections_list = list(tab_data["sections"].values())
            output_tabs.append({
                "id": tab_id,
                "label": tab_data["label"],
                "sections": sections_list
            })
    for tab_id, tab_data in tabs_dict.items():
        if tab_id not in tab_order:
            sections_list = list(tab_data["sections"].values())
            output_tabs.append({
                "id": tab_id,
                "label": tab_data["label"],
                "sections": sections_list
            })

    # IST Timestamp
    now_utc = datetime.utcnow()
    # IST is UTC + 5:30
    from datetime import timezone, timedelta
    ist_tz = timezone(timedelta(hours=5, minutes=30))
    now_ist = datetime.now(ist_tz)

    output_payload = {
        "generated_at_ist": now_ist.strftime("%d/%m/%Y %H:%M:%S IST"),
        "summary": {
            "total": total_metrics,
            "ok": ok_metrics,
            "stale": stale_metrics,
            "missing": missing_metrics,
        },
        "tabs": output_tabs
    }

    with open(LATEST_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, indent=2)

    print(f"\n[Output] Wrote {LATEST_JSON_PATH}")
    print(f"[Summary] Total: {total_metrics} | OK: {ok_metrics} | Stale: {stale_metrics} | Missing: {missing_metrics}")
    print("Market Data Pipeline Run Completed Successfully.")


if __name__ == "__main__":
    run_pipeline()
