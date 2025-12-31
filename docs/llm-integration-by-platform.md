# LLM Integration Guide - By Platform

## Quick Enable

To enable LLM extraction on any platform, set `LLM_ENABLED = True` in the platform config file.

### Mac
```python
# src/pipeline/config_mac.py
LLM_ENABLED = True          # Enable LLM extraction
LLM_BACKEND = "ollama"      # Ollama works great on Mac
LLM_MODEL = "neural-chat"   # or mistral-7b, llama2-7b
```

**Setup:**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama (one-time)
ollama serve &

# Pull model (one-time)
ollama pull neural-chat

# Run pipeline
python run_pipeline_mac.py
```

---

### Jetson (Orin/Xavier)
```python
# src/pipeline/config_jetson.py
LLM_ENABLED = True          # Enable LLM extraction
LLM_BACKEND = "ollama"      # Ollama recommended
LLM_MODEL = "neural-chat"   # Fast, good quality
```

**Setup:**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama (one-time)
ollama serve &

# Pull model (one-time)
ollama pull neural-chat

# Run pipeline
python run_pipeline_jetson.py
```

**For Jetson Nano (4GB):**
```python
LLM_MODEL = "openchat-3.5"  # Smaller model
# or use vLLM with quantization:
LLM_BACKEND = "vllm-quantized"
```

---

### Jetson Nano (Limited VRAM)
```python
# src/pipeline/config_jetson.py
LLM_ENABLED = True
LLM_BACKEND = "vllm-quantized"  # Memory efficient
LLM_MODEL = "TheBloke/Mistral-7B-Instruct-GPTQ"  # 4-bit
```

**Setup:**
```bash
pip install vllm

python run_pipeline_jetson.py
```

---

### DGX
```python
# src/pipeline/config_dgx.py
LLM_ENABLED = True          # Enable LLM extraction
LLM_BACKEND = "ollama"      # or "vllm" for max performance
LLM_MODEL = "mistral-7b"    # Full-sized models work well
```

---

## Default Behavior

- **LLM_ENABLED = False** by default (backward compatible)
- Pipeline works with or without LLM extraction
- Graceful fallback if Ollama not running

## What Gets Extracted

When LLM extraction is enabled, 12 new features are added:

**Energy Infrastructure:**
- `f_is_solar` - Solar installation
- `f_is_battery` - Battery storage  
- `f_is_generator` - Backup generator
- `f_is_ev_charger` - EV charging

**Building Type:**
- `f_is_residential` - Residential
- `f_is_commercial` - Commercial
- `f_is_adu` - Accessory dwelling

**Work Type:**
- `f_is_new_construction` - New construction
- `f_is_remodel` - Remodel

**Systems:**
- `f_has_hvac` - HVAC work
- `f_has_electrical` - Electrical work
- `f_has_plumbing` - Plumbing work

## Troubleshooting

**"Cannot connect to Ollama"**
```bash
ollama serve  # Start in background
```

**"Model not found"**
```bash
ollama pull neural-chat  # Pull the model
```

**Performance too slow**
- Try smaller model: `openchat-3.5`
- Use quantized models: `vllm-quantized` backend
- Reduce batch size in extraction code

## Testing

```python
# Quick test
python -c "
from src.pipeline.nlp.llm_jetson import JetsonLLMExtractor
extractor = JetsonLLMExtractor(backend='ollama', model='neural-chat')
features = extractor.extract_batch(['Solar panel installation with battery'])
print(features)
"
```

## Examples

- **Mac:** `python run_pipeline_mac.py`
- **Jetson:** `python run_pipeline_jetson.py`
- **DGX:** `python run_pipeline_dgx.py`

Each platform automatically uses the configured backend and model!
