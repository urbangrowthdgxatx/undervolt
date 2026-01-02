# Undervolt Project Structure

Clean, organized structure for the Austin infrastructure mapping pipeline.

## Root Directory

```
undervolt/
├── run_pipeline.py          # Legacy pipeline runner (config-based)
├── run_unified.py           # Unified runner (auto-detect platform)
├── run.py                   # Helper runner/entry point
├── README.md                # Main project README
├── claude.md                # Project instructions for Claude
│
├── src/                     # Source code (modular)
│   └── pipeline/
│       ├── config.py              # Base configuration
│       ├── config_dgx.py          # DGX-specific config
│       ├── config_jetson.py       # Jetson-specific config
│       ├── config_mac.py          # Mac-specific config
│       ├── main.py                # Pipeline orchestrator
│       ├── data/                  # Data operations (legacy pipeline)
│       │   ├── loader.py          # Load/save CSV
│       │   ├── cleaner.py         # Data cleaning
│       │   └── analyzer.py        # Analysis
│       ├── data_unified.py        # Unified load + clean (GPU/CPU aware)
│       ├── nlp/                   # NLP enrichment
│       │   └── enrichment.py      # Keyword extraction
│       ├── clustering/            # Clustering
│       │   └── kmeans.py          # KMeans (GPU/CPU)
│       ├── clustering_unified.py  # Unified clustering (GPU/CPU aware)
│       ├── platform.py            # Platform detection + config
│       └── utils/                 # Utilities
│           ├── gpu.py             # GPU detection
│           └── logging_setup.py   # Logging
│
├── data/                    # Data directory
│   ├── README.md
│   ├── .gitignore
│   └── Issued_Construction_Permits_20251212.csv  (1.5GB, not in git)
│
├── scripts/                 # Helper scripts
│   ├── download_data.sh     # Download Austin permits (bash)
│   └── download_data.py     # Download Austin permits (python)
│
├── docs/                    # Documentation
│   ├── readme.md            # Documentation index
│   ├── guides/              # How-to guides (pipeline, setup, GPU)
│   ├── architecture/        # Architecture docs & diagrams
│   ├── performance/         # Benchmarks & optimization notes
│   ├── platform-guide.md    # Platform-specific guidance
│   ├── columns.md           # Column reference
│   └── hackathon.md         # Hackathon summary & narrative
│
├── examples/                # Example code & test data
│   ├── README.md
│   ├── data_pipeline.ipynb  # Walkthrough notebook
│   ├── jetson_llm_example.py # Jetson LLM example
│   └── run_llm_api.py       # LLM API example
│
├── tests/                   # Automated tests
│   └── python/
│       ├── test_pipeline.py # pytest smoke test
│       └── test_permits.csv # Sample dataset
│
├── output/                  # Pipeline outputs (not in git)
│   ├── README.md
│   ├── permit_data_enriched.csv     (1.8GB - full dataset with features)
│   └── energy_permits.csv           (small - energy-only permits)
│
├── legacy/                  # Deprecated code
│   ├── README.md
│   └── pipeline_cudf.py     # Original monolithic script (370 lines)
│
├── frontend/                # Next.js visualization
│   ├── src/
│   ├── public/
│   └── package.json
│
├── config/                  # YAML configs (planned)
│   └── features/
│
└── resources/               # Background docs & research
    └── notebook/
```

## Quick Navigation

### 🚀 Running the Pipeline

```bash
# Unified runner (auto-detect platform)
python run_unified.py

# Legacy runner (config-based)
python run_pipeline.py
```

### 📖 Documentation

- **Docs index**: [docs/readme.md](docs/readme.md)
- **Architecture**: [docs/architecture/](docs/architecture/)
- **Platform Guide**: [docs/platform-guide.md](docs/platform-guide.md)
- **Pipeline Guide**: [docs/guides/pipeline.md](docs/guides/pipeline.md)

### 🧪 Testing

```bash
# pytest smoke test with sample data
pytest tests/python/test_pipeline.py
```

### 📥 Get Data

```bash
# Download Austin permits dataset (~1.5GB)
bash scripts/download_data.sh

# Or use Python version
python scripts/download_data.py
```

## File Overview

| Directory | Purpose |
|-----------|---------|
| `src/pipeline/` | Modular pipeline code (legacy + unified) |
| `docs/` | Documentation, guides, and architecture |
| `scripts/` | Data download + helper utilities |
| `examples/` | Jupyter + LLM demos |
| `tests/` | Automated checks |

## What's in Git vs. Not

### ✅ In Git
- Source code (`src/`, `*.py`)
- Documentation (`docs/*.md`)
- Scripts (`scripts/`)
- Examples (`examples/`)
- Configuration (`config/`)
- Frontend code (`frontend/`)

### ❌ Not in Git (too large)
- Data files (`data/*.csv`)
- Output files (`output/*.csv`)
- Node modules (`frontend/node_modules/`)

## Clean Structure Benefits

1. **Clear separation** - Code, docs, data, outputs all separate
2. **Easy to navigate** - Find what you need quickly
3. **Git-friendly** - Large files excluded automatically
4. **Platform support** - DGX, Jetson, Mac configs ready
5. **Professional** - Industry-standard organization

## Migration from Old Structure

**Before:** Everything in root (messy)
```
undervolt/
├── pipeline_cudf.py
├── SETUP.md
├── ARCHITECTURE.md
├── permit_data.csv
├── test_permits.csv
└── ... 20+ files in root
```

**After:** Organized (clean)
```
undervolt/
├── run_unified.py
├── src/          # Code
├── docs/         # Docs
├── data/         # Data
├── output/       # Results
└── tests/        # Tests
```

## Next Steps

1. **Run the pipeline**: `python run_unified.py`
2. **Explore outputs**: `output/permit_data_enriched.csv`
3. **Read docs**: Start with `docs/readme.md`
4. **Customize**: Adjust `run_unified.py` flags or `src/pipeline/platform.py`

Everything is organized and ready to use! 🎉
