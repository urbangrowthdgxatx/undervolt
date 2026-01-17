# LLM Permit Categorization - Technical Notes

## Overview

Using local LLM (Ollama + llama3.2:3b) on Jetson AGX Orin to semantically categorize 192K+ Austin construction permits.

## Hardware

- **Device**: NVIDIA Jetson AGX Orin 64GB
- **JetPack**: 5.1.2 (L4T 35.4.1)
- **GPU**: Ampere architecture, CUDA 8.7
- **Power Mode**: MAXN (60W)

## LLM Setup

- **Framework**: Ollama
- **Model**: llama3.2:3b (2.0GB)
- **Optimizations**:
  - `keep_alive: 60m` - Model stays in GPU memory
  - `num_predict: 100` - Minimal output tokens
  - `num_ctx: 256` - Small context window
  - `temperature: 0.1` - Deterministic outputs

## Performance Metrics

### Initial Sample (1,000 permits)
- **Time**: ~17 minutes
- **Success rate**: 99.2% (992/1000)
- **Speed**: ~1 permit/sec
- **Token throughput**: ~39.5 tok/s

### Full Dataset Projection
- **Total permits**: 192,427
- **Estimated time**: ~53 hours
- **Started**: 2026-01-02

## Categories Extracted

Each permit gets 5 semantic categories:

| Field | Values | Description |
|-------|--------|-------------|
| `project_type` | new_construction, renovation, repair, upgrade, demolition, installation | Nature of work |
| `building_type` | residential_single, residential_multi, commercial, industrial, infrastructure | Building category |
| `scale` | minor, moderate, major | Project size |
| `trade` | electrical, plumbing, hvac, structural, roofing, general, foundation | Primary trade |
| `is_green` | true/false | Energy/sustainability related |

## Sample Distribution (1K sample)

```
PROJECT_TYPE:
  renovation          559 (56.4%) ███████████
  installation        175 (17.7%) ███
  new_construction     83 ( 8.4%) █
  upgrade              75 ( 7.6%) █
  repair               66 ( 6.7%) █
  demolition           26 ( 2.6%)

BUILDING_TYPE:
  residential_single  724 (73.0%) ██████████████
  commercial           82 ( 8.3%) █
  infrastructure       71 ( 7.2%) █
  residential_multi    63 ( 6.4%) █

TRADE:
  general             317 (32.0%) ██████
  hvac                260 (26.2%) █████
  electrical          239 (24.1%) ████
  plumbing             89 ( 9.0%) █
  roofing              20 ( 2.0%)
  structural           11 ( 1.1%)

SCALE:
  minor               559 (56.4%) ███████████
  moderate            224 (22.6%) ████
  major               159 (16.0%) ███

IS_GREEN:
  false               931 (93.9%) ██████████████████
  true                 61 ( 6.1%) █
```

## Implementation Details

### Prompt Engineering

```
Analyze this construction permit and categorize it.

Description: "{description}"

Return JSON with these fields:
- project_type: new_construction/renovation/repair/upgrade/demolition/installation
- building_type: residential_single/residential_multi/commercial/industrial/infrastructure
- scale: minor/moderate/major
- trade: electrical/plumbing/hvac/structural/roofing/general/foundation
- is_green: true if solar/EV/battery/energy related, false otherwise

Return ONLY JSON, no explanation.
```

### Resume Capability

Progress saved every 100 permits to `data/llm_progress.json`:
- Can resume with `--resume` flag
- Survives interruptions
- Incremental database updates

### Database Schema

Added columns to permits table:
- `llm_project_type`
- `llm_building_type`
- `llm_scale`
- `llm_trade`
- `llm_is_green`

## Files

- `scripts/python/llm_categorize_all.py` - Full dataset script
- `scripts/python/llm_categorize.py` - Sample script
- `src/pipeline/nlp/llm_categorization.py` - Pipeline integration
- `data/llm_categories.json` - Sample results
- `data/llm_progress.json` - Resume checkpoint
- `data/llm_full_run.log` - Full run output

## Comparison: Keyword vs LLM

| Aspect | Keyword NLP | LLM Categorization |
|--------|-------------|-------------------|
| Speed | <1 sec total | ~53 hours |
| Features | 16 binary flags | 5 semantic categories |
| Accuracy | Pattern-based | Context-aware |
| Coverage | All permits | All permits (after run) |
| Use case | Clustering features | Rich insights, filtering |

## Lessons Learned

1. **GPU memory management**: `keep_alive` crucial for Jetson
2. **Prompt length**: Shorter prompts = faster inference
3. **Resume capability**: Essential for multi-hour runs
4. **Batch updates**: Save every 100 permits to avoid data loss

## Future Improvements

- [ ] Parallel processing with multiple Ollama instances
- [ ] Batch prompting (multiple permits per request)
- [ ] Fine-tuned smaller model for this specific task
- [ ] vLLM/TensorRT-LLM when JetPack 6 available

---

*Generated during Undervolt project development, January 2026*
