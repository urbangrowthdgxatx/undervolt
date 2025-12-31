# Jetson LLM Quick Reference

## Installation Checklist

- [ ] **Ollama:** `curl -fsSL https://ollama.ai/install.sh | sh`
- [ ] **Start server:** `ollama serve` (in background)
- [ ] **Pull model:** `ollama pull mistral-7b`
- [ ] **Verify:** `curl http://localhost:11434/api/tags`

## Basic Usage

```python
from src.pipeline.nlp.llm_jetson import JetsonLLMExtractor

# One-liner setup
extractor = JetsonLLMExtractor(backend="ollama", model="mistral-7b")

# Extract features
features = extractor.extract_batch(descriptions)

# Add to DataFrame
df = extractor.extract_dataframe(df, text_col="description")
```

## Available Backends

| Backend | Setup | Speed | Memory | Best For |
|---|---|---|---|---|
| **ollama** | `ollama serve` | ⚡⚡⚡ | 7-8GB | Jetson Orin/Xavier |
| **vllm-quantized** | `pip install vllm` | ⚡⚡ | 4-6GB | Limited VRAM |
| **vllm** | `pip install vllm` | ⚡ | 10GB+ | Desktop/Server |

## Recommended Models

**Ollama:**
- `mistral-7b` - Best balance (recommended)
- `neural-chat` - Alternative
- `openchat-3.5` - Lightest

**vLLM:**
- `TheBloke/Mistral-7B-Instruct-GPTQ` - 4-bit quantized
- `TheBloke/Mistral-7B-Instruct-AWQ` - 5-bit quantized

## Extracted Features

Default features extracted from descriptions:
- `is_solar` - Solar installation
- `is_battery` - Battery storage
- `is_generator` - Generator/backup power
- `is_ev_charger` - EV charging
- `is_adu` - Accessory dwelling unit
- `is_residential` - Residential
- `is_commercial` - Commercial
- `is_new_construction` - New build
- `is_remodel` - Remodel/renovation
- `has_hvac` - HVAC system
- `has_electrical` - Electrical work
- `has_plumbing` - Plumbing work

## Troubleshooting

**"Cannot connect to Ollama"**
```bash
ollama serve  # Start server in background
```

**"Model not found"**
```bash
ollama pull mistral-7b  # Pull the model
```

**Memory errors**
- Use smaller model or quantized version
- Reduce batch size: `extract_batch(descriptions, batch_size=5)`
- Check VRAM: `nvidia-smi` on Jetson

**Slow extraction**
- Check GPU is active: `nvidia-smi`
- Monitor memory: `watch -n 1 nvidia-smi`

## Full Documentation

See `docs/JETSON_LLM.md` for detailed guide.

## Example

```python
from src.pipeline.nlp.llm_jetson import JetsonLLMExtractor

descriptions = [
    "Solar + battery storage installation",
    "Commercial HVAC upgrade",
    "Residential remodel with EV charger",
]

extractor = JetsonLLMExtractor(backend="ollama", model="mistral-7b")
features = extractor.extract_batch(descriptions)

for desc, feat in zip(descriptions, features):
    print(f"{desc}:\n  {feat}\n")
```

## Environment Variables (optional)

```bash
# Ollama server URL
export OLLAMA_BASE_URL=http://localhost:11434

# Model cache location
export OLLAMA_MODELS=/path/to/models

# GPU memory fraction
export CUDA_VISIBLE_DEVICES=0
```
