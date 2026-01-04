#!/bin/bash
# UnderVolt Monitor Loop
# Continuous monitoring with configurable intervals for different checks

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITOR_SCRIPT="$SCRIPT_DIR/monitor.sh"
LOG_DIR="$SCRIPT_DIR/../../logs"

# Default intervals (in seconds)
DB_INTERVAL=600       # 10 minutes
SYSTEM_INTERVAL=60    # 1 minute
GPU_INTERVAL=30       # 30 seconds
SERVICES_INTERVAL=120 # 2 minutes

# Logging
LOG_TO_FILE=false
LOG_FILE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --db-interval)
            DB_INTERVAL="$2"
            shift 2
            ;;
        --sys-interval)
            SYSTEM_INTERVAL="$2"
            shift 2
            ;;
        --gpu-interval)
            GPU_INTERVAL="$2"
            shift 2
            ;;
        --log)
            LOG_TO_FILE=true
            mkdir -p "$LOG_DIR"
            LOG_FILE="$LOG_DIR/monitor-$(date '+%Y%m%d-%H%M%S').log"
            shift
            ;;
        --help|-h)
            echo "UnderVolt Monitor Loop - Continuous system monitoring"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --db-interval N     Database check interval in seconds (default: 600)"
            echo "  --sys-interval N    System check interval in seconds (default: 60)"
            echo "  --gpu-interval N    GPU check interval in seconds (default: 30)"
            echo "  --log               Log output to file in logs/ directory"
            echo "  --help, -h          Show this help"
            echo ""
            echo "Examples:"
            echo "  $0                           # Run with defaults"
            echo "  $0 --sys-interval 30 --log  # System check every 30s, log to file"
            echo ""
            echo "Press Ctrl+C to stop monitoring"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Trap Ctrl+C for clean exit
cleanup() {
    echo ""
    echo "Stopping monitor loop..."
    if $LOG_TO_FILE && [ -n "$LOG_FILE" ]; then
        echo "Log saved to: $LOG_FILE"
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM

# Log function
log() {
    local msg="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    if $LOG_TO_FILE; then
        echo "[$timestamp] $msg" | tee -a "$LOG_FILE"
    else
        echo "[$timestamp] $msg"
    fi
}

# Check if monitor.sh exists
if [ ! -f "$MONITOR_SCRIPT" ]; then
    echo "Error: monitor.sh not found at $MONITOR_SCRIPT"
    exit 1
fi

chmod +x "$MONITOR_SCRIPT"

echo "═══════════════════════════════════════════════════════════════"
echo "  UnderVolt Monitor Loop Started"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Intervals:"
echo "    Database:    every ${DB_INTERVAL}s"
echo "    System:      every ${SYSTEM_INTERVAL}s"
echo "    GPU:         every ${GPU_INTERVAL}s"
echo "    Services:    every ${SERVICES_INTERVAL}s"
echo ""
if $LOG_TO_FILE; then
    echo "  Logging to: $LOG_FILE"
    echo ""
fi
echo "  Press Ctrl+C to stop"
echo ""
echo "═══════════════════════════════════════════════════════════════"

# Track last run times
LAST_DB=0
LAST_SYSTEM=0
LAST_GPU=0
LAST_SERVICES=0

# Initial full check
log "Starting initial full system check..."
"$MONITOR_SCRIPT" 2>&1 | if $LOG_TO_FILE; then tee -a "$LOG_FILE"; else cat; fi

# Main loop
while true; do
    NOW=$(date +%s)

    # Database check
    if (( NOW - LAST_DB >= DB_INTERVAL )); then
        log "Running database check..."
        "$MONITOR_SCRIPT" --db 2>&1 | if $LOG_TO_FILE; then tee -a "$LOG_FILE"; else cat; fi
        LAST_DB=$NOW
    fi

    # System check
    if (( NOW - LAST_SYSTEM >= SYSTEM_INTERVAL )); then
        log "Running system check..."
        "$MONITOR_SCRIPT" --sys 2>&1 | if $LOG_TO_FILE; then tee -a "$LOG_FILE"; else cat; fi
        LAST_SYSTEM=$NOW
    fi

    # GPU check
    if (( NOW - LAST_GPU >= GPU_INTERVAL )); then
        log "Running GPU check..."
        "$MONITOR_SCRIPT" --gpu 2>&1 | if $LOG_TO_FILE; then tee -a "$LOG_FILE"; else cat; fi
        LAST_GPU=$NOW
    fi

    # Services check
    if (( NOW - LAST_SERVICES >= SERVICES_INTERVAL )); then
        log "Running services check..."
        "$MONITOR_SCRIPT" --services 2>&1 | if $LOG_TO_FILE; then tee -a "$LOG_FILE"; else cat; fi
        LAST_SERVICES=$NOW
    fi

    # Sleep for a short interval before next check
    sleep 5
done
