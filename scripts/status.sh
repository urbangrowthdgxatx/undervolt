#!/bin/bash
# Undervolt System Status
# Run this to check current state of all services

echo "=========================================="
echo " UNDERVOLT SYSTEM STATUS"
echo " Machine: Jetson AGX Orin (R35.4.1)"
echo " $(date)"
echo "=========================================="
echo ""

# System resources
echo "=== SYSTEM RESOURCES ==="
echo "Disk:"
df -h / | tail -1 | awk '{print "  Used: "$3" / "$2" ("$5")"}'
echo "Memory:"
free -h | awk 'NR==2{print "  Used: "$3" / "$2}'
echo ""

# Docker status
echo "=== DOCKER ==="
if systemctl is-active --quiet docker; then
    echo "  Docker: ✓ Running"
else
    echo "  Docker: ✗ Not running"
fi
echo ""

# vLLM status
echo "=== vLLM ==="
if docker images | grep -q "dustynv/vllm"; then
    echo "  Image: ✓ Downloaded"
else
    echo "  Image: ✗ Not downloaded (run: docker pull dustynv/vllm:0.7.4-r36.4.0-cu128-24.04)"
fi

if docker ps | grep -q "vllm-server"; then
    echo "  Server: ✓ Running"
    curl -s http://localhost:8000/v1/models 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print('  Models:', [m['id'] for m in d.get('data',[])])" 2>/dev/null || echo "  API: Not responding"
else
    echo "  Server: ✗ Not running"
fi
echo ""

# Frontend status
echo "=== FRONTEND ==="
if systemctl is-active --quiet undervolt-frontend 2>/dev/null; then
    echo "  Service: ✓ Running (systemd)"
elif lsof -ti:3000 >/dev/null 2>&1; then
    echo "  Server: ✓ Running on port 3000"
else
    echo "  Server: ✗ Not running"
fi

if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "  Web: ✓ Responding at http://localhost:3000"
else
    echo "  Web: ✗ Not responding"
fi
echo ""

# Database status
echo "=== DATABASE ==="
DB_PATH="/home/red/Documents/github/undervolt/data/undervolt.db"
if [ -f "$DB_PATH" ]; then
    PERMIT_COUNT=$(python3 -c "import sqlite3; c=sqlite3.connect('$DB_PATH'); print(c.execute('SELECT count(*) FROM permits').fetchone()[0])" 2>/dev/null)
    echo "  Database: ✓ Found"
    echo "  Permits: $PERMIT_COUNT"
else
    echo "  Database: ✗ Not found"
fi
echo ""

echo "=========================================="
echo " Quick Commands:"
echo "   Start frontend: cd frontend && npm run dev"
echo "   Start vLLM:     docker run -d --gpus all --network host --name vllm-server dustynv/vllm:0.7.4-r36.4.0-cu128-24.04 vllm serve meta-llama/Llama-3.2-3B-Instruct --port 8000"
echo "   Install services: sudo ./scripts/services/install-services.sh"
echo "=========================================="
