# Undervolt

> Energy is the bottleneck to the frontier.

Austin is electrifying. Solar panels, EV chargers, and battery systems are spreading across the city. But buried in 2.2 million construction permits is a different story: 634 generator permits — more than EV chargers. For every 7 solar installations, only 1 battery. The city is generating clean power but can't store it. Trust in the grid is fractured.

**Undervolt** uses DGX-accelerated LLM extraction to surface hidden infrastructure signals from permit text. The result is a real-time map of Austin's energy transition — where it's thriving, where it's stalling, and where the next investment should go.

This isn't failure. It's transition under constraint.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           UNDERVOLT SYSTEM                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    DGX BOX (GPU EXTRACTION)                     │   │
│   │                                                                 │   │
│   │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐  │   │
│   │   │ Raw Data │───▶│   NLP    │───▶│   8B     │───▶│ Struct  │  │   │
│   │   │  2.2M    │    │ Filter   │    │  Model   │    │ Signals │  │   │
│   │   │ permits  │    │ keywords │    │ Extract  │    │  JSON   │  │   │
│   │   └──────────┘    └──────────┘    └──────────┘    └────┬────┘  │   │
│   │                                                        │       │   │
│   │   cuDF/RAPIDS ─────────────────────────────────────────┘       │   │
│   └───────────────────────────────────────────┬─────────────────────┘   │
│                                               │                         │
│                                               ▼                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      NEON POSTGRES                              │   │
│   │                                                                 │   │
│   │   construction_permits                                          │   │
│   │   ├── permit_num, lat, lng, zip, district, year                 │   │
│   │   └── f_solar, f_ev, f_battery, f_generator, f_adu, f_panel     │   │
│   └───────────────────────────────────────────┬─────────────────────┘   │
│                                               │                         │
│                                               ▼                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      NEXT.JS FRONTEND                           │   │
│   │                                                                 │   │
│   │   ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐   │   │
│   │   │  MCP Server │───▶│   GPT-4o     │───▶│  Story Blocks   │   │   │
│   │   │  (SQL Tool) │    │   + Zod      │    │  Maps, Charts   │   │   │
│   │   └─────────────┘    └──────────────┘    └─────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Extraction Pipeline (DGX)

The GPU-accelerated pipeline transforms raw permit text into structured signals:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        EXTRACTION PIPELINE                             │
│                                                                        │
│  ┌─────────────┐                                                       │
│  │   CSV       │  2.2M permits                                         │
│  │  (1.7 GB)   │  Issued_Construction_Permits.csv                      │
│  └──────┬──────┘                                                       │
│         │                                                              │
│         ▼                                                              │
│  ┌─────────────┐                                                       │
│  │  Stage 1    │  Load + Clean (cuDF)                                  │
│  │  Clean      │  • Select columns: permit_num, description, lat, lng  │
│  │             │  • Drop nulls, min length filter                      │
│  └──────┬──────┘  → 1.8M rows                                          │
│         │                                                              │
│         ▼                                                              │
│  ┌─────────────┐                                                       │
│  │  Stage 2    │  NLP Keyword Filter                                   │
│  │  Filter     │  • Keywords from YAML config                          │
│  │             │  • "solar", "generator", "battery", "EV", etc.        │
│  └──────┬──────┘  → 150K candidate rows                                │
│         │                                                              │
│         ▼                                                              │
│  ┌─────────────┐                                                       │
│  │  Stage 3    │  LLM Extraction (8B model on vLLM)                    │
│  │  Extract    │  • Batched inference (batch_size=50)                  │
│  │             │  • Structured JSON output via prompt                  │
│  │             │  • {"is_solar": true, "solar_kw": 8.5}                │
│  └──────┬──────┘  → Extracted features                                 │
│         │                                                              │
│         ▼                                                              │
│  ┌─────────────┐                                                       │
│  │  Stage 4    │  Validate + Store                                     │
│  │  Save       │  • JSON parse + schema validation                     │
│  │             │  • Write to Neon Postgres                             │
│  └─────────────┘  → Queryable signals                                  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

The Next.js frontend connects to the database via MCP (Model Context Protocol):

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                           │
│                                                                        │
│   User clicks question                                                 │
│         │                                                              │
│         ▼                                                              │
│   ┌─────────────┐                                                      │
│   │  /api/chat  │  Route handler                                       │
│   └──────┬──────┘                                                      │
│          │                                                             │
│          ▼                                                             │
│   ┌─────────────┐    ┌─────────────────────────────────┐              │
│   │  MCP Client │───▶│  @modelcontextprotocol/server   │              │
│   │             │    │  postgres-query tool            │              │
│   └──────┬──────┘    └─────────────────────────────────┘              │
│          │                                                             │
│          ▼                                                             │
│   ┌─────────────┐                                                      │
│   │  GPT-4o     │  generateObject() with Zod schema                   │
│   │  + Context  │  • Writes SQL via MCP                               │
│   │             │  • Formats insight as StoryBlock                    │
│   └──────┬──────┘                                                      │
│          │                                                             │
│          ▼                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│   │  StoryBlock │    │  MiniMap    │    │  MiniChart  │              │
│   │   Card      │    │  (Mapbox)   │    │  (Recharts) │              │
│   └─────────────┘    └─────────────┘    └─────────────┘              │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## The Data

