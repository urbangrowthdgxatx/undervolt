# Undervolt

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NVIDIA](https://img.shields.io/badge/NVIDIA-Jetson%20%7C%20DGX-76B900?logo=nvidia)](https://nvidia.com)

GPU-accelerated pipeline for extracting structured insights from millions of unstructured text records with location data.

**Live Demo:** [undervolt-atx.vercel.app](https://undervolt-atx.vercel.app)

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.10+
- Supabase account (for database)
- Mapbox token (for maps)

### 1. Clone & Install

```bash
git clone https://github.com/urbangrowthdgxatx/undervolt.git
cd undervolt

# Frontend
cd frontend
npm install
cp .env.example .env.local  # Add your keys
```

### 2. Environment Variables

```bash
# frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_MAPBOX_TOKEN=<your-mapbox-token>
```

### 3. Run

```bash
npm run dev
# Open http://localhost:3000
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         UNDERVOLT                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │  Raw Data   │───▶│ GPU Pipeline│───▶│ Structured JSON │  │
│  │  (CSV/API)  │    │ (cuDF/LLM)  │    │   (Supabase)    │  │
│  └─────────────┘    └─────────────┘    └────────┬────────┘  │
│                                                  │          │
│                                                  ▼          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   Next.js Frontend                      ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐  ││
│  │  │  Maps   │  │ Charts  │  │  Chat   │  │  Stories  │  ││
│  │  │(Leaflet)│  │(Recharts│  │ (Ollama)│  │  (LLM)    │  ││
│  │  └─────────┘  └─────────┘  └─────────┘  └───────────┘  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
undervolt/
├── frontend/              # Next.js app
│   ├── src/app/          # Pages & API routes
│   ├── src/components/   # React components
│   └── src/lib/          # Supabase client
│
├── src/pipeline/         # GPU extraction pipeline
│   ├── data/             # Data loading & cleaning
│   ├── nlp/              # LLM categorization
│   └── clustering/       # K-means clustering
│
├── scripts/              # Utilities
│   ├── python/           # Data processing
│   └── shell/            # Setup scripts
│
├── config/               # YAML configuration
└── docs/                 # Documentation
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

## Tech Stack

| Layer | Technology |
|-------|------------|
| GPU Processing | CUDA, RAPIDS cuDF/cuML |
| LLM | Ollama + Nemotron Mini 4B |
| Database | Supabase PostgreSQL |
| Frontend | Next.js 16, React 19 |
| Maps | Leaflet |
| Charts | Recharts |

### Platform Support

| Platform | Use Case |
|----------|----------|
| NVIDIA DGX | Train on millions of records |
| NVIDIA Jetson | Edge deployment, zero cloud |
| Mac/Linux | Local development |

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
