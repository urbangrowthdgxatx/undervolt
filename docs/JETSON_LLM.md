# Jetson LLM Integration Guide

## Overview

This guide explains how to use vLLM and other LLM backends optimized for NVIDIA Jetson devices. The implementation provides:

- **Ollama** (recommended) - Simple, user-friendly LLM server
- **vLLM** with quantization - High-performance inference with memory efficiency
- **Unified interface** - Easy switching between backends

## Quick Start

### Option 1: Ollama (Easiest, Recommended)

**1. Install Ollama:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**2. Start the Ollama server:**
```bash
ollama serve
```

**3. In another terminal, pull a model:**
```bash
# Recommended for Jetson: Mistral-7B
ollama pull mistral-7b

# Or other good options:
ollama pull neural-chat     # Also good
ollama pull openchat-3.5    # Smallest, fastest
```

**4. Use in your code:**
```python
from src.pipeline.nlp.llm_jetson import JetsonLLMExtractor

extractor = JetsonLLMExtractor(backend="ollama", model="mistral-7b")
features = extractor.extract_batch(descriptions)
```

### Option 2: vLLM with Quantization

**1. Install vLLM:**
```bash
pip install vllm
```

**2. Use quantized models:**
```python
from src.pipeline.nlp.llm_jetson import JetsonLLMExtractor

# AWQ quantized Mistral-7B (faster, less memory)
extractor = JetsonLLMExtractor(
    backend="vllm-quantized",
    model="TheBloke/Mistral-7B-Instruct-GPTQ",
    quantization="gptq"
)
features = extractor.extract_batch(descriptions)
```

## Jetson Hardware Compatibility

| Jetson Model | VRAM | Recommended Backend | Recommended Model |
|---|---|---|---|
| **Orin** | 12GB | Ollama | mistral-7b, llama2-7b |
| **Xavier** | 8GB | Ollama or vLLM-quantized | mistral-7b, neural-chat |
| **Nano** | 4GB | vLLM-quantized | 4-bit quantized models |

## Model Recommendations

### For Ollama

| Model | VRAM | Speed | Quality | Notes |
|---|---|---|---|---|
| **mistral-7b** | 8GB | ⚡⚡⚡ Fast | ⭐⭐⭐⭐ Excellent | **Recommended** |
| neural-chat-7b | 8GB | ⚡⚡⚡ Fast | ⭐⭐⭐⭐ Excellent | Great alt option |
| llama2-7b | 8GB | ⚡⚡⚡ Fast | ⭐⭐⭐⭐ Good | Popular, well-tested |
| openchat-3.5 | 7GB | ⚡⚡⚡⚡ Fastest | ⭐⭐⭐ Fair | Smallest, fastest |

### For vLLM with Quantization

| Model | VRAM | Speed | Quality | Command |
|---|---|---|---|---|
| Mistral-7B-GPTQ | 4GB | ⚡⚡⚡ | ⭐⭐⭐⭐ | `TheBloke/Mistral-7B-Instruct-GPTQ` |
| Mistral-7B-AWQ | 5GB | ⚡⚡⚡ | ⭐⭐⭐⭐ | `TheBloke/Mistral-7B-Instruct-AWQ` |
| Llama2-7B-Q8 | 6GB | ⚡⚡ | ⭐⭐⭐⭐⭐ | `TheBloke/Llama-2-7B-Instruct-Q8_0-GGUF` |

## Usage Examples

### Basic Extraction
```python
from src.pipeline.nlp.llm_jetson import JetsonLLMExtractor

# Initialize with Ollama
extractor = JetsonLLMExtractor(backend="ollama", model="mistral-7b")

# Extract from a list of descriptions
descriptions = [
    "New solar panel installation with battery backup",
    "Commercial HVAC replacement and electrical upgrade",
]

features = extractor.extract_batch(descriptions)
# Returns: [{'is_solar': True, 'is_battery': True, ...}, {...}]
```

