# Vishnu Madat — Personal Website & Market Dashboard

Personal portfolio and institutional-grade weekly market intelligence dashboard hosted on GitHub Pages.

## Market Dashboard Overview

The **Market Dashboard** (`market-dashboard.html`) replicates and extends Mark Meldrum's weekly market intelligence framework across both US and Indian capital markets:

- **US Rates & Equity**: Par yield curve (1M to 30Y), 2s10s & 3m10y slopes, major US equity ETFs, DXY, and fixed income proxies.
- **US Real Yields, Credit & Commodities**: TIPS yields, inflation compensation breakevens (5Y, 7Y, 10Y, 20Y, 30Y, Fwd 5Y5Y), ICE BofA corporate credit OAS spreads (IG, AA, BBB, HY, BB, CCC), Freddie Mac 30Y mortgage spreads, energy, agricultural and industrial commodities, and agency mREITs.
- **India Rates & Equity**: Policy rates (Repo, SDF, MSF, WACR), T-bills, G-Sec benchmark curve (1Y to 30Y), Nifty 50, Bank, and sectoral indices.
- **India Real Yields, Credit & Commodities**: Ex-post / ex-ante real yields, corporate bond spreads, domestic home-loan rates, and MCX commodities.
- **India Flows, Liquidity & Macro**: FPI/DII net flows, AMFI SIP inflows, banking liquidity, Nifty valuation multiples, RBI forex reserves, and high-frequency macro prints (CPI, IIP, GST).
- **Data Health**: Real-time status monitoring, observation timestamps, staleness detection, and data source tracking.

---

## 5-Minute Setup & Operations Guide

### 1. GitHub Pages Configuration
1. Go to **Settings** → **Pages** on your repository (`vishnumadat.github.io`).
2. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **`main`** / Folder: **`/ (root)`**
3. Save. Any commit to `main` will automatically build and publish the live site.

### 2. Automated Pipeline (`market-data.yml`)
- The pipeline runs automatically via GitHub Actions:
  - Weekdays at 06:00 AM IST (`00:30 UTC`)
  - Weekdays at 07:30 PM IST (`14:00 UTC` - post-market settlement)
  - Saturdays at 07:30 PM IST (`14:00 UTC` - weekly close capture)
- The pipeline fetches public FRED series (no API keys required), downloads Close prices via `yfinance`, checks manual inputs, calculates all derived metrics, and commits changes to `data/market/` with `[skip ci]`.

### 3. Manual Run (Trigger on Demand)
1. In your GitHub repository, click the **Actions** tab.
2. Select **Market Data Pipeline** from the left-hand workflow list.
3. Click **Run workflow** → select branch → click green **Run workflow** button.

### 4. Entering Manual Metrics
When entering prints for indicators without public automated APIs:
1. Open the relevant file in `data/market/manual/`:
   - `fed_futures.csv`
   - `india_rates.csv`
   - `india_credit.csv`
   - `india_macro.csv`
   - `india_commodities.csv`
2. Append a new row: `metric_id,YYYY-MM-DD,value,note`.
3. Commit to GitHub. The next pipeline run validates and rolls the data. See [`docs/MANUAL_INPUT.md`](docs/MANUAL_INPUT.md) for full instructions.

---

## Architecture & Repo Layout

```
.
├── market-dashboard.html        # Market Dashboard page (native HTML)
├── market-dashboard.css         # Dashboard styling (site design tokens)
├── market-dashboard.js          # Client-side tab switching, charts & tables
├── .github/workflows/
│   ├── market-data.yml          # Automated market pipeline workflow
│   └── daily_nav_update.yml     # Existing portfolio NAV workflow
├── pipeline/                    # Python data engine
│   ├── config/metrics.yml       # Central metric configuration registry
│   ├── fetchers/
│   │   ├── fred.py              # Public FRED CSV fetcher (no API key)
│   │   └── yahoo.py             # Yahoo Finance unadjusted Close fetcher
│   ├── compute.py               # Calculation engine (THIS, LAST, BASE, YTD, slopes)
│   ├── validate.py              # Manual CSV validation & staleness check
│   ├── run.py                   # Master pipeline runner
│   └── requirements.txt         # Pipeline dependencies
├── data/market/
│   ├── history/*.csv            # Daily close history per metric (id, date, value)
│   ├── manual/*.csv             # User manual entry templates
│   └── latest.json              # Pre-computed JSON payload rendered by frontend
├── tests/
│   └── test_compute.py          # Pytest & Unittest test suite with fixtures
└── docs/
    ├── SOURCES.md               # Complete metric-to-source registry
    └── MANUAL_INPUT.md          # Manual input instructions
```

---

## Local Development & Testing

Run unit tests:
```bash
python -m pytest tests/
```

Run data pipeline locally:
```bash
python pipeline/run.py
```
