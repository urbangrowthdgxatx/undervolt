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
DATA_PATH = os.path.join(DATA_DIR, "Issued_Construction_Permits.csv")

# Output paths
OUTPUT_ENRICHED = "permit_data_enriched.csv"
OUTPUT_SUMMARY = "permit_summary_by_zip.csv"

# ==========================================================
# Platform Detection and Configuration Loading
# ==========================================================

import platform as plat_module


def detect_platform():
    """Auto-detect current platform."""
    system = plat_module.system()
    machine = plat_module.machine()

    if machine.startswith('aarch64'):
        return 'jetson'
    elif machine == 'arm64' and system == 'Darwin':
        return 'mac'
    else:
        return 'dgx'


def get_config(platform_name='auto', config_path=None):
    """
    Get configuration for specified platform.
    
    Args:
        platform_name: 'jetson', 'dgx', 'mac', or 'auto'
        config_path: Optional path to custom config file
    
    Returns:
        dict: Configuration dictionary
    """
    if platform_name == 'auto':
        platform_name = detect_platform()
    
    # Import platform-specific config
    if platform_name == 'jetson':
        from . import config_jetson as platform_config
    elif platform_name == 'dgx':
        from . import config_dgx as platform_config
    elif platform_name == 'mac':
        from . import config_mac as platform_config
    else:
        raise ValueError(f"Unknown platform: {platform_name}")
    
    # Build config dict from platform module
    config = {}
    for key in dir(platform_config):
        if key.isupper() and not key.startswith('_'):
            config[key] = getattr(platform_config, key)
    
    # Add platform name
    config['PLATFORM'] = platform_name
    
    # Override with custom config if provided
    if config_path:
        import importlib.util
        spec = importlib.util.spec_from_file_location("custom_config", config_path)
        custom_config = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(custom_config)
        
        for key in dir(custom_config):
            if key.isupper() and not key.startswith('_'):
                config[key] = getattr(custom_config, key)
    
    return config
