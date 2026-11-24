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
| `cmd_gold` | Gold ($/oz) | Yahoo Finance | `GC=F` | Auto | COMEX Gold Futures ($/troy oz) |
| `cmd_silver` | Silver ($/oz) | Yahoo Finance | `SI=F` | Auto | COMEX Silver Futures ($/troy oz) |
| `cmd_copper` | Copper ($/lb) | Yahoo Finance | `HG=F` | Auto | COMEX Copper Futures ($/lb) |
| `cmd_aluminum` | Aluminum (LME $/MT) | Yahoo Finance | `ALI=F` | Auto | LME Aluminum Cash/Futures ($/MT) |
| `cmd_zinc` | Zinc ($/lb) | Yahoo Finance | `ZN=F` | Auto | Global Zinc Futures |
| `cmd_platinum` | Platinum ($/oz) | Yahoo Finance | `PL=F` | Auto | NYMEX Platinum Futures ($/troy oz) |
| `cmd_palladium`| Palladium ($/oz) | Yahoo Finance | `PA=F` | Auto | NYMEX Palladium Futures ($/troy oz) |
| `cmd_wti` | WTI Crude Oil ($/bbl) | Yahoo Finance | `CL=F` | Auto | NYMEX Light Sweet Crude ($/bbl) |
| `cmd_brent` | Brent Crude Oil ($/bbl) | Yahoo Finance | `BZ=F` | Auto | ICE Brent Crude Futures ($/bbl) |
| `cmd_natgas` | Natural Gas ($/MMBtu) | Yahoo Finance | `NG=F` | Auto | Henry Hub Natural Gas |
| `cmd_gasoline` | RBOB Gasoline ($/gal) | Yahoo Finance | `RB=F` | Auto | NYMEX RBOB Gasoline |
| `cmd_heatingoil`| Heating Oil ($/gal) | Yahoo Finance | `HO=F` | Auto | NYMEX Heating Oil |
| `cmd_wheat` | Wheat (CBOT) | Yahoo Finance | `ZW=F` | Auto | CBOT Wheat Futures |
| `cmd_corn` | Corn (CBOT) | Yahoo Finance | `ZC=F` | Auto | CBOT Corn Futures |
| `cmd_soybeans` | Soybeans (CBOT) | Yahoo Finance | `ZS=F` | Auto | CBOT Soybean Futures |
| `cmd_soyoil` | Soybean Oil (CBOT) | Yahoo Finance | `ZL=F` | Auto | CBOT Soybean Oil Futures |
| `cmd_coffee` | Coffee (ICE) | Yahoo Finance | `KC=F` | Auto | ICE Coffee 'C' Futures |
| `cmd_sugar` | Sugar #11 (ICE) | Yahoo Finance | `SB=F` | Auto | ICE Sugar #11 Futures |
| `cmd_cotton` | Cotton #2 (ICE) | Yahoo Finance | `CT=F` | Auto | ICE Cotton #2 Futures |
| `cmd_livecattle`| Live Cattle (CME) | Yahoo Finance | `LE=F` | Auto | CME Live Cattle Futures |
| `cmd_leanhogs` | Lean Hogs (CME) | Yahoo Finance | `HE=F` | Auto | CME Lean Hogs Futures |
| `mbs_mbb` | MBB | Yahoo Finance | `MBB` | Auto | iShares MBS ETF |
| `mbs_agnc` | AGNC | Yahoo Finance | `AGNC` | Auto | AGNC Investment Corp |
| `mbs_nly` | NLY | Yahoo Finance | `NLY` | Auto | Annaly Capital Management |

---

## Tab 3: India Rates & Equity

