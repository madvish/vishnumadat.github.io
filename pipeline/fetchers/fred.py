"""FRED data fetcher using public fredgraph CSV endpoint.

Endpoint format: https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}
Requires no API key.
"""

import io
import time
from typing import Dict, List, Optional
import pandas as pd
import requests

FRED_CSV_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MarketDashboard/1.0"


def fetch_fred_series(
    series_ids: List[str],
    start_date: str = "2023-01-01",
    delay_seconds: float = 0.5,
) -> Dict[str, pd.DataFrame]:
    """Fetch one or more FRED series and return a dict of {series_id: DataFrame(date, value)}.
    
    DataFrames have columns: ['date', 'value'] with date as str YYYY-MM-DD and value as float.
    """
    results: Dict[str, pd.DataFrame] = {}
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    for i, sid in enumerate(series_ids):
        if i > 0 and delay_seconds > 0:
            time.sleep(delay_seconds)

        url = f"{FRED_CSV_URL}?id={sid}"
        try:
            resp = session.get(url, timeout=15)
            if resp.status_code != 200:
                print(f"[FRED] HTTP {resp.status_code} for {sid}")
                results[sid] = pd.DataFrame(columns=["date", "value"])
                continue

            # Parse CSV
            # Typical format:
            # DATE,DGS10
            # 2023-01-03,3.79
            # 2023-01-04,.
            df = pd.read_csv(io.StringIO(resp.text))
            if df.empty or len(df.columns) < 2:
                results[sid] = pd.DataFrame(columns=["date", "value"])
                continue

            date_col = df.columns[0]
            val_col = df.columns[1]

            # Coerce values to numeric, '.' becomes NaN
            df[val_col] = pd.to_numeric(df[val_col], errors="coerce")
            df = df.dropna(subset=[val_col])

            # Filter by start_date
            df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
            df = df.dropna(subset=[date_col])
            
            if start_date:
                start_dt = pd.to_datetime(start_date)
                df = df[df[date_col] >= start_dt]

            df = df.sort_values(by=date_col)
            clean_df = pd.DataFrame({
                "date": df[date_col].dt.strftime("%Y-%m-%d"),
                "value": df[val_col].astype(float)
            })

            results[sid] = clean_df
            print(f"[FRED] Successfully fetched {sid}: {len(clean_df)} records")

        except Exception as e:
            print(f"[FRED] Error fetching {sid}: {e}")
            results[sid] = pd.DataFrame(columns=["date", "value"])

    return results
