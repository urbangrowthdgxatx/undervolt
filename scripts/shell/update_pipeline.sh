#!/bin/bash
#
# Daily Incremental Pipeline Update (Supabase)
#
# Downloads latest Austin permits CSV, inserts new permits into Supabase,
# assigns clusters to unclustered permits, re-aggregates summary tables.
#
# Usage:
#   bash scripts/shell/update_pipeline.sh           # Full update (download + process)
#   bash scripts/shell/update_pipeline.sh --quick   # Skip download, just process new permits
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load .env if present
ENV_FILE="$(cd "$(dirname "$0")/../.." && pwd)/.env"
[ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a

# Telegram notifications (set via environment or .env file)
TG_BOT_TOKEN="${TG_BOT_TOKEN:-}"
TG_CHAT_ID="${TG_CHAT_ID:-}"

tg_send() {
    curl -s -X POST "https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage" \
        -H "Content-Type: application/json" \
        -d "{\"chat_id\": ${TG_CHAT_ID}, \"text\": \"$1\", \"parse_mode\": \"Markdown\"}" > /dev/null 2>&1 || true
}

# Directories
PROJECT_ROOT="/home/red/Documents/github/undervolt"
DATA_DIR="$PROJECT_ROOT/data"
LOG_DIR="$PROJECT_ROOT/logs"
SCRIPTS_DIR="$PROJECT_ROOT/scripts/python"

mkdir -p "$LOG_DIR" "$DATA_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/pipeline_$TIMESTAMP.log"

log()   { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"; }
info()  { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"; }
warn()  { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"; }

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

banner "UNDERVOLT DAILY INCREMENTAL UPDATE"
log "Started at $(date)"
tg_send "⚡ *Undervolt Pipeline Started*
$(date '+%b %d, %I:%M %p')"

# --------------------------------------------------------------------------
# Step 1: Download latest CSV (unless --quick)
# --------------------------------------------------------------------------
CSV_FILE="$DATA_DIR/Issued_Construction_Permits.csv"

if [ "$SKIP_DOWNLOAD" = false ]; then
    banner "STEP 1: DOWNLOAD LATEST AUSTIN PERMITS"

    DOWNLOAD_URL="https://data.austintexas.gov/api/views/3syk-w9eu/rows.csv?accessType=DOWNLOAD"
    TEMP_FILE="$DATA_DIR/.permits_download_tmp.csv"

    info "Downloading from Austin Open Data Portal..."
    info "URL: $DOWNLOAD_URL"

    if curl -L -o "$TEMP_FILE" --progress-bar "$DOWNLOAD_URL" 2>&1 | tee -a "$LOG_FILE"; then
        # Verify download is valid (has header + data)
        LINE_COUNT=$(wc -l < "$TEMP_FILE")
        if [ "$LINE_COUNT" -lt 100 ]; then
            error "Download looks too small ($LINE_COUNT lines). Aborting."
            rm -f "$TEMP_FILE"
            exit 1
        fi

        # Replace the current file
        mv "$TEMP_FILE" "$CSV_FILE"
        FILE_SIZE=$(du -h "$CSV_FILE" | cut -f1)
        log "Download complete: $FILE_SIZE, $((LINE_COUNT - 1)) records"
        tg_send "📥 *Download complete*
${FILE_SIZE}, $((LINE_COUNT - 1)) records"
    else
        error "Download failed!"
        tg_send "❌ *Pipeline FAILED* — CSV download error"
        rm -f "$TEMP_FILE"
        exit 1
    fi
else
    if [ ! -f "$CSV_FILE" ]; then
        error "No CSV file found at $CSV_FILE. Run without --quick first."
        exit 1
    fi
    info "Using existing CSV: $CSV_FILE"
fi

# --------------------------------------------------------------------------
# Step 2: Incremental insert — only new permits go into Supabase
# --------------------------------------------------------------------------
banner "STEP 2: INSERT NEW PERMITS INTO SUPABASE"

info "Running incremental update..."
if python3 "$SCRIPTS_DIR/incremental_update.py" 2>&1 | tee -a "$LOG_FILE"; then
    log "Incremental insert complete"
else
    error "Incremental insert failed!"
    tg_send "❌ *Pipeline FAILED* — incremental insert error"
    exit 1
fi

# --------------------------------------------------------------------------
# Step 3: Cluster unclustered permits via nearest centroid
# --------------------------------------------------------------------------
banner "STEP 3: CLUSTER NEW PERMITS"

info "Assigning clusters to unclustered permits..."
if python3 "$SCRIPTS_DIR/cluster_new_permits.py" 2>&1 | tee -a "$LOG_FILE"; then
    log "Clustering complete"
else
    error "Clustering failed!"
    tg_send "❌ *Pipeline FAILED* — clustering error"
    exit 1
fi

# --------------------------------------------------------------------------
# Summary
# --------------------------------------------------------------------------
banner "UPDATE COMPLETE"

log "Pipeline finished at $(date)"
log "Log saved to: $LOG_FILE"

# Send completion summary via Telegram
SUMMARY=$(grep -c "new permits" "$LOG_FILE" 2>/dev/null && grep "new permits\|Done in\|Total permits\|nothing to do\|No new permits" "$LOG_FILE" | tail -3 | tr '\n' ' ' || echo "completed")
tg_send "✅ *Undervolt Pipeline Complete*
$(date '+%b %d, %I:%M %p')
${SUMMARY}"

# Clean up old logs (keep last 30 days)
find "$LOG_DIR" -name "pipeline_*.log" -type f -mtime +30 -delete 2>/dev/null || true

exit 0
