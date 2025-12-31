#!/bin/bash
#
# Automated Daily Pipeline Update
#
# Downloads latest Austin permits, runs full pipeline, updates database
# Can be run manually or scheduled with cron
#
# Usage:
#   bash scripts/shell/update_pipeline.sh           # Full update
#   bash scripts/shell/update_pipeline.sh --quick   # Skip download, just process
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
PROJECT_ROOT="/home/red/Documents/github/undervolt"
DATA_DIR="$PROJECT_ROOT/data"
OUTPUT_DIR="$PROJECT_ROOT/output"
LOG_DIR="$PROJECT_ROOT/logs"

# Create log directory
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/pipeline_$TIMESTAMP.log"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

banner() {
    echo "" | tee -a "$LOG_FILE"
    echo "================================================================================" | tee -a "$LOG_FILE"
    echo "  $1" | tee -a "$LOG_FILE"
    echo "================================================================================" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
}

# Parse arguments
SKIP_DOWNLOAD=false
if [[ "$1" == "--quick" ]]; then
    SKIP_DOWNLOAD=true
    info "Quick mode: Skipping download"
fi

cd "$PROJECT_ROOT"

banner "UNDERVOLT AUTOMATED PIPELINE UPDATE"

# Step 1: Download latest data (unless --quick)
if [ "$SKIP_DOWNLOAD" = false ]; then
    banner "STEP 1: DOWNLOAD LATEST AUSTIN PERMITS"

    info "Downloading from Austin Open Data Portal..."

    # Austin Open Data API endpoint
    API_URL="https://data.austintexas.gov/resource/3syk-w9eu.csv"
    TEMP_FILE="$DATA_DIR/permits_download_$TIMESTAMP.csv"
    CURRENT_FILE="$DATA_DIR/Issued_Construction_Permits_$(date +%Y%m%d).csv"

    # Download with curl (supports resume, shows progress)
    if curl -L -o "$TEMP_FILE" "$API_URL?\$limit=9999999" 2>&1 | tee -a "$LOG_FILE"; then
        log "✅ Download complete"

        # Count records
        RECORD_COUNT=$(wc -l < "$TEMP_FILE")
        RECORD_COUNT=$((RECORD_COUNT - 1))  # Subtract header
        info "Downloaded: $RECORD_COUNT permits"

        # Move to dated filename
        mv "$TEMP_FILE" "$CURRENT_FILE"
        log "Saved to: $CURRENT_FILE"

        # Update symlink to latest
        ln -sf "$(basename $CURRENT_FILE)" "$DATA_DIR/Issued_Construction_Permits_latest.csv"

        # Archive old files (keep last 7 days)
        info "Cleaning up old downloads (keeping last 7 days)..."
        find "$DATA_DIR" -name "Issued_Construction_Permits_*.csv" -type f -mtime +7 -delete
    else
        error "Download failed!"
        exit 1
    fi
else
    info "Using existing data file (--quick mode)"
fi

# Step 2: Check for existing processed data
banner "STEP 2: CHECK INCREMENTAL UPDATE"

LATEST_DATA=$(ls -t "$DATA_DIR"/Issued_Construction_Permits_*.csv 2>/dev/null | head -1)
if [ -z "$LATEST_DATA" ]; then
    error "No data file found!"
    exit 1
fi

info "Latest data: $LATEST_DATA"

# Check if we've already processed this file
ENRICHED_FILE="$OUTPUT_DIR/permit_data_enriched.csv"
if [ -f "$ENRICHED_FILE" ]; then
    ENRICHED_MTIME=$(stat -c %Y "$ENRICHED_FILE" 2>/dev/null || stat -f %m "$ENRICHED_FILE")
    DATA_MTIME=$(stat -c %Y "$LATEST_DATA" 2>/dev/null || stat -f %m "$LATEST_DATA")

    if [ "$ENRICHED_MTIME" -gt "$DATA_MTIME" ]; then
        warn "Enriched data is newer than raw data - no update needed"
        info "To force update, run: rm $ENRICHED_FILE"

        # Still update database from existing processed data
        banner "STEP 5: UPDATE DATABASE (from existing data)"
        cd "$PROJECT_ROOT"
        npm run db:reset 2>&1 | tee -a "$LOG_FILE"
        log "✅ Database updated"
        exit 0
    fi
fi

# Step 3: Run full ML pipeline
banner "STEP 3: RUN ML PIPELINE (2.4M permits)"

info "Starting GPU-accelerated pipeline..."
python3 run_pipeline.py 2>&1 | tee -a "$LOG_FILE"

if [ $? -eq 0 ]; then
    log "✅ Pipeline complete"
else
    error "Pipeline failed!"
    exit 1
fi

# Step 4: Generate cluster names (if needed)
banner "STEP 4: GENERATE CLUSTER NAMES"

# Check if name_clusters.py exists and run it
if [ -f "scripts/python/name_clusters.py" ]; then
    info "Generating cluster names..."
    # Note: We'll update this script to process full dataset
    python3 scripts/python/name_clusters.py 2>&1 | tee -a "$LOG_FILE"
else
    warn "Cluster naming script not found, skipping..."
fi

# Step 5: Update database
banner "STEP 5: UPDATE DATABASE"

cd "$PROJECT_ROOT"
info "Resetting and re-ingesting database..."
npm run db:reset 2>&1 | tee -a "$LOG_FILE"

if [ $? -eq 0 ]; then
    log "✅ Database updated"
else
    error "Database update failed!"
    exit 1
fi

# Step 6: Summary
banner "UPDATE COMPLETE"

# Get stats
DB_COUNT=$(npx tsx -e "import Database from 'better-sqlite3'; const db = new Database('./data/undervolt.db', { readonly: true }); console.log(db.prepare('SELECT COUNT(*) as c FROM permits').get().c); db.close();")

log "Pipeline Summary:"
log "  - Raw permits: $(wc -l < $LATEST_DATA | awk '{print $1-1}' | numfmt --grouping 2>/dev/null || wc -l < $LATEST_DATA | awk '{print $1-1}')"
log "  - Enriched permits: $(wc -l < $OUTPUT_DIR/permit_data_enriched.csv | awk '{print $1-1}' | numfmt --grouping 2>/dev/null || wc -l < $OUTPUT_DIR/permit_data_enriched.csv | awk '{print $1-1}')"
log "  - Energy permits: $(wc -l < $OUTPUT_DIR/energy_permits.csv | awk '{print $1-1}' | numfmt --grouping 2>/dev/null || wc -l < $OUTPUT_DIR/energy_permits.csv | awk '{print $1-1}')"
log "  - Database records: $DB_COUNT"
log ""
log "Log saved to: $LOG_FILE"
log ""
log "Next steps:"
log "  - Start frontend: cd frontend && bun run dev"
log "  - View dashboard: http://localhost:3000/dashboard"

exit 0
