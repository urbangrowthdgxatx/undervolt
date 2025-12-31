import os

# Fully disable cuFile / GDS everywhere
os.environ["CUFILE_DISABLE"] = "1"
os.environ["LIBCUDF_CUFILE_POLICY"] = "OFF"
os.environ["RAPIDS_NO_INITIALIZE_CUFILE"] = "1"
os.environ["CUDF_CUFILE_POLICY"] = "ALWAYS_OFF"
os.environ["CUFILE_ENV_FORCE_DISABLED"] = "1"
os.environ["LIBCUDF_CUFILE_POLICY"] = "OFF"

import time
import logging
import subprocess
import pandas as pd
import json

def print_schema_json(df, nlp_prefix="f_"):
    schema = []
    for col in df.columns:
        schema.append({
            "name": col,
            "dtype": str(df[col].dtype),
            "feature": col.startswith(nlp_prefix)
        })
    print(json.dumps(schema, indent=2))

# ==========================================================
# Try enabling cuDF
# ==========================================================
GPU_ENABLED = False
try:
    import cudf
    GPU_ENABLED = True
except Exception:
    pass

# ==========================================================
# Logging
# ==========================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[logging.StreamHandler()]
)
log = logging.getLogger("permits")


# ==========================================================
# GPU environment / safety
# ==========================================================

def print_gpu_info():
    log.info("Checking GPU environment...")

    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=index,name,memory.total,driver_version",
                "--format=csv,noheader"
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        log.info("GPU Info:\n" + result.stdout)
    except Exception as e:
        log.warning(f"Could not run nvidia-smi: {e}")

    if GPU_ENABLED:
        try:
            log.info(f"Detected GPUs: {cudf.cuda.runtime.getDeviceCount()}")
        except Exception:
            log.info("Detected GPUs (fallback: 1)")
        log.info("cuDF detected — GPU acceleration ON.")
    else:
        log.warning("cuDF NOT found — falling back to CPU pandas.")

    # Disable cuFile to avoid GPUDirect Storage crash
    os.environ["CUFILE_ENV_FORCE_DISABLED"] = "1"
    log.info("cuFile disabled to prevent GDS crashes.")


# ==========================================================
# LOAD DATA
# ==========================================================

def load_data(path: str):
    start = time.time()
    log.info(f"Loading CSV → {path}")

    if GPU_ENABLED:
        df = cudf.read_csv(path)
    else:
        df = pd.read_csv(path)

    log.info(f"Loaded {len(df):,} rows in {time.time() - start:.2f}s")
    return df


# ==========================================================
# DATE PARSER (safe CPU fallback)
# ==========================================================

def parse_dates_cpu(col):
    """Always CPU-parse dates to avoid cuDF date bugs."""
    col_cpu = col.to_pandas() if GPU_ENABLED else col

    parsed = pd.to_datetime(col_cpu, errors="coerce")

    if GPU_ENABLED:
        return cudf.from_pandas(parsed)
    return parsed


# ==========================================================
# CLEANING PIPELINE
# ==========================================================

def clean_permit_data(df):
    log.info("Starting cleaning pipeline...")

    # Column name normalization
    df.columns = (
        df.columns
        .str.lower()
        .str.replace(" ", "_")
        .str.replace("__", "_")
    )

    # DATE COLUMNS
    date_cols = [
        "applied_date", "issued_date", "status_date",
        "expires_date", "completed_date"
    ]

    for col in date_cols:
        if col in df:
            df[col] = parse_dates_cpu(df[col])

    # NUMERIC COLUMNS
    numeric_cols = [
        "total_existing_bldg_sqft", "remodel_repair_sqft",
        "total_new_add_sqft", "total_valuation_remodel",
        "total_job_valuation", "number_of_floors",
        "housing_units", "building_valuation",
        "building_valuation_remodel", "electrical_valuation",
        "electrical_valuation_remodel", "mechanical_valuation",
        "mechanical_valuation_remodel", "plumbing_valuation",
        "plumbing_valuation_remodel", "medgas_valuation",
        "medgas_valuation_remodel", "total_lot_sqft"
    ]

    for col in numeric_cols:
        if col in df:
            # Strip commas
            df[col] = df[col].astype("str").str.replace(",", "", regex=False)

            # Safe parse
            col_cpu = df[col].to_pandas() if GPU_ENABLED else df[col]
            col_cpu = pd.to_numeric(col_cpu, errors="coerce")
            df[col] = cudf.from_pandas(col_cpu) if GPU_ENABLED else col_cpu

    # ZIP CODE extraction
    zip_sources = ["original_zip", "contractor_zip", "applicant_zip"]
    df["zip_code"] = None

    for src in zip_sources:
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

    # FIXED logging bug
    log.info("Columns: %s", list(df.columns))

    return df


# ==========================================================
# ANALYSIS
# ==========================================================

def analyze(df):
    if "zip_code" not in df:
        log.warning("Missing zip_code — cannot group.")
        return None

    grouped = df.groupby("zip_code").size()
    grouped = grouped.reset_index().rename(columns={0: "permit_count"})

    return grouped.sort_values("permit_count", ascending=False)