| Metric ID | Label | Source | Series / Ticker / Formula | Status | Verified Endpoint |
|---|---|---|---|---|---|
| `in_repo` | RBI Policy Repo Rate | RBI | Scraper | Auto | RBI Press Release LAF corridor |
| `in_sdf` | Standing Deposit Facility | RBI | Scraper | Auto | RBI Press Release LAF corridor |
| `in_msf` | Marginal Standing Facility | RBI | Scraper | Auto | RBI Press Release LAF corridor |
| `in_wacr` | Weighted Avg Call Rate | RBI | Scraper | Auto | RBI Press Release Overnight Segment |
| `in_tbill_91d` | 91D T-Bill Rate | Manual | `in_tbill_91d` | Manual | RBI weekly auction result |
| `in_tbill_182d`| 182D T-Bill Rate | Manual | `in_tbill_182d` | Manual | RBI weekly auction result |
| `in_tbill_364d`| 364D T-Bill Rate | Manual | `in_tbill_364d` | Manual | RBI weekly auction result |
| `in_cd_3m` | 3M CD Rate | Manual | `in_cd_3m` | Manual | FIMMDA / FBIL Money Market |
| `in_cd_12m` | 12M CD Rate | Manual | `in_cd_12m` | Manual | FIMMDA / FBIL Money Market |
| `in_gsec_1y` | 1Y G-Sec Yield | Manual | `in_gsec_1y` | Manual | FBIL G-Sec Par Yield Curve |
| `in_gsec_2y` | 2Y G-Sec Yield | Manual | `in_gsec_2y` | Manual | FBIL G-Sec Par Yield Curve |
| `in_gsec_3y` | 3Y G-Sec Yield | Manual | `in_gsec_3y` | Manual | FBIL G-Sec Par Yield Curve |
| `in_gsec_5y` | 5Y G-Sec Yield | Manual | `in_gsec_5y` | Manual | FBIL G-Sec Par Yield Curve |
| `in_gsec_7y` | 7Y G-Sec Yield | Manual | `in_gsec_7y` | Manual | FBIL G-Sec Par Yield Curve |
| `in_gsec_10y`| 10Y Benchmark G-Sec | Manual | `in_gsec_10y` | Manual | FBIL Benchmark G-Sec Close |
| `in_gsec_15y`| 15Y G-Sec Yield | Manual | `in_gsec_15y` | Manual | FBIL G-Sec Par Yield Curve |
| `in_gsec_20y`| 20Y G-Sec Yield | Manual | `in_gsec_20y` | Manual | FBIL G-Sec Par Yield Curve |
| `in_gsec_30y`| 30Y G-Sec Yield | Manual | `in_gsec_30y` | Manual | FBIL G-Sec Par Yield Curve |
| `in_slope_10y2y`| 10Y − 2Y Slope | Derived | `in_gsec_10y - in_gsec_2y` | Auto | Derived G-Sec term premium |
| `in_slope_10y91d`| 10Y − 91D Slope | Derived | `in_gsec_10y - in_tbill_91d` | Auto | Derived G-Sec short curve slope |
| `in_slope_wacr_repo`| WACR − Repo Spread | Derived | `in_wacr - in_repo` | Auto | Liquidity friction indicator |
| `in_nifty50` | Nifty 50 Index | Yahoo Finance | `^NSEI` | Auto | NSE Nifty 50 Index Close |
| `in_sensex` | BSE Sensex Index | Yahoo Finance | `^BSESN` | Auto | BSE S&P Sensex Index Close |
| `in_nifty_next50`| Nifty Next 50 (Junior BeES)| Yahoo Finance | `JUNIORBEES.NS` | Auto | Nippon India Junior BeES ETF |
| `in_midcap150` | Nifty Midcap 150 | Yahoo Finance | `NIFTYMIDCAP150.NS` | Auto | NSE Nifty Midcap 150 Index |
| `in_smallcap250`| Nifty Smallcap 250 | Yahoo Finance | `NIFTYSMLCAP250.NS` | Auto | NSE Nifty Smallcap 250 Index |
| `in_nifty_bank`| Nifty Bank Index | Yahoo Finance | `^NSEBANK` | Auto | NSE Nifty Bank Index |
| `in_nifty_pvt_bank`| Nifty Private Bank | Yahoo Finance | `NIFTY_PVT_BANK.NS` | Auto | NSE Nifty Private Bank Index |
| `in_nifty_psu_bank`| Nifty PSU Bank | Yahoo Finance | `^CNXPSUBANK` | Auto | NSE Nifty PSU Bank Index |
| `in_nifty_fin` | Nifty Financial Services | Yahoo Finance | `^CNXFIN` | Auto | NSE Nifty Financial Services |
| `in_nifty_it` | Nifty IT Index | Yahoo Finance | `^CNXIT` | Auto | NSE Nifty IT Index |
| `in_nifty_pharma`| Nifty Pharma Index | Yahoo Finance | `^CNXPHARMA` | Auto | NSE Nifty Pharma Index |
| `in_nifty_fmcg`| Nifty FMCG Index | Yahoo Finance | `^CNXFMCG` | Auto | NSE Nifty FMCG Index |
| `in_nifty_auto`| Nifty Auto Index | Yahoo Finance | `^CNXAUTO` | Auto | NSE Nifty Auto Index |
| `in_nifty_metal`| Nifty Metal Index | Yahoo Finance | `^CNXMETAL` | Auto | NSE Nifty Metal Index |
| `in_nifty_energy`| Nifty Energy Index | Yahoo Finance | `^CNXENERGY` | Auto | NSE Nifty Energy Index |
| `in_nifty_realty`| Nifty Realty Index | Yahoo Finance | `^CNXREALTY` | Auto | NSE Nifty Realty Index |
| `in_nifty_infra`| Nifty Infra Index | Yahoo Finance | `^CNXINFRA` | Auto | NSE Nifty Infrastructure Index |
| `in_usdinr` | USD / INR Spot | Yahoo Finance | `INR=X` | Auto | Interbank Spot Exchange Rate |
| `in_vix` | India VIX | Yahoo Finance | `^INDIAVIX` | Auto | NSE India Volatility Index |
| `in_gilt_proxy`| Gilt ETF (5Y Proxy) | Yahoo Finance | `GILT5YBEES.NS` | Auto | Nippon India ETF Nifty Gilt |

