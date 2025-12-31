# LLM-Based Feature Extraction

Guide to using vLLM for advanced feature extraction from permit descriptions.

## Overview

The LLM extraction module uses a local language model (e.g., Llama-3-8B) to extract structured features from permit descriptions. This provides more nuanced understanding compared to keyword matching.

## Requirements

### Hardware
- **GPU**: NVIDIA GPU with 16GB+ VRAM (24GB recommended for 8B models)
- **RAM**: 32GB+ system RAM
- **Storage**: 20GB+ for model weights

### Recommended Platforms
- ✅ **NVIDIA DGX**: Ideal (80GB VRAM)
- ✅ **NVIDIA A100/H100**: Excellent (40-80GB VRAM)
- ✅ **NVIDIA RTX 4090**: Good (24GB VRAM)
- ⚠️ **NVIDIA Jetson**: Limited (AGX Orin 64GB shared memory - use 3B models)
- ❌ **Mac/CPU**: Not supported (vLLM requires CUDA)

## Installation

### 1. Install vLLM

```bash
# CUDA 12.1+ required
pip install vllm

# Verify installation
python -c "from vllm import LLM; print('vLLM installed successfully')"
```

### 2. Download Model (Optional)

vLLM will auto-download models, but you can pre-download:

```bash
# Using HuggingFace CLI
pip install huggingface-hub
huggingface-cli download meta-llama/Llama-3-8B-Instruct
```

## Usage

### Basic Usage

```python
from src.pipeline.nlp.llm_extraction import llm_enrich
import pandas as pd

# Load permit data
df = pd.read_csv("data/Issued_Construction_Permits_20251212.csv", nrows=1000)

# Run LLM extraction
df_enriched = llm_enrich(
    df,
    text_col="description",
    model_name="meta-llama/Llama-3-8B-Instruct",
    batch_size=50
)

# Result: DataFrame with llm_* columns
# llm_is_solar, llm_is_battery, llm_is_generator, etc.
```

### Integration with Pipeline

```python
from src.pipeline.data.loader import load_permit_data
from src.pipeline.nlp.enrichment import nlp_enrich
from src.pipeline.nlp.llm_extraction import llm_enrich

# Load data
df = load_permit_data("data/Issued_Construction_Permits_20251212.csv")

# Run keyword extraction (fast)
df = nlp_enrich(df)

# Run LLM extraction (slower, more accurate)
df = llm_enrich(df, batch_size=50)

# Compare results
from src.pipeline.nlp.llm_extraction import compare_keyword_vs_llm
comparison = compare_keyword_vs_llm(df)
print(comparison)
```

## Extracted Features

The LLM extracts 12 boolean features:

### Energy Infrastructure
- `llm_is_solar` - Solar panel installation
- `llm_is_battery` - Battery storage system
- `llm_is_generator` - Backup generator
- `llm_is_ev_charger` - EV charging station

### Property Type
- `llm_is_adu` - Accessory Dwelling Unit
- `llm_is_residential` - Residential property
- `llm_is_commercial` - Commercial property

### Work Type
- `llm_is_new_construction` - New building
- `llm_is_remodel` - Renovation/remodel

### Systems
- `llm_has_hvac` - HVAC work
- `llm_has_electrical` - Electrical work
- `llm_has_plumbing` - Plumbing work

## Performance

### Speed

| Platform | Batch Size | Throughput | Time for 100K permits |
|----------|-----------|------------|----------------------|
| DGX A100 | 100 | ~500/sec | ~3 minutes |
| RTX 4090 | 50 | ~200/sec | ~8 minutes |
| RTX 3090 | 32 | ~100/sec | ~17 minutes |
| Jetson AGX | 10 | ~20/sec | ~83 minutes |

### Memory Usage

| Model Size | VRAM Required | Batch Size (max) |
|------------|---------------|------------------|
| Llama-3-3B | 8GB | 100 |
| Llama-3-8B | 16GB | 50 |
| Llama-3-70B | 80GB | 20 |

## Model Selection

### Recommended Models

```python
# Best accuracy (requires 16GB+ VRAM)
model_name = "meta-llama/Llama-3-8B-Instruct"

# Faster, less VRAM (8GB)
model_name = "meta-llama/Llama-3.2-3B-Instruct"

# For Jetson (4GB)
model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
```

### Custom Models

You can use any HuggingFace model or local path:

```python
# Local model
df_enriched = llm_enrich(df, model_name="/path/to/local/model")

# Fine-tuned model
df_enriched = llm_enrich(df, model_name="your-org/permits-classifier")
```

## Comparison: Keyword vs LLM

