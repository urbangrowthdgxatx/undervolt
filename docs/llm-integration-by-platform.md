# LLM Integration Guide - By Platform

## Quick Enable

Run the unified pipeline with `--enable-llm` to turn on LLM extraction. You can
override backend/model per run without editing config files.

### Mac
```python
# src/pipeline/platform.py (defaults)
llm_backend = "ollama"      # Ollama works great on Mac
llm_model = "neural-chat"   # or mistral-7b, llama2-7b
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
python run_unified.py --platform mac --enable-llm
```

---

### Jetson (Orin/Xavier)
```python
# src/pipeline/platform.py (defaults)
llm_backend = "ollama"      # Ollama recommended
llm_model = "neural-chat"   # Fast, good quality
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
python run_unified.py --platform jetson --enable-llm
```

**For Jetson Nano (4GB):**
```python
llm_model = "openchat-3.5"  # Smaller model
# or use vLLM with quantization:
llm_backend = "vllm-quantized"
```

---

### Jetson Nano (Limited VRAM)
```python
# Use CLI overrides
llm_backend = "vllm-quantized"  # Memory efficient
llm_model = "TheBloke/Mistral-7B-Instruct-GPTQ"  # 4-bit
```

**Setup:**
```bash
pip install vllm

python run_unified.py --platform jetson --enable-llm \
  --llm-backend vllm-quantized \
  --llm-model TheBloke/Mistral-7B-Instruct-GPTQ
```

---

### DGX
```python
# src/pipeline/platform.py (defaults)
llm_backend = "vllm"        # or "ollama" if preferred
llm_model = "meta-llama/Llama-3-8B-Instruct"
```

---

## Default Behavior

- LLM extraction is **off** unless `--enable-llm` is provided
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

- **Mac:** `python run_unified.py --platform mac --enable-llm`
- **Jetson:** `python run_unified.py --platform jetson --enable-llm`
- **DGX:** `python run_unified.py --platform dgx --enable-llm`

Each platform automatically uses the configured backend and model!
