#!/bin/bash
# Download Austin Construction Permits Dataset
# Source: https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_ROOT/data"

# Create data directory if it doesn't exist
mkdir -p "$DATA_DIR"

echo "📥 Downloading Austin Construction Permits dataset..."
echo "Source: Austin Open Data Portal"
echo "Dataset: Issued Construction Permits (2.2M+ records)"
echo ""

# Socrata API endpoint for CSV export
# This gets the full dataset in CSV format
DATASET_URL="https://data.austintexas.gov/api/views/3syk-w9eu/rows.csv?accessType=DOWNLOAD"
OUTPUT_FILE="$DATA_DIR/Issued_Construction_Permits_20251212.csv"

# Download with progress bar
if command -v wget &> /dev/null; then
    wget -O "$OUTPUT_FILE" "$DATASET_URL"
elif command -v curl &> /dev/null; then
    curl -L -o "$OUTPUT_FILE" "$DATASET_URL"
else
    echo "❌ Error: Neither wget nor curl found. Please install one of them."
    exit 1
fi

# Check if download was successful
if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    LINE_COUNT=$(wc -l < "$OUTPUT_FILE")

    echo ""
    echo "✅ Download complete!"
    echo "📊 File: $OUTPUT_FILE"
    echo "📦 Size: $FILE_SIZE"
    echo "📝 Lines: $(printf "%'d" $((LINE_COUNT - 1))) records (+ 1 header)"
    echo ""
    echo "Next steps:"
    echo "  1. Run the pipeline: python pipeline_cudf.py"
    echo "  2. Or run test: python test_pipeline.py"
else
    echo "❌ Download failed!"
    exit 1
fi
