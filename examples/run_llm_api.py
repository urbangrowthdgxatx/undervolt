#!/usr/bin/env python3
"""
Simple HTTP server for LLM extraction
Wraps FastAPI app to avoid module import issues
"""
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))

if __name__ == "__main__":
    from src.pipeline.api import app
    import uvicorn
    
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info"
    )
