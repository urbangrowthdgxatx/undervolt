# Austin Hidden Infrastructure Mapper

**DGX-accelerated system that extracts hidden infrastructure signals from construction permit text to reveal Austin's electrification and density trends.**

Built for the [AITX DGX Hackathon](https://luma.com/aitx-dgx-hackathon?tk=dQyKpK)

## The Problem

Austin issues 2M+ construction permits, but the real urban growth story is buried in unstructured text descriptions:
- Where are EV chargers being installed?
- Which neighborhoods are adding ADUs (density)?
- Is the city building grid resilience after the 2021 freeze?

City planners can't see these trends because they're locked in free-text fields.

## Our Solution

Extract 7 hidden signals using LLM inference on DGX, then surface trends with RAPIDS analytics.

### Signals We Extract

| Signal | Description |
|--------|-------------|
| `is_ev_charger` | EV charging station installations |
| `is_solar` + `solar_kw` | Solar panel installations with capacity |
| `has_battery` | Battery storage (Powerwall, backup) |
| `has_generator` | Backup generator installations |
| `is_adu` | Accessory dwelling units (housing density) |
| `is_panel_upgrade` | Electrical panel upgrades (infrastructure strain) |
| `units` | Number of housing units |

## Architecture

```
Neon Postgres (80K permits)
        │
        ▼
   DGX Load (cuDF)
        │
        ▼
   LLM Extraction (Mistral-7B, GPU batch)
        │
        ▼
   Feature Store (Parquet)
        │
        ▼
   RAPIDS Aggregation (cuDF groupby)
        │
        ▼
   Visualization / Insights
```

## Data

- **Source:** [Austin Open Data - Issued Construction Permits](https://data.austintexas.gov/)
- **Size:** 2.4M+ rows, 1.7GB
- **Sample loaded:** 80K rows in Neon Postgres
- **Coverage:** 97% have lat/long, 97% have zip code

## Project Structure

```
runtime-collective/
├── README.md                        # This file
├── PLAN.md                          # Build plan & DGX workflow
├── resources/
│   ├── PROJECT_SPEC.md              # DGX project specification
│   ├── HACKATHON_TASK.md            # Hackathon challenge details
│   └── sample_feature_extraction.md # Feature extraction analysis (40 samples)
├── prompts/                         # LLM prompts (TODO)
├── scripts/                         # Python scripts (TODO)
│   ├── load_data.py                 # Neon → GPU
│   ├── extract_features.py          # LLM batch extraction
│   ├── analyze_trends.py            # RAPIDS aggregation
│   └── visualize.py                 # Charts & maps
└── feature_store/                   # Extracted features (TODO)
```

## Database

Permit data is loaded in Neon Postgres:

```
Table: construction_permits
Rows: 79,661
Columns: 68 (all TEXT for flexibility)
```

Key columns:
- `permit_num` - Unique identifier
- `description` - Free text (THE GOLDMINE)
- `original_zip` - Location
- `latitude`, `longitude` - Coordinates
- `calendar_year_issued` - Time dimension

## Quick Stats from Data Exploration

| Signal | Count in 80K Sample |
|--------|---------------------|
| EV Chargers | 775 |
| Solar | 1,630 |
| ADU | 331 |
| Generator | 1,277 |
| Battery Storage | 128 |
| Panel Upgrades | 3,072 |
| Multi-family | 4,025 |

## DGX Workflow

1. **Load data** from Neon into cuDF (GPU DataFrame)
2. **Batch LLM inference** with Mistral-7B across 80K descriptions
3. **RAPIDS aggregation** - groupby zip, year for trend analysis
4. **Export** feature store as Parquet

## Why DGX?

- **Batch LLM inference** - Process 80K permits without API rate limits
- **Multi-GPU parallel processing** - Fast iteration on prompts
- **RAPIDS/cuDF** - GPU-accelerated analytics
- **Local models** - No cloud API costs

## Sample Insights (Preview)

From initial exploration:
- 78704 (South Austin) leads in EV charger installations
- Solar + battery combinations growing (grid resilience)
- ADUs clustering in central Austin zip codes
- Generator permits reflect post-2021 freeze preparedness

## Team

Built at the AITX DGX Hackathon

## License

MIT
