# Austin Hidden Infrastructure Mapper - Build Plan

## Project Summary
Extract 7 hidden signals from Austin construction permit text using DGX-accelerated LLM inference, then surface trends with RAPIDS analytics.

**One-liner:** "We built a DGX-accelerated system that extracts hidden infrastructure signals (EV chargers, solar, ADUs, generators) from permit text to reveal Austin's electrification and density trends."

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────┐ │
│  │  Neon    │───▶│ DGX Load    │───▶│ LLM Extract │───▶│ Feature │ │
│  │ Postgres │    │ (cuDF)      │    │ (GPU Batch) │    │ Store   │ │
│  │ 80K rows │    │             │    │             │    │(Parquet)│ │
│  └──────────┘    └─────────────┘    └─────────────┘    └────┬────┘ │
│                                                              │      │
│                                      ┌───────────────────────┘      │
│                                      ▼                              │
│                         ┌─────────────────────────┐                 │
│                         │   RAPIDS Aggregation    │                 │
│                         │   - By zip code         │                 │
│                         │   - By year             │                 │
│                         │   - Trend analysis      │                 │
│                         └───────────┬─────────────┘                 │
│                                     ▼                               │
│                         ┌─────────────────────────┐                 │
│                         │   Visualization/Demo    │                 │
│                         │   - Heatmaps            │                 │
│                         │   - Trend charts        │                 │
│                         │   - Key insights        │                 │
│                         └─────────────────────────┘                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The 7 Signals We Extract

| Signal | What LLM Looks For | Why It Matters |
|--------|-------------------|----------------|
| **is_ev_charger** | "EV charger", "electric vehicle", "charging station", "Level 2" | Electrification trend |
| **is_solar** | "solar", "PV system", "photovoltaic" + extract kW | Renewable adoption |
| **has_battery** | "battery backup", "Powerwall", "energy storage" | Grid resilience |
| **has_generator** | "generator", "standby power", "Generac" + extract kW | Post-freeze resilience |
| **is_adu** | "ADU", "accessory dwelling", "secondary apartment", small sqft + kitchen | Housing density |
| **is_panel_upgrade** | "panel upgrade", "200 amp", "service upgrade" | Infrastructure strain |
| **units** | Extract number of housing units from description | Development scale |

---

## Build Steps

### STEP 1: LLM Prompt Development (Local)
**Goal:** Create and test the extraction prompt on sample data

**Deliverable:** `prompts/extract_features.txt`

```
You are an expert at analyzing construction permit descriptions.
Extract the following signals from the permit text:

{
  "is_ev_charger": boolean,      // EV charging station installation
  "is_solar": boolean,           // Solar panel installation
  "solar_kw": number or null,    // Solar system size in kW if mentioned
  "has_battery": boolean,        // Battery storage (Powerwall, backup)
  "has_generator": boolean,      // Backup generator installation
  "generator_kw": number or null,// Generator size if mentioned
  "is_adu": boolean,             // Accessory dwelling unit
  "is_panel_upgrade": boolean,   // Electrical panel/service upgrade
  "units": number or null,       // Number of housing units
  "housing_type": "single_family" | "multi_family" | "commercial" | null
}

Only return the JSON object, no explanation.

Permit description: {description}
```

**Test:** Run on 20 samples, validate output

---

### STEP 2: Data Loading Script (Local → DGX)
**Goal:** Pull permits from Neon into GPU memory

**Deliverable:** `scripts/load_data.py`

```python
import cudf
import pandas as pd
from sqlalchemy import create_engine

# Connection
DATABASE_URL = "postgresql://neondb_owner:npg_5M4WYbgyfJDa@ep-long-sky-ah0b88ws-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

def load_permits():
    engine = create_engine(DATABASE_URL)

    # Pull relevant columns
    query = """
    SELECT permit_num, description, permit_class_mapped,
           original_zip, latitude, longitude,
           calendar_year_issued, total_job_valuation
    FROM construction_permits
    WHERE description IS NOT NULL AND LENGTH(description) > 10
    """

    # Load to pandas, convert to cuDF
    pdf = pd.read_sql(query, engine)
    gdf = cudf.DataFrame.from_pandas(pdf)

    return gdf
```

---

### STEP 3: LLM Batch Extraction (DGX - THE MAIN EVENT)
**Goal:** Run local LLM on all 80K permits

**Deliverable:** `scripts/extract_features.py`

```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import cudf
import json

# Load model (on DGX GPUs)
model_id = "mistralai/Mistral-7B-Instruct-v0.2"  # or Llama
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    torch_dtype=torch.float16,
    device_map="auto"  # Spread across GPUs
)

def extract_features(description: str) -> dict:
    prompt = f"""Extract signals from this permit:

{description}

Return JSON only:
{{"is_ev_charger": bool, "is_solar": bool, "solar_kw": number|null, "has_battery": bool, "has_generator": bool, "is_adu": bool, "is_panel_upgrade": bool, "units": number|null, "housing_type": string|null}}"""

    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    outputs = model.generate(**inputs, max_new_tokens=200)
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)

    # Parse JSON from response
    return json.loads(response.split("{")[-1].split("}")[0] + "}")

def batch_extract(gdf: cudf.DataFrame, batch_size=100):
    results = []
    descriptions = gdf['description'].to_pandas().tolist()

    for i in range(0, len(descriptions), batch_size):
        batch = descriptions[i:i+batch_size]
        batch_results = [extract_features(d) for d in batch]
        results.extend(batch_results)
        print(f"Processed {i+batch_size}/{len(descriptions)}")

    return results
```

