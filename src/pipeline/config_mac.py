"""Mac-specific configuration (CPU-only, optimized)"""
import os

# ==========================================================
# CPU Configuration for Mac
# ==========================================================
# Disable all GPU features
os.environ["CUFILE_DISABLE"] = "1"
os.environ["LIBCUDF_CUFILE_POLICY"] = "OFF"
os.environ["RAPIDS_NO_INITIALIZE_CUFILE"] = "1"

# GPU disabled on Mac
GPU_ENABLED = False

# Import base configuration
from .config import *

# Mac-specific overrides (CPU-optimized)
CLUSTERING_PARAMS = {
    "n_clusters": 8,
    "max_iter": 300,
    "n_pca_components": 10,
    "feature_prefix": "f_"
}

# Mac has good CPU, use reasonable batch size
BATCH_SIZE = 5000

# Platform identifier
PLATFORM = "Mac"

# Mac-specific: Use all available cores
import multiprocessing
N_JOBS = multiprocessing.cpu_count()
# Mac LLM Configuration
# Ollama works great on Mac - can handle full models
LLM_BACKEND = "ollama"  # Ollama recommended for Mac
LLM_MODEL = "neural-chat"  # or mistral-7b, llama2-7b
LLM_ENABLED = False  # Set to True to enable, requires ollama serve running