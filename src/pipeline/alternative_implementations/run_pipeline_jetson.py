#!/usr/bin/env python3
"""
Undervolt Pipeline Runner - Jetson Configuration

Optimized for NVIDIA Jetson with limited memory.
Uses smaller batches and reduced parameters.

Usage:
    python run_pipeline_jetson.py
"""
import sys

# Use Jetson-specific configuration
import src.pipeline.config_jetson as config
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
