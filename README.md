# Undervolt

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NVIDIA](https://img.shields.io/badge/NVIDIA-DGX%20Spark-76B900?logo=nvidia)](https://nvidia.com)
[![Jetson](https://img.shields.io/badge/NVIDIA-Jetson%20AGX%20Orin-76B900?logo=nvidia)](https://developer.nvidia.com/embedded/jetson-agx-orin)

**1st Place Urban Growth** | NVIDIA DGX Spark Hackathon 2026

## What is Undervolt?

A **GPU-accelerated pipeline** that extracts structured insights from millions of unstructured text records with location data.

**Input:** Any messy dataset — permits, 311 requests, inspections, code violations, incident reports
**Output:** Categorized signals, interactive maps, natural-language queries

Train on DGX. Deploy on Jetson. Run anywhere.

---

## Example: Austin Urban Growth

We built Undervolt at the NVIDIA DGX Spark Hackathon using **2.3 million Austin construction permits**.

**What we found:**
- **26,050 solar** installations vs only **1,172 batteries** (22:1 ratio)
- **7,293 generators** — grid trust is broken after the 2021 freeze
- Wealthy neighborhoods have 12x more backup power than lower-income areas

These signals were buried in unstructured permit text. The pipeline extracted them in seconds.

---

## The Problem (Any City, Any Dataset)

Organizations sit on **millions of records** with valuable signals locked inside:

| Dataset | Hidden Signals |
|---------|----------------|
| **Construction permits** | Energy adoption, growth corridors, infrastructure stress |
| **311 requests** | Service gaps, neighborhood issues, resource allocation |
| **Inspections** | Compliance patterns, risk areas, enforcement gaps |
| **Code violations** | Blight patterns, landlord behavior, gentrification signals |
| **Incident reports** | Safety trends, response patterns, resource needs |

**The challenge:**
- Millions of records
- Unstructured text descriptions
- Inconsistent formats
- Impossible to explore on CPU systems

**Undervolt solves this** with GPU-accelerated NLP, LLM categorization, and on-device inference.

---

## Who Needs This?

| Audience | Use Case |
|----------|----------|
| **City governments** | Turn open data into actionable intelligence |
| **Utilities** | Forecast load and infrastructure needs by neighborhood |
| **Real estate / developers** | Identify growth corridors and infrastructure-ready zones |
| **Researchers** | Analyze urban patterns at scale |
| **Any org with location + text data** | Extract structure from chaos |

---

## Why Not Build Your Own?

You could. But here's what you'd need to figure out:

| Challenge | DIY | Undervolt |
|-----------|-----|-----------|
| **GPU data processing** | Learn RAPIDS/cuDF, handle memory | Already optimized for millions of rows |
| **LLM integration** | Prompt engineering, batching, error handling | Config-driven, works out of the box |
| **Schema design** | Decide what to extract, iterate | YAML config — swap categories in minutes |
| **Edge deployment** | CUDA compatibility, memory constraints | Tested on Jetson AGX Orin |
| **Cross-platform** | Different builds for each target | Same codebase: DGX → Jetson → Mac → Linux |
| **Visualization** | Build maps, charts, dashboards | Interactive frontend included |
| **Natural language queries** | RAG setup, context injection | Ollama + grounded responses ready |

**What took us 48 hours at a hackathon + weeks of iteration:**
- 2.3M records processed and validated
- 8 ML clusters with keyword extraction
- LLM categorization with 86% coverage
- Edge deployment with zero cloud dependency
- Interactive maps and chat interface

**You get all of it. Point at your data and run.**

Queries that once took minutes now run in **milliseconds**, **locally** and **privately**.


## Demo Video
[Link here](https://www.loom.com/share/a473f2934db0409bacf54b767490cd19)

## Meet our Hackathon Team
### Ravinder Jilkapally
**LinkedIn**: https://www.linkedin.com/in/jravinder
**Email**: jravinderreddy@gmail.com
**Role**: GenAI systems lead, pipeline design, GPU optimization, VLLM deployment

### Avanish Joshi
**LinkedIn**: https://www.linkedin.com/in/avanishj
**Email**: avanishjoshi@gmail.com
**Role**: Exploratory data analysis, trend identification, Feature Engineering

### Tyrone Avnit
**LinkedIn**: https://www.linkedin.com/in/tyroneavnit/
**Email**: tyronemichael@gmail.com
**Role**: Rapid prototyping, application UI, end-to-end integration

### Siddharth Gargava
**LinkedIn**: https://www.linkedin.com/in/siddharthgargava/
**Email**: siddharth27gargava@gmail.com
**Role**: LLM driven NLP system, GPU-accelerated feature extraction, ML ready dataset design

## Architecture
```
+-----------------------------------------------------------------------+
|                           UNDERVOLT SYSTEM                            |
+-----------------------------------------------------------------------+
|                                                                       |
|   +---------------------------------------------------------------+   |
|   |                    JETSON AGX ORIN (GPU EXTRACTION)                   |   |
|   |                                                               |   |
|   |   +----------+    +----------+    +----------+    +---------+ |   |
|   |   | Raw Data |--->|   NLP    |--->|   8B     |--->| Struct  | |   |
|   |   |  2.2M    |    | Driven   |    |  Model   |    | Signals | |   |
|   |   | permits  |    | Features |    | Extract  |    |  JSON   | |   |
|   |   +----------+    +----------+    +----------+    +----+----+ |   |
|   |                                                        |      |   |
|   |   cuDF/RAPIDS/cuML ___________________________________/       |   |
|   +-----------------------------------------------+---------------+   |
|                                                   |                   |
|                                                   v                   |
|   +---------------------------------------------------------------+   |
|   |                    SUPABASE POSTGRES                          |   |
|   |                                                               |   |
|   |   permits (2.3M rows)                                         |   |
|   |   +-- permit_number, address, lat, lng, zip_code              |   |
|   |   +-- cluster_id, energy_type, solar_capacity_kw              |   |
|   |   +-- project_type, building_type, scale, trade, is_green     |   |
|   |                                                               |   |
|   |   clusters, cluster_keywords, energy_stats_by_zip, trends     |   |
|   |   get_dashboard_stats() RPC function                          |   |
|   +-----------------------------------------------+---------------+   |
|                                                   |                   |
|                                                   v                   |
|   +---------------------------------------------------------------+   |
|   |                    NEXT.JS FRONTEND (Jetson)                  |   |
|   |                                                               |   |
|   |   +-------------+    +--------------+    +-----------------+  |   |
|   |   | Supabase    |--->| API Routes   |--->|  Story Blocks   |  |   |
|   |   | Client      |    | (PostgREST)  |    |  Maps, Charts   |  |   |
|   |   +-------------+    +--------------+    +-----------------+  |   |
|   +---------------------------------------------------------------+   |
|                                                                       |
+-----------------------------------------------------------------------+
```


## Extraction Pipeline (DGX)

The GPU-accelerated pipeline transforms raw permit text into structured signals:

```
+------------------------------------------------------------------------+
|                        EXTRACTION PIPELINE                             |
|                                                                        |
|  +-------------+                                                       |
|  |   CSV       |  2.2M permits                                        |
|  |  (1.7 GB)   |  Issued_Construction_Permits.csv                     |
|  +------+------+                                                       |
|         |                                                              |
|         v                                                              |
|  +-------------+                                                       |
|  |  Stage 1    |  Load + Clean (cuDF)                                  |
|  |  Clean      |  - Select columns: permit_num, description, lat, lng  |
|  |             |  - Drop nulls, min length filter                      |
|  +------+------+  -> 1.8M rows                                        |
|         |                                                              |
|         v                                                              |
|  +-------------+                                                       |
|  |  Stage 2    |  NLP Keyword Filter                                   |
|  |  Filter     |  - Keywords from YAML config                         |
|  |             |  - "solar", "generator", "battery", "EV", etc.       |
|  +------+------+  -> 150K candidate rows                              |
|         |                                                              |
|         v                                                              |
|  +-------------+                                                       |
|  |  Stage 3    |  LLM Extraction (8B model on vLLM)                   |
|  |  Extract    |  - Batched inference (batch_size=50)                 |
|  |             |  - Structured JSON output via prompt                 |
|  |             |  - {"is_solar": true, "solar_kw": 8.5}              |
|  +------+------+  -> Extracted features                               |
|         |                                                              |
|         v                                                              |
|  +-------------+                                                       |
|  |  Stage 4    |  Validate + Store                                    |
|  |  Save       |  - JSON parse + schema validation                    |
|  |             |  - Write to Supabase Postgres                        |
|  +-------------+  -> Queryable signals                                |
|                                                                        |
+------------------------------------------------------------------------+
```

## Frontend Architecture

The Next.js frontend connects to Supabase Postgres via PostgREST:

```
+------------------------------------------------------------------------+
|                        FRONTEND (Next.js 16)                           |
|                                                                        |
|   User clicks question                                                 |
|         |                                                              |
|         v                                                              |
|   +-------------+                                                      |
|   |  /api/chat  |  Route handler                                       |
|   +------+------+                                                      |
|          |                                                             |
|          v                                                             |
|   +-------------+    +-----------------------------------------+       |
|   | Supabase    |--->| Postgres (2.3M permits)                 |       |
|   | Client      |    | get_dashboard_stats() RPC               |       |
|   +------+------+    | PostgREST queries with filters          |       |
|          |           +-----------------------------------------+       |
|          v                                                             |
|   +-------------+                                                      |
|   |  Ollama     |  Local LLM for narrative generation                  |
|   |  + Context  |  - Nemotron Mini 4B on Jetson GPU                   |
|   |             |  - Formats insight as StoryBlock                     |
|   +------+------+                                                      |
|          |                                                             |
|          v                                                             |
|   +-------------+    +-------------+    +-------------+                |
|   |  StoryBlock |    |  MiniMap    |    |  MiniChart  |                |
|   |   Card      |    |  (Mapbox)   |    |  (Recharts) |                |
|   +-------------+    +-------------+    +-------------+                |
|                                                                        |
+------------------------------------------------------------------------+
```


## The Data

- **Source:** [Austin Open Data - Issued Construction Permits](https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu)
- **Size:** 2.3M+ permits
- **Database:** Supabase Postgres (2,303,817 rows)
- **Coverage:** 63% geocoded, 840+ ZIP codes


## Key Findings

| Signal | Count | Insight |
|--------|-------|---------|
| Solar | 26,050 | Grid-tied, saves money but useless when grid fails |
| EV Chargers | 3,681 | Electrification accelerating |
| Generators | 7,293 | +246% after 2021 freeze -- grid trust is broken |
| Batteries | 1,172 | Only 1 for every 22 solar -- storage is the bottleneck |
| HVAC | 71,506 | Climate adaptation in progress |

**LLM Categorization (86% coverage):**
| Category | Top Values |
|----------|-----------|
| Project Type | new_construction (887K), renovation (438K), repair (390K) |
| Building Type | residential_single (952K), commercial (253K), residential_multi (155K) |
| Trade | general (1.4M), landscaping (349K), electrical (184K), hvac (145K) |

**Post-Freeze Effect (2021):**
- Battery permits: +214%
- Generator permits: +246%

**The Resilience Gap:**
- District 10 (Westlake, wealthy): 2,151 generators
- District 4 (East, lower income): 175 total permits


## Database Schema

```sql
-- Supabase Postgres
permits (2,303,817 rows)
+-- permit_number     TEXT UNIQUE
+-- address           TEXT
+-- zip_code          TEXT NOT NULL
+-- latitude, longitude  REAL
+-- cluster_id        INTEGER -> clusters.id
+-- work_description  TEXT
+-- is_energy_permit  BOOLEAN
+-- energy_type       TEXT (solar, battery, ev_charger, etc.)
+-- solar_capacity_kw REAL
+-- issue_date        TEXT
+-- project_type      TEXT (LLM-categorized)
+-- building_type     TEXT (LLM-categorized)
+-- scale             TEXT (LLM-categorized)
+-- trade             TEXT (LLM-categorized)
+-- is_green          BOOLEAN (LLM-categorized)

-- Supporting tables
clusters (8 rows), cluster_keywords (36 rows)
energy_stats_by_zip (840 rows), trends (570 rows)

-- RPC function
get_dashboard_stats() -> JSONB (single call for full dashboard)
```


## Feature Extraction

Features are defined declaratively via YAML configuration files, making it easy to add new extraction targets without code changes. Each feature group specifies keywords for NLP filtering and structured prompts for LLM extraction, producing validated JSON signals that feed directly into the database.
## Project Structure

```
undervolt/
+-- docs/                    # Documentation
|   +-- architecture/        # System architecture
|   +-- guides/             # Setup guides
|   +-- features/           # Features & findings
|   +-- performance/        # Performance docs
|   +-- changelog/          # Change history
|
+-- src/                    # Python Source
|   +-- pipeline/          # Data processing
|   +-- ml/                # Machine learning
|   +-- utils/             # Shared utilities
|
+-- frontend/              # Next.js Application
|   +-- src/app/           # Pages & API routes
|   +-- src/components/    # React components
|   +-- src/lib/           # Supabase client
|   +-- public/            # Static assets
|
+-- scripts/               # Utilities
|   +-- python/            # Data scripts
|   +-- node/              # Build scripts
|   +-- shell/             # Setup scripts
|
+-- data/                  # Raw Data (not in git)
+-- output/                # Processed Data (not in git)
+-- config/                # Configuration
+-- tests/                 # Tests
+-- examples/              # Example Code
+-- run.py                 # Main Entry Point
```

## Quick Start (Jetson Deployment)

### 1. Start Services

```bash
# Services auto-start on boot, but to start manually:
sudo systemctl start ollama
sudo systemctl start undervolt-frontend

# Check status
systemctl status ollama undervolt-frontend
```

### 2. Access Dashboard

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

### 3. Environment Setup

The frontend requires these environment variables in `frontend/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_MAPBOX_TOKEN=<mapbox token>
```

### 4. Development Setup

```bash
# Frontend development
cd frontend
nvm use 20
npm install
npm run dev

# Run categorization (if needed)
python3 scripts/python/fast_categorize.py
```

## Original Quick Start (DGX/Full Pipeline)

### 1. Download the Data

```bash
bash scripts/shell/download_data.sh
# Or: python scripts/python/download_data.py
```

### 2. Run the Unified Pipeline

```bash
python run_unified.py              # Full pipeline
python run_unified.py --sample 100000  # Test with sample
python run_unified.py --help       # Show options
```

### 3. Run Frontend

```bash
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Hardware | NVIDIA Jetson AGX Orin 64GB (275 TOPS) |
| Training Hardware | NVIDIA DGX Spark (Grace Blackwell) |
| GPU Processing | CUDA 11.4, RAPIDS cuDF/cuML |
| LLM | NVIDIA Nemotron Mini 4B via Ollama |
| Database | Supabase Postgres (cloud, 2.3M rows) |
| API Layer | Supabase PostgREST + RPC functions |
| Backend | Next.js 16 with Turbopack |
| Frontend | React 19, Leaflet, Recharts |
| Services | systemd (auto-restart on boot) |

### Portable & Adaptable

This pipeline isn't locked to one city or one machine. The same codebase runs across:

| Platform | Architecture | Use Case |
|----------|--------------|----------|
| **NVIDIA DGX Spark** | Grace Blackwell | Train on millions of records |
| **NVIDIA Jetson AGX Orin** | ARM64 / 275 TOPS | Deploy at the edge, zero cloud |
| **Mac** | Apple Silicon / Intel | Develop locally |
| **Linux laptops** | x86_64 | Develop locally |

**Why this matters:**
- **Train big, deploy small** — Process millions of records on DGX, serve insights on a $2K edge device
- **Ollama as abstraction** — Same LLM interface across all platforms
- **Swap the data, keep the pipeline** — Point at any city's open data and rerun

**Schema-agnostic extraction:**

The pipeline doesn't assume permits. Define your extraction targets in config:

```yaml
# config/extraction.yaml
dataset: "311_requests"
text_field: "description"
location_fields: ["latitude", "longitude"]

categories:
  - name: "pothole"
    keywords: ["pothole", "road damage", "street repair"]
  - name: "graffiti"
    keywords: ["graffiti", "vandalism", "tagging"]
  - name: "noise"
    keywords: ["noise", "loud music", "barking"]
```

The same pipeline handles permits, 311 requests, inspections, code violations—any unstructured text with location data.

### What Changed Since DGX Hackathon

| Component | Hackathon (DGX Spark) | Production (Jetson) |
|-----------|----------------------|---------------------|
| Hardware | DGX Spark (Grace Blackwell) | Jetson AGX Orin 64GB |
| Database | Neon Postgres (cloud) | Supabase Postgres (cloud) |
| LLM | vLLM + 8B model | Ollama + Nemotron Mini 4B |
| Clustering | cuML k-means | cuML k-means (same) |
| Categorization | LLM-only | Rule-based + LLM hybrid |
| Deployment | Manual | systemd services |
| API Routes | Drizzle ORM + SQLite | Supabase PostgREST |
| Cloud Dependency | Required | Zero (edge-native) |


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

## Future: Context Bundles

Pre-compute data-grounded questions from extraction patterns:

```
+------------------------------------------------------------------------+
|                    CONTEXT BUNDLES (PLANNED)                           |
|                                                                        |
|   After each batch extraction:                                         |
|                                                                        |
|   +-------------+    +-------------+    +-------------------------+    |
|   |  Extracted  |--->|  Context    |--->|  Question Generator     |    |
|   |   Signals   |    |   Bundle    |    |  (data-grounded)        |    |
|   |             |    |   Builder   |    |                         |    |
|   +-------------+    +-------------+    +-------------+-----------+    |
|                                                       |                |
|   Current: Foundation model generates questions       v                |
|   from general knowledge                      +-------------+          |
|                                               | Rich, Data- |          |
|   Future: Pre-compute question bundles        |  Grounded   |          |
|   based on actual extracted patterns          |  Questions  |          |
|                                               +-------------+          |
|                                                                        |
|   Examples:                                                            |
|   - "District 10 has 5x more generators than District 4--why?"         |
|   - "Solar-to-battery ratio dropped in 2023--what changed?"            |
|   - "78704 has the highest ADU density--is it zoning?"                 |
|                                                                        |
+------------------------------------------------------------------------+
```

## License

MIT
