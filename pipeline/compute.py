"""Compute engine for Market Dashboard metrics.

Computes:
- THIS: Latest available observation date & value
- LAST: Observation as-of (THIS - 7 days), or last available on or before that date
- BASE: Observation as-of Jan 1 of the current year, or last available on or before that date
- change:
    - rate: THIS - LAST (pp)
    - price: (THIS / LAST - 1) * 100 (%)
- YTD:
    - rate: THIS - BASE (pp)
    - price: (THIS / BASE - 1) * 100 (%)
- Cycle High: Maximum value since 2023-01-01 with date
- Derived series computed via formula from constituent histories
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd


def get_as_of_observation(df: pd.DataFrame, target_date_str: str) -> Optional[Dict[str, Any]]:
    """Return the last available observation on or before target_date_str."""
    if df is None or df.empty:
        return None
    
    sub = df[df["date"] <= target_date_str]
    if sub.empty:
        return None
    
    latest_row = sub.iloc[-1]
    return {
        "date": str(latest_row["date"]),
        "value": float(latest_row["value"])
    }


def compute_derived_history(
    formula: str,
    metric_histories: Dict[str, pd.DataFrame]
) -> pd.DataFrame:
    """Evaluate simple arithmetic formula across metric histories aligning on date.
    
    Examples:
    - 'ust_10y - ust_2y'
    - '2 * real_10y - real_5y'
    - '2 * be_10y - be_5y'
    - 'mortgage_30y - ust_10y'
    """
    import re
    # Extract identifiers from formula
    tokens = re.findall(r"[a-zA-Z_][a-zA-Z0-9_]*", formula)
    unique_tokens = list(set(tokens))

    # Verify all tokens exist in metric_histories
    for tok in unique_tokens:
        if tok not in metric_histories or metric_histories[tok] is None or metric_histories[tok].empty:
            return pd.DataFrame(columns=["date", "value"])

    # Merge on date using outer join to align series of different frequencies
    merged = None
    for tok in unique_tokens:
        tok_df = metric_histories[tok][["date", "value"]].rename(columns={"value": tok})
        if merged is None:
            merged = tok_df
        else:
            merged = pd.merge(merged, tok_df, on="date", how="outer")

    if merged is None or merged.empty:
        return pd.DataFrame(columns=["date", "value"])

    merged = merged.sort_values(by="date")
    # Forward fill to align series across weekly/monthly observations
    for tok in unique_tokens:
        merged[tok] = merged[tok].ffill()

    merged = merged.dropna(subset=unique_tokens)
    if merged.empty:
        return pd.DataFrame(columns=["date", "value"])

    # Safe evaluate expression using column names
    try:
        # Create a dict of numpy arrays
        eval_env = {tok: merged[tok].to_numpy() for tok in unique_tokens}
        # evaluate using python eval with restricted builtins
        result_vals = eval(formula, {"__builtins__": None}, eval_env)
        merged["value"] = result_vals
        merged = merged.sort_values(by="date")
        return pd.DataFrame({"date": merged["date"], "value": merged["value"].astype(float)})
    except Exception as e:
        print(f"[Compute] Error evaluating formula '{formula}': {e}")
        return pd.DataFrame(columns=["date", "value"])


def compute_metric_stats(
    metric_cfg: Dict[str, Any],
    history_df: pd.DataFrame,
    current_year: Optional[int] = None
) -> Dict[str, Any]:
    """Calculate THIS, LAST, BASE, change, YTD, and Cycle High for a single metric."""
    metric_id = metric_cfg["id"]
    display_type = metric_cfg.get("display_type", "rate")

    res = {
        "id": metric_id,
        "label": metric_cfg.get("label", metric_id),
        "full_name": metric_cfg.get("full_name"),
        "unit": metric_cfg.get("unit", "%"),
        "polarity": metric_cfg.get("polarity", "neutral"),
        "display_type": display_type,
        "source": f"{metric_cfg.get('source', '')} {metric_cfg.get('ticker', '')}".strip(),
        "this_value": None,
        "this_date": None,
        "last_value": None,
        "last_date": None,
        "change": None,
        "base_value": None,
        "base_date": None,
        "ytd": None,
        "cycle_high": None,
        "cycle_high_date": None,
        "updated": None,
        "stale": False,
        "status": "missing",
    }

    if history_df is None or history_df.empty:
        return res

    # Ensure clean numeric values and sorted dates
    clean_df = history_df.dropna(subset=["date", "value"]).copy()
    clean_df["date"] = clean_df["date"].astype(str)
    clean_df["value"] = pd.to_numeric(clean_df["value"], errors="coerce")
    clean_df = clean_df.dropna(subset=["value"]).sort_values(by="date")

    if clean_df.empty:
        return res

    # 1. THIS: Latest available observation
    latest_row = clean_df.iloc[-1]
    this_date_str = str(latest_row["date"])
    this_val = float(latest_row["value"])

    res["this_value"] = round(this_val, 2)
    res["this_date"] = this_date_str
    res["updated"] = this_date_str
    res["status"] = "ok"

    this_dt = datetime.strptime(this_date_str, "%Y-%m-%d")

    # 2. LAST: Observation as-of (THIS - 7 days)
    target_last_date = (this_dt - timedelta(days=7)).strftime("%Y-%m-%d")
    last_obs = get_as_of_observation(clean_df, target_last_date)
    if last_obs is not None:
        last_val = last_obs["value"]
        res["last_value"] = round(last_val, 2)
        res["last_date"] = last_obs["date"]

        if display_type == "price":
            if last_val != 0:
                res["change"] = round(((this_val / last_val) - 1.0) * 100.0, 2)
        else:
            res["change"] = round(this_val - last_val, 2)

    # 3. BASE: Observation as-of Jan 1 of current year
    year = current_year if current_year is not None else this_dt.year
    target_base_date = f"{year}-01-01"
    base_obs = get_as_of_observation(clean_df, target_base_date)
    
    # If no observation on or before Jan 1 (e.g. data starts after Jan 1), take earliest of that year
    if base_obs is None:
        year_rows = clean_df[clean_df["date"].str.startswith(str(year))]
        if not year_rows.empty:
            earliest_row = year_rows.iloc[0]
            base_obs = {"date": str(earliest_row["date"]), "value": float(earliest_row["value"])}

    if base_obs is not None:
        base_val = base_obs["value"]
        res["base_value"] = round(base_val, 2)
        res["base_date"] = base_obs["date"]

        if display_type == "price":
            if base_val != 0:
                res["ytd"] = round(((this_val / base_val) - 1.0) * 100.0, 2)
        else:
            res["ytd"] = round(this_val - base_val, 2)

    # 4. Cycle High: Maximum since 2023-01-01 (omitted for flow metrics)
    if display_type == "flow":
        res["change"] = None
        res["cycle_high"] = None
        res["cycle_high_date"] = None
        # For pure flow quantities, YTD is the cumulative sum of flows in current year
        if metric_id in ("in_fpi_equity", "in_dii_equity", "in_fpi_debt"):
            ytd_rows = clean_df[clean_df["date"] >= f"{year}-01-01"]
            if not ytd_rows.empty:
                res["ytd"] = round(float(ytd_rows["value"].sum()), 2)
    else:
        cycle_df = clean_df[clean_df["date"] >= "2023-01-01"]
        if not cycle_df.empty:
            max_idx = cycle_df["value"].idxmax()
            max_row = cycle_df.loc[max_idx]
            res["cycle_high"] = round(float(max_row["value"]), 2)
            res["cycle_high_date"] = str(max_row["date"])

    # Check stale condition
    stale_after_days = metric_cfg.get("stale_after_days", 5)
    today_dt = datetime.now()
    days_old = (today_dt - this_dt).days
    if days_old > stale_after_days:
        res["stale"] = True
        res["status"] = "stale"

    return res
