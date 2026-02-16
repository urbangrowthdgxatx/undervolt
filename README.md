# Undervolt

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NVIDIA](https://img.shields.io/badge/NVIDIA-Jetson%20%7C%20DGX-76B900?logo=nvidia)](https://nvidia.com)

Urban infrastructure intelligence — GPU-accelerated analysis of 2.34M Austin construction permits. First place, Urban Growth category at the [NVIDIA DGX Spark Frontier Hackathon](https://www.nvidia.com/en-us/events/dgx-spark-hackathon/).

**Live Demo:** [undervolt-atx.vercel.app](https://undervolt-atx.vercel.app)
**Live Video:** [Loom](https://www.loom.com/share/76e8ca2ec7884a1cb23b3f5a8e69103b)

## Features

- **Interactive map explorer** — Leaflet-powered map with 2.34M geocoded permits, cluster overlays, and zip code heatmaps
- **AI story mode** — Ask questions about Austin's growth and get narrative answers with charts, maps, and AI-generated illustrations
- **Pre-built reports** — Solar/battery adoption ratios, generator surge tracking, pool construction trends, and more
- **Local LLM chat** — Ollama (local) with NVIDIA NIM cloud fallback for zero-downtime AI responses
- **96 pre-cached AI insights** — Instant responses across 12 categories, no LLM call required
- **Waitlist & approval gating** — Admin-controlled access for custom AI queries

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                           UNDERVOLT                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────────┐   │
│  │   Raw Data   │───▶│ GPU Pipeline │───▶│  Structured JSON  │   │
│  │   (CSV/API)  │    │ (cuDF/LLM)   │    │    (Supabase)     │   │
│  └──────────────┘    └──────────────┘    └────────┬──────────┘   │
│                                                    │             │
│                                                    ▼             │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    Next.js Frontend                       │    │
│  │  ┌────────┐  ┌─────────┐  ┌──────────┐  ┌────────────┐   │    │
│  │  │  Maps  │  │ Reports │  │ Stories  │  │    Chat    │   │    │
│  │  │Leaflet │  │Recharts │  │  (LLM)   │  │  (LLM)    │   │    │
│  │  └────────┘  └─────────┘  └──────────┘  └────────────┘   │    │
│  └──────────────────────────────────────────────────────┬────┘    │
│                                                         │        │
│                         LLM Backend                     │        │
│                    ┌────────────────────┐               │        │
│                    │  Ollama (local)    │◀──────────────┘        │
│                    │  localhost:11434   │                         │
│                    └───────┬────────────┘                         │
│                            │ fallback                             │
│                    ┌───────▼────────────┐                         │
│                    │  NVIDIA API Catalog│                         │
│                    │  (cloud, NIM)      │                         │
│                    │  integrate.api.    │                         │
│                    │  nvidia.com/v1     │                         │
│                    └────────────────────┘                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| GPU Processing | CUDA, RAPIDS cuDF/cuML |
| LLM (local) | Ollama + Nemotron 3 Nano |
| LLM (cloud fallback) | NVIDIA API Catalog — Nemotron Nano 8B (`integrate.api.nvidia.com`) |
| Image Generation | Google Gemini 2.0 Flash |
| Database | Supabase PostgreSQL |
| Frontend | Next.js 16, React 19, Turbopack |
| Maps | Leaflet (primary), Mapbox (optional) |
| Charts | Recharts |

> **Note on NVIDIA cloud:** The code uses NVIDIA API Catalog (free developer tier), not NVIDIA AI Enterprise. API key format is `nvapi-...`, endpoint is `integrate.api.nvidia.com/v1`. The codebase calls this "NIM" in function names (`callNIM`), which is the underlying inference runtime — the access layer is the API Catalog.

### Platform Support

| Platform | Use Case |
|----------|----------|
| NVIDIA DGX | Train on millions of records |
| NVIDIA Jetson | Edge deployment, zero cloud |
| Mac/Linux | Local development |

## Project Structure

```
undervolt/
├── frontend/                   # Next.js app
│   ├── src/app/               # 15 page routes + 17 API routes
│   ├── src/components/        # 33 React components
│   ├── src/lib/               # 8 shared utils (supabase, llm-client, auth, etc.)
│   └── public/data/           # Pre-generated JSON (clusters, trends, GeoJSON)
│
├── src/pipeline/              # GPU extraction pipeline
│   ├── config.py              # Base config
│   ├── config_dgx.py          # DGX overrides
│   ├── config_jetson.py       # Jetson overrides
│   ├── config_mac.py          # Mac/Linux overrides
│   ├── data/                  # Data loading & cleaning
│   ├── nlp/                   # LLM categorization & extraction
│   ├── clustering/            # K-means clustering
│   └── api/                   # LLM server
│
├── scripts/
│   ├── python/                # 27 data-processing scripts
│   └── shell/                 # 11 setup & monitoring scripts
│
├── config/                    # YAML configuration
└── docs/                      # Documentation
```

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.10+
- Supabase account (for database)
- Mapbox token (for maps)
- Ollama (for local LLM — run on Jetson, DGX, or any local machine; optional if using NIM cloud only)

### 1. Clone & Install

```bash
git clone https://github.com/urbangrowthdgxatx/undervolt.git
cd undervolt

# Frontend
cd frontend
npm install
```

### 2. Environment Variables

Create `frontend/.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Maps
NEXT_PUBLIC_MAPBOX_TOKEN=<your-mapbox-token>

# LLM — local Ollama (primary)
VLLM_BASE_URL=http://localhost:11434/v1
VLLM_MODEL_NAME=nemotron-3-nano

# LLM — NVIDIA API Catalog cloud fallback (optional)
NVIDIA_NIM_API_KEY=nvapi-...
NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_NIM_MODEL=nvidia/llama-3.1-nemotron-nano-8b-v1

# Image generation (optional)
GOOGLE_AI_KEY=<your-google-ai-key>
```

### 3. Run

```bash
npm run dev
# Open http://localhost:3000
```

## Adapt for Your Data

The pipeline is schema-agnostic. Define extraction targets in YAML:

```yaml
# config/features/your_dataset.yaml
dataset: "311_requests"
text_field: "description"
location_fields: ["latitude", "longitude"]

categories:
  - name: "pothole"
    keywords: ["pothole", "road damage", "street repair"]
  - name: "noise"
    keywords: ["noise complaint", "loud music", "barking"]
```

Works with any unstructured text + location data: permits, 311 requests, inspections, incident reports.

## Run the Pipeline

```bash
# Full pipeline (requires GPU)
python run_unified.py

# Test with sample
python run_unified.py --sample 100000

# Show options
python run_unified.py --help
```

## Jetson Deployment

```bash
# Start services
sudo systemctl start ollama
sudo systemctl start undervolt-frontend

# Check status
systemctl status ollama undervolt-frontend
```

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT
