# Pipeline Usage Guide

## Quick Start

The pipeline has been fixed and is now ready to run on both GPU (cuDF/cuML) and CPU (pandas/sklearn) systems.

## Prerequisites

Install required Python dependencies:

```bash
pip3 install scikit-learn pandas
```

For GPU acceleration (optional, requires NVIDIA GPU + RAPIDS):
```bash
# Follow RAPIDS installation guide: https://rapids.ai/start.html
```

## Getting the Data

1. Download the Austin Construction Permits dataset from:
   https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu

2. Save it as `Issued_Construction_Permits_20251212.csv` in the project root directory

## Running the Pipeline

### Test Mode (Small Sample)

To verify everything works:

```bash
python test_pipeline.py
```

This runs on 5 sample permits included in `test_permits.csv`.

### Full Pipeline (2.2M Records)

Once you have the full dataset:

```bash
python pipeline_cudf.py
```

## Output Files

The pipeline generates two files:

1. **permit_data_enriched.csv** - Full dataset with NLP features and clusters
   - Original columns
   - NLP keyword features (f_*_kw_*)
   - Cluster assignment (f_cluster)

2. **permit_summary_by_zip.csv** - Summary statistics by ZIP code

## Pipeline Stages

1. **Data Loading** - cuDF (GPU) or pandas (CPU)
2. **Data Cleaning** - Date parsing, numeric conversion, lat/lon validation
3. **NLP Feature Extraction** - Keyword matching for solar, EV, battery, etc.
4. **Clustering** - KMeans clustering on extracted features
5. **Export** - Save enriched dataset and summaries

## GPU vs CPU Mode

The pipeline automatically detects available hardware:

- **GPU Mode**: Uses cuDF + cuML for maximum speed (requires NVIDIA GPU + RAPIDS)
- **CPU Mode**: Falls back to pandas + sklearn (works anywhere)

## Troubleshooting

### NumPy Version Warning

You may see a warning about NumPy version compatibility. This is non-critical and won't affect functionality.

### Missing Data File

If you see:
```
ERROR | Data file not found: Issued_Construction_Permits_20251212.csv
```

Download the dataset from the link above and place it in the project root.

### Out of Memory

For the full 2.2M dataset on CPU systems with limited RAM:
- Close other applications
- Consider processing in chunks (modification required)
- Use a system with more RAM or GPU acceleration
