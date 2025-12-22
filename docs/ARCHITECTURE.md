# Undervolt Architecture

Organized code structure for the Undervolt pipeline.

## Project Structure

```
undervolt/
├── src/
│   └── pipeline/
│       ├── __init__.py
│       ├── config.py              # Central configuration
│       ├── main.py                # Main pipeline entry point
│       ├── data/                  # Data operations
│       │   ├── __init__.py
│       │   ├── loader.py         # Load/save CSV
│       │   ├── cleaner.py        # Data cleaning
│       │   └── analyzer.py       # Analysis functions
│       ├── nlp/                   # NLP enrichment
│       │   ├── __init__.py
│       │   └── enrichment.py     # Keyword extraction
│       ├── clustering/            # Clustering
│       │   ├── __init__.py
│       │   └── kmeans.py         # KMeans clustering
│       └── utils/                 # Utilities
│           ├── __init__.py
│           ├── gpu.py            # GPU detection
│           └── logging_setup.py  # Logging config
├── data/                          # Data directory
│   ├── README.md
│   └── Issued_Construction_Permits_20251212.csv
├── scripts/                       # Helper scripts
│   ├── download_data.sh
│   └── download_data.py
├── run_pipeline.py               # Main runner (NEW)
├── pipeline_cudf.py              # Legacy monolithic (DEPRECATED)
└── test_pipeline.py              # Test script

```

## Module Breakdown

### `src/pipeline/config.py`
Central configuration for all pipeline parameters:
- GPU environment setup
- Column definitions (text, numeric, dates)
- NLP keywords
- Clustering parameters
- File paths

### `src/pipeline/data/`
Data loading, cleaning, and analysis:
- **loader.py**: Load CSV with cuDF/pandas, save results
- **cleaner.py**: Clean data (normalize columns, parse dates, extract ZIP)
- **analyzer.py**: Analysis functions (group by ZIP, etc.)

### `src/pipeline/nlp/`
NLP feature extraction:
- **enrichment.py**: Extract keyword features from text columns

### `src/pipeline/clustering/`
Clustering operations:
- **kmeans.py**: KMeans clustering on NLP features (GPU/CPU)

### `src/pipeline/utils/`
Utility functions:
- **gpu.py**: GPU detection and info
- **logging_setup.py**: Logging configuration

### `src/pipeline/main.py`
Main pipeline orchestration - runs the complete workflow

## Running the Pipeline

### New Way (Recommended)
```bash
python run_pipeline.py
```

### Old Way (Still Works)
```bash
python pipeline_cudf.py
```

## Pipeline Flow

```
┌─────────────────────────────────────────────────────────┐
│                    PIPELINE FLOW                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Check Data File                                     │
│     └── config.DATA_PATH                                │
│                                                         │
│  2. GPU Detection                                       │
│     └── utils.print_gpu_info()                          │
│                                                         │
│  3. Load Data                                           │
│     └── data.load_data()                                │
│                                                         │
│  4. Clean Data                                          │
│     ├── Normalize column names                          │
│     ├── Parse dates                                     │
│     ├── Clean numeric fields                            │
│     ├── Extract ZIP codes                               │
│     └── Filter invalid lat/lon                          │
│                                                         │
│  5. NLP Enrichment                                      │
│     └── nlp.nlp_enrich()                                │
│         └── Extract keyword features                    │
│                                                         │
│  6. Clustering                                          │
│     └── clustering.run_cuml_clustering()                │
│         ├── Scale features                              │
│         ├── PCA dimensionality reduction                │
│         └── KMeans clustering                           │
│                                                         │
│  7. Save Results                                        │
│     ├── permit_data_enriched.csv                        │
│     └── permit_summary_by_zip.csv                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Configuration

All configuration is centralized in `src/pipeline/config.py`:

```python
# Text columns for NLP
TEXT_COLUMNS = [
    "description",
    "work_class",
    "permit_class",
    "permit_type_desc",
    "permit_type"
]

# NLP keywords to search for
NLP_KEYWORDS = [
    "residential", "commercial", "remodel", "repair",
    "solar", "battery", "generator", "EV", ...
]

# Clustering parameters
CLUSTERING_PARAMS = {
    "n_clusters": 8,
    "max_iter": 300,
    "n_pca_components": 10
}
```

## GPU/CPU Fallback

The pipeline automatically detects and uses available hardware:

- **GPU Mode**: Uses cuDF + cuML (requires NVIDIA GPU + RAPIDS)
- **CPU Mode**: Uses pandas + sklearn (works anywhere)

Detection logic in `config.py`:
```python
GPU_ENABLED = False
try:
    import cudf
    GPU_ENABLED = True
except Exception:
    pass
```

## Adding New Features

### Add New NLP Keywords
Edit `src/pipeline/config.py`:
```python
NLP_KEYWORDS = [
    "existing keywords...",
    "new_keyword_1",
    "new_keyword_2"
]
```

### Add New Text Columns
Edit `src/pipeline/config.py`:
```python
TEXT_COLUMNS = [
    "existing columns...",
    "new_text_column"
]
```

### Modify Clustering
Edit `src/pipeline/config.py`:
```python
CLUSTERING_PARAMS = {
    "n_clusters": 12,  # Change number of clusters
    "max_iter": 500,   # More iterations
    ...
}
```

## Testing

### Unit Testing (TODO)
```bash
pytest tests/
```

### Integration Testing
```bash
python test_pipeline.py  # Small sample dataset
```

### Full Pipeline
```bash
python run_pipeline.py   # Full 2.4M records
```

## Benefits of New Structure

1. **Modularity**: Each component is isolated and testable
2. **Configuration**: Single source of truth for all parameters
3. **Maintainability**: Easy to find and modify specific functionality
4. **Extensibility**: Simple to add new features or modules
5. **Backwards Compatible**: Old `pipeline_cudf.py` still works

## Migration Path

The old monolithic `pipeline_cudf.py` is still available but deprecated.

**To migrate custom code:**
1. Import from new modules:
   ```python
   from src.pipeline.data import load_data, clean_permit_data
   from src.pipeline.nlp import nlp_enrich
   from src.pipeline.clustering import run_cuml_clustering
   ```

2. Use config for parameters:
   ```python
   from src.pipeline.config import TEXT_COLUMNS, NLP_KEYWORDS
   ```

3. Run via main entry point:
   ```python
   from src.pipeline.main import main
   main()
   ```
