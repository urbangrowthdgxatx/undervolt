#!/usr/bin/env python3
"""
Undervolt Pipeline Runner - DGX Configuration

Optimized for NVIDIA DGX with full RAPIDS stack.
Uses maximum GPU acceleration, larger batches, and more clusters.

Usage:
    python run_pipeline_dgx.py
"""
import sys

# Use DGX-specific configuration
import src.pipeline.config_dgx as config
import src.pipeline.config
src.pipeline.config = config

from src.pipeline.main import main

if __name__ == "__main__":
    print(f"🚀 Running on platform: {config.PLATFORM}")
    print(f"GPU Enabled: {config.GPU_ENABLED}")
    print(f"Clusters: {config.CLUSTERING_PARAMS['n_clusters']}")
    print(f"Batch Size: {config.BATCH_SIZE}")
    print()
    sys.exit(main())