- **Source:** [Austin Open Data - Issued Construction Permits](https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu)
- **Size:** 2.2M+ permits
- **Coverage:** 63% geocoded, 87% have Council District

---

## Key Findings

| Signal | Count | Insight |
|--------|-------|---------|
| Solar | 25,610 | Grid-tied, saves money but useless when grid fails |
| EV Chargers | 119,727 | Electrification is real |
| Generators | 7,116 | +246% after 2021 freeze — trust is broken |
| Batteries | 878 | Only 1 for every 29 solar — storage is the bottleneck |
| ADUs | 2,549 | Density growing in central Austin |

**Post-Freeze Effect (2021):**
- Battery permits: +214%
- Generator permits: +246%

**The Resilience Gap:**
- District 10 (Westlake, wealthy): 2,151 generators
- District 4 (East, lower income): 175 total permits

---

## Database Schema

```sql
construction_permits
├── permit_num        TEXT PRIMARY KEY
├── description       TEXT
├── lat, lng          DOUBLE PRECISION
├── original_zip      TEXT
├── council_district  TEXT
├── calendar_year_issued INTEGER
├── issued_date_dt    DATE
│
│ -- Extracted signals (boolean flags)
├── f_solar           BOOLEAN
├── f_ev              BOOLEAN
├── f_battery         BOOLEAN
├── f_generator       BOOLEAN
├── f_adu             BOOLEAN
└── f_panel           BOOLEAN
```

---

## Feature Config (YAML-Driven)

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

---

## Quick Start

### Frontend

```bash
cd frontend
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Extraction (requires DGX)

```bash
python scripts/extract_parallel.py
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| GPU Processing | cuDF/RAPIDS on DGX |
| LLM Extraction | vLLM + 8B model |
| Database | Neon Postgres (serverless) |
| API | MCP (Model Context Protocol) |
| Frontend | Next.js 16, React 19, Tailwind |
| Maps | Mapbox GL |
| Charts | Recharts |

---

## Future: Context Bundles

Pre-compute data-grounded questions from extraction patterns:

```
┌────────────────────────────────────────────────────────────────────────┐
│                    CONTEXT BUNDLES (PLANNED)                           │
│                                                                        │
│   After each batch extraction:                                         │
│                                                                        │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐   │
│   │  Extracted  │───▶│  Context    │───▶│  Question Generator     │   │
│   │   Signals   │    │   Bundle    │    │  (data-grounded)        │   │
│   │             │    │   Builder   │    │                         │   │
│   └─────────────┘    └─────────────┘    └───────────┬─────────────┘   │
│                                                     │                  │
│   Current: Foundation model generates questions     ▼                  │
│   from general knowledge                      ┌─────────────┐         │
│                                               │ Rich, Data- │         │
│   Future: Pre-compute question bundles        │  Grounded   │         │
│   based on actual extracted patterns          │  Questions  │         │
│                                               └─────────────┘         │
│                                                                        │
│   Examples:                                                            │
│   • "District 10 has 5x more generators than District 4—why?"         │
│   • "Solar-to-battery ratio dropped in 2023—what changed?"            │
│   • "78704 has the highest ADU density—is it zoning?"                 │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
undervolt/
├── config/
│   └── features/           # YAML configs per signal type
│       ├── energy.yaml
│       └── ...
│
├── scripts/
│   ├── extract.py          # Single-threaded extraction
│   ├── extract_parallel.py # Multi-GPU parallel extraction
│   └── gpu_extract.py      # cuDF GPU utilities
│
├── frontend/
│   ├── src/app/            # Next.js app router
│   ├── src/components/     # React components
│   │   ├── cards/          # InsightCard, MapCard, ChartCard
│   │   ├── MiniMap.tsx     # Mapbox integration
│   │   └── MiniChart.tsx   # Recharts integration
│   └── src/lib/            # Shared utilities
│
└── output/                 # Extracted parquet files
```

---

## Who Uses This

| Audience | What they want |
|----------|---------------|
| **City planners** | Where to invest in grid infrastructure |
| **Datacenter scouts** | Is this area grid-ready? |
| **Solar/battery companies** | Where to sell (gaps in coverage) |
| **Utilities** | Load forecasting by neighborhood |
| **Developers** | Infrastructure-ready zones |

---

## License

MIT
