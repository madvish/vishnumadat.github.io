"""Yahoo Finance data fetcher using yfinance library."""

from typing import Dict, List
import pandas as pd
import yfinance as yf


def fetch_yahoo_series(
    tickers: List[str],
    start_date: str = "2023-01-01",
) -> Dict[str, pd.DataFrame]:
    """Fetch Close prices for Yahoo tickers from start_date to today.
    
    Returns dict mapping ticker -> DataFrame(date, value).
    Close price is unadjusted Close (per specifications).
    """
    results: Dict[str, pd.DataFrame] = {}

    if not tickers:
        return results

    print(f"[Yahoo] Fetching {len(tickers)} tickers starting from {start_date}...")
    
    # Try fetching individually or in small batches to prevent one bad ticker from breaking all
    for ticker in tickers:
        try:
            t = yf.Ticker(ticker)
            df = t.history(start=start_date, auto_adjust=False)

            if df.empty or "Close" not in df.columns:
                # Fallback to fast_info if available (e.g. for settlement-based CME futures like LTC=F, COB=F)
                try:
                    fi = t.fast_info
                    last_price = getattr(fi, "last_price", None)
                    if last_price is not None and float(last_price) > 0:
                        from datetime import datetime
                        today_str = datetime.now().strftime("%Y-%m-%d")
                        clean_df = pd.DataFrame([{"date": today_str, "value": float(last_price)}])
                        results[ticker] = clean_df
                        print(f"[Yahoo] Recovered {ticker} from fast_info: {last_price:.2f}")
                        continue
                except Exception:
                    pass

                print(f"[Yahoo] No data returned for ticker {ticker}")
                results[ticker] = pd.DataFrame(columns=["date", "value"])
                continue

            df = df.reset_index()
            # Date column might be 'Date' or 'Datetime'
            date_col = "Date" if "Date" in df.columns else df.columns[0]
            
            df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
            df = df.dropna(subset=[date_col, "Close"])
            df = df.sort_values(by=date_col)

            clean_df = pd.DataFrame({
                "date": df[date_col].dt.strftime("%Y-%m-%d"),
                "value": df["Close"].astype(float)
            })

            results[ticker] = clean_df
            print(f"[Yahoo] Successfully fetched {ticker}: {len(clean_df)} records")

        except Exception as e:
            print(f"[Yahoo] Error fetching ticker {ticker}: {e}")
            results[ticker] = pd.DataFrame(columns=["date", "value"])

    return results
