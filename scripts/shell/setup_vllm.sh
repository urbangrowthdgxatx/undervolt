#!/bin/bash
# Setup vLLM on Jetson AGX Orin for GPU-accelerated LLM inference
# Reference: https://www.jetson-ai-lab.com/tutorials/genai-on-jetson-llms-vlms/#-vllm-for-best-performance

set -e

echo "🚀 Setting up vLLM for Jetson AGX Orin"
echo "========================================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

# Check if nvidia-docker is available
if ! docker run --rm --runtime nvidia nvidia/cuda:11.4.0-base-ubuntu20.04 nvidia-smi &> /dev/null; then
    echo "❌ NVIDIA Docker runtime not found. Please install nvidia-docker2."
    exit 1
fi

echo "✅ Docker and NVIDIA runtime detected"

# Pull vLLM container
echo ""
echo "📦 Pulling vLLM container (this may take a while)..."
docker pull ghcr.io/nvidia-ai-iot/vllm:latest-jetson-orin

echo ""
echo "✅ vLLM container ready!"
echo ""
echo "========================================="
echo "Quick Start:"
echo "========================================="
echo ""
echo "1. Start vLLM server:"
echo "   docker run --rm -d --runtime nvidia --network host \\"
echo "     --name vllm-server \\"
echo "     -v ~/.cache/huggingface:/root/.cache/huggingface \\"
echo "     ghcr.io/nvidia-ai-iot/vllm:latest-jetson-orin \\"
echo "     vllm serve meta-llama/Llama-3.2-3B-Instruct --port 11435 --dtype float16"
echo ""
echo "2. Update frontend/.env.local:"
echo "   VLLM_BASE_URL=http://localhost:11435/v1"
echo "   VLLM_MODEL_NAME=meta-llama/Llama-3.2-3B-Instruct"
echo ""
echo "3. Restart frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "For speculative decoding (3x faster), use:"
echo "   --speculative-config '{\"model\": \"RedHatAI/Llama-3.2-3B-speculator.eagle3\", \"draft_model_config\": {\"hf_overrides\": {\"num_hidden_layers\": 1}}}'"
echo ""
echo "Monitor GPU usage:"
echo "   watch -n 0.5 tegrastats"
echo ""
echo "========================================="
