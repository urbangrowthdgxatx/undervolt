"""Jetson-specific configuration for edge GPU"""
import os

# ==========================================================
# GPU Configuration for Jetson
# ==========================================================
# Disable cuFile/GDS (not supported on Jetson)
os.environ["CUFILE_DISABLE"] = "1"
os.environ["LIBCUDF_CUFILE_POLICY"] = "OFF"
os.environ["RAPIDS_NO_INITIALIZE_CUFILE"] = "1"
os.environ["CUDF_CUFILE_POLICY"] = "ALWAYS_OFF"

# Try enabling cuDF (limited RAPIDS support on Jetson)
GPU_ENABLED = False
try:
    import cudf
    GPU_ENABLED = True
except Exception:
    pass

# Import base configuration
from .config import *

# Jetson-specific overrides (lower memory)
CLUSTERING_PARAMS = {
    "n_clusters": 6,  # Fewer clusters for limited memory
    "max_iter": 200,  # Fewer iterations
    "n_pca_components": 5,  # Fewer components
    "feature_prefix": "f_"
}

# Use smaller batches on Jetson
BATCH_SIZE = 1000  # Smaller batches for limited memory

# Reduce NLP keywords to save memory
NLP_KEYWORDS = [
    "residential", "commercial", "remodel", "solar",
    "battery", "generator", "electrical"
]

# Platform identifier
PLATFORM = "Jetson"
