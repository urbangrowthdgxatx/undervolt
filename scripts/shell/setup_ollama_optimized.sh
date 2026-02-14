#!/bin/bash
# Setup Ollama for optimized LLM inference on Jetson AGX Orin
# Run with: sudo bash scripts/shell/setup_ollama_optimized.sh [model_name]
#
# Defaults to VLLM_MODEL_NAME env var, then nemotron-3-nano

set -e

MODEL="${1:-${VLLM_MODEL_NAME:-nemotron-3-nano}}"

echo "================================"
echo "Ollama Optimization Setup"
echo "Model: ${MODEL}"
echo "================================"
echo ""

# Step 1: Configure Ollama service
echo "Step 1: Configuring Ollama service..."
mkdir -p /etc/systemd/system/ollama.service.d

cat > /etc/systemd/system/ollama.service.d/override.conf << 'EOF'
[Service]
Environment="OLLAMA_KEEP_ALIVE=24h"
Environment="OLLAMA_NUM_PARALLEL=2"
Environment="OLLAMA_MAX_LOADED_MODELS=1"
EOF

echo "Created /etc/systemd/system/ollama.service.d/override.conf"

# Step 2: Reload and restart Ollama
echo ""
echo "Step 2: Restarting Ollama service..."
systemctl daemon-reload
systemctl restart ollama
sleep 2

# Step 3: Enable MAXN power mode
echo ""
echo "Step 3: Enabling MAXN power mode..."
nvpmodel -m 0 2>/dev/null || echo "Warning: Could not set power mode"
jetson_clocks 2>/dev/null || echo "Warning: Could not set clocks"

# Step 4: Warmup the model
echo ""
echo "Step 4: Warming up model: ${MODEL}..."
curl -s http://localhost:11434/api/generate \
  -d "{\"model\":\"${MODEL}\",\"prompt\":\"warmup\",\"keep_alive\":\"24h\",\"options\":{\"num_predict\":1}}" \
  > /dev/null 2>&1

echo ""
echo "================================"
echo "Setup complete!"
echo "================================"
echo ""
echo "Run benchmark to verify:"
echo "  curl -s http://localhost:11434/api/generate -d '{\"model\":\"${MODEL}\",\"prompt\":\"Hello\",\"stream\":false,\"keep_alive\":\"30m\",\"options\":{\"num_predict\":20}}' | python3 -c \"import sys,json; d=json.load(sys.stdin); print(f'{d[\\\"eval_count\\\"]} tokens at {d[\\\"eval_count\\\"]/(d[\\\"eval_duration\\\"]/1e9):.1f} tok/s')\""
echo ""
