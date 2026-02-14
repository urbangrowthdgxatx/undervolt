"""Data cleaning utilities"""
import logging
import pandas as pd
from ..config import GPU_ENABLED, DATE_COLUMNS, NUMERIC_COLUMNS, ZIP_SOURCES

log = logging.getLogger("permits")

if GPU_ENABLED:
    import cudf


def parse_dates_cpu(col):
    """
    Parse dates using CPU (safe fallback to avoid cuDF date bugs)

    Args:
        col: Column to parse

    Returns:
        Parsed datetime column
    """
    col_cpu = col.to_pandas() if GPU_ENABLED else col
    parsed = pd.to_datetime(col_cpu, errors="coerce")

    if GPU_ENABLED:
        return cudf.from_pandas(parsed)
    return parsed


def clean_permit_data(df):
    """
    Clean and normalize permit data

    Args:
        df: Raw DataFrame

    Returns:
        Cleaned DataFrame
    """
    log.info("Starting cleaning pipeline...")

    # Column name normalization
    df.columns = (
        df.columns
        .str.lower()
        .str.replace(" ", "_")
        .str.replace("__", "_")
    )

    # DATE COLUMNS
    for col in DATE_COLUMNS:
        if col in df:
            df[col] = parse_dates_cpu(df[col])

    # NUMERIC COLUMNS
    for col in NUMERIC_COLUMNS:
        if col in df:
            # Strip commas
            df[col] = df[col].astype("str").str.replace(",", "", regex=False)

            # Safe parse
            col_cpu = df[col].to_pandas() if GPU_ENABLED else df[col]
            col_cpu = pd.to_numeric(col_cpu, errors="coerce")
            df[col] = cudf.from_pandas(col_cpu) if GPU_ENABLED else col_cpu

    # ZIP CODE extraction
    df["zip_code"] = None

    for src in ZIP_SOURCES:
        if src in df:
            extracted = df[src].astype("str").str.extract(r"(\d{5})", expand=False)
            df["zip_code"] = extracted.fillna(df["zip_code"])

    # Lat/Lon filtering
    if "latitude" in df and "longitude" in df:
        df["latitude"] = df["latitude"].astype("float64")
        df["longitude"] = df["longitude"].astype("float64")

        before = len(df)
        df = df[
            (df["latitude"] > -90) & (df["latitude"] < 90) &
            (df["longitude"] > -180) & (df["longitude"] < 180)
        ]
        log.info(f"Filtered invalid lat/lon rows: {before - len(df):,}")

    # Remove invalid rows
    if "permit_num" in df and "original_address_1" in df:
        before = len(df)
        df = df.dropna(subset=["permit_num", "original_address_1"])
        log.info(f"Dropped {before - len(df):,} invalid rows")

    log.info(f"Final row count: {len(df):,}")
    log.info("Columns: %s", list(df.columns))

    return df
