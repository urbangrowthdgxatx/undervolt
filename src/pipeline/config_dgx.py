"""DGX-specific configuration for maximum GPU acceleration"""
import os

# ==========================================================
# GPU Configuration for DGX
# ==========================================================
# Enable all RAPIDS/cuDF features on DGX
os.environ.pop("CUFILE_DISABLE", None)
os.environ.pop("LIBCUDF_CUFILE_POLICY", None)
os.environ.pop("RAPIDS_NO_INITIALIZE_CUFILE", None)
os.environ["CUDF_CUFILE_POLICY"] = "ALWAYS"  # Enable GDS on DGX

# Try enabling cuDF (should work on DGX)
GPU_ENABLED = False
try:
    import cudf
    GPU_ENABLED = True
except Exception:
    pass

# Import base configuration
from .config import *

# DGX-specific overrides
CLUSTERING_PARAMS = {
    "n_clusters": 16,  # More clusters for DGX power
    "max_iter": 500,   # More iterations
    "n_pca_components": 20,  # More components
    "feature_prefix": "f_"
}

# Use larger batches on DGX
BATCH_SIZE = 10000  # Process in larger batches

# DGX LLM Configuration
# DGX has plenty of VRAM - can use full vLLM or Ollama
LLM_BACKEND = "ollama"  # or vllm for maximum performance
LLM_MODEL = "neural-chat"  # Full-sized models work well here
LLM_ENABLED = False  # Set to True to enable
OLLAMA_BASE_URL = "http://localhost:11434"

# Platform identifier
PLATFORM = "DGX"
