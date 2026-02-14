#!/bin/bash
# Setup local LLM for Jetson
# Uses llama.cpp or ollama for better Jetson compatibility

set -e

echo "================================"
echo "Local LLM Setup for Undervolt"
echo "================================"
echo ""

# Detect platform
if [ -f /etc/nv_tegra_release ]; then
    PLATFORM="jetson"
    echo "✅ Detected: NVIDIA Jetson"
else
    PLATFORM="unknown"
    echo "⚠️  Platform: Unknown (proceeding anyway)"
fi

echo ""
echo "Choose installation method:"
echo "1) Ollama (recommended for Jetson - easiest)"
echo "2) llama.cpp (lightweight, manual setup)"
echo "3) vLLM (requires CUDA, high memory)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "Installing Ollama..."
        echo ""

        # Install Ollama
        curl -fsSL https://ollama.com/install.sh | sh

        echo ""
        echo "✅ Ollama installed!"
        echo ""
        echo "Starting Ollama service..."
        sudo systemctl start ollama

        echo ""
        echo "Pulling Llama 3.2 3B model (optimized for Jetson)..."
        ollama pull llama3.2:3b

        echo ""
        echo "✅ Setup complete!"
        echo ""
        echo "Ollama is running at: http://localhost:11434"
        echo ""
        echo "Add to frontend/.env.local:"
        echo "VLLM_BASE_URL=http://localhost:11434/v1"
        echo "VLLM_MODEL_NAME=llama3.2:3b"
        ;;

    2)
        echo ""
        echo "Installing llama.cpp..."
        echo ""

        # Clone and build llama.cpp
        git clone https://github.com/ggerganov/llama.cpp
        cd llama.cpp
        make -j$(nproc)

        echo ""
        echo "Downloading Llama-3.2-3B GGUF model..."
        mkdir -p models
        cd models
        wget https://huggingface.co/QuantFactory/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct.Q4_K_M.gguf

        cd ..

        echo ""
        echo "✅ llama.cpp installed!"
        echo ""
        echo "To start the server:"
        echo "cd llama.cpp"
        echo "./llama-server -m models/Llama-3.2-3B-Instruct.Q4_K_M.gguf --port 8080 -c 2048"
        echo ""
        echo "Add to frontend/.env.local:"
        echo "VLLM_BASE_URL=http://localhost:8080/v1"
        echo "VLLM_MODEL_NAME=Llama-3.2-3B-Instruct"
        ;;

    3)
        echo ""
        echo "Installing vLLM..."
        echo ""

        # Check CUDA
        if ! command -v nvidia-smi &> /dev/null; then
            echo "❌ Error: nvidia-smi not found. vLLM requires CUDA."
            echo "   For Jetson, use Ollama (option 1) instead."
            exit 1
        fi

        # Install vLLM
        pip3 install vllm

        echo ""
        echo "✅ vLLM installed!"
        echo ""
        echo "To start the server:"
        echo "python3 -m vllm.entrypoints.openai.api_server \\"
        echo "  --model meta-llama/Llama-3.2-3B-Instruct \\"
        echo "  --port 8000 \\"
        echo "  --max-model-len 2048"
        echo ""
        echo "Add to frontend/.env.local:"
        echo "VLLM_BASE_URL=http://localhost:8000/v1"
        echo "VLLM_MODEL_NAME=meta-llama/Llama-3.2-3B-Instruct"
        ;;

    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "================================"
echo "Next Steps:"
echo "================================"
echo ""
echo "1. Start the LLM server (see commands above)"
echo ""
echo "2. Update frontend/.env.local with:"
echo "   VLLM_BASE_URL=<server-url>"
echo "   VLLM_MODEL_NAME=<model-name>"
echo ""
echo "3. Restart the frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Test the chat at http://localhost:3001"
echo ""