---

## Tab 4: India Real Yields, Credit, Commodities & Housing

| Metric ID | Label | Source | Series / Ticker / Formula | Status | Verified Endpoint |
|---|---|---|---|---|---|
| `in_cpi_latest`| CPI YoY Inflation (Latest) | Manual | `in_cpi_latest` | Manual | MoSPI Headline CPI Print |
| `in_inf_exp_1y`| RBI 1Y Inflation Exp | Manual | `in_inf_exp_1y` | Manual | RBI Household Survey (IESH) |
| `in_real_5y` | 5Y G-Sec Real Yield | Derived | `in_gsec_5y - in_cpi_latest` | Auto | Ex-Post Real Yield |
| `in_real_10y` | 10Y G-Sec Real Yield | Derived | `in_gsec_10y - in_cpi_latest` | Auto | Ex-Post Real Yield |
| `in_real_10y_exante`| 10Y Ex-Ante Real Yield | Derived | `in_gsec_10y - in_inf_exp_1y` | Auto | Ex-Ante Real Yield |
| `in_iib_10y` | 10Y IIB Real Yield | Manual | `in_iib_10y` | Manual | Inflation Indexed Bond yield |
| `in_be_10y` | 10Y Breakeven Inflation | Derived | `in_gsec_10y - in_iib_10y` | Auto | Derived inflation compensation |
| `in_spread_aaa_3y`| AAA 3Y Spread (bps) | Manual | `in_spread_aaa_3y` | Manual | CRISIL / FIMMDA Corporate Bond |
| `in_spread_aaa_5y`| AAA 5Y Spread (bps) | Manual | `in_spread_aaa_5y` | Manual | CRISIL / FIMMDA Corporate Bond |
| `in_spread_aaa_10y`| AAA 10Y Spread (bps)| Manual | `in_spread_aaa_10y` | Manual | CRISIL / FIMMDA Corporate Bond |
| `in_spread_aa_3y`| AA 3Y Spread (bps) | Manual | `in_spread_aa_3y` | Manual | CRISIL / FIMMDA Corporate Bond |
| `in_spread_a_3y` | A 3Y Spread (bps) | Manual | `in_spread_a_3y` | Manual | CRISIL / FIMMDA Corporate Bond |
| `in_spread_bbb_3y`| BBB 3Y Spread (bps)| Manual | `in_spread_bbb_3y` | Manual | CRISIL / FIMMDA Corporate Bond |
| `in_spread_sdl_10y`| SDL 10Y Spread (bps)| Manual | `in_spread_sdl_10y` | Manual | State Development Loan vs G-Sec |
| `in_sbi_home_loan`| SBI Home Loan Floor | Manual | `in_sbi_home_loan` | Manual | SBI EBLR + Base Spread |
| `in_hdfc_home_loan`| HDFC Home Loan Floor| Manual | `in_hdfc_home_loan` | Manual | HDFC Bank Retail Prime Floor |
| `in_spread_hl_repo`| Home Loan over Repo | Derived | `in_sbi_home_loan - in_repo` | Auto | Retail mortgage banking margin |
| `in_lichsgfin` | LIC Housing Finance | Yahoo Finance | `LICHSGFIN.NS` | Auto | NSE traded close |
| `in_pnbhousing`| PNB Housing Finance | Yahoo Finance | `PNBHOUSING.NS` | Auto | NSE traded close |
| `in_bajajhfl` | Bajaj Housing Finance | Yahoo Finance | `BAJAJHFL.NS` | Auto | NSE traded close |
| `in_canfinhome`| Can Fin Homes | Yahoo Finance | `CANFINHOME.NS` | Auto | NSE traded close |
| `in_reit_embassy`| Embassy REIT | Yahoo Finance | `EMBASSY.NS` | Auto | NSE traded close |
| `in_reit_mindspace`| Mindspace REIT | Yahoo Finance | `MINDSPACE.NS` | Auto | NSE traded close |
| `in_reit_biret`| Brookfield REIT | Yahoo Finance | `BIRET.NS` | Auto | NSE traded close |
| `in_brent` | Brent Crude (ICE $/bbl) | Yahoo Finance | `BZ=F` | Auto | ICE Brent Crude Futures |
| `in_wti` | WTI Crude (NYMEX $/bbl) | Yahoo Finance | `CL=F` | Auto | NYMEX Light Sweet Crude |
| `in_natgas` | Natural Gas (NYMEX $/MMBtu)| Yahoo Finance | `NG=F` | Auto | Henry Hub Natural Gas |
| `ncdex_turmeric`| NCDEX Turmeric (TMCFGRNZM) | NCDEX | Scraper (`ncdex.com`) | Auto | NCDEX Active Contract (Farmer Grade Nizamabad) |
| `ncdex_jeera` | NCDEX Jeera / Cumin (JEERAUNJHA)| NCDEX | Scraper (`ncdex.com`) | Auto | NCDEX Active Contract (Unjha) |
| `ncdex_dhaniya`| NCDEX Coriander (DHANIYA) | NCDEX | Scraper (`ncdex.com`) | Auto | NCDEX Active Contract |
| `ncdex_guargum`| NCDEX Guar Gum 5MT (GUARGUM5)| NCDEX | Scraper (`ncdex.com`) | Auto | NCDEX Active Contract |
| `ncdex_guarseed`| NCDEX Guar Seed 10MT (GUARSEED10)| NCDEX | Scraper (`ncdex.com`) | Auto | NCDEX Active Contract |
| `ncdex_castor` | NCDEX Castor Seed (CASTOR) | NCDEX | Scraper (`ncdex.com`) | Auto | NCDEX Active Contract |
| `ncdex_cocudakl`| NCDEX Cottonseed Oilcake | NCDEX | Scraper (`ncdex.com`) | Auto | NCDEX Active Contract (Akola) |
| `ncdex_pepper` | NCDEX Black Pepper (PEPPER) | NCDEX | Scraper (`ncdex.com`) | Auto | NCDEX Active Contract |
| `ncdex_soybean`| NCDEX Soybean (Indore) | Manual | `ncdex_soybean` | Manual | NCDEX Indore delivery benchmark |
| `ncdex_rmseed` | NCDEX Mustard Seed / RM Seed | Manual | `ncdex_rmseed` | Manual | NCDEX Jaipur delivery benchmark |
| `ncdex_chana` | NCDEX Chana / Gram (Delhi) | Manual | `ncdex_chana` | Manual | NCDEX Delhi delivery benchmark |
| `ncdex_syoref` | NCDEX Refined Soy Oil | Manual | `ncdex_syoref` | Manual | NCDEX Kandla delivery benchmark |
| `ncdex_kapas` | NCDEX Kapas / Raw Cotton | Manual | `ncdex_kapas` | Manual | NCDEX Rajkot delivery benchmark |
| `ncdex_maize` | NCDEX Maize (Kharif) | Manual | `ncdex_maize` | Manual | NCDEX Chhindwara delivery benchmark |
| `ncdex_barley` | NCDEX Barley / Jau | Manual | `ncdex_barley` | Manual | NCDEX Jaipur delivery benchmark |
| `ncdex_moong` | NCDEX Moong | Manual | `ncdex_moong` | Manual | NCDEX Mertha delivery benchmark |

