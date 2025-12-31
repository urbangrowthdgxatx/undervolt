#!/bin/bash
#
# Setup Automated Daily Pipeline Updates
#
# This script configures a cron job to run the pipeline update every night
#
# Usage:
#   bash scripts/shell/setup_cron.sh           # Install daily 2am cron
#   bash scripts/shell/setup_cron.sh remove    # Remove cron job
#

PROJECT_ROOT="/home/red/Documents/github/undervolt"
CRON_SCRIPT="$PROJECT_ROOT/scripts/shell/update_pipeline.sh"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [[ "$1" == "remove" ]]; then
    echo -e "${YELLOW}Removing Undervolt pipeline cron job...${NC}"

    # Remove from crontab
    crontab -l 2>/dev/null | grep -v "undervolt/scripts/shell/update_pipeline.sh" | crontab -

    echo -e "${GREEN}✅ Cron job removed${NC}"
    echo ""
    echo "To verify:"
    echo "  crontab -l"
    exit 0
fi

echo "================================================================================"
echo "  SETUP AUTOMATED DAILY PIPELINE UPDATES"
echo "================================================================================"
echo ""
echo "This will configure a cron job to:"
echo "  1. Download latest Austin permits (every night at 2am)"
echo "  2. Run ML pipeline (GPU-accelerated)"
echo "  3. Update database"
echo "  4. Log results to logs/"
echo ""
echo -e "${YELLOW}Schedule: Daily at 2:00 AM${NC}"
echo ""

# Check if cron script exists
if [ ! -f "$CRON_SCRIPT" ]; then
    echo -e "${RED}ERROR: Update script not found: $CRON_SCRIPT${NC}"
    exit 1
fi

# Make sure it's executable
chmod +x "$CRON_SCRIPT"

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Cron job entry
# Run at 2am daily, redirect stdout/stderr to log
CRON_JOB="0 2 * * * cd $PROJECT_ROOT && bash $CRON_SCRIPT >> logs/cron.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "undervolt/scripts/shell/update_pipeline.sh"; then
    echo -e "${YELLOW}Cron job already exists. Updating...${NC}"
    # Remove old entry
    crontab -l 2>/dev/null | grep -v "undervolt/scripts/shell/update_pipeline.sh" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo -e "${GREEN}✅ Cron job installed${NC}"
echo ""
echo "Cron schedule:"
echo "  $CRON_JOB"
echo ""
echo "Verify installation:"
echo "  crontab -l"
echo ""
echo "Manual run (test):"
echo "  bash scripts/shell/update_pipeline.sh"
echo ""
echo "Quick run (skip download):"
echo "  bash scripts/shell/update_pipeline.sh --quick"
echo ""
echo "Check logs:"
echo "  tail -f logs/cron.log"
echo "  ls -lt logs/  # List recent pipeline runs"
echo ""
echo "To remove cron job:"
echo "  bash scripts/shell/setup_cron.sh remove"
echo ""
echo "================================================================================"
