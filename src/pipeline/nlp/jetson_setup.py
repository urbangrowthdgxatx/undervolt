"""
Jetson LLM configuration and setup utilities

Provides setup instructions and utilities for running LLM on Jetson.
"""

import logging
import subprocess
import sys
from typing import Optional

log = logging.getLogger("permits")

# Recommended models for Jetson
JETSON_MODELS = {
    "ollama": {
        "mistral-7b": {
            "ram_required": "8GB",
            "speed": "Fast",
            "quality": "Good",
            "recommended": True,
        },
        "neural-chat-7b": {
            "ram_required": "8GB",
            "speed": "Fast",
            "quality": "Good",
        },
        "llama2-7b": {
            "ram_required": "8GB",
            "speed": "Fast",
            "quality": "Good",
        },
        "openchat-3.5": {
            "ram_required": "7GB",
            "speed": "Fastest",
            "quality": "Fair",
        },
    },
    "vllm-quantized": {
        "mistral-7b-q4": {
            "ram_required": "4GB",
            "speed": "Medium",
            "quality": "Good",
        },
        "mistral-7b-int8": {
            "ram_required": "6GB",
            "speed": "Fast",
            "quality": "Excellent",
        },
    },
}


def print_jetson_setup_guide():
    """Print setup guide for Jetson LLM"""
    guide = """
╔══════════════════════════════════════════════════════════════════════════╗
║              JETSON LLM SETUP GUIDE                                       ║
╚══════════════════════════════════════════════════════════════════════════╝

OPTION 1: OLLAMA (Recommended for Jetson)
──────────────────────────────────────────

1. Install Ollama:
   curl -fsSL https://ollama.ai/install.sh | sh

2. Start Ollama server:
   ollama serve

3. In another terminal, pull a model (from JETSON_MODELS above):
   ollama pull mistral-7b      # Fast, good quality (8GB)
   ollama pull neural-chat     # Fast, good quality (8GB)
   ollama pull openchat-3.5    # Fastest (7GB)

4. Use in your pipeline:
   from src.pipeline.nlp.llm_jetson import JetsonLLMExtractor
   
   extractor = JetsonLLMExtractor(backend="ollama", model="mistral-7b")
   features = extractor.extract_batch(descriptions)


OPTION 2: VLLM with Quantized Models
──────────────────────────────────────

1. Install vLLM:
   pip install vllm

2. Use quantized models (4-bit or 8-bit):
   from src.pipeline.nlp.llm_jetson import JetsonLLMExtractor
   
   extractor = JetsonLLMExtractor(
       backend="vllm-quantized",
       model="TheBloke/Mistral-7B-Instruct-GPTQ"
   )


OPTION 3: LLAMA.CPP (Lightest weight)
──────────────────────────────────────

1. Install llama.cpp:
   pip install llama-cpp-python

2. Download quantized model (GGUF format):
   wget https://huggingface.co/TheBloke/Mistral-7B-Instruct-GGUF/...

3. Use with llama.cpp wrapper (custom implementation needed)


JETSON MEMORY GUIDELINES
────────────────────────
- Jetson Orin: 12GB VRAM  → Use Mistral-7B or better
- Jetson Xavier: 8GB VRAM → Use smaller models or 4-bit quantization
- Jetson Nano: 4GB VRAM   → Use llama.cpp with heavy quantization

Check your Jetson model:
   cat /etc/nv_tegra_release

Check available memory:
   free -h
"""
    print(guide)


def check_ollama_installed() -> bool:
    """Check if Ollama is installed"""
    try:
        subprocess.run(["ollama", "--version"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def check_ollama_running(base_url: str = "http://localhost:11434") -> bool:
    """Check if Ollama server is running"""
    try:
        import requests
        response = requests.get(f"{base_url}/api/tags", timeout=2)
        return response.status_code == 200
    except Exception:
        return False


def recommend_backend_for_jetson(vram_gb: Optional[int] = None) -> str:
    """
    Recommend LLM backend based on available VRAM

    Args:
        vram_gb: Available VRAM in GB (auto-detected if None)

    Returns:
        Recommended backend: 'ollama', 'vllm-quantized', or 'vllm'
    """
    if vram_gb is None:
        # Try to detect
        try:
            import torch
            if torch.cuda.is_available():
                vram_gb = int(torch.cuda.get_device_properties(0).total_memory / 1e9)
        except:
            vram_gb = 8  # Default assumption

    if vram_gb >= 12:
        return "ollama"  # Can use full models
    elif vram_gb >= 6:
        return "vllm-quantized"  # Need quantization
    else:
        return "vllm-quantized"  # Heavy quantization needed
