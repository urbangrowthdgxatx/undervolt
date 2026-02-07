#!/bin/bash
# Warmup LLM to eliminate cold start latency
# Run this after boot or after Ollama restart

echo "Warming up LLM model..."

curl -s http://localhost:11434/api/generate \
  -d '{"model":"llama3.2:3b","prompt":"warmup","keep_alive":"24h","options":{"num_predict":1}}' \
  > /dev/null 2>&1

echo "LLM model loaded and ready!"
echo "Model will stay in GPU memory for 24 hours."
