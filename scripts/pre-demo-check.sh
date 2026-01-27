#!/bin/bash
# Pre-demo checklist for Undervolt Jan 27 Demo
# Run this before the demo to verify everything is working

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TAILSCALE_IP="100.87.236.76"
FRONTEND_PORT=3000
OLLAMA_PORT=11434

echo "============================================"
echo "  Undervolt Pre-Demo Check"
echo "  $(date)"
echo "============================================"
echo ""

PASS=0
FAIL=0

check() {
    local name="$1"
    local cmd="$2"

    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $name"
        ((FAIL++))
    fi
}

warn() {
    local name="$1"
    local value="$2"
    echo -e "${YELLOW}!${NC} $name: $value"
}

echo "=== System ==="
check "Tailscale running" "tailscale status"
check "Tailscale IP reachable" "ping -c 1 -W 2 $TAILSCALE_IP"

echo ""
echo "=== Services ==="
check "Ollama service active" "systemctl is-active ollama"
check "Frontend service active" "systemctl is-active undervolt-frontend"

echo ""
echo "=== Ports ==="
check "Frontend (port $FRONTEND_PORT)" "ss -tln | grep -q :$FRONTEND_PORT"
check "Ollama (port $OLLAMA_PORT)" "ss -tln | grep -q :$OLLAMA_PORT"

echo ""
echo "=== Supabase Connectivity ==="
STATS_RESPONSE=$(curl -sf http://localhost:$FRONTEND_PORT/api/stats 2>/dev/null)
if echo "$STATS_RESPONSE" | grep -q "totalPermits"; then
    TOTAL=$(echo "$STATS_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('totalPermits',0))" 2>/dev/null)
    check "Stats API returns data" "true"
    warn "Total permits from Supabase" "$TOTAL"
else
    check "Stats API returns data" "false"
fi

# Check permits endpoint
check "Permits API responds" "curl -sf 'http://localhost:$FRONTEND_PORT/api/permits?limit=1' | grep -q data"

# Check GeoJSON endpoint
check "GeoJSON API responds" "curl -sf http://localhost:$FRONTEND_PORT/api/geojson | grep -q FeatureCollection"

# Check trends endpoint
check "Trends API responds" "curl -sf http://localhost:$FRONTEND_PORT/api/trends | grep -q monthly"

echo ""
echo "=== Ollama ==="
check "Ollama API responds" "curl -sf http://localhost:$OLLAMA_PORT/api/tags | grep -q models"

echo ""
echo "=== Tailscale Network ==="
if tailscale status 2>/dev/null | grep -q "$TAILSCALE_IP"; then
    echo -e "${GREEN}✓${NC} Tailscale online (this device visible)"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Tailscale offline"
    ((FAIL++))
fi

# Show connected peers
echo ""
echo "=== Tailscale Peers ==="
tailscale status 2>/dev/null | grep -v "^$" | head -5

echo ""
echo "=== Remote Access URLs ==="
echo "  Dashboard: http://$TAILSCALE_IP:$FRONTEND_PORT"
echo "  SSH:       ssh red@$TAILSCALE_IP"

echo ""
echo "============================================"
if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}All $PASS checks passed!${NC} Ready for demo."
else
    echo -e "${RED}$FAIL checks failed${NC}, $PASS passed."
    echo ""
    echo "To fix services:"
    echo "  sudo systemctl restart ollama undervolt-frontend"
fi
echo "============================================"

exit $FAIL
