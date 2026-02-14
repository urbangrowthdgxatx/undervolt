#!/bin/bash
# UnderVolt System & Database Monitor
# For Jetson AGX Orin platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DB_PATH="$PROJECT_DIR/data/undervolt.db"

# Default mode
MODE="all"
WATCH_MODE=false
WATCH_INTERVAL=10

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --db|--database)
            MODE="db"
            shift
            ;;
        --sys|--system)
            MODE="system"
            shift
            ;;
        --gpu)
            MODE="gpu"
            shift
            ;;
        --services)
            MODE="services"
            shift
            ;;
        --watch|-w)
            WATCH_MODE=true
            shift
            ;;
        --interval|-i)
            WATCH_INTERVAL="$2"
            shift 2
            ;;
        --help|-h)
            echo "UnderVolt Monitor - System & Database monitoring for Jetson"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --db, --database    Show database stats only"
            echo "  --sys, --system     Show system resources only"
            echo "  --gpu               Show GPU/Jetson stats only"
            echo "  --services          Show service status only"
            echo "  --watch, -w         Continuous monitoring mode"
            echo "  --interval, -i N    Watch interval in seconds (default: 10)"
            echo "  --help, -h          Show this help"
            echo ""
            echo "Examples:"
            echo "  $0                  # Show all stats once"
            echo "  $0 --db             # Database stats only"
            echo "  $0 --watch -i 5     # Watch mode, update every 5 seconds"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_header() {
    local title="$1"
    echo ""
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  $title${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
}

print_section() {
    local title="$1"
    echo -e "\n${BOLD}${BLUE}▸ $title${NC}"
}

# System resource monitoring
show_system() {
    print_header "SYSTEM RESOURCES - $(date '+%Y-%m-%d %H:%M:%S')"

    # CPU
    print_section "CPU Usage"
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 2>/dev/null || echo "N/A")
    local load_avg=$(cat /proc/loadavg | awk '{print $1, $2, $3}')
    local cpu_cores=$(nproc)
    echo "  Load Average:    $load_avg"
    echo "  CPU Cores:       $cpu_cores"

    # Memory
    print_section "Memory"
    free -h | awk '
        NR==1 {printf "  %-12s %10s %10s %10s\n", "", $1, $2, $3}
        NR==2 {printf "  %-12s %10s %10s %10s\n", "RAM:", $2, $3, $4}
        NR==3 {printf "  %-12s %10s %10s %10s\n", "Swap:", $2, $3, $4}
    '

    # Disk
    print_section "Disk Usage"
    df -h "$PROJECT_DIR" 2>/dev/null | awk '
        NR==1 {printf "  %-30s %8s %8s %8s %6s\n", "Filesystem", "Size", "Used", "Avail", "Use%"}
        NR==2 {printf "  %-30s %8s %8s %8s %6s\n", $1, $2, $3, $4, $5}
    '

    # Temperature (Jetson specific)
    print_section "Temperature"
    if [ -d /sys/devices/virtual/thermal ]; then
        for zone in /sys/devices/virtual/thermal/thermal_zone*/temp; do
            if [ -f "$zone" ]; then
                local zone_name=$(dirname "$zone" | xargs basename)
                local temp=$(cat "$zone" 2>/dev/null | awk '{printf "%.1f", $1/1000}')
                local zone_type=$(cat "$(dirname "$zone")/type" 2>/dev/null || echo "unknown")
                echo "  $zone_type: ${temp}°C"
            fi
        done | head -6
    else
        echo "  Temperature sensors not available"
    fi
}

# GPU/Jetson monitoring
show_gpu() {
    print_header "GPU / JETSON STATUS"

    # Check if running on Jetson
    if command -v tegrastats &> /dev/null; then
        print_section "Jetson Tegrastats (2 second sample)"
        timeout 2 tegrastats 2>/dev/null | tail -1 || echo "  tegrastats not responding"
    fi

    # NVIDIA GPU info
    if command -v nvidia-smi &> /dev/null; then
        print_section "NVIDIA GPU"
        nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv,noheader,nounits 2>/dev/null | \
            awk -F', ' '{printf "  GPU: %s\n  Memory: %s MB / %s MB\n  Utilization: %s%%\n  Temperature: %s°C\n", $1, $2, $3, $4, $5}' || \
            echo "  nvidia-smi not available or no GPU detected"
    fi

    # NVP Model (Jetson power mode)
    if command -v nvpmodel &> /dev/null; then
        print_section "Power Mode"
        sudo nvpmodel -q 2>/dev/null | grep -E "^NV|^MAXN" || echo "  nvpmodel not available"
    fi

    # CUDA info
    print_section "CUDA"
    if command -v nvcc &> /dev/null; then
        nvcc --version 2>/dev/null | grep "release" || echo "  CUDA not available"
    else
        echo "  nvcc not found"
    fi
}

# Database monitoring
show_database() {
    print_header "DATABASE STATUS"

    if [ ! -f "$DB_PATH" ]; then
        echo -e "  ${RED}Database not found at: $DB_PATH${NC}"
        return
    fi

    # File sizes
    print_section "Database Files"
    local db_size=$(du -h "$DB_PATH" 2>/dev/null | cut -f1)
    echo "  Main DB:         $db_size  ($DB_PATH)"

    if [ -f "$DB_PATH-wal" ]; then
        local wal_size=$(du -h "$DB_PATH-wal" 2>/dev/null | cut -f1)
        echo "  WAL file:        $wal_size"
    fi

    if [ -f "$DB_PATH-shm" ]; then
        local shm_size=$(du -h "$DB_PATH-shm" 2>/dev/null | cut -f1)
        echo "  SHM file:        $shm_size"
    fi

    # Table counts using sqlite3 or Node.js fallback
    if command -v sqlite3 &> /dev/null; then
        print_section "Table Record Counts"

        local tables=("permits" "clusters" "cluster_keywords" "energy_stats_by_zip" "trends" "cache_metadata")
        for table in "${tables[@]}"; do
            local count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
            printf "  %-22s %12s records\n" "$table" "$(echo $count | sed ':a;s/\B[0-9]\{3\}\>/.&/;ta')"
        done

        # Energy breakdown
        print_section "Energy Permits by Type"
        sqlite3 -separator '|' "$DB_PATH" "
            SELECT energy_type, COUNT(*) as count
            FROM permits
            WHERE is_energy_permit = 1 AND energy_type IS NOT NULL
            GROUP BY energy_type
            ORDER BY count DESC;
        " 2>/dev/null | while IFS='|' read -r type count; do
            printf "  %-22s %12s\n" "$type" "$(echo $count | sed ':a;s/\B[0-9]\{3\}\>/.&/;ta')"
        done

        # Recent years
        print_section "Permits by Year (recent)"
        sqlite3 -separator '|' "$DB_PATH" "
            SELECT substr(issue_date, 1, 4) as year, COUNT(*) as count
            FROM permits
            WHERE issue_date IS NOT NULL
            GROUP BY year
            ORDER BY year DESC
            LIMIT 5;
        " 2>/dev/null | while IFS='|' read -r year count; do
            printf "  %-22s %12s\n" "$year" "$(echo $count | sed ':a;s/\B[0-9]\{3\}\>/.&/;ta')"
        done

        # Database integrity
        print_section "Database Health"
        local integrity=$(sqlite3 "$DB_PATH" "PRAGMA integrity_check;" 2>/dev/null)
        if [ "$integrity" = "ok" ]; then
            echo -e "  Integrity:       ${GREEN}OK${NC}"
        else
            echo -e "  Integrity:       ${RED}$integrity${NC}"
        fi

        local wal_mode=$(sqlite3 "$DB_PATH" "PRAGMA journal_mode;" 2>/dev/null)
        echo "  Journal mode:    $wal_mode"

    else
        # Fallback to Node.js monitor script
        print_section "Table Statistics (via Node.js)"
        if [ -f "$PROJECT_DIR/scripts/monitor-db.ts" ] && command -v npx &> /dev/null; then
            cd "$PROJECT_DIR" && npx tsx scripts/monitor-db.ts 2>/dev/null | grep -v "^=" | grep -v "^$" | head -30
        else
            echo -e "  ${YELLOW}sqlite3 not installed - install with: sudo apt install sqlite3${NC}"
            echo "  Or run: npx tsx scripts/monitor-db.ts"
        fi
    fi
}

