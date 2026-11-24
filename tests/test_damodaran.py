import unittest
from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parent.parent
PIPELINE_DIR = BASE_DIR / "pipeline"
if str(PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(PIPELINE_DIR))

from fetchers.damodaran import fetch_damodaran_erp


class TestDamodaranFetcher(unittest.TestCase):

    def test_fetch_damodaran_erp(self):
        data = fetch_damodaran_erp()
        self.assertIn("in_nifty_erp", data)
        self.assertIn("value", data["in_nifty_erp"])
        val = data["in_nifty_erp"]["value"]
        self.assertIsInstance(val, float)
        # India ERP is historically between 4.0% and 12.0% (specifically 7.08% currently)
        self.assertGreater(val, 4.0)
        self.assertLess(val, 12.0)
        self.assertIn("date", data["in_nifty_erp"])


if __name__ == "__main__":
    unittest.main()
