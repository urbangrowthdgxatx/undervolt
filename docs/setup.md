# Undervolt Setup Guide

Complete setup instructions for running the Undervolt pipeline.

## Prerequisites

- Python 3.8+
- pip or pip3
- wget or curl (for downloading data)

## Installation Steps

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd undervolt
```

### Step 2: Download the Dataset

The Austin Construction Permits dataset is **NOT** included in the repository due to its size (~1.5GB).

Download it using one of these methods:

**Option A: Bash Script (recommended)**
```bash
bash scripts/download_data.sh
```

**Option B: Python Script**
```bash
python scripts/download_data.py
```

**Option C: Manual Download**
1. Visit: https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu
2. Click "Export" → "CSV"
3. Save as `data/Issued_Construction_Permits_20251212.csv`

### Step 3: Install Python Dependencies

**CPU-only mode (works anywhere):**
```bash
pip install scikit-learn pandas
```

**GPU mode (requires NVIDIA GPU + RAPIDS):**
```bash
# Install RAPIDS following: https://rapids.ai/start.html
# Then install additional deps:
pip install scikit-learn pandas
```

### Step 4: Run the Pipeline

```bash
python pipeline_cudf.py
```

**Expected output:**
- Processing time: ~2-10 minutes (depending on CPU/GPU)
- Output files:
  - `permit_data_enriched.csv` (~2GB) - Full dataset with NLP features and clusters
  - `permit_summary_by_zip.csv` (~50KB) - Summary by ZIP code

### Step 5: Test with Sample Data (Optional)

To verify everything works before processing the full dataset:

```bash
python test_pipeline.py
```

This runs on 5 sample permits in `test_permits.csv`.

## Pipeline Features

The pipeline automatically:
- ✅ Detects GPU/CPU and uses appropriate libraries
- ✅ Cleans and normalizes 2.4M records
- ✅ Parses dates and numeric fields
- ✅ Extracts ZIP codes from multiple sources
- ✅ Validates lat/lon coordinates
- ✅ Generates NLP keyword features for:
  - Solar installations
  - EV chargers
  - Battery storage
  - Generators
  - HVAC, electrical, plumbing
  - Residential vs commercial
  - Remodels, repairs, new construction
- ✅ Clusters permits using KMeans
- ✅ Exports enriched dataset

## Troubleshooting

### "Data file not found"

Run the download script:
```bash
bash scripts/download_data.sh
```

### "No module named 'sklearn'"

Install dependencies:
```bash
pip install scikit-learn pandas
```

### NumPy version warning

This is non-critical and won't affect functionality. To fix:
```bash
pip install --upgrade numpy
```

### Out of memory

The full dataset requires ~4-8GB RAM for CPU processing. Options:
- Close other applications
- Use a machine with more RAM
- Use GPU acceleration (much more memory efficient)

## Project Structure

```
undervolt/
├── data/                          # Data directory (not in git)
│   ├── README.md
│   └── Issued_Construction_Permits_20251212.csv  (download first)
├── scripts/
│   ├── download_data.sh          # Bash download script
│   └── download_data.py          # Python download script
├── pipeline_cudf.py              # Main extraction pipeline
├── test_pipeline.py              # Test with sample data
├── test_permits.csv              # Sample data (5 permits)
├── SETUP.md                      # This file
└── README.md                     # Project overview
```

## Next Steps

After running the pipeline:

1. **Explore the enriched data:**
   ```bash
   head permit_data_enriched.csv
   ```

2. **Check ZIP summaries:**
   ```bash
   head permit_summary_by_zip.csv
   ```

3. **Run the frontend** (if available):
   ```bash
   cd frontend
   bun install
   bun run dev
   ```

## Support

- Issues: Check [GitHub Issues](https://github.com/your-repo/issues)
- Data source: [Austin Open Data Portal](https://data.austintexas.gov)
