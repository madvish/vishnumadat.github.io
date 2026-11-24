"""Unit tests for Investing.com and US Treasury scraper."""

from pathlib import Path
import sys
import unittest
from unittest.mock import MagicMock, patch

BASE_DIR = Path(__file__).resolve().parent.parent
PIPELINE_DIR = BASE_DIR / "pipeline"
if str(PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(PIPELINE_DIR))

from fetchers.investing import fetch_investing_us_bonds, fetch_investing_macro_indicators


class TestInvestingFetcher(unittest.TestCase):

    @patch("fetchers.investing.urllib.request.urlopen")
    def test_investing_scrape_success(self, mock_urlopen):
        """Verify HTML parser correctly extracts 2M and 4M bill yields."""
        sample_html = """
        <table>
          <tr><td>Name</td><td>Yield</td></tr>
          <tr><td>&nbsp; U.S. 1M 4.126 4.109 +0.017 +0.41%</td></tr>
          <tr><td>&nbsp; U.S. 2M 4.206 4.189 +0.017 +0.41%</td></tr>
          <tr><td>&nbsp; U.S. 3M 4.302 4.283 +0.019 +0.44%</td></tr>
          <tr><td>&nbsp; U.S. 4M 4.375 4.363 +0.012 +0.28%</td></tr>
        </table>
        """
        mock_resp = MagicMock()
        mock_resp.read.return_value = sample_html.encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        res = fetch_investing_us_bonds()
        self.assertIn("ust_2m", res)
        self.assertEqual(res["ust_2m"]["value"], 4.206)
        self.assertIn("ust_4m", res)
        self.assertEqual(res["ust_4m"]["value"], 4.375)

    @patch("fetchers.investing.urllib.request.urlopen")
    def test_fetch_macro_indicators(self, mock_urlopen):
        """Verify macro indicators parser extracts CPI, GDP, PMI, etc."""
        sample_html = """
        <table>
          <tr><td>Inflation Rate</td><td>6.09</td></tr>
          <tr><td>Industrial Production</td><td>6.7</td></tr>
          <tr><td>GDP Annual Growth Rate</td><td>7.8</td></tr>
          <tr><td>Manufacturing PMI</td><td>56.0</td></tr>
          <tr><td>Services PMI</td><td>55.3</td></tr>
        </table>
        """
        mock_resp = MagicMock()
        mock_resp.read.return_value = sample_html.encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        res = fetch_investing_macro_indicators()
        self.assertIn("in_macro_cpi", res)
        self.assertEqual(res["in_macro_cpi"]["value"], 6.09)
        self.assertIn("in_macro_gdp", res)
        self.assertEqual(res["in_macro_gdp"]["value"], 7.8)
        self.assertIn("in_macro_mfg_pmi", res)
        self.assertEqual(res["in_macro_mfg_pmi"]["value"], 56.0)


if __name__ == "__main__":
    unittest.main()