# Service monitoring
show_services() {
    print_header "SERVICE STATUS"

    # Ollama LLM
    print_section "Ollama LLM"
    if pgrep -x "ollama" > /dev/null; then
        echo -e "  Status:          ${GREEN}Running${NC}"
        local ollama_pid=$(pgrep -x "ollama")
        echo "  PID:             $ollama_pid"

        # Check API
        if curl -s --max-time 2 http://localhost:11434/api/tags > /dev/null 2>&1; then
            echo -e "  API:             ${GREEN}Responding${NC}"
            # List loaded models
            local models=$(curl -s http://localhost:11434/api/tags 2>/dev/null | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | head -3 | tr '\n' ', ' | sed 's/,$//')
            if [ -n "$models" ]; then
                echo "  Models:          $models"
            fi
        else
            echo -e "  API:             ${YELLOW}Not responding${NC}"
        fi
    else
        echo -e "  Status:          ${RED}Not running${NC}"
        echo "  Start with:      ollama serve"
    fi

    # Frontend (Next.js)
    print_section "Frontend (Next.js)"
    if lsof -i :3000 > /dev/null 2>&1; then
        echo -e "  Status:          ${GREEN}Running on port 3000${NC}"
        local frontend_pid=$(lsof -t -i :3000 | head -1)
        echo "  PID:             $frontend_pid"

        # Check if responding
        if curl -s --max-time 2 http://localhost:3000 > /dev/null 2>&1; then
            echo -e "  HTTP:            ${GREEN}Responding${NC}"
        else
            echo -e "  HTTP:            ${YELLOW}Not responding${NC}"
        fi
    else
        echo -e "  Status:          ${RED}Not running${NC}"
        echo "  Start with:      cd frontend && npm run dev"
    fi

    # Docker (if applicable)
    print_section "Docker"
    if command -v docker &> /dev/null; then
        if docker info > /dev/null 2>&1; then
            echo -e "  Status:          ${GREEN}Running${NC}"
            local container_count=$(docker ps -q 2>/dev/null | wc -l)
            echo "  Containers:      $container_count running"
        else
            echo -e "  Status:          ${YELLOW}Installed but not running${NC}"
        fi
    else
        echo "  Status:          Not installed"
    fi
}

# Main display function
show_all() {
    clear
    echo -e "${BOLD}${GREEN}"
    echo "  _   _           _          __     __    _ _   "
    echo " | | | |_ __   __| | ___ _ __\ \   / /__ | | |_ "
    echo " | | | | '_ \ / _\` |/ _ \ '__\\ \ / / _ \| | __|"
    echo " | |_| | | | | (_| |  __/ |   \ V / (_) | | |_ "
    echo "  \___/|_| |_|\__,_|\___|_|    \_/ \___/|_|\__|"
    echo -e "${NC}"
    echo -e "  ${CYAN}System & Database Monitor${NC}"

    show_system
    show_gpu
    show_database
    show_services

    echo ""
    echo -e "${CYAN}───────────────────────────────────────────────────────────────${NC}"
    if $WATCH_MODE; then
        echo -e "  Press ${BOLD}Ctrl+C${NC} to exit | Refreshing every ${WATCH_INTERVAL}s"
    fi
}

# Run based on mode
run_monitor() {
    case $MODE in
        all)
            show_all
            ;;
        db)
            show_database
            ;;
        system)
            show_system
            ;;
        gpu)
            show_gpu
            ;;
        services)
            show_services
            ;;
    esac
}

# Main execution
if $WATCH_MODE; then
    while true; do
        run_monitor
        sleep "$WATCH_INTERVAL"
    done
else
    run_monitor
fi
