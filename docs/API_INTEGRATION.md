# LLM API Integration

## Quick Start

### 1. Start Python FastAPI Backend

```bash
pip install fastapi uvicorn

# Run the LLM API server
python -m uvicorn src.pipeline.api.llm_server:app --host 0.0.0.0 --port 8000 --reload
```

Server will be available at: `http://localhost:8000`

### 2. Use from Frontend

```typescript
// Extract features from the app
const response = await fetch('/api/llm/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    descriptions: [
      "Solar panel installation with battery storage",
      "Commercial HVAC replacement"
    ],
    backend: "ollama",
    model: "neural-chat"
  })
});

const data = await response.json();
console.log(data.features);
```

## API Endpoints

### Health Check
```bash
GET /health

# Response
{
  "status": "healthy",
  "llm_available": true,
  "ollama_running": true
}
```

### Extract Features
```bash
POST /extract

# Request
{
  "descriptions": ["Solar installation with battery"],
  "backend": "ollama",
  "model": "neural-chat"
}

# Response
{
  "features": [
    {
      "is_solar": true,
      "is_battery": true,
      "is_generator": false,
      ...
    }
  ],
  "backend": "ollama",
  "model": "neural-chat",
  "success": true
}
```

### List Available Models
```bash
GET /models

# Response
{
  "backends": {
    "ollama": ["neural-chat", "mistral-7b", "llama2-7b"],
    "vllm": ["meta-llama/Llama-3-8B-Instruct"],
    "vllm-quantized": ["TheBloke/Mistral-7B-Instruct-GPTQ"]
  }
}
```

## Setup Checklist

- [ ] Ollama running: `systemctl status ollama` or `ollama serve`
- [ ] Python backend running: `python -m uvicorn src.pipeline.api.llm_server:app --port 8000`
- [ ] Frontend can call `/api/llm/extract`
- [ ] Environment variable (optional): `PYTHON_API_URL=http://localhost:8000`

## Environment Variables

```bash
# Set Python API URL (default: http://localhost:8000)
export PYTHON_API_URL=http://localhost:8000
```

## Docker (Optional)

```dockerfile
FROM python:3.10
WORKDIR /app
COPY . .
RUN pip install fastapi uvicorn
CMD ["python", "-m", "uvicorn", "src.pipeline.api.llm_server:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Troubleshooting

### "Cannot connect to Python API"
- Ensure Python backend is running: `python -m uvicorn src.pipeline.api.llm_server:app --port 8000`
- Check port is not in use: `lsof -i :8000`

### "Ollama not running"
- Start Ollama: `ollama serve` or `systemctl start ollama`
- Check status: `curl http://localhost:11434/api/tags`

### "Model not found"
- Pull the model: `ollama pull neural-chat`
- List models: `ollama list`

## Performance

- **First request:** 3-5 seconds (model loading)
- **Subsequent requests:** 1-2 seconds per description
- **Batch size:** 10-50 descriptions for best performance

## CORS

The FastAPI backend has CORS enabled for all origins. For production, restrict to:

```python
allow_origins=["http://localhost:3000", "https://yourdomain.com"]
```
