"""Unit tests for Investing.com and US Treasury scraper."""

from pathlib import Path
import sys
import unittest
from unittest.mock import MagicMock, patch

BASE_DIR = Path(__file__).resolve().parent.parent
PIPELINE_DIR = BASE_DIR / "pipeline"
if str(PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(PIPELINE_DIR))

from fetchers.investing import fetch_investing_us_bonds


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


if __name__ == "__main__":
    unittest.main()
