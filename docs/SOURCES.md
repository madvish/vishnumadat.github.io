# Market Dashboard — Data Sources & Series Registry

This document records the exact endpoint, ticker, or manual input mechanism for every metric tracked in the Market Dashboard.

---

## Tab 1: US Rates & Equity

| Metric ID | Label | Source | Series / Ticker / Formula | Status | Verified Endpoint |
|---|---|---|---|---|---|
| `ust_1m` | 1M Par Rate | FRED | `DGS1MO` | Auto | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS1MO` |
| `ust_2m` | 2M Par Rate | Manual | `ust_2m` | Manual | No CMT series published by FRED/Treasury; manual fallback |
| `ust_3m` | 3M Par Rate | FRED | `DGS3MO` | Auto | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS3MO` |
| `ust_4m` | 4M Par Rate | Manual | `ust_4m` | Manual | No CMT series published by FRED/Treasury; manual fallback |
| `ust_6m` | 6M Par Rate | FRED | `DGS6MO` | Auto | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS6MO` |
| `ust_1y` | 1Y Par Rate | FRED | `DGS1` | Auto | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS1` |
| `ust_2y` | 2Y Par Yield | FRED | `DGS2` | Auto | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS2` |
| `ust_3y` | 3Y Par Yield | FRED | `DGS3` | Auto | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS3` |
| `ust_5y` | 5Y Par Yield | FRED | `DGS5` | Auto | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS5` |
| `ust_7y` | 7Y Par Yield | FRED | `DGS7` | Auto | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS7` |
| `ust_10y` | 10Y Par Yield | FRED | `DGS10` | Auto | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10` |
| `ust_20y` | 20Y Par Yield | FRED | `DGS20` | Auto | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS20` |
| `ust_30y` | 30Y Par Yield | FRED | `DGS30` | Auto | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS30` |
| `slope_2s10s` | 2s10s Slope | Derived | `ust_10y - ust_2y` | Auto | Derived from DGS10 and DGS2 |
| `slope_3m10y` | 3m10y Slope | Derived | `ust_10y - ust_3m` | Auto | Derived from DGS10 and DGS3MO |
| `us_kre` | KRE Regional Bank | Yahoo Finance | `KRE` | Auto | Yahoo Finance unadjusted Close |
| `us_dxy` | US Dollar Index (DXY) | Yahoo Finance | `DX-Y.NYB` | Auto | ICE US Dollar Index |
| `us_xlu` | Utilities SPDR | Yahoo Finance | `XLU` | Auto | Utilities Select Sector SPDR |
| `us_iyr` | US Real Estate | Yahoo Finance | `IYR` | Auto | iShares U.S. Real Estate ETF |
| `us_xlp` | Consumer Staples | Yahoo Finance | `XLP` | Auto | Consumer Staples Select Sector |
| `us_spy` | S&P 500 ETF | Yahoo Finance | `SPY` | Auto | SPDR S&P 500 ETF Trust |
| `us_iwm` | Russell 2000 ETF | Yahoo Finance | `IWM` | Auto | iShares Russell 2000 ETF |
| `us_qqq` | Invesco QQQ | Yahoo Finance | `QQQ` | Auto | Invesco QQQ Trust |
| `us_tlt` | 20+ Year Treasury | Yahoo Finance | `TLT` | Auto | iShares 20+ Year Treasury Bond |
| `fed_futures` | 30D Fed Funds Strip | Manual / CME | `fed_futures.csv` | Manual | Fed funds contracts (ZQ) via template |

---

## Tab 2: US Real Yields, Breakevens, Credit & Commodities

| Metric ID | Label | Source | Series / Ticker / Formula | Status | Verified Endpoint |
|---|---|---|---|---|---|
| `real_5y` | 5Y Real TIPS | FRED | `DFII5` | Auto | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DFII5` |
| `real_7y` | 7Y Real TIPS | FRED | `DFII7` | Auto | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DFII7` |
| `real_10y` | 10Y Real TIPS | FRED | `DFII10` | Auto | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DFII10` |
| `real_20y` | 20Y Real TIPS | FRED | `DFII20` | Auto | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DFII20` |
| `real_30y` | 30Y Real TIPS | FRED | `DFII30` | Auto | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DFII30` |
| `real_f5y5y` | Fwd 5Y5Y Real | Derived | `2 * real_10y - real_5y` | Auto | Derived from TIPS curve |
| `be_5y` | 5Y Breakeven | Derived | `ust_5y - real_5y` | Auto | Nominal minus TIPS |
| `be_7y` | 7Y Breakeven | Derived | `ust_7y - real_7y` | Auto | Nominal minus TIPS |
| `be_10y` | 10Y Breakeven | Derived | `ust_10y - real_10y` | Auto | Nominal minus TIPS |
| `be_20y` | 20Y Breakeven | Derived | `ust_20y - real_20y` | Auto | Nominal minus TIPS |
| `be_30y` | 30Y Breakeven | Derived | `ust_30y - real_30y` | Auto | Nominal minus TIPS |
| `be_f5y5y` | Fwd 5Y5Y Breakeven | Derived | `2 * be_10y - be_5y` | Auto | Derived forward breakeven |
| `oas_ig` | IG OAS Spread | FRED | `BAMLC0A0CM` | Auto | ICE BofA US Corporate OAS |
| `oas_aa` | AA OAS Spread | FRED | `BAMLC0A2CAA` | Auto | ICE BofA AA Corporate OAS |
| `oas_bbb` | BBB OAS Spread | FRED | `BAMLC0A4CBBB` | Auto | ICE BofA BBB Corporate OAS |
| `oas_hy` | HY OAS Spread | FRED | `BAMLH0A0HYM2` | Auto | ICE BofA US High Yield OAS |
| `oas_bb` | BB OAS Spread | FRED | `BAMLH0A1HYBB` | Auto | ICE BofA BB High Yield OAS |
| `oas_ccc` | CCC OAS Spread | FRED | `BAMLH0A3HYC` | Auto | ICE BofA CCC High Yield OAS |
| `mortgage_30y`| 30Y Fixed Mortgage | FRED | `MORTGAGE30US` | Auto | Freddie Mac Primary Mortgage |
| `mortgage_spread`| Mortgage−10Y Spread | Derived | `mortgage_30y - ust_10y`| Auto | Derived spread vs 10Y UST |
| `cmd_gold` | Gold | Yahoo Finance | `GC=F` | Auto | COMEX Gold Futures |
| `cmd_silver` | Silver | Yahoo Finance | `SI=F` | Auto | COMEX Silver Futures |
| `cmd_copper` | Copper | Yahoo Finance | `HG=F` | Auto | COMEX Copper Futures |
| `cmd_aluminum` | Aluminum | Yahoo Finance | `ALI=F` | Auto | LME Aluminum Futures |
| `cmd_platinum` | Platinum | Yahoo Finance | `PL=F` | Auto | NYMEX Platinum Futures |
| `cmd_palladium`| Palladium | Yahoo Finance | `PA=F` | Auto | NYMEX Palladium Futures |
| `cmd_wti` | WTI Crude Oil | Yahoo Finance | `CL=F` | Auto | NYMEX Light Sweet Crude |
| `cmd_natgas` | Natural Gas | Yahoo Finance | `NG=F` | Auto | Henry Hub Natural Gas |
| `cmd_wheat` | Wheat | Yahoo Finance | `ZW=F` | Auto | CBOT Wheat Futures |
| `cmd_corn` | Corn | Yahoo Finance | `ZC=F` | Auto | CBOT Corn Futures |
| `cmd_soybeans` | Soybeans | Yahoo Finance | `ZS=F` | Auto | CBOT Soybean Futures |
| `cmd_leanhogs` | Lean Hogs | Yahoo Finance | `HE=F` | Auto | CME Lean Hogs Futures |
| `cmd_livecattle`| Live Cattle | Yahoo Finance | `LE=F` | Auto | CME Live Cattle Futures |
| `mbs_mbb` | MBB | Yahoo Finance | `MBB` | Auto | iShares MBS ETF |
| `mbs_agnc` | AGNC | Yahoo Finance | `AGNC` | Auto | AGNC Investment Corp |
| `mbs_nly` | NLY | Yahoo Finance | `NLY` | Auto | Annaly Capital Management |

