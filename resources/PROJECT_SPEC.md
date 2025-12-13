# Urban Growth & Infrastructure Intelligence — DGX Project

## Links
- **Team Doc**: https://docs.google.com/document/d/1XmYui-OFBHIh93l3169p6xDPLFEUbqDIyzmPYXdMyzY/edit?tab=t.0
- **Hackathon**: https://luma.com/aitx-dgx-hackathon?tk=dQyKpK
- **Judging Criteria**: https://docs.google.com/document/d/1FhwCPFuJxC3tYRn2vHTF9gPJ-V9Lzf7YNFujEpAZZut4/edit?tab=t.0

## Objective
Build a DGX-accelerated system that turns unstructured city permit text into actionable urban growth insights by extracting structured signals, storing them in a feature store, and surfacing non-obvious trends through analytics and visualization.

## Problem Statement
City permits are messy text blobs containing signals about:
- EV charger expansion
- Dense housing (ADUs, multi-family)
- Infrastructure strain
- Neighborhood transformation

Today, planners and analysts cannot easily see these patterns. We will.

## System Architecture
```
Raw Permit Text
      │
      ▼
DGX Ingestion & Exploration (GPU)
      │
      ▼
LLM / NLP Feature Extraction (GPU)
      │
      ▼
Feature Store (Structured Signals)
      │
      ▼
Trend Analysis & Aggregation (RAPIDS)
      │
      ▼
Visualization + Narrative Output
```

## Feature Taxonomy (CRITICAL)
| Feature Category | Examples |
|------------------|----------|
| Infrastructure | EV chargers, solar panels, power upgrades |
| Housing | ADUs, multi-family, renovations |
| Commercial | Warehouses, retail, mixed use |
| Cost Signals | Permit valuation buckets |
| Location | Zip, neighborhood, corridor |

## Example LLM Output
```json
{
  "ev_charger": true,
  "adu": false,
  "permit_value": "250k-500k",
  "infrastructure_upgrade": true
}
```

## Solo Build Requirements
| Component | Must-Have |
|-----------|-----------|
| Data sample | 10–20 permits (for extraction demo) |
| Feature extraction | 5–10 features |
| Feature store | Yes |
| Analysis | 2–3 strong insights |
| Visualization | 1 clean view |

## What NOT To Do
- Don't scrape more data
- Don't over-model
- Don't build prediction models
- Don't over-engineer UI

## One-Sentence Pitch
"We built a DGX-accelerated system that turns unstructured city permit text into structured urban growth signals, enabling planners to see infrastructure and housing trends that were previously hidden."

## Judging Criteria Alignment
| Criteria | How We Score |
|----------|--------------|
| Technical Execution | Full pipeline |
| NVIDIA Ecosystem | RAPIDS + GPU LLM |
| Value | City-ready insights |
| Frontier | LLM-driven urban intelligence |
