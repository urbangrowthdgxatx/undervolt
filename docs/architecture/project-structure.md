# Undervolt Project Structure

Clean, organized structure for the Austin infrastructure mapping pipeline.

## Root Directory

```
undervolt/
├── run_pipeline.py          # Default pipeline runner (auto-detect platform)
├── run_unified.py           # Unified runner entry point
├── README.md                # Main project README
├── CLAUDE.md                # Project instructions for Claude
│
├── src/                     # Source code (modular)
│   └── pipeline/
│       ├── config.py              # Base configuration
│       ├── config_dgx.py          # DGX-specific config
│       ├── config_jetson.py       # Jetson-specific config
│       ├── config_mac.py          # Mac-specific config
│       ├── main.py                # Pipeline orchestrator
│       ├── data/                  # Data operations
│       │   ├── loader.py          # Load/save CSV
│       │   ├── cleaner.py         # Data cleaning
│       │   └── analyzer.py        # Analysis
│       ├── nlp/                   # NLP enrichment
│       │   └── enrichment.py      # Keyword extraction
│       ├── clustering/            # Clustering
│       │   └── kmeans.py          # KMeans (GPU/CPU)
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
│   ├── README.md            # Documentation index
│   ├── SETUP.md             # Setup guide
│   ├── ARCHITECTURE.md      # System architecture
│   ├── PLATFORM_GUIDE.md    # Platform-specific configs
│   ├── CODE_ORGANIZATION.md # Code structure
│   ├── DATASET_COLUMNS.md   # Column reference
│   ├── COLUMN_FIXES.md      # Column mapping fixes
│   ├── PIPELINE_USAGE.md    # Usage guide
│   ├── columns.md           # (legacy column info)
│   └── PRESENTATION.md      # Presentation materials
│
├── examples/                # Example code & test data
│   ├── README.md
│   ├── test_pipeline.py     # Test with sample data
│   └── test_permits.csv     # Sample (5 permits)
│
├── output/                  # Pipeline outputs (not in git)
│   ├── README.md
│   ├── permit_data_enriched.csv     (1.8GB - full dataset with features)
│   └── permit_summary_by_zip.csv    (403MB - ZIP summaries)
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
# Default (auto-detect)
python run_pipeline.py

# Unified runner
python run_unified.py
```

### 📖 Documentation

- **Setup**: [docs/SETUP.md](docs/SETUP.md)
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Platform Guide**: [docs/PLATFORM_GUIDE.md](docs/PLATFORM_GUIDE.md)
- **Dataset Info**: [docs/DATASET_COLUMNS.md](docs/DATASET_COLUMNS.md)

### 🧪 Testing

```bash
# Quick test with 5 sample permits
python examples/test_pipeline.py
```

### 📥 Get Data

```bash
# Download Austin permits dataset (~1.5GB)
bash scripts/download_data.sh

# Or use Python version
python scripts/download_data.py
```

## File Counts

| Directory | Files | Purpose |
|-----------|-------|---------|
| `src/pipeline/` | 15 Python files | Modular pipeline code |
| `docs/` | 10 Markdown files | Complete documentation |
| `scripts/` | 2 scripts | Data download utilities |
| `examples/` | 2 files | Test code and data |
| `output/` | 2 CSV files | Pipeline results (2.2GB total) |
| `legacy/` | 1 Python file | Deprecated monolith |

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
├── run_pipeline.py
├── src/          # Code
├── docs/         # Docs
├── data/         # Data
├── output/       # Results
└── examples/     # Tests
```

## Next Steps

1. **Run the pipeline**: `python run_pipeline.py`
2. **Explore outputs**: `output/permit_data_enriched.csv`
3. **Read docs**: Start with `docs/SETUP.md`
4. **Customize**: Edit configs in `src/pipeline/config*.py`

Everything is organized and ready to use! 🎉
