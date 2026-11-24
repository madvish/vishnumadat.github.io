"""Unit tests for Moneycontrol commodity fetcher and metrics integration."""

from pathlib import Path
import sys
import unittest
from unittest.mock import MagicMock, patch

BASE_DIR = Path(__file__).resolve().parent.parent
PIPELINE_DIR = BASE_DIR / "pipeline"
if str(PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(PIPELINE_DIR))

from fetchers.moneycontrol import (
    MCX_MAP,
    NCDEX_MAP,
    SPOT_MAP,
    fetch_moneycontrol_commodities,
)


class TestMoneycontrolCommodities(unittest.TestCase):

    def test_symbol_maps_contain_required_metals(self):
        """Verify MCX and Spot maps include required metals (Gold, Silver, Copper)."""
        self.assertIn("GOLD", MCX_MAP)
        self.assertEqual(MCX_MAP["GOLD"], "mcx_gold")
        self.assertIn("SILVER", MCX_MAP)
        self.assertEqual(MCX_MAP["SILVER"], "mcx_silver")
        self.assertIn("COPPER", MCX_MAP)
        self.assertEqual(MCX_MAP["COPPER"], "mcx_copper")

        self.assertIn("GOLD", SPOT_MAP)
        self.assertEqual(SPOT_MAP["GOLD"], "spot_gold")
        self.assertIn("SILVER", SPOT_MAP)
        self.assertEqual(SPOT_MAP["SILVER"], "spot_silver")
        self.assertIn("COPPER", SPOT_MAP)
        self.assertEqual(SPOT_MAP["COPPER"], "spot_copper")

    @patch("fetchers.moneycontrol.fetch_moneycontrol_tab")
    def test_fetch_moneycontrol_commodities_mock(self, mock_fetch_tab):
        """Verify fetch_moneycontrol_commodities correctly parses tab payloads."""
        def fake_tab(tab_name):
            if tab_name == "MCX":
                return [
                    {"symbol": "GOLD", "lastPrice": "126021.00", "priceChange": "4243.00", "priceChangePercentage": "3.48", "expDate": "04 Dec 2026"},
                    {"symbol": "SILVER", "lastPrice": "154205.00", "priceChange": "6392.00", "priceChangePercentage": "4.32", "expDate": "04 Dec 2026"},
                    {"symbol": "COPPER", "lastPrice": "1193.90", "priceChange": "0.00", "priceChangePercentage": "0.00", "expDate": "30 Nov 2026"},
                ]
            elif tab_name == "SPOT":
                return [
                    {"symbol": "GOLD", "lastPrice": "124632.00", "priceChange": "827.00", "priceChangePercentage": "0.67"},
                ]
            elif tab_name == "NCDEX":
                return [
                    {"symbol": "TMCFGRNZM", "lastPrice": "25668.00", "priceChange": "-378.00", "priceChangePercentage": "-1.45"},
                ]
            return []

        mock_fetch_tab.side_effect = fake_tab

        res = fetch_moneycontrol_commodities()
        self.assertIn("mcx_gold", res)
        self.assertEqual(res["mcx_gold"]["value"], 126021.0)
        self.assertEqual(res["mcx_gold"]["pct"], 3.48)

        self.assertIn("mcx_silver", res)
        self.assertEqual(res["mcx_silver"]["value"], 154205.0)

        self.assertIn("mcx_copper", res)
        self.assertEqual(res["mcx_copper"]["value"], 1193.90)

        self.assertIn("spot_gold", res)
        self.assertEqual(res["spot_gold"]["value"], 124632.0)

        self.assertIn("ncdex_turmeric", res)
        self.assertEqual(res["ncdex_turmeric"]["value"], 25668.0)


if __name__ == "__main__":
    unittest.main()