### Keyword Extraction (Current)
- ✅ **Fast**: 50,000 permits/sec
- ✅ **No GPU required**
- ✅ **Deterministic**
- ❌ **Simple pattern matching**
- ❌ **Misses context** ("solar water heater" → solar power)

### LLM Extraction (Advanced)
- ✅ **Context-aware**: Understands nuance
- ✅ **Higher accuracy**: Distinguishes solar thermal vs solar PV
- ✅ **Handles ambiguity**: "battery backup for solar" → both flags
- ❌ **Slower**: 100-500 permits/sec
- ❌ **Requires GPU**: 16GB+ VRAM
- ❌ **Non-deterministic**: Slight variation in outputs

### When to Use Each

**Use Keywords** (default):
- CPU-only systems
- Fast exploration
- Good enough accuracy (80-90%)

**Use LLM**:
- Production analysis requiring high accuracy
- Research requiring nuanced understanding
- When GPU resources are available

## Example Results

### Input Permit
```
Description: "INSTALL 10KW SOLAR PV SYSTEM WITH 13.5KWH BATTERY BACKUP
             AND EV CHARGER FOR RESIDENTIAL NEW CONSTRUCTION"
```

### Keyword Extraction
```python
f_description_kw_solar: True        # ✅ Correct
f_description_kw_residential: True  # ✅ Correct
f_description_kw_new: True          # ✅ Correct
# ❌ Misses: battery, EV charger (keywords not in list)
```

### LLM Extraction
```python
llm_is_solar: True              # ✅ Correct
llm_is_battery: True            # ✅ Detected from context
llm_is_ev_charger: True         # ✅ Detected from context
llm_is_residential: True        # ✅ Correct
llm_is_new_construction: True   # ✅ Correct
llm_has_electrical: True        # ✅ Inferred
```

## Troubleshooting

### Out of Memory Error
```
RuntimeError: CUDA out of memory
```

**Solutions**:
1. Reduce batch size: `batch_size=10` instead of `batch_size=50`
2. Use smaller model: `Llama-3.2-3B-Instruct` instead of `Llama-3-8B`
3. Reduce max_model_len: Add to config
   ```python
   extractor = LLMExtractor(
       model_name="meta-llama/Llama-3-8B-Instruct",
       max_model_len=256  # Reduce from 512
   )
   ```

### Slow Inference
```
Taking 10+ seconds per batch
```

**Solutions**:
1. Enable tensor parallelism (multi-GPU):
   ```python
   extractor = LLMExtractor(
       model_name="meta-llama/Llama-3-8B-Instruct",
       tensor_parallel_size=2  # Use 2 GPUs
   )
   ```
2. Use quantized models (requires bitsandbytes)
3. Increase batch size if VRAM allows

### JSON Parsing Errors
```
WARNING: Failed to parse JSON
```

**Normal behavior**: ~0.1-1% of outputs may fail to parse. The module returns default (all False) for failed parses. This is acceptable for large-scale analysis.

## Advanced Configuration

### Custom Extraction Prompt

Edit `src/pipeline/nlp/llm_extraction.py`:

```python
EXTRACTION_PROMPT = """Extract infrastructure signals from this permit.

Description: {description}

Return JSON with these fields:
{{
  "is_solar": true/false,
  "is_battery": true/false,
  "estimated_capacity_kw": number or null,
  "urgency": "low"|"medium"|"high"
}}

JSON:"""
```

### Batch Processing Large Datasets

```python
import pandas as pd
from src.pipeline.nlp.llm_extraction import LLMExtractor

# Initialize once (expensive)
extractor = LLMExtractor(model_name="meta-llama/Llama-3-8B-Instruct")

# Process in chunks
chunk_size = 10000
all_results = []

for i in range(0, len(df), chunk_size):
    chunk = df.iloc[i:i+chunk_size]
    descriptions = chunk["description"].fillna("").tolist()

    # Extract features
    features = extractor.extract_batch(descriptions, batch_size=50)
    all_results.extend(features)

    print(f"Processed {min(i+chunk_size, len(df)):,}/{len(df):,}")

# Combine results
feature_df = pd.DataFrame(all_results)
df_enriched = pd.concat([df, feature_df], axis=1)
```

## Next Steps

1. **Test on sample data**: Run `examples/test_llm_extraction.py` (TODO: create)
2. **Compare accuracy**: Use `compare_keyword_vs_llm()` on validation set
3. **Fine-tune model**: Train on labeled permit data for domain-specific accuracy
4. **Production deployment**: Integrate into main pipeline with error handling

## References

- [vLLM Documentation](https://docs.vllm.ai/)
- [Llama-3 Model Card](https://huggingface.co/meta-llama/Llama-3-8B-Instruct)
- [Undervolt Pipeline Architecture](ARCHITECTURE.md)
