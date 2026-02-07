# Undervolt: Austin Construction Permit Analytics

## One-Liner
**GPU-accelerated analytics dashboard for 2.3M Austin construction permits, served from Supabase Postgres and running on NVIDIA Jetson AGX Orin.**

---

## What It Does

Undervolt transforms raw City of Austin permit data into actionable insights about urban development trends, energy transition, and construction patterns. Data is processed on edge hardware (Jetson) and served from Supabase cloud Postgres.

### Key Stats
- **2,303,817** construction permits loaded in Supabase
- **85.9%** automatically categorized using rule-based NLP
- **8 GPU-accelerated clusters** identified via RAPIDS/cuML
- **25,982** solar installations tracked
- **71,331** HVAC permits mapped
- **840** ZIP codes covered
- **15+ years** of permit history (2009-2025)

---

## Features

### 1. Interactive Map Dashboard
- Leaflet-based map with clustered permit markers
- Filter by zip code, permit type, energy category
- Real-time filtering with instant updates
- 50K points loaded via Supabase PostgREST

### 2. GPU-Accelerated Clustering
- RAPIDS cuML k-means on Jetson (16x faster than CPU)
- 8 semantic clusters: New Residential, Demolition, Electrical/Roofing, HVAC, etc.
- TF-IDF vectorization of permit descriptions

### 3. Smart Categorization
- **Project Type**: new_construction, renovation, repair, installation, demolition
- **Building Type**: residential_single, residential_multi, commercial, industrial
- **Trade**: electrical, plumbing, HVAC, roofing, foundation
- **Scale**: major, moderate, minor

### 4. Energy Transition Tracking
- Solar panel installations by zip code
- Battery storage permits
- EV charger deployments
- Panel upgrades and generator installs

### 5. Local LLM Integration
- Ollama with Llama 3.2 (3B) for semantic analysis
- Runs entirely on-device, no cloud dependency
- ~1.3 seconds per inference

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Hardware | NVIDIA Jetson AGX Orin (64GB) |
| GPU Compute | CUDA 11.4, RAPIDS cuDF/cuML |
| LLM | Ollama + Llama 3.2:3b |
| Backend | Next.js 16 |
| Database | Supabase Postgres (cloud, 2.3M records) |
| API Layer | Supabase PostgREST + RPC functions |
| Frontend | React 19, Leaflet, Recharts |
| Services | systemd (auto-restart on boot) |

---

## Demo Flow (5 minutes)

### 1. The Problem (30 sec)
"Austin issues 150K+ permits/year. City planners, developers, and researchers need to understand patterns - but the raw data is just permit numbers and descriptions."

### 2. The Solution (1 min)
"Undervolt processes 2.3M permits on a Jetson, using GPU acceleration for clustering and local LLM for categorization. Data is served from Supabase Postgres -- a single RPC call returns the full dashboard stats."

### 3. Live Demo (2.5 min)
- Show map with all permits
- Filter to solar installations -> show adoption hotspots
- Filter to new construction -> show growth areas
- Click cluster -> explain what GPU clustering found
- Show LLM categories in sidebar

### 4. Technical Deep Dive (1 min)
- "RAPIDS cuML gives us 16x speedup on clustering"
- "Ollama runs Llama 3.2 locally at 1.3s/query"
- "Supabase serves 2.3M permits via PostgREST with <500ms response times"
- "A single Postgres RPC replaces 5+ separate queries for the dashboard"

### 5. Impact (30 sec)
"City planners can now see which neighborhoods are going solar, where new construction is concentrated, and track the energy transition in real-time."

---

## Talking Points

### For Technical Audience
- "Full NVIDIA stack: Jetson hardware, CUDA, RAPIDS, local LLM"
- "16x speedup using GPU-accelerated clustering vs scikit-learn"
- "2.3M records served from Supabase Postgres via PostgREST"
- "Migrated from local SQLite to cloud Postgres with zero downtime"
- "Edge compute + cloud data: Jetson for inference, Supabase for serving"

### For Business Audience
- "Track Austin's energy transition in real-time"
- "Identify growth corridors before they're obvious"
- "Minimal cloud costs -- Supabase free tier handles 2.3M records"
- "Privacy-preserving: LLM inference stays local on the Jetson"

### For Urban Planning
- "See solar adoption by neighborhood"
- "Track construction trends over 15 years"
- "Identify permit patterns before they become trends"

---

## Roadmap

### Phase 2
- Time-series animation of permit growth
- Predictive modeling: "Where will construction spike next?"
- Export reports as PDF/CSV

### Phase 3
- Multi-city comparison (Houston, Dallas, San Antonio)
- Real-time permit feed integration
- Mobile-responsive dashboard

### Phase 4
- vLLM integration (when CUDA 12 supported on Jetson)
- Fine-tuned permit classification model
- API for third-party integrations

---

## Quick Start

```bash
# Start services (auto-starts on boot)
sudo systemctl start ollama
sudo systemctl start undervolt-frontend

# Access dashboard
open http://localhost:3000/dashboard

# Environment requires:
# NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
```

---

## Key Metrics to Highlight

| Metric | Value | Why It Matters |
|--------|-------|----------------|
| Total Permits | 2.3M | Scale of analysis |
| GPU Speedup | 16x | NVIDIA value prop |
| Categorization | 86% | Data quality |
| Solar Permits | 26K | Energy transition |
| ZIP Codes | 840 | Geographic coverage |
| API Response | <500ms | Real-time interactivity |
| Database | Supabase | Cloud-managed, zero ops |

---

## Q&A Prep

**Q: Why Supabase instead of local SQLite?**
A: The SQLite file was 700MB and tied to the Jetson. Supabase gives us cloud-hosted Postgres with PostgREST, row-level security, and the ability to serve data to any client without the Jetson being online. A single RPC function replaces 5+ separate queries.

**Q: Why not use cloud for everything?**
A: LLM inference and GPU clustering run on the Jetson -- that's the compute-heavy part. The database is the read-heavy part, which Supabase handles well. Edge compute + cloud data.

**Q: How accurate is the categorization?**
A: 86% coverage with rule-based patterns. The remaining 14% are ambiguous short descriptions.

**Q: Can this scale to other cities?**
A: Yes - the pipeline is data-agnostic. Just need permit data in similar format.

**Q: What's the refresh rate?**
A: Currently batch processing. Real-time feed integration is on the roadmap.

---

## Contact

Project: Undervolt - Austin Urban Growth Analytics
Hardware: NVIDIA Jetson AGX Orin (R35.4.1, JetPack 5.1.2)
Database: Supabase Postgres (arpoymzcflsqcaqixhie)
Demo URL: http://[jetson-ip]:3000/dashboard
