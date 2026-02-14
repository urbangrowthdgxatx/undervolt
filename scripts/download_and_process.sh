#!/bin/bash
# =============================================================================
# Austin Permits - Download and Process Pipeline
# =============================================================================
#
# Downloads fresh data from Austin Open Data Portal and processes it
# through the ML pipeline.
#
# Usage:
#   ./scripts/download_and_process.sh [--skip-download] [--skip-pipeline]
#
# =============================================================================

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_DIR/data"
OUTPUT_DIR="$PROJECT_DIR/output"

# Austin Open Data Portal - Issued Construction Permits
# https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu
DATA_URL="https://data.austintexas.gov/api/views/3syk-w9eu/rows.csv?accessType=DOWNLOAD"
RAW_FILE="$DATA_DIR/Issued_Construction_Permits.csv"

echo "============================================================"
echo " Austin Permits - Download and Process Pipeline"
echo "============================================================"
echo "Project: $PROJECT_DIR"
echo "Data:    $DATA_DIR"
echo "Output:  $OUTPUT_DIR"
echo ""

# Parse arguments
SKIP_DOWNLOAD=false
SKIP_PIPELINE=false
for arg in "$@"; do
    case $arg in
        --skip-download) SKIP_DOWNLOAD=true ;;
        --skip-pipeline) SKIP_PIPELINE=true ;;
    esac
done

# Create directories
mkdir -p "$DATA_DIR" "$OUTPUT_DIR"

# =============================================================================
# Step 1: Download fresh data
# =============================================================================
if [ "$SKIP_DOWNLOAD" = false ]; then
    echo "[1/4] Downloading fresh data from Austin Open Data Portal..."
    echo "      URL: $DATA_URL"

    # Remove old file if exists
    rm -f "$RAW_FILE"

    # Download with progress
    curl -L -o "$RAW_FILE" "$DATA_URL" --progress-bar

    # Verify download
    if [ ! -f "$RAW_FILE" ]; then
        echo "ERROR: Download failed!"
        exit 1
    fi

    ROW_COUNT=$(wc -l < "$RAW_FILE")
    FILE_SIZE=$(du -h "$RAW_FILE" | cut -f1)
    echo "      Downloaded: $FILE_SIZE ($ROW_COUNT rows)"
else
    echo "[1/4] Skipping download (--skip-download)"
    if [ ! -f "$RAW_FILE" ]; then
        echo "ERROR: No data file found at $RAW_FILE"
        exit 1
    fi
fi

# =============================================================================
# Step 2: Run ML pipeline (enrichment + clustering)
# =============================================================================
if [ "$SKIP_PIPELINE" = false ]; then
    echo ""
    echo "[2/4] Running ML pipeline (NLP enrichment + clustering)..."

    cd "$PROJECT_DIR"

    # Run the unified pipeline
    python3 -m src.pipeline.main 2>&1 | tee "$DATA_DIR/pipeline.log"

    # Verify outputs
    if [ ! -f "$OUTPUT_DIR/permit_data_named_clusters.csv" ]; then
        echo "ERROR: Pipeline failed - no output file!"
        exit 1
    fi

    OUTPUT_ROWS=$(wc -l < "$OUTPUT_DIR/permit_data_named_clusters.csv")
    echo "      Pipeline complete: $OUTPUT_ROWS rows"
else
    echo ""
    echo "[2/4] Skipping pipeline (--skip-pipeline)"
fi

# =============================================================================
# Step 3: Create/update database
# =============================================================================
echo ""
echo "[3/4] Creating database and ingesting data..."

cd "$PROJECT_DIR"

# Clean old database
rm -f "$DATA_DIR/undervolt.db"

# Push schema
npm run db:push

# Ingest data
npm run db:ingest

# Verify
PERMIT_COUNT=$(python3 -c "
import sqlite3
conn = sqlite3.connect('$DATA_DIR/undervolt.db')
count = conn.execute('SELECT COUNT(*) FROM permits').fetchone()[0]
print(count)
")

echo "      Database: $PERMIT_COUNT permits ingested"

# =============================================================================
# Step 4: Summary
# =============================================================================
echo ""
echo "============================================================"
echo " Pipeline Complete!"
echo "============================================================"
echo ""
echo "Files:"
echo "  Raw data:     $RAW_FILE"
echo "  Enriched:     $OUTPUT_DIR/permit_data_enriched.csv"
echo "  Clustered:    $OUTPUT_DIR/permit_data_named_clusters.csv"
echo "  Database:     $DATA_DIR/undervolt.db ($PERMIT_COUNT permits)"
echo ""
echo "Next steps:"
echo "  1. Start frontend:  cd frontend && npm run dev"
echo "  2. Run LLM:         python3 scripts/python/llm_categorize_all.py"
echo ""
