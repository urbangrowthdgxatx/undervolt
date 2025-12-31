#!/usr/bin/env python3
"""
Undervolt Pipeline Runner - Mac Configuration

Optimized for Mac (CPU-only) with multiprocessing.
Uses sklearn with all available cores.

Usage:
    python run_pipeline_mac.py
"""
import sys

# Use Mac-specific configuration
import src.pipeline.config_mac as config
import src.pipeline.config
src.pipeline.config = config

from src.pipeline.main import main

if __name__ == "__main__":
    print(f"🚀 Running on platform: {config.PLATFORM}")
    print(f"GPU Enabled: {config.GPU_ENABLED}")
    print(f"CPU Cores: {config.N_JOBS}")
    print(f"Clusters: {config.CLUSTERING_PARAMS['n_clusters']}")
    print(f"Batch Size: {config.BATCH_SIZE}")
    print()
    sys.exit(main())
