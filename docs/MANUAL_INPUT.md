# Manual Data Input Guide

To update manual metrics directly on GitHub:

1. Navigate to `data/market/manual/` and click the relevant CSV file (`india_rates.csv`, `india_credit.csv`, `india_macro.csv`, `india_commodities.csv`, or `fed_futures.csv`).
2. Click the pencil icon (Edit this file).
3. Append a new row at the bottom: `metric_id,YYYY-MM-DD,value,note`.
4. Formatting rules:
   - Rates & yields in `%` (e.g., `6.50` for 6.50%).
   - Spreads in `bps` (e.g., `45` for 45 bps).
   - Macro flows in `₹ crore` (e.g., `2450.5` or `-1200.0` for net outflows).
   - Never enter future dates.
5. Commit directly with message `Update manual market data`. The automated pipeline will validate and deploy.
