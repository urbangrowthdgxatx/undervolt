#!/bin/bash

echo ""
echo "============================================================"
echo "🖥️  SYSTEM USAGE - $(date)"
echo "============================================================"

# CPU info
echo ""
echo "🔲 CPU Usage:"
top -bn1 | head -5 | tail -3

# Memory info
echo ""
echo "💾 Memory Usage:"
free -h | head -2

# Disk usage
echo ""
echo "📀 Disk Usage:"
df -h / | tail -1 | awk '{print "   Root: " $3 " used / " $2 " total (" $5 " used)"}'
df -h /home 2>/dev/null | tail -1 | awk '{print "   Home: " $3 " used / " $2 " total (" $5 " used)"}'

# GPU info (Jetson)
echo ""
echo "🎮 GPU Status (Jetson):"
if command -v tegrastats &> /dev/null; then
    timeout 2 tegrastats --interval 1000 | head -1
else
    echo "   tegrastats not available"
fi

# Ollama status
echo ""
echo "🤖 Ollama Status:"
if pgrep -x "ollama" > /dev/null; then
    echo "   Ollama is running"
    ollama list 2>/dev/null | head -5
else
    echo "   Ollama is not running"
fi

# Check if frontend is running
echo ""
echo "🌐 Frontend Status:"
if lsof -i :3000 > /dev/null 2>&1; then
    echo "   Frontend running on port 3000"
else
    echo "   Frontend not running"
fi

echo ""
echo "============================================================"
echo ""
