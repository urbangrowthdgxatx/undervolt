# Data Directory

This directory contains the Austin Construction Permits dataset.

## Download the Data

The dataset is **not** checked into git due to its large size (1.5GB).

To download it, run either:

### Option 1: Bash script
```bash
bash scripts/download_data.sh
```

### Option 2: Python script
```bash
python scripts/download_data.py
```

## Dataset Information

- **Source**: [Austin Open Data Portal](https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu)
- **Size**: ~1.5 GB (varies as dataset is updated)
- **Records**: 2.4M+ construction permits
- **Filename**: `Issued_Construction_Permits_20251212.csv`
- **Note**: This is a live dataset - size and record count may change over time

## Contents

After downloading, you should have:
```
data/
├── README.md (this file)
├── .gitignore
└── Issued_Construction_Permits_20251212.csv (not in git)
```

## Usage

Once downloaded, run the pipeline:
```bash
python pipeline_cudf.py
```