---

## Tabs 3–5: India Intelligence (Integration Roadmap)

| Metric Category | Target Sources | Auto Status | Fallback File |
|---|---|---|---|
| Policy & Money Market (Repo, SDF, MSF, WACR, T-Bills) | FBIL / RBI DBIE / WSS | Best-effort scraper | `data/market/manual/india_rates.csv` |
| Benchmark G-Sec Yields (1Y–30Y) | FBIL / CCIL | Best-effort scraper | `data/market/manual/india_rates.csv` |
| Equity Indices (Nifty 50, Bank, Sectors) | Yahoo Finance (`^NSEI`, `^NSEBANK`, etc.) | Auto | Yahoo Finance |
| Corporate Credit Spreads (AAA, AA, A, BBB, SDL) | FBIL / FIMMDA / CRISIL | Best-effort scraper | `data/market/manual/india_credit.csv` |
| Domestic Commodities (MCX Gold, Silver, Crude) | MCX API / Yahoo | Best-effort scraper | `data/market/manual/india_commodities.csv` |
| FPI / DII Flows | NSDL FPI Monitor / NSE | Best-effort scraper | `data/market/manual/india_macro.csv` |
| High-Frequency Macro (CPI, IIP, GST, SIP) | MoSPI / AMFI / Ministry of Finance | Manual (monthly prints) | `data/market/manual/india_macro.csv` |
