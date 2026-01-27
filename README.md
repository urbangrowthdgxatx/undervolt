# Undervolt

Welcome to **UnderVolt** -- Your Urban Growth Intelligence Partner

## Problem Statemement
> **Urban growth is happening faster than cities can understand it.**

Austin is changing. Solar panels, EV chargers, and new construction are spreading rapidly across the city. But inside **2.3 million construction permits**, a more fragile reality is hiding in plain sight.

**There are more generator permits than batteries.**
**For every 7 solar installations, there is only 1 battery.**

Cities are producing clean energy, but they can't store it. **Grid trust is uneven. Resilience is unequal.** And these signals don't show up in dashboards until it's too late.

**Undervolt** turns massive, messy permit data into **real-time Urban Growth Intelligence**, powered end-to-end on **NVIDIA DGX Spark**.

We extract hidden infrastructure signals from unstructured permit text using **GPU-accelerated analytics** and **on-device LLMs**, then transform them into **interactive maps, trends, and natural-language insights**.

**This isn't about hindsight.**
**It's about seeing urban stress and opportunity, as it forms.**

## Who Needs this?

| Audience | What they want |
|----------|---------------|
| **City planners** | Where to invest in grid infrastructure |
| **Datacenter scouts** | Is this area grid-ready? |
| **Solar/battery companies** | Where to sell (gaps in coverage) |
| **Utilities** | Load forecasting by neighborhood |
| **Developers** | Infrastructure-ready zones |


## What Undervolt Does

Cities usually learn where growth happened **after** it happens.

**Undervolt finds the signals before that**: grid stress, solar adoption, battery gaps, redevelopment pressure--already buried inside permit text.

**The challenge is scale:**
- **Millions of records**
- **Unstructured descriptions**
- **Inconsistent formats**
- **Impossible to explore interactively on CPU systems**

So we built a **DGX-native pipeline** that:
- **Cleans and structures 2.2M permits in seconds**
- **Enriches them with GPU-accelerated NLP and clustering**
- **Uses an on-device LLM to make the data conversational**

**The result:**
- **Instant insights from millions of records**
- **Interactive geographic and trend maps**
- **A natural-language assistant that understands urban growth**

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
|   |                    DGX BOX (GPU EXTRACTION)                   |   |
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
|   |  + Context  |  - Llama 3.2:3b on Jetson GPU                       |
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
| Solar | 25,982 | Grid-tied, saves money but useless when grid fails |
| EV Chargers | 3,642 | Electrification accelerating |
| Generators | 7,248 | +246% after 2021 freeze -- trust is broken |
| Batteries | 1,161 | Only 1 for every 22 solar -- storage is the bottleneck |
| HVAC | 71,331 | Climate adaptation in progress |

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


## Feature Extraction (YAML-Driven)

Add new extraction features without code changes:

```yaml
# config/features/solar.yaml
feature_group:
  name: "solar"
  enabled: true

features:
  - name: "is_solar"
    type: "boolean"
  - name: "solar_kw"
    type: "number"
    nullable: true

extraction:
  keywords: ["solar", "PV", "photovoltaic"]
  prompt: |
    Analyze for solar installation.
    Return: {"is_solar": bool, "solar_kw": number|null}
```

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
NEXT_PUBLIC_SUPABASE_URL=https://arpoymzcflsqcaqixhie.supabase.co
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
| Hardware | NVIDIA Jetson AGX Orin (64GB) |
| GPU Processing | CUDA 11.4, RAPIDS cuDF/cuML |
| LLM | Ollama + Llama 3.2:3b (local) |
| Database | Supabase Postgres (cloud, 2.3M rows) |
| API Layer | Supabase PostgREST + RPC functions |
| Backend | Next.js 16 |
| Frontend | React 19, Leaflet, Recharts |
| Services | systemd (auto-restart on boot) |

### What Changed Since DGX Hackathon

| Component | Hackathon (DGX) | Current (Jetson) |
|-----------|-----------------|------------------|
| Hardware | DGX Spark | Jetson AGX Orin 64GB |
| Database | Neon Postgres (cloud) | Supabase Postgres (cloud) |
| LLM | vLLM + 8B model | Ollama + Llama 3.2:3b |
| Clustering | cuML k-means | cuML k-means (same) |
| Categorization | LLM-only | Rule-based + LLM hybrid |
| Deployment | Manual | systemd services |
| API Routes | Drizzle ORM + SQLite | Supabase PostgREST |
| Cost | Cloud DB fees | Supabase free tier |


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
