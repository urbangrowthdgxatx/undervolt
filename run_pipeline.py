#!/usr/bin/env python3
"""
Undervolt Pipeline Runner

Usage:
    python run_pipeline.py
"""
import sys
from src.pipeline.main import main

if __name__ == "__main__":
    sys.exit(main())
