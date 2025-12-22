"""FastAPI server for LLM extraction (re-export from __init__)"""
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from src.pipeline.api import app
