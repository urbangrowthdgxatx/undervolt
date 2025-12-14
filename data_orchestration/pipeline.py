import os
import time
import logging
import subprocess

# -------------------------
# GPU IMPORT (optional)
# -------------------------
import pandas as pd
GPU_ENABLED = False

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s ",
    handlers=[logging.StreamHandler()]
)
log = logging.getLogger("permits")


# -------------------------
# GPU CHECK
# -------------------------
def print_gpu_info():
    log.info("Checking GPU environment...")
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=index,name,memory.total,driver_version", "--format=csv,noheader"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        log.info("GPU Info:\n" + result.stdout)
    except Exception as e:
        log.warning(f"Could not run nvidia-smi: {e}")

    if GPU_ENABLED:
        log.info("cuDF successfully imported — GPU processing ENABLED.")
    else:
        log.warning("cuDF not available — using pandas.")


# -------------------------
# LOAD DATA
# -------------------------
def load_data(path: str):
    start = time.time()
    if not os.path.isfile(path):
        raise FileNotFoundError(path)

    log.info(f"Loading file: {path}")

    if GPU_ENABLED:
        df = cudf.read_csv(path)
    else:
        df = pd.read_csv(path)

    log.info(f"Loaded {len(df):,} rows in {time.time() - start:.2f}s")
    log.info(f"Columns: {list(df.columns)}")

    return df


# -------------------------
# SAFE DATE PARSER (CPU → GPU)
# -------------------------
def parse_dates_cpu(col):
    """
    Mixed-format safe parsing:
    1) Convert cuDF to pandas
    2) pandas.to_datetime(errors='coerce')
    3) return cuDF series
    """
    import pandas as pd

    if GPU_ENABLED:
        col_cpu = col.to_pandas()
    else:
        col_cpu = col

    parsed = pd.to_datetime(col_cpu, errors="coerce")

    # Convert back
    if GPU_ENABLED:
        return cudf.from_pandas(parsed)
    return parsed


# -------------------------
# CLEANING PIPELINE
# -------------------------
def clean_permit_data(df):
    log.info("Starting cleaning...")

    # 1) Normalize column names
    df.columns = (
        df.columns
        .str.lower()
        .str.replace(" ", "_")
        .str.replace("__", "_")
    )

    # 2) DATE FIELDS — ALWAYS CPU PARSING
    date_cols = [
        "applied_date", "issued_date", "status_date",
        "expires_date", "completed_date",
    ]

    for col in date_cols:
        if col in df:
            df[col] = parse_dates_cpu(df[col])

    # 3) NUMERIC FIELDS — fully safe
    numeric_cols = [
        "total_existing_bldg_sqft", "remodel_repair_sqft",
        "total_new_add_sqft", "total_valuation_remodel",
        "total_job_valuation", "number_of_floors",
        "housing_units", "building_valuation",
        "building_valuation_remodel", "electrical_valuation",
        "electrical_valuation_remodel", "mechanical_valuation",
        "mechanical_valuation_remodel", "plumbing_valuation",
        "plumbing_valuation_remodel", "medgas_valuation",
        "medgas_valuation_remodel", "total_lot_sqft",
    ]

    for col in numeric_cols:
        if col in df:
            df[col] = (
                df[col]
                .astype("str")
                .str.replace(",", "", regex=False)
            )
            # coerce to float safely
            if GPU_ENABLED:
                log.info(f"Converting numeric column `{col}` using GPU-safe method")
                import pandas as pd
                df[col] = cudf.from_pandas(
                    pd.to_numeric(df[col].to_pandas(), errors="coerce")
                )
            else:
                import pandas as pd
                df[col] = pd.to_numeric(df[col], errors="coerce")

    # 4) ZIP Codes
    zip_cols = ["original_zip", "contractor_zip", "applicant_zip"]
    for col in zip_cols:
        if col in df:
            df[col] = df[col].astype("str").str.extract(r"(\d{5})", expand=False)

    # 5) Lat / Lon
    if "latitude" in df and "longitude" in df:
        df["latitude"] = df["latitude"].astype("float64")
        df["longitude"] = df["longitude"].astype("float64")

        df = df[
            (df["latitude"] > -90) & (df["latitude"] < 90) &
            (df["longitude"] > -180) & (df["longitude"] < 180)
        ]

    # 6) Drop obviously invalid rows
    if "permit_num" in df and "original_address_1" in df:
        before = len(df)
        df = df.dropna(subset=["permit_num", "original_address_1"])
        log.info(f"Dropped {before - len(df)} invalid rows")

    # 7) Strip all strings
    if GPU_ENABLED:
        str_cols = df.select_dtypes(include=["object", "str"]).columns
    else:
        str_cols = df.select_dtypes(include=["object"]).columns

    for col in str_cols:
        df[col] = df[col].astype("str").str.strip()
    #Log the final columns as json with key:value, value is the data type
    
    log.info(f"Final columns: {df.columns.tolist()}")
    log.info(f"Final cleaned row count: {len(df):,}")

    return df


# -------------------------
# ANALYSIS
# -------------------------
def analyze(df):
    if "zip_code" not in df.columns:
        log.warning("Column `zip_code` missing.")
        return None
    grouped = df.groupby("zip_code").size().reset_index().rename({"size": "permit_count"})
    return grouped.sort_values("permit_count", ascending=False)


# -------------------------
# SAVE
# -------------------------
def save_results(df, outpath):
    if df is None:
        log.warning("Nothing to save.")
        return
    df.to_csv(outpath, index=False)
    log.info("Saved results.")


# -------------------------
# MAIN
# -------------------------
DATA_PATH = "/home/asus/atx-hackathon/data/Issued_Construction_Permits_20251213.csv"

def main():
    print_gpu_info()
    df = load_data(DATA_PATH)
    df = clean_permit_data(df)
    results = analyze(df)
    save_results(results, "permit_summary_by_zip.csv")

if __name__ == "__main__":
    main()
