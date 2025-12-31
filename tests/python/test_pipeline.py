#!/usr/bin/env python
"""Test script to verify pipeline works with small dataset"""
import os
import sys

# Set the data path to test file
os.environ['TEST_MODE'] = '1'

# Import and run the pipeline
import pipeline_cudf as pipeline

# Override the DATA_PATH
pipeline.DATA_PATH = os.path.join(
    os.path.dirname(__file__),
    "test_permits.csv"
)

if __name__ == "__main__":
    pipeline.main()
