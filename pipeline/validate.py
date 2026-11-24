"""Validator for manual input CSVs and data health checking."""

from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Tuple
import pandas as pd


def validate_manual_csv(file_path: Path) -> Tuple[List[str], List[str]]:
    """Validate a manual input CSV file.
    
    Returns (errors, warnings).
    Columns required: metric_id, date, value, note
    """
    errors: List[str] = []
    warnings: List[str] = []

    if not file_path.exists():
        warnings.append(f"Manual file not found: {file_path.name}")
        return errors, warnings

    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        errors.append(f"Failed to read CSV {file_path.name}: {e}")
        return errors, warnings

    expected_cols = {"metric_id", "date", "value", "note"}
    if not expected_cols.issubset(set(df.columns)):
        missing = expected_cols - set(df.columns)
        errors.append(f"{file_path.name} missing required columns: {missing}")
        return errors, warnings

    if df.empty:
        # Empty template is allowed
        return errors, warnings

    today_str = datetime.now().strftime("%Y-%m-%d")

    for idx, row in df.iterrows():
        line_num = idx + 2
        metric_id = str(row["metric_id"]).strip()
        date_str = str(row["date"]).strip()
        val = row["value"]

        # Skip rows where metric_id is empty or NaN
        if not metric_id or pd.isna(row["metric_id"]):
            continue

        # Skip rows where value is empty (unfilled template row)
        if pd.isna(val) or str(val).strip() == "":
            continue

        # Validate date format
        try:
            row_dt = datetime.strptime(date_str, "%Y-%m-%d")
            if date_str > today_str:
                errors.append(f"{file_path.name}:{line_num} Date '{date_str}' is in the future.")
        except ValueError:
            errors.append(f"{file_path.name}:{line_num} Invalid date format '{date_str}' (expected YYYY-MM-DD).")

        # Validate numeric value
        try:
            num_val = float(val)
            # Basic sanity checks
            if abs(num_val) > 1_000_000_000:
                warnings.append(f"{file_path.name}:{line_num} Unusually large value {num_val} for {metric_id}.")
        except (ValueError, TypeError):
            errors.append(f"{file_path.name}:{line_num} Non-numeric value '{val}' for {metric_id}.")

    return errors, warnings


def validate_all_manual_inputs(manual_dir: Path) -> Tuple[List[str], List[str]]:
    """Validate all CSV files in the manual input directory."""
    all_errors = []
    all_warnings = []

    if not manual_dir.exists():
        return all_errors, all_warnings

    for csv_file in manual_dir.glob("*.csv"):
        errs, warns = validate_manual_csv(csv_file)
        all_errors.extend(errs)
        all_warnings.extend(warns)

    return all_errors, all_warnings
