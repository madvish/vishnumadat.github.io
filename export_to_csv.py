"""Reads Model_Portfolio_Master.xlsx (saved by Excel) and writes the website data files into ./data
Run:  python export_to_csv.py
Requires: pip install openpyxl pandas
"""
import json, datetime as dt, math
from pathlib import Path
import pandas as pd, openpyxl

XLSX = Path(__file__).parent / "Model_Portfolio_Master.xlsx"
OUT = Path(__file__).parent / "data"
OUT.mkdir(exist_ok=True)

wb = openpyxl.load_workbook(XLSX, data_only=True)
calc, settings = wb["calc"], wb["settings"]

def need(v, what):
    if v is None or (isinstance(v, float) and math.isnan(v)):
        raise SystemExit(f"STOP: '{what}' is empty. Open the workbook in Excel, let it recalculate, save, and run again.")
    return v

# safety checks - refuse to export if the workbook says CHECK
for r in range(4, 8):
    if calc[f"F{r}"].value != "OK":
        raise SystemExit(f"STOP: check '{calc[f'D{r}'].value}' is not OK in the calc sheet. Fix it and run again.")

asof = need(calc["B3"].value, "as-of date").date()
inception = need(calc["B4"].value, "inception").date()
pr, br, al = (need(calc[c].value, c) for c in ("B8", "B11", "B12"))

# ---- holdings
rows = []
txn = pd.DataFrame(wb["transactions"].values)
txn.columns = txn.iloc[0]; txn = txn.iloc[1:]; txn = txn[txn["ticker"].notna()]
first_buy = txn[txn["action (BUY/SELL)"] == "BUY"].groupby("ticker")["date"].min()
for r in range(21, 56):
    qty = calc[f"F{r}"].value
    if not qty: continue
    t = calc[f"C{r}"].value
    rows.append(dict(ticker=t, company=calc[f"B{r}"].value, sector=calc[f"D{r}"].value, industry=calc[f"E{r}"].value,
        weight_pct=round(calc[f"M{r}"].value*100, 2), target_weight_pct=round(calc[f"N{r}"].value*100, 2),
        active_weight_pct=round(calc[f"O{r}"].value*100, 2),
        entry_date=first_buy[t].strftime("%Y-%m-%d"), entry_price=round(calc[f"G{r}"].value, 2),
        last_price=round(calc[f"I{r}"].value, 2), return_since_entry_pct=round(calc[f"L{r}"].value*100, 2),
        contribution_pct=round(calc[f"P{r}"].value*100, 2)))
h = pd.DataFrame(rows).sort_values("weight_pct", ascending=False)
h.to_csv(OUT/"holdings.csv", index=False)

# ---- sectors
srows = []
for r in range(62, 77):
    if calc[f"A{r}"].value in (None, "TOTAL"): continue
    if not calc[f"C{r}"].value: continue
    srows.append(dict(sector=calc[f"A{r}"].value, weight_pct=round(calc[f"E{r}"].value*100, 2),
        target_weight_pct=round(calc[f"F{r}"].value*100, 2), sector_return_pct=round(calc[f"D{r}"].value*100, 2),
        contribution_pct=round(calc[f"H{r}"].value*100, 2)))
pd.DataFrame(srows).sort_values("weight_pct", ascending=False).to_csv(OUT/"sectors.csv", index=False)

# ---- nav (index values only - no rupee amounts)
nav = []
for row in wb["nav"].iter_rows(min_row=2, values_only=True):
    if row[0] in (None, ""): continue
    nav.append(dict(date=row[0].strftime("%Y-%m-%d"), portfolio_index=round(row[4], 2), benchmark_index=round(row[6], 2),
                    alpha_pp=round(row[7], 2), drawdown_pct=round(row[8]*100, 2)))
pd.DataFrame(nav).to_csv(OUT/"nav.csv", index=False)

# ---- transactions and changes
t = txn[["date", "ticker", "action (BUY/SELL)", "qty", "price", "change_id"]].copy()
t.columns = ["date", "ticker", "action", "qty", "price", "change_id"]
t["date"] = pd.to_datetime(t["date"]).dt.strftime("%Y-%m-%d")
t.to_csv(OUT/"transactions.csv", index=False)

ch = pd.DataFrame(wb["changes"].values); ch.columns = ch.iloc[0]; ch = ch.iloc[1:]; ch = ch[ch["change_id"].notna()]
ch["date"] = pd.to_datetime(ch["date"]).dt.strftime("%Y-%m-%d")
ch.sort_values("date", ascending=False, kind="stable").to_csv(OUT/"changes.csv", index=False)

# ---- theses
th = pd.DataFrame(wb["theses"].values); th.columns = th.iloc[0]; th = th.iloc[1:]; th = th[th["text"].notna()]
th["thesis_date"] = pd.to_datetime(th["thesis_date"]).dt.strftime("%Y-%m-%d")
th.to_csv(OUT/"theses.csv", index=False)

# ---- meta (last_updated = the day you run this script)
meta = dict(last_updated=dt.date.today().isoformat(), data_as_of=asof.isoformat(), inception=inception.isoformat(),
            benchmark=settings["B4"].value, currency=settings["B5"].value,
            since_inception_return_pct=round(pr*100, 2), benchmark_return_pct=round(br*100, 2),
            alpha_pp=round(al*100, 2), positions=len(h),
            annualised_note="Annualised figures are shown only after one year of history.")
(OUT/"meta.json").write_text(json.dumps(meta, indent=2))
print("Exported to", OUT, "| data as of", asof, "| return", meta["since_inception_return_pct"], "% vs", meta["benchmark_return_pct"], "%")
