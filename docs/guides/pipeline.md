# Undervolt Data Pipeline

**Single unified pipeline** that processes Austin construction permits from raw data to database-ready format.

## Quick Start

```bash
# Run full pipeline (auto-detects GPU on Jetson/DGX, CPU on Mac)
python run_unified.py

# Test with sample
python run_unified.py --sample 100000

# Force platform config (useful for testing)
python run_unified.py --platform dgx

# Optional LLM enrichment (uses platform defaults)
python run_unified.py --enable-llm

# After pipeline completes
npm run db:ingest        # Load into database
cd frontend && bun run dev  # Start dashboard
```

## What It Does

```
Raw Austin Permits (2.4M)
  ↓ Step 1: Load (cuDF on GPU, pandas on CPU)
  ↓ Step 2: Clean (remove invalid coords, nulls)
  ↓ Step 3: NLP (keyword extraction, 80 features)
  ↓ Step 4: Clustering (KMeans, 8 clusters)
  ↓ Step 5: Energy Filter (99.3% reduction)
  ↓ Step 6: Save (CSV + JSON)
Energy Permits (18K) → Database → Dashboard
```

## Platform Auto-Detection

| Platform | Detection | Backend |
|----------|-----------|---------|
| **Jetson AGX Orin** | `aarch64` + Linux | cuDF + cuML (CUDA) |
| **NVIDIA DGX** | `nvidia-smi` exists | cuDF + cuML (CUDA) |
| **Mac** | `arm64` + Darwin | pandas + scikit-learn |
| **Generic Linux** | No GPU | pandas + scikit-learn |

## Pipeline Steps

### Step 1: Load Data
- **Input**: `data/Issued_Construction_Permits_20251212.csv` (2.4M permits)
- **Backend**: cuDF (GPU) or pandas (CPU)
- **Code**: `src/pipeline/data_unified.py`
- **Output**: DataFrame with 68 columns

### Step 2: Clean & Normalize
- **Code**: `src/pipeline/data_unified.py`
- **Actions**:
  - Remove invalid lat/lng (~35K permits)
  - Parse 5 date columns
  - Convert 20 numeric columns
  - Extract ZIP codes
- **Output**: Clean DataFrame (~2.4M permits)

### Step 3: NLP Enrichment
- **Code**: `src/pipeline/nlp/enrichment.py`
- **Actions**:
  - Extract keywords from 5 text columns
  - Create 80 binary feature columns (f_*)
  - Keywords: residential, commercial, hvac, electrical, etc.
- **Output**: Enriched DataFrame (2.4M permits + 80 features)

**Optional LLM enrichment**
- Enable with `--enable-llm` (uses platform defaults from `src/pipeline/platform.py`)
- Override with `--llm-backend` and `--llm-model` if needed

### Step 4: Clustering
- **Code**: `src/pipeline/clustering_unified.py`
- **Actions**:
  - StandardScaler normalization
  - PCA (80 features → 10 components)
  - KMeans (k=8 clusters)
  - Assign f_cluster column (0-7)
- **Backend**: cuML (GPU) or scikit-learn (CPU)
- **Output**: Clustered DataFrame (2.4M permits + cluster_id)

### Step 5: Energy Extraction
- **Code**: Inline (calls `track_energy_infrastructure.py` logic)
- **Actions**:
  - Filter permits with energy keywords:
    - Solar: `solar`, `photovoltaic`, `pv system`
    - Battery: `battery`, `powerwall`, `energy storage`
    - EV: `ev charger`, `electric vehicle`
    - Generator: `generator`, `standby gen`
    - Panel: `panel upgrade`, `200 amp`
    - HVAC: `hvac`, `heat pump`, `ac unit`
  - Extract solar capacity (kW) from descriptions
  - Add permit_number, address, lat/lng
- **Output**: Energy permits DataFrame (~18K permits)

### Step 6: Save Outputs
- **Files**:
  - `output/permit_data_enriched.csv` - All permits with clusters
  - `output/energy_permits.csv` - Energy permits only (for database)
  - `frontend/public/data/energy_infrastructure.json` - Aggregated stats for frontend

## Output Files

