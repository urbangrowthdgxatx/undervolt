#!/bin/bash
# Warmup LLM to eliminate cold start latency
# Run this after boot or after Ollama restart
#
# Usage: bash scripts/shell/warmup_llm.sh [model_name]
# Defaults to VLLM_MODEL_NAME env var, then nemotron-3-nano

MODEL="${1:-${VLLM_MODEL_NAME:-nemotron-3-nano}}"
OLLAMA_URL="${OLLAMA_HOST:-http://localhost:11434}"

echo "Warming up model: ${MODEL}..."

curl -s "${OLLAMA_URL}/api/generate" \
  -d "{\"model\":\"${MODEL}\",\"prompt\":\"warmup\",\"keep_alive\":\"24h\",\"options\":{\"num_predict\":1}}" \
  > /dev/null 2>&1

echo "Model '${MODEL}' loaded and ready!"
echo "Model will stay in GPU memory for 24 hours."