---

## Tab 5: India Flows, Liquidity & Macro

| Metric ID | Label | Source | Series / Ticker / Formula | Status | Verified Endpoint |
|---|---|---|---|---|---|
| `cross_10y_spread`| India 10Y vs US 10Y | Derived | `in_gsec_10y - ust_10y` | Auto | Cross-market Sovereign Spread |
| `fed_funds_target`| Fed Funds Target Upper | FRED | `DFEDTARU` | Auto | Federal Reserve Target Rate |
| `cross_repo_fed_spread`| Repo vs Fed Funds | Derived | `in_repo - fed_funds_target` | Auto | Cross-border Monetary Policy Spread |
| `in_fpi_equity`| FPI Net Equity Flow | Manual | `in_fpi_equity` | Manual | NSDL FPI Monitor (Daily) |
| `in_fpi_debt` | FPI Net Debt Flow | Manual | `in_fpi_debt` | Manual | NSDL FPI Monitor (Daily) |
| `in_dii_equity` | DII Net Equity Flow | Manual | `in_dii_equity` | Manual | NSE Daily Trading Activity Report |
| `in_sip_inflows`| MF SIP Inflows (AMFI) | Manual | `in_sip_inflows` | Manual | AMFI Monthly Industry Data |
| `in_bank_liquidity`| System Liquidity | Manual | `in_bank_liquidity` | Manual | RBI LAF Net Liquidity Position |
| `in_forex_reserves`| Forex Reserves ($ bn) | Manual | `in_forex_reserves` | Manual | RBI Weekly Statistical Supplement |
| `in_nifty_pe` | Nifty 50 Trailing P/E | Manual | `in_nifty_pe` | Manual | niftyindices.com / NSE |
| `in_nifty_pb` | Nifty 50 P/B | Manual | `in_nifty_pb` | Manual | niftyindices.com / NSE |
| `in_nifty_div_yield`| Nifty 50 Div Yield | Manual | `in_nifty_div_yield` | Manual | niftyindices.com / NSE |
| `in_nifty_earnings_yield`| Earnings Yield | Derived | `100.0 / in_nifty_pe` | Auto | Calculated E/P |
| `in_nifty_erp` | Equity Risk Premium | Derived | `in_nifty_earnings_yield - in_gsec_10y` | Auto | Earnings Yield minus 10Y G-Sec |
| `in_midcap_pe` | Midcap 150 P/E | Manual | `in_midcap_pe` | Manual | niftyindices.com |
| `in_smallcap_pe`| Smallcap 250 P/E | Manual | `in_smallcap_pe` | Manual | niftyindices.com |
| `in_mcap_gdp` | Market-Cap to GDP | Manual | `in_mcap_gdp` | Manual | Buffett Indicator |
| `in_macro_cpi` | Headline CPI YoY | Manual | `in_macro_cpi` | Manual | MoSPI CPI Monthly Release |
| `in_macro_core_cpi`| Core CPI YoY | Manual | `in_macro_core_cpi` | Manual | Headline minus Food & Energy |
| `in_macro_wpi` | Headline WPI YoY | Manual | `in_macro_wpi` | Manual | Office of Economic Adviser |
| `in_macro_iip` | IIP YoY | Manual | `in_macro_iip` | Manual | MoSPI Industrial Output |
| `in_macro_gdp` | Real GDP Growth YoY | Manual | `in_macro_gdp` | Manual | National Statistical Office (NSO) |
| `in_macro_mfg_pmi`| HSBC Mfg PMI | Manual | `in_macro_mfg_pmi` | Manual | S&P Global / HSBC |
| `in_macro_srv_pmi`| HSBC Services PMI | Manual | `in_macro_srv_pmi` | Manual | S&P Global / HSBC |
| `in_macro_gst` | GST Collections | Manual | `in_macro_gst` | Manual | Ministry of Finance Monthly |
| `in_macro_trade_deficit`| Trade Deficit | Manual | `in_macro_trade_deficit`| Manual | Department of Commerce |
| `in_macro_cab` | Current Account Balance| Manual | `in_macro_cab` | Manual | RBI Balance of Payments |
| `in_macro_fiscal_deficit`| Fiscal Deficit (% BE)| Manual | `in_macro_fiscal_deficit`| Manual | Controller General of Accounts |
| `in_credit_growth`| Bank Credit Growth | Manual | `in_credit_growth` | Manual | RBI Fortnightly WSS |
| `in_deposit_growth`| Bank Deposit Growth | Manual | `in_deposit_growth` | Manual | RBI Fortnightly WSS |
| `in_cd_gap` | Credit − Deposit Gap | Derived | `in_credit_growth - in_deposit_growth`| Auto | Liquidity growth divergence |