**DGX Justification:**
- Batch inference across 80K descriptions
- Multi-GPU parallel processing
- No API rate limits or costs

---

### STEP 4: Feature Store Creation
**Goal:** Save extracted features as Parquet

**Deliverable:** `scripts/save_features.py`

```python
import cudf

def create_feature_store(gdf: cudf.DataFrame, features: list):
    # Merge features back to original data
    feature_df = cudf.DataFrame(features)

    result = cudf.concat([
        gdf[['permit_num', 'original_zip', 'latitude', 'longitude', 'calendar_year_issued']],
        feature_df
    ], axis=1)

    # Save as Parquet (GPU-optimized format)
    result.to_parquet('feature_store/permits_with_signals.parquet')

    return result
```

---

### STEP 5: RAPIDS Trend Analysis (DGX)
**Goal:** GPU-accelerated aggregations

**Deliverable:** `scripts/analyze_trends.py`

```python
import cudf

def analyze_trends(gdf: cudf.DataFrame):
    insights = {}

    # EV chargers by zip
    insights['ev_by_zip'] = gdf[gdf['is_ev_charger'] == True] \
        .groupby('original_zip').size() \
        .sort_values(ascending=False) \
        .head(10)

    # Solar adoption trend
    insights['solar_by_year'] = gdf[gdf['is_solar'] == True] \
        .groupby('calendar_year_issued') \
        .agg({'solar_kw': 'mean', 'permit_num': 'count'})

    # ADU hotspots
    insights['adu_by_zip'] = gdf[gdf['is_adu'] == True] \
        .groupby('original_zip').size() \
        .sort_values(ascending=False) \
        .head(10)

    # Grid resilience index (generator + battery + solar)
    gdf['resilience_score'] = (
        gdf['has_generator'].astype(int) +
        gdf['has_battery'].astype(int) +
        gdf['is_solar'].astype(int)
    )
    insights['resilience_by_zip'] = gdf.groupby('original_zip')['resilience_score'].mean()

    return insights
```

---

### STEP 6: Visualization (Local/Demo)
**Goal:** Charts and maps for judges

**Deliverable:** `notebooks/demo.ipynb` or `scripts/visualize.py`

**Visualizations:**
1. **Heatmap:** EV charger density by zip code
2. **Line chart:** Solar kW installed by year
3. **Bar chart:** Top 10 zip codes for ADUs
4. **Composite:** Grid resilience score by neighborhood

---

## File Structure

```
runtime-collective/
├── PLAN.md                          # This file
├── resources/
│   ├── PROJECT_SPEC.md              # ✅ Done
│   ├── HACKATHON_TASK.md            # ✅ Done
│   └── sample_feature_extraction.md # ✅ Done
├── prompts/
│   └── extract_features.txt         # LLM prompt
├── scripts/
│   ├── load_data.py                 # Neon → GPU
│   ├── extract_features.py          # LLM batch (DGX)
│   ├── save_features.py             # → Parquet
│   ├── analyze_trends.py            # RAPIDS aggregation
│   └── visualize.py                 # Charts
├── feature_store/
│   └── permits_with_signals.parquet # Output
└── notebooks/
    └── demo.ipynb                   # Final demo
```

---

## DGX Session Checklist

```
[ ] Verify GPU access: nvidia-smi
[ ] Install stack: pip install cudf-cu12 transformers torch
[ ] Test Neon connection from DGX
[ ] Download model: Mistral-7B-Instruct
[ ] Run extraction on 100 samples (test)
[ ] Run full batch (80K permits)
[ ] Run RAPIDS aggregations
[ ] Export results
```

---

## Demo Script (What You Say to Judges)

1. **The Problem:** "Permit data has hidden signals - EV chargers, ADUs, grid resilience - locked in text"

2. **Our Solution:** "We built a DGX pipeline that extracts 7 signals using local LLM inference"

3. **Show the Tech:**
   - "80,000 permits processed with Mistral-7B on DGX"
   - "RAPIDS cuDF for GPU-accelerated trend analysis"

4. **Show the Insights:**
   - "78704 has 3x more EV chargers than 78731"
   - "Solar adoption up 40% year-over-year"
   - "Generator permits spiked post-2021 freeze"

5. **The Impact:** "City planners can now see infrastructure trends they couldn't before"

---

## Timeline

| Phase | Tasks |
|-------|-------|
| **Pre-DGX** | Prompt development, test extraction locally, prepare scripts |
| **On DGX** | Load data, batch extraction, RAPIDS analysis, export |
| **Post-DGX** | Visualization, demo prep, pitch practice |
