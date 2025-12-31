# Quick Start: Local LLM on Jetson

Your frontend is configured to use a local LLM. Here's how to get it running:

## Option 1: Use Analytics-Only Mode (No LLM Required) ⚡

The fastest way to demo right now:

```bash
# The frontend is already set up to use local analytics
# Just update the chat component to use /api/chat-analytics

cd frontend
npm run dev
```

Visit http://localhost:3001 and your chat will work using pre-computed analytics data!

## Option 2: Install Ollama (Recommended for Jetson) 🦙

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a small model optimized for Jetson
ollama pull llama3.2:3b

# Ollama runs automatically on port 11434
# Your .env.local is already configured!
```

Then restart the frontend and chat will use the local model.

## Option 3: Use llama.cpp (Manual Setup)

```bash
# Clone and build
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make -j$(nproc)

# Download model
mkdir -p models
wget -P models https://huggingface.co/QuantFactory/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct.Q4_K_M.gguf

# Start server
./llama-server -m models/Llama-3.2-3B-Instruct.Q4_K_M.gguf --port 8080 -c 2048
```

Update `frontend/.env.local`:
```
VLLM_BASE_URL=http://localhost:8080/v1
VLLM_MODEL_NAME=Llama-3.2-3B-Instruct
```

## Current Setup

Your `.env.local` is already configured for Ollama:
```
VLLM_BASE_URL=http://localhost:11434/v1
VLLM_MODEL_NAME=llama3.2:3b
```

## What's Working Right Now

✅ **Analytics data** - All 8 clusters, energy stats, growth trends
✅ **Analytics-only chat** - Use `/api/chat-analytics` endpoint
✅ **Map dashboard** - http://localhost:3001/dashboard
✅ **Data APIs** - All endpoints functional

## Next Steps

1. **For immediate demo**: Use analytics-only mode (already works!)
2. **For full LLM**: Install Ollama (5 minutes)
3. **For production**: Set up automatic model serving

## Testing

Test analytics-only endpoint:
```bash
curl -X POST http://localhost:3001/api/chat-analytics \
  -H "Content-Type: application/json" \
  -d '{"message": "What is growing fastest in Austin?"}'
```

Should return growth data with stories!
