"""
FastAPI backend for LLM extraction

Serves the Jetson LLM extraction as REST API endpoints
Can be called from the frontend (Next.js) or other services

Usage:
    python -m uvicorn src.pipeline.api.llm_server:app --host 0.0.0.0 --port 8000

Endpoints:
    POST /extract - Extract features from descriptions
    GET /health - Health check
    GET /models - List available models
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging

# Try importing LLM support
try:
    from src.pipeline.nlp.llm_jetson import JetsonLLMExtractor
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Undervolt LLM Extraction API",
    description="Extract energy infrastructure features from permit descriptions",
    version="1.0.0"
)

# Add CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow from any origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class ExtractionRequest(BaseModel):
    descriptions: List[str]
    backend: str = "ollama"
    model: str = "neural-chat"

class ExtractionResponse(BaseModel):
    features: List[Dict[str, Any]]
    backend: str
    model: str
    success: bool

class HealthResponse(BaseModel):
    status: str
    llm_available: bool
    ollama_running: bool = False

# Global LLM extractor instance
_extractor: Optional[Any] = None
_current_backend: str = "ollama"
_current_model: str = "neural-chat"

def get_extractor(backend: str = "ollama", model: str = "neural-chat"):
    """Get or create LLM extractor instance"""
    global _extractor, _current_backend, _current_model
    
    if _extractor is None or _current_backend != backend or _current_model != model:
        if not LLM_AVAILABLE:
            raise RuntimeError("LLM support not available - install src.pipeline.nlp.llm_jetson")
        
        try:
            _extractor = JetsonLLMExtractor(backend=backend, model=model)
            _current_backend = backend
            _current_model = model
            logger.info(f"Initialized {backend} extractor with {model}")
        except Exception as e:
            logger.error(f"Failed to initialize extractor: {e}")
            raise
    
    return _extractor

@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    import socket
    
    # Check if Ollama is running
    ollama_running = False
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(("localhost", 11434))
        ollama_running = result == 0
        sock.close()
    except:
        pass
    
    return HealthResponse(
        status="healthy",
        llm_available=LLM_AVAILABLE,
        ollama_running=ollama_running
    )

@app.post("/extract", response_model=ExtractionResponse)
async def extract_features(request: ExtractionRequest):
    """
    Extract energy infrastructure features from permit descriptions
    
    Args:
        descriptions: List of permit descriptions to analyze
        backend: LLM backend ('ollama', 'vllm', 'vllm-quantized')
        model: Model name
    
    Returns:
        List of extracted features for each description
    """
    if not LLM_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="LLM support not available"
        )
    
    if not request.descriptions:
        return ExtractionResponse(
            features=[],
            backend=request.backend,
            model=request.model,
            success=True
        )
    
    try:
        extractor = get_extractor(request.backend, request.model)
        features = extractor.extract_batch(request.descriptions)
        
        return ExtractionResponse(
            features=features,
            backend=request.backend,
            model=request.model,
            success=True
        )
    except Exception as e:
        logger.error(f"Extraction error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Extraction failed: {str(e)}"
        )

@app.get("/models")
async def list_models():
    """List available models"""
    return {
        "backends": {
            "ollama": [
                "neural-chat",
                "mistral-7b",
                "llama2-7b",
                "openchat-3.5"
            ],
            "vllm": [
                "meta-llama/Llama-3-8B-Instruct"
            ],
            "vllm-quantized": [
                "TheBloke/Mistral-7B-Instruct-GPTQ",
                "TheBloke/Mistral-7B-Instruct-AWQ"
            ]
        }
    }

@app.get("/")
async def root():
    """API documentation"""
    return {
        "name": "Undervolt LLM Extraction API",
        "version": "1.0.0",
        "endpoints": {
            "health": "GET /health",
            "extract": "POST /extract",
            "models": "GET /models"
        },
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
