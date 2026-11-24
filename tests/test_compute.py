"""Acceptance and unit tests for Market Dashboard compute engine and validation."""

import os
from pathlib import Path
import sys
import unittest
import pandas as pd

# Add pipeline directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
PIPELINE_DIR = BASE_DIR / "pipeline"
if str(PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(PIPELINE_DIR))

from compute import (
    compute_derived_history,
    compute_metric_stats,
    get_as_of_observation,
)
from validate import validate_manual_csv


class TestMarketCompute(unittest.TestCase):

    def test_acceptance_criteria_us_fixtures(self):
        """Verify exact QA / Acceptance criteria with US fixtures (week of 2026-11-20):
        
        Par yields:
          THIS: 2Y 4.63, 3M 4.32, 5Y 4.71, 10Y 4.92
          BASE (1-Jan-2026): 2Y 3.47, 3M 3.67, 10Y 4.18
        Real yields:
          THIS: 5Y 2.53, 10Y 2.77, 20Y 3.03

        Expected:
          2s10s THIS = 4.92 - 4.63 = 0.29
          2s10s BASE = 4.18 - 3.47 = 0.71
          2s10s YTD = 0.29 - 0.71 = -0.42
          3m10y THIS = 4.92 - 4.32 = 0.60
          3m10y BASE = 4.18 - 3.67 = 0.51
          Breakeven 5Y = 4.71 - 2.53 = 2.18
          Breakeven 10Y = 4.92 - 2.77 = 2.15
          Real F5Y5Y = 2 * 2.77 - 2.53 = 3.01
          BE F5Y5Y = 2 * 2.15 - 2.18 = 2.12
        """
        # Create fixture history dataframes
        dates = ["2025-12-31", "2026-01-01", "2026-11-13", "2026-11-20"]
        
        ust_2y_hist = pd.DataFrame({
            "date": dates,
            "value": [3.45, 3.47, 4.60, 4.63]
        })
        ust_3m_hist = pd.DataFrame({
            "date": dates,
            "value": [3.65, 3.67, 4.30, 4.32]
        })
        ust_5y_hist = pd.DataFrame({
            "date": dates,
            "value": [3.70, 3.75, 4.68, 4.71]
        })
        ust_10y_hist = pd.DataFrame({
            "date": dates,
            "value": [4.15, 4.18, 4.88, 4.92]
        })

        real_5y_hist = pd.DataFrame({
            "date": dates,
            "value": [1.50, 1.55, 2.50, 2.53]
        })
        real_10y_hist = pd.DataFrame({
            "date": dates,
            "value": [1.80, 1.85, 2.75, 2.77]
        })
        real_20y_hist = pd.DataFrame({
            "date": dates,
            "value": [2.00, 2.05, 3.00, 3.03]
        })

        histories = {
            "ust_2y": ust_2y_hist,
            "ust_3m": ust_3m_hist,
            "ust_5y": ust_5y_hist,
            "ust_10y": ust_10y_hist,
            "real_5y": real_5y_hist,
            "real_10y": real_10y_hist,
            "real_20y": real_20y_hist,
        }

        # 1. 2s10s slope
        slope_2s10s_hist = compute_derived_history("ust_10y - ust_2y", histories)
        stats_2s10s = compute_metric_stats(
            {"id": "slope_2s10s", "display_type": "rate", "stale_after_days": 10},
            slope_2s10s_hist,
            current_year=2026
        )
        self.assertEqual(stats_2s10s["this_value"], 0.29)
        self.assertEqual(stats_2s10s["base_value"], 0.71)
        self.assertEqual(stats_2s10s["ytd"], -0.42)

        # 2. 3m10y slope
        slope_3m10y_hist = compute_derived_history("ust_10y - ust_3m", histories)
        stats_3m10y = compute_metric_stats(
            {"id": "slope_3m10y", "display_type": "rate", "stale_after_days": 10},
            slope_3m10y_hist,
            current_year=2026
        )
        self.assertEqual(stats_3m10y["this_value"], 0.60)
        self.assertEqual(stats_3m10y["base_value"], 0.51)

        # 3. Breakeven 5Y
        be_5y_hist = compute_derived_history("ust_5y - real_5y", histories)
        stats_be_5y = compute_metric_stats(
            {"id": "be_5y", "display_type": "rate", "stale_after_days": 10},
            be_5y_hist,
            current_year=2026
        )
        self.assertEqual(stats_be_5y["this_value"], 2.18)

        # 4. Breakeven 10Y
        be_10y_hist = compute_derived_history("ust_10y - real_10y", histories)
        stats_be_10y = compute_metric_stats(
            {"id": "be_10y", "display_type": "rate", "stale_after_days": 10},
            be_10y_hist,
            current_year=2026
        )
        self.assertEqual(stats_be_10y["this_value"], 2.15)

        # 5. Real F5Y5Y = 2 * real_10y - real_5y
        real_f5y5y_hist = compute_derived_history("2 * real_10y - real_5y", histories)
        stats_real_f5y5y = compute_metric_stats(
            {"id": "real_f5y5y", "display_type": "rate", "stale_after_days": 10},
            real_f5y5y_hist,
            current_year=2026
        )
        self.assertEqual(stats_real_f5y5y["this_value"], 3.01)

        # 6. BE F5Y5Y = 2 * be_10y - be_5y
        histories["be_5y"] = be_5y_hist
        histories["be_10y"] = be_10y_hist
        be_f5y5y_hist = compute_derived_history("2 * be_10y - be_5y", histories)
        stats_be_f5y5y = compute_metric_stats(
            {"id": "be_f5y5y", "display_type": "rate", "stale_after_days": 10},
            be_f5y5y_hist,
            current_year=2026
        )
        self.assertEqual(stats_be_f5y5y["this_value"], 2.12)

    def test_as_of_observation(self):
        df = pd.DataFrame({
            "date": ["2026-01-02", "2026-01-05", "2026-01-09"],
            "value": [10.0, 12.0, 15.0]
        })
        # Target date exactly matches
        obs = get_as_of_observation(df, "2026-01-05")
        self.assertEqual(obs["date"], "2026-01-05")
        self.assertEqual(obs["value"], 12.0)

        # Target date between rows (falls back to last on or before)
        obs = get_as_of_observation(df, "2026-01-07")
        self.assertEqual(obs["date"], "2026-01-05")
        self.assertEqual(obs["value"], 12.0)

        # Target date before all rows
        obs = get_as_of_observation(df, "2026-01-01")
        self.assertIsNone(obs)

    def test_price_change_and_ytd(self):
        """Verify price display_type calculates percentage returns."""
        df = pd.DataFrame({
            "date": ["2026-01-01", "2026-11-13", "2026-11-20"],
            "value": [100.0, 110.0, 121.0]
        })
        stats = compute_metric_stats(
            {"id": "spy", "display_type": "price", "stale_after_days": 30},
            df,
            current_year=2026
        )
        self.assertEqual(stats["this_value"], 121.0)
        self.assertEqual(stats["change"], 10.0)
        self.assertEqual(stats["ytd"], 21.0)

    def test_cycle_high(self):
        df = pd.DataFrame({
            "date": ["2022-12-01", "2023-05-10", "2024-08-15", "2026-11-20"],
            "value": [999.0, 50.0, 85.0, 60.0]
        })
        stats = compute_metric_stats(
            {"id": "test_ch", "display_type": "rate", "stale_after_days": 30},
            df,
            current_year=2026
        )
        self.assertEqual(stats["cycle_high"], 85.0)
        self.assertEqual(stats["cycle_high_date"], "2024-08-15")

    def test_flow_metric_compute(self):
        """Verify that display_type='flow' sets change=None, cycle_high=None, and computes cumulative YTD flow."""
        df = pd.DataFrame({
            "date": ["2026-01-01", "2026-11-13", "2026-11-20"],
            "value": [-3500.0, 1850.0, 5600.0]
        })
        stats = compute_metric_stats(
            {"id": "in_fpi_equity", "display_type": "flow", "stale_after_days": 10},
            df,
            current_year=2026
        )
        self.assertEqual(stats["this_value"], 5600.0)
        self.assertEqual(stats["last_value"], 1850.0)
        self.assertIsNone(stats["change"])
        self.assertIsNone(stats["cycle_high"])
        self.assertIsNone(stats["cycle_high_date"])
        # Cumulative sum of 2026: -3500 + 1850 + 5600 = 3950.0
        self.assertEqual(stats["ytd"], 3950.0)

    def test_csv_validator(self):
        import tempfile
        with tempfile.NamedTemporaryFile("w+", suffix=".csv", delete=False) as f:
            f.write("metric_id,date,value,note\nin_repo,2026-10-15,6.50,RBI Repo\n")
            f_name = f.name
        
        try:
            errs, warns = validate_manual_csv(Path(f_name))
            self.assertEqual(len(errs), 0)
        finally:
            os.remove(f_name)

        with tempfile.NamedTemporaryFile("w+", suffix=".csv", delete=False) as f:
            f.write("metric_id,date,value,note\nin_repo,2026-10-15,abc,RBI Repo\n")
            f_name = f.name
        try:
            errs, warns = validate_manual_csv(Path(f_name))
            self.assertGreater(len(errs), 0)
        finally:
            os.remove(f_name)


if __name__ == "__main__":
    unittest.main()