### `output/energy_permits.csv` (18K rows)
Ready for database ingestion with:
- `permit_number` - Real Austin permit IDs (e.g., `2025-156150 EP`)
- `address` - Street addresses
- `latitude`, `longitude` - Coordinates
- `zip_code`, `cluster_id`, `issued_date`
- `type` - Energy type (solar/battery/ev_charger/etc.)
- `capacity_kw` - Solar capacity (if available)

### `frontend/public/data/energy_infrastructure.json`
Frontend dashboard data:
- `summary` - Type counts, solar stats
- `by_zip` - Top 100 ZIP codes with energy breakdowns
- `monthly_trends` - Time-series data
- `metadata` - Pipeline info

## Performance

| Hardware | Load Time | Clustering | Total |
|----------|-----------|------------|-------|
| **Jetson AGX Orin** (GPU) | ~3s | ~8s | ~15s |
| **NVIDIA DGX** (GPU) | ~2s | ~5s | ~10s |
| **Mac M1/M2** (CPU) | ~45s | ~120s | ~3min |

## Usage Examples

### Full Production Run
```bash
# Process all 2.4M permits
python run_unified.py

# Outputs:
# - output/permit_data_enriched.csv (2.4M permits)
# - output/energy_permits.csv (18K permits)
# - frontend/public/data/energy_infrastructure.json
```

### Development Testing
```bash
# Test with 100K sample (faster)
python run_unified.py --sample 100000

# Skip clustering for faster testing
python run_unified.py --sample 50000 --skip-clustering
```

### After Pipeline Completes
```bash
# Load into database
npm run db:ingest

# Verify
npm run db:studio  # Opens GUI at http://localhost:4983

# Start dashboard
cd frontend && bun run dev
```

## Troubleshooting

### "Data file not found"
```bash
# Download raw data
bash scripts/shell/download_data.sh

# Or manually from:
# https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu
```

### GPU Not Detected (Jetson/DGX)
```bash
# Check NVIDIA GPU
nvidia-smi

# Verify cuDF installation
python -c "import cudf; print('cuDF OK')"

# If missing, reinstall RAPIDS
pip install cudf-cu11 cuml-cu11 --extra-index-url=https://pypi.nvidia.com
```

### Memory Issues
```bash
# Run with smaller sample
python run_unified.py --sample 500000

# Or increase swap (Jetson)
sudo fallocate -l 16G /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## Pipeline vs. Individual Scripts

**Old way** (fragmented):
```bash
python -m src.pipeline.main           # Step 1-4
python scripts/python/track_energy_infrastructure.py  # Step 5
python scripts/python/name_clusters.py  # Additional
npm run db:ingest                     # Step 6
```

**New way** (unified):
```bash
python run_unified.py  # All steps in one command
npm run db:ingest      # Load results
```

## Customization

### Change Number of Clusters
Use the CLI flag:
```bash
python run_unified.py --clusters 12
```

### Add New Energy Keywords
Edit `scripts/python/track_energy_infrastructure.py:62-116`:
```python
# Add wind turbines
if any(kw in desc for kw in ['wind turbine', 'windmill']):
    result['is_energy'] = True
    result['type'] = 'wind'
    result['signals'].append('wind')
```

### Change Sample Size Default
Edit `run_unified.py`:
```python
parser.add_argument('--sample', type=int, default=100000, ...)
```

## Architecture

```
run_unified.py (orchestrator)
├── platform.py → Jetson/DGX/Mac auto-detect
├── step_1_load_data() → src/pipeline/data_unified.py
├── step_2_clean_data() → src/pipeline/data_unified.py
├── step_3_nlp_enrich() → src/pipeline/nlp/enrichment.py (+ optional LLM)
├── step_4_clustering() → src/pipeline/clustering_unified.py
├── step_5_extract_energy() → scripts/python/track_energy_infrastructure.py
└── step_6_save_outputs() → CSV + JSON files
```

## Next Steps

1. **Run pipeline**: `python run_unified.py`
2. **Load database**: `npm run db:ingest`
3. **Start frontend**: `cd frontend && bun run dev`
4. **View map**: http://localhost:3000/dashboard

---

**Questions?** See [data-flow-complete.md](../data-flow-complete.md) for complete data flow audit trail.
