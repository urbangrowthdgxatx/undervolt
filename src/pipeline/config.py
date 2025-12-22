"""Configuration for the pipeline"""
import os

# ==========================================================
# GPU Configuration
# ==========================================================
# Fully disable cuFile / GDS everywhere
os.environ["CUFILE_DISABLE"] = "1"
os.environ["LIBCUDF_CUFILE_POLICY"] = "OFF"
os.environ["RAPIDS_NO_INITIALIZE_CUFILE"] = "1"
os.environ["CUDF_CUFILE_POLICY"] = "ALWAYS_OFF"
os.environ["CUFILE_ENV_FORCE_DISABLED"] = "1"
os.environ["LIBCUDF_CUFILE_POLICY"] = "OFF"

# Try enabling cuDF
GPU_ENABLED = False
try:
    import cudf
    GPU_ENABLED = True
except Exception:
    pass

# ==========================================================
# Column Definitions
# ==========================================================

# Text columns for NLP enrichment
TEXT_COLUMNS = [
    "description",        # Main permit description
    "work_class",        # Type of work (residential, commercial, etc.)
    "permit_class",      # Permit classification
    "permit_type_desc",  # Detailed permit type description
    "permit_type"        # Permit type code
]

# Date columns to parse
DATE_COLUMNS = [
    "applied_date",
    "issued_date",
    "status_date",
    "expires_date",
    "completed_date"
]

# Numeric columns to clean
NUMERIC_COLUMNS = [
    "total_existing_bldg_sqft",
    "remodel_repair_sqft",
    "total_new_add_sqft",
    "total_valuation_remodel",
    "total_job_valuation",
    "number_of_floors",
    "housing_units",
    "building_valuation",
    "building_valuation_remodel",
    "electrical_valuation",
    "electrical_valuation_remodel",
    "mechanical_valuation",
    "mechanical_valuation_remodel",
    "plumbing_valuation",
    "plumbing_valuation_remodel",
    "medgas_valuation",
    "medgas_valuation_remodel",
    "total_lot_sqft"
]

# ZIP code source columns (tried in order)
ZIP_SOURCES = ["original_zip", "contractor_zip", "applicant_zip"]

# ==========================================================
# NLP Keywords
# ==========================================================

NLP_KEYWORDS = [
    "residential", "commercial", "remodel", "repair", "new", "demolition",
    "foundation", "roof", "window", "permit", "hvac", "electrical",
    "plumbing", "mechanical", "multi-family", "single-family"
]

# ==========================================================
# LLM Configuration (Optional, for energy infrastructure extraction)
# ==========================================================
# Options: 'ollama', 'vllm-quantized', 'vllm', or None (keyword-only extraction)
LLM_BACKEND = None  # Override in platform-specific configs
LLM_MODEL = None    # Override in platform-specific configs
LLM_ENABLED = False  # Set to True to enable LLM extraction
OLLAMA_BASE_URL = "http://localhost:11434"
VLLM_QUANTIZATION = "awq"

# ==========================================================
# Clustering Parameters
# ==========================================================

CLUSTERING_PARAMS = {
    "n_clusters": 8,
    "max_iter": 300,
    "n_pca_components": 10,
    "feature_prefix": "f_"
}

# ==========================================================
# File Paths
# ==========================================================

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
DATA_PATH = os.path.join(DATA_DIR, "Issued_Construction_Permits_20251212.csv")

# Output paths
OUTPUT_ENRICHED = "permit_data_enriched.csv"
OUTPUT_SUMMARY = "permit_summary_by_zip.csv"
