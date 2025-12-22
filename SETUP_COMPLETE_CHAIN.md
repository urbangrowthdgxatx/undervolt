# Complete LLM Setup for Frontend + Backend

## Services to Run

You need **three** services running:

### 1. Ollama (LLM Model Server)
```bash
# Status
systemctl status ollama
# or
ollama list

# Already running ✅
```

### 2. Python FastAPI Backend (Port 8000)
```bash
cd /home/red/Documents/github/undervolt

# Install dependencies
pip install fastapi uvicorn

# Start server
python -m uvicorn src.pipeline.api.llm_server:app --host 0.0.0.0 --port 8000

# Watch output:
# INFO:     Application startup complete
# Uvicorn running on http://0.0.0.0:8000
```

### 3. Next.js Frontend (Port 3000)
```bash
cd /home/red/Documents/github/undervolt/frontend

# Start dev server
npm run dev
# or
bun run dev

# Should show:
# ▲ Next.js 16.0.10
# - Local: http://localhost:3000
```

## Quick Setup (All 3 Services)

```bash
# Terminal 1: Start Ollama (if not running)
ollama serve

# Terminal 2: Start Python API
cd /home/red/Documents/github/undervolt
python -m uvicorn src.pipeline.api.llm_server:app --host 0.0.0.0 --port 8000

# Terminal 3: Start Frontend
cd /home/red/Documents/github/undervolt/frontend
npm run dev  # or: bun run dev
```

## Test the Full Chain

### 1. Test Ollama
```bash
curl http://localhost:11434/api/tags
# Should return list of models with neural-chat
```

### 2. Test Python API
```bash
curl -X POST http://localhost:8000/extract \
  -H "Content-Type: application/json" \
  -d '{"descriptions": ["Solar panel installation with battery"]}'

# Should return extracted features
```

### 3. Test Frontend API
```bash
curl -X POST http://localhost:3000/api/llm/extract \
  -H "Content-Type: application/json" \
  -d '{"descriptions": ["Solar panel installation"]}'

# Should return features (from Python backend or mock)
```

## Architecture

```
Frontend (Next.js, localhost:3000)
    ↓
Frontend API (/api/llm/extract)
    ↓
Python FastAPI Backend (localhost:8000)
    ↓
Ollama LLM Server (localhost:11434)
    ↓
neural-chat Model (7B)
```

## Files Created

1. **`frontend/src/app/api/llm/extract.ts`** (NEW)
   - Next.js API route
   - Proxies to Python backend
   - Falls back to mock if needed

2. **`src/pipeline/api/__init__.py`** (NEW)
   - FastAPI app
   - `/extract` endpoint
   - `/health` endpoint
   - `/models` endpoint

3. **`src/pipeline/api/llm_server.py`** (NEW)
   - Server entry point
   - Run with: `python -m uvicorn src.pipeline.api.llm_server:app --port 8000`

4. **`docs/API_INTEGRATION.md`** (NEW)
   - Complete API documentation
   - Troubleshooting guide

## Common Issues

### "Failed to connect to Python API"
- Make sure Python backend is running on port 8000
- Check: `curl http://localhost:8000/health`

### "Ollama not responding"
- Make sure Ollama is running
- Check: `curl http://localhost:11434/api/tags`

### "Model not found"
- Pull the model: `ollama pull neural-chat`
- Already done ✅

### Frontend not showing results
- Ensure all 3 services are running
- Check browser console for errors
- API endpoint is at `/api/llm/extract`

## What Happens Now

When the user enters a permit description in the app:
1. Frontend sends it to `/api/llm/extract`
2. Next.js API calls Python backend at `http://localhost:8000/extract`
3. Python backend uses Ollama to extract features
4. Features are returned to frontend
5. Frontend displays the results

## Next: Start Services

```bash
# In 3 separate terminals:

# Terminal 1
ollama serve

# Terminal 2
cd /home/red/Documents/github/undervolt && \
python -m uvicorn src.pipeline.api.llm_server:app --port 8000

# Terminal 3
cd /home/red/Documents/github/undervolt/frontend && \
npm run dev
```

Then go to **http://localhost:3000** and try asking about permit descriptions!