# ==========================================================
# SAVE RESULTS
# ==========================================================

def save_results(df, outpath):
    if df is None:
        log.warning("Nothing to save.")
        return

    df.to_csv(outpath, index=False)
    log.info(f"Saved results → {outpath}")

# ==========================================================
# NLP FEATURE EXTRACTION
# ==========================================================
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA

try:
    from cuml.feature_extraction.text import TfidfVectorizer as cuTFIDF
    from cuml.decomposition import PCA as cuPCA
    CUML_AVAILABLE = True
except Exception:
    CUML_AVAILABLE = False


def nlp_enrich(df, text_cols):

    log.info("🧠 Running GPU NLP keyword extraction...")

    KEYWORDS = [
        "residential", "commercial", "remodel", "repair", "new", "demolition",
        "foundation", "roof", "window", "permit", "hvac", "electrical",
        "plumbing", "mechanical", "multi-family", "single-family"
    ]

    for col in text_cols:
        if col not in df.columns:
            log.warning(f"Skipping missing text column: {col}")
            continue

        safe_col = df[col].fillna("").str.lower()

        for kw in KEYWORDS:
            df[f"f_{col}_kw_{kw}"] = safe_col.str.contains(
                kw.lower(), regex=False
            ).astype(int)

    log.info("NLP enrichment complete.")
    return df

try:
    from cuml.cluster import KMeans as cuKMeans
    from cuml.preprocessing import StandardScaler as cuStandardScaler
    from cuml.decomposition import PCA as cuPCA
    CUML_CLUSTERING_AVAILABLE = True
except Exception:
    CUML_CLUSTERING_AVAILABLE = False
    from sklearn.cluster import KMeans as cuKMeans
    from sklearn.preprocessing import StandardScaler as cuStandardScaler
    from sklearn.decomposition import PCA as cuPCA

def run_cuml_clustering(df, feature_prefix="f_"):
    mode = "GPU (cuML)" if CUML_CLUSTERING_AVAILABLE else "CPU (sklearn)"
    log.info(f"⚡ Running {mode} clustering on NLP features...")

    # pick only the features created by NLP
    feature_cols = [c for c in df.columns if c.startswith(feature_prefix)]

    if len(feature_cols) == 0:
        log.warning("No NLP feature columns found for clustering")
        return df

    # Convert to CPU pandas if needed for sklearn
    if not CUML_CLUSTERING_AVAILABLE and GPU_ENABLED:
        X = df[feature_cols].to_pandas().astype("float32")
    else:
        X = df[feature_cols].astype("float32")

    # Scale
    scaler = cuStandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Dimensionality reduction (optional but recommended)
    n_samples = len(X)
    n_components = min(10, len(feature_cols), n_samples)

    if n_components < 2:
        log.warning(f"Too few components ({n_components}) for PCA, using raw features")
        X_pca = X_scaled
    else:
        pca = cuPCA(n_components=n_components)
        X_pca = pca.fit_transform(X_scaled)

    # KMeans (ensure n_clusters <= n_samples)
    n_clusters = min(8, n_samples)
    if n_clusters < 2:
        log.warning(f"Too few samples ({n_samples}) for clustering, skipping")
        df["f_cluster"] = 0
        return df

    kmeans = cuKMeans(n_clusters=n_clusters, max_iter=300)
    clusters = kmeans.fit_predict(X_pca)

    # Convert back to appropriate format
    if CUML_CLUSTERING_AVAILABLE:
        df["f_cluster"] = clusters
    elif GPU_ENABLED:
        df["f_cluster"] = cudf.from_pandas(pd.Series(clusters))
    else:
        df["f_cluster"] = clusters

    log.info("Clustering complete. Added column 'f_cluster'.")
    return df


# ==========================================================
# MAIN
# ==========================================================

DATA_PATH = os.path.join(
    os.path.dirname(__file__),
    "data",
    "Issued_Construction_Permits_20251212.csv"
)

def main():
    # Check if data file exists
    if not os.path.exists(DATA_PATH):
        log.error(f"Data file not found: {DATA_PATH}")
        log.error("Download from: https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu")
        log.error("Save as: Issued_Construction_Permits_20251212.csv in project root")
        return

    print_gpu_info()
    df = load_data(DATA_PATH)
    # Choose text columns to enrich
    TEXT_COLUMNS = [
        "description",           # Main permit description
        "work_class",           # Type of work (residential, commercial, etc.)
        "permit_class",         # Permit classification
        "permit_type_desc",     # Detailed permit type description
        "permit_type"           # Permit type code
    ]
    clean_df = clean_permit_data(df)

    nlp_enriched_df = nlp_enrich(clean_df, TEXT_COLUMNS)

    # After NLP enrichment, run analysis or save enriched dataset
    nlp_enriched_df.to_csv("permit_data_enriched.csv", index=False)
    log.info("Saved enriched dataset with NLP features.")
    #print_schema_json(nlp_enriched_df)

    cuml_enriched_df = run_cuml_clustering(nlp_enriched_df)
    save_results(cuml_enriched_df, "permit_summary_by_zip.csv")


if __name__ == "__main__":
    main()