### DataFrame Integration
```python
import pandas as pd
from src.pipeline.nlp.llm_jetson import JetsonLLMExtractor

# Load your data
df = pd.read_csv("permits.csv")

# Initialize extractor
extractor = JetsonLLMExtractor(backend="ollama", model="mistral-7b")

# Extract features and add to DataFrame
df_enriched = extractor.extract_dataframe(df, text_col="description")

# New columns added: f_is_solar, f_is_battery, f_is_generator, etc.
print(df_enriched.columns)
```

### Using in Jetson Pipeline
```python
from src.pipeline.nlp.llm_jetson import JetsonLLMExtractor
from src.pipeline.config_jetson import LLM_BACKEND, LLM_MODEL, LLM_ENABLED

if LLM_ENABLED:
    extractor = JetsonLLMExtractor(backend=LLM_BACKEND, model=LLM_MODEL)
    df = extractor.extract_dataframe(df, text_col="description")
```

## Configuration

Edit `src/pipeline/config_jetson.py`:

```python
# LLM Configuration
LLM_BACKEND = "ollama"  # 'ollama', 'vllm-quantized', or 'vllm'
LLM_MODEL = "mistral-7b"  # Model name (backend-specific)
LLM_ENABLED = True  # Set to False to skip LLM extraction

# Ollama server
OLLAMA_BASE_URL = "http://localhost:11434"

# vLLM quantization
VLLM_QUANTIZATION = "awq"  # or "gptq", "bitsandbytes"
```

## Troubleshooting

### "Cannot connect to Ollama"
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama if not running
ollama serve
```

### Model not found
```bash
# Pull the model
ollama pull mistral-7b

# Check available models
ollama list
```

### Out of memory errors
- Use a smaller model (e.g., openchat-3.5 instead of mistral-7b)
- Use quantized models (4-bit or 8-bit)
- Reduce batch size in `extract_batch(batch_size=5)`

### Slow inference
- CPU fallback? Check GPU is active: `nvidia-smi`
- Model too large? Try quantized or smaller model
- Batch size too large? Reduce batch size

## Setup Utilities

The package includes helper functions:

```python
from src.pipeline.nlp.jetson_setup import (
    print_jetson_setup_guide,
    check_ollama_running,
    check_ollama_installed,
    recommend_backend_for_jetson,
)

# Print setup guide
print_jetson_setup_guide()

# Check if Ollama is running
if check_ollama_running():
    print("✓ Ollama is ready")

# Get recommendation based on VRAM
backend = recommend_backend_for_jetson(vram_gb=8)
print(f"Recommended: {backend}")
```

## Performance Tips

1. **Use Ollama with mistral-7b** - Best balance of speed and quality
2. **Run Ollama in background** - Start once, reuse
3. **Batch descriptions** - Process 10-50 at a time
4. **Pre-allocate memory** - Use `memory.ulimit` on Jetson
5. **Disable telemetry** - Some LLMs send data to cloud

## See Also

- `examples/jetson_llm_example.py` - Full working example
- `run_pipeline_jetson.py` - Integration in main pipeline
- `src/pipeline/config_jetson.py` - Configuration options
- `src/pipeline/nlp/llm_jetson.py` - Implementation details

## Alternative: llama.cpp

For very constrained environments (Jetson Nano):

```bash
# Install
pip install llama-cpp-python

# Download quantized model (GGUF format)
wget https://huggingface.co/TheBloke/Mistral-7B-Instruct-GGUF/resolve/main/Mistral-7B-Instruct-Q2_K.gguf

# Use (requires custom integration)
```

## Further Reading

- [Ollama GitHub](https://github.com/jmorganca/ollama)
- [vLLM Documentation](https://docs.vllm.ai/)
- [NVIDIA Jetson Docs](https://docs.nvidia.com/jetson/)
- [LLM Quantization Guide](https://huggingface.co/docs/bitsandbytes)
