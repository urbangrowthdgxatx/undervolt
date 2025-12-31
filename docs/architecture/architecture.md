# Architecture Documentation

Complete system architecture showing clear separation between data processing, ML pipeline, API layer, and UI.

## Table of Contents
- [System Overview](#system-overview)
- [Layer 1: Data Processing](#layer-1-data-processing)
- [Layer 2: ML Pipeline](#layer-2-ml-pipeline)
- [Layer 3: API Layer](#layer-3-api-layer)
- [Layer 4: UI Layer](#layer-4-ui-layer)
- [Deployment Architecture](#deployment-architecture)

---

## System Overview

Undervolt is built as a **4-layer architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 4: UI LAYER                        │
│                    Next.js Frontend                         │
│        React components, pages, client-side logic           │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/JSON
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   LAYER 3: API LAYER                        │
│               Next.js API Routes + LLM                      │
│       Stats, chat, suggestions, data serving                │
└────────────────────┬────────────────────────────────────────┘
                     │ File I/O
                     │
┌────────────────────▼────────────────────────────────────────┐
│                LAYER 2: ML PIPELINE                         │
│            Python + scikit-learn + pandas                   │
│         Clustering, NLP, feature engineering                │
└────────────────────┬────────────────────────────────────────┘
                     │ CSV processing
                     │
┌────────────────────▼────────────────────────────────────────┐
│              LAYER 1: DATA PROCESSING                       │
│                   Python + pandas                           │
│         Download, clean, normalize, extract                 │
└─────────────────────────────────────────────────────────────┘
```

**Key Principles**:
- **Layer 1** only deals with raw data → cleaned data
- **Layer 2** only deals with ML/NLP → enriched data
- **Layer 3** only serves data via APIs → no processing
- **Layer 4** only renders UI → no data logic

---

## Layer 1: Data Processing

### Purpose
Download, clean, normalize, and validate raw permit data from Austin Open Data.

### Technology Stack
- **Language**: Python 3.8+
- **Libraries**: pandas, requests
- **Input**: Austin Open Data API
- **Output**: Cleaned CSV files

### Directory Structure
```
scripts/
├── download_data.sh          # Bash script to download CSV
├── download_data.py          # Python script to download CSV
└── (future) validate_data.py # Data validation script

data/
├── README.md
├── .gitignore
└── Issued_Construction_Permits_20251212.csv  (1.5GB, not in git)
```

### Data Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  LAYER 1: DATA PROCESSING                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Download                                           │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Austin Open Data API                              │     │
│  │  https://data.austintexas.gov/                     │     │
│  │                                                     │     │
│  │  Download via:                                     │     │
│  │  • scripts/download_data.sh (wget/curl)            │     │
│  │  • scripts/download_data.py (requests library)     │     │
│  └────────────────┬───────────────────────────────────┘     │
│                   │                                         │
│                   ▼                                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  data/Issued_Construction_Permits_20251212.csv     │     │
│  │  • 1.5GB, 2,458,645 rows, 66 columns              │     │
│  │  • Not committed to git                            │     │
│  └────────────────┬───────────────────────────────────┘     │
│                   │                                         │
│                   ▼                                         │
│  Step 2: Validate (future)                                  │
│  ┌────────────────────────────────────────────────────┐     │
│  │  • Check schema (66 expected columns)              │     │
│  │  • Validate data types                             │     │
│  │  • Check for required fields                       │     │
│  │  • Report data quality issues                      │     │
│  └────────────────┬───────────────────────────────────┘     │
│                   │                                         │
│                   ▼                                         │
│  Step 3: Clean                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  • Normalize column names (lowercase, snake_case)  │     │
│  │  • Handle missing values                           │     │
│  │  • Standardize date formats                        │     │
│  │  • Fix geocoding issues                            │     │
│  │  • Deduplicate records                             │     │
│  └────────────────┬───────────────────────────────────┘     │
│                   │                                         │
│                   ▼                                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  output/permits_cleaned.csv (future)               │     │
│  │  Ready for ML pipeline                             │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Files

**Download Scripts**:
- `scripts/download_data.sh` - Bash version using wget/curl
- `scripts/download_data.py` - Python version using requests

**Usage**:
```bash
# Option 1: Bash
bash scripts/download_data.sh

# Option 2: Python
python scripts/download_data.py
```

**Output**: `data/Issued_Construction_Permits_20251212.csv`

### Data Schema (Input)

**66 columns from Austin Open Data**:
```
Permit Type                  Type code (BP, EP, MP, PP, DP)
Permit Type Desc             Human-readable type
Permit Num                   Unique identifier
Description                  Free-text description
Issued Date                  YYYY/MM/DD format
Calendar Year Issued         Integer year
Latitude, Longitude          Geocoded coordinates
Original Zip                 ZIP code
Council District             District 1-10
Work Class                   New, Remodel, Repair, etc.
Total Job Valuation          Dollar amount
Housing Units                Number of units
... (54 more fields)
```

### Future Enhancements

1. **Data Validation Script** (`scripts/validate_data.py`)
   - Schema validation
   - Data quality checks
   - Missing value reports
   - Anomaly detection

2. **Incremental Updates**
   - Track last download date
   - Only fetch new permits
   - Append to existing dataset

3. **Data Versioning**
   - Tag datasets by date
   - Track schema changes
   - Enable rollback

---

## Layer 2: ML Pipeline

### Purpose
Extract features, cluster permits, and generate ML-ready datasets.

### Technology Stack
- **Language**: Python 3.8+
- **Libraries**:
  - pandas - Data manipulation
  - scikit-learn - ML algorithms (TF-IDF, K-Means)
  - numpy - Numerical operations
  - (future) cuDF/RAPIDS - GPU acceleration

### Directory Structure
```
src/
└── undervolt/
    ├── __init__.py
    ├── pipeline.py              # Main pipeline orchestrator
    ├── feature_extraction.py    # NLP feature extraction
    ├── clustering.py            # ML clustering logic
    └── utils.py                 # Shared utilities

config/
├── features/
│   ├── solar.yaml              # Solar feature config
│   ├── battery.yaml            # Battery feature config
│   ├── ev.yaml                 # EV charger feature config
│   └── generator.yaml          # Generator feature config
└── pipeline.yaml               # Pipeline configuration

output/
├── permit_data_enriched.csv          (1.8GB)
├── permit_summary_by_zip.csv         (1.8GB)
├── permit_data_named_clusters.csv    (88MB)
├── energy_permits.csv                (3.2MB)
└── cluster_names.json                (2.7KB)

# Legacy files (to be refactored):
pipeline_cudf.py              # Monolithic pipeline script
run_pipeline.py               # Pipeline runner
```

### ML Pipeline Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   LAYER 2: ML PIPELINE                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Input: data/Issued_Construction_Permits_20251212.csv       │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Stage 1: Load & Prepare                           │     │
│  │  • Read CSV with pandas                            │     │
│  │  • Select relevant columns                         │     │
│  │  • Drop nulls, filter by min length                │     │
│  │  • Create working dataframe                        │     │
│  └────────────────┬───────────────────────────────────┘     │
│                   │ 2,458,645 rows                          │
│                   ▼                                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Stage 2: Feature Extraction (NLP)                 │     │
│  │                                                     │     │
│  │  For each feature config (solar.yaml, etc.):       │     │
│  │  • Load keywords from YAML                         │     │
│  │  • Regex match on description field                │     │
│  │  • Create boolean feature columns                  │     │
│  │                                                     │     │
│  │  Extracts 80 features:                             │     │
│  │  • f_description_kw_solar                          │     │
│  │  • f_description_kw_battery                        │     │
│  │  • f_description_kw_ev                             │     │
│  │  • f_description_kw_generator                      │     │
│  │  • f_description_kw_hvac                           │     │
│  │  • f_description_kw_electrical                     │     │
│  │  • ... (74 more across all text fields)           │     │
│  └────────────────┬───────────────────────────────────┘     │
│                   │ ~60 seconds                             │
│                   ▼                                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Stage 3: ML Clustering                            │     │
│  │                                                     │     │
│  │  TF-IDF Vectorization:                             │     │
│  │  • Convert descriptions to vectors                 │     │
│  │  • Remove stop words                               │     │
│  │  • Weight by term frequency                        │     │
│  │                                                     │     │
│  │  K-Means Clustering:                               │     │
│  │  • Group similar permits                           │     │
│  │  • Assign cluster IDs (0-N)                        │     │
│  │  • Generate cluster names                          │     │
│  │                                                     │     │
│  │  Cluster Naming:                                   │     │
│  │  • Extract top keywords per cluster                │     │
│  │  • Generate human-readable names                   │     │
│  │  • Map cluster ID → name                           │     │
│  └────────────────┬───────────────────────────────────┘     │
│                   │ ~90 seconds                             │
│                   ▼                                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Stage 4: Export                                   │     │
│  │                                                     │     │
│  │  Write output files:                               │     │
│  │  • permit_data_enriched.csv (all features)         │     │
│  │  • permit_summary_by_zip.csv (by ZIP)              │     │
│  │  • permit_data_named_clusters.csv (clustered)      │     │
│  │  • energy_permits.csv (energy subset)              │     │
│  │  • cluster_names.json (metadata)                   │     │
│  └────────────────────────────────────────────────────┘     │
│                   │                                         │
│                   ▼                                         │
│  Output: 3.7GB of enriched data in output/                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Feature Extraction

**YAML-Driven Configuration** (future):
```yaml
# config/features/solar.yaml
feature_group:
  name: "solar"
  enabled: true

features:
  - name: "f_description_kw_solar"
    type: "boolean"
    source_field: "description"
    keywords: ["solar", "pv", "photovoltaic"]
    case_sensitive: false

  - name: "f_description_kw_battery"
    type: "boolean"
    source_field: "description"
    keywords: ["battery", "powerwall", "storage"]
```

**Current Implementation**: Hardcoded regex in `pipeline_cudf.py`

**80 Features Extracted**:
- 20 features from `description` field
- 20 features from `work_class` field
- 20 features from `permit_class` field
- 20 features from `permit_type_desc` field

**Keywords**:
- `solar`, `battery`, `ev`, `generator`
- `hvac`, `electrical`, `plumbing`, `mechanical`
- `residential`, `commercial`, `multi-family`, `single-family`
- `new`, `remodel`, `repair`, `demolition`
- `foundation`, `roof`, `window`, `permit`

### Clustering Algorithm

**TF-IDF Vectorization**:
```python
from sklearn.feature_extraction.text import TfidfVectorizer

vectorizer = TfidfVectorizer(
    max_features=1000,
    stop_words='english',
    ngram_range=(1, 2)
)
vectors = vectorizer.fit_transform(descriptions)
```

**K-Means Clustering**:
```python
from sklearn.cluster import KMeans

kmeans = KMeans(
    n_clusters=10,
    random_state=42,
    n_init=10
)
clusters = kmeans.fit_predict(vectors)
```

**Cluster Naming**:
- Extract top 5 keywords per cluster
- Generate name like "New Residential Construction"
- Save to `cluster_names.json`

### Running the Pipeline

```bash
# Current: Monolithic script
python pipeline_cudf.py

# OR
python run_pipeline.py

# Future: Modular pipeline
python -m src.undervolt.pipeline --config config/pipeline.yaml
```

**Processing Time**: ~3-4 minutes for 2.4M permits

### Output Schema

**permit_data_enriched.csv** (146 columns):
- Original 66 columns from raw data
- 80 NLP feature columns (f_description_kw_*, f_work_class_kw_*, etc.)
- 1 cluster column (f_cluster)

**cluster_names.json**:
```json
{
  "0": {
    "name": "New Residential Construction",
    "keywords": ["new", "residential", "single-family", "construction", "build"]
  },
  "1": {
    "name": "HVAC & Mechanical",
    "keywords": ["hvac", "ac", "heat", "air", "mechanical"]
  }
}
```

### Future Enhancements

1. **GPU Acceleration**
   - Replace pandas with cuDF (RAPIDS)
   - GPU-accelerated TF-IDF
   - Faster K-Means on GPU

2. **Deep Learning Features**
   - Use BERT/LLM embeddings instead of TF-IDF
   - Fine-tune on permit descriptions
   - Better semantic clustering

3. **LLM-Powered Extraction** (planned in README)
   - Use vLLM + 8B model for structured extraction
   - Extract: solar_kw, battery_kwh, ev_charger_type, etc.
   - Structured JSON output per permit

4. **Incremental Processing**
   - Only process new permits
   - Update clusters incrementally
   - Faster daily refreshes

---

## Layer 3: API Layer

### Purpose
Serve processed data and LLM insights via REST APIs.

### Technology Stack
- **Framework**: Next.js 16 API Routes
- **Runtime**: Node.js 20+
- **LLM**: Ollama (Llama 3.2 3B, local GPU)
- **Data Format**: JSON
- **Response**: REST JSON / Server-Sent Events (SSE)

### Directory Structure
```
frontend/src/app/api/
├── stats/
│   └── route.ts              # GET/POST stats aggregation
├── chat/
│   └── route.ts              # POST chat with LLM
├── chat-llm/
│   └── route.ts              # POST direct LLM (fast)
├── chat-analytics/
│   └── route.ts              # POST analytics-enhanced chat
└── story/
    ├── suggest/
    │   └── route.ts          # POST question generation
    └── synthesize/
        └── route.ts          # POST multi-block synthesis

scripts/
└── precompute_stats.js       # Generate .stats-cache.json
```

### API Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 3: API LAYER                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Data Serving APIs                                 │     │
│  │                                                     │     │
│  │  GET /api/stats                                    │     │
│  │  • Read .stats-cache.json (4.2KB)                  │     │
│  │  • Fallback: stream permit_summary_by_zip.csv      │     │
│  │  • Return: aggregated statistics                   │     │
│  │  • Performance: 11-58ms (cached), 60s (uncached)   │     │
│  │                                                     │     │
│  │  POST /api/stats (clear cache)                     │     │
│  │  • Delete memory and disk cache                    │     │
│  │  • Force regeneration on next request              │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  LLM-Powered APIs                                  │     │
│  │                                                     │     │
│  │  POST /api/chat                                    │     │
│  │  • Input: user question                            │     │
│  │  • Call: Ollama LLM (http://localhost:11434)       │     │
│  │  • Output: StoryBlock JSON                         │     │
│  │  • Streaming: Server-Sent Events (SSE)             │     │
│  │  • Performance: 15-41s                             │     │
│  │                                                     │     │
│  │  POST /api/chat-llm                                │     │
│  │  • Direct LLM call (no analytics)                  │     │
│  │  • Performance: ~1.7s (GPU-cached)                 │     │
│  │                                                     │     │
│  │  POST /api/story/suggest                           │     │
│  │  • Input: existing story blocks                    │     │
│  │  • Generate: 20-28 contextual questions            │     │
│  │  • Performance: 5s                                 │     │
│  │                                                     │     │
│  │  POST /api/story/synthesize                        │     │
│  │  • Input: 2+ story blocks                          │     │
│  │  • Output: synthesized insight                     │     │
│  │  • Performance: ~10s                               │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Data Sources                                      │     │
│  │                                                     │     │
│  │  • output/.stats-cache.json (4.2KB)                │     │
│  │  • output/permit_summary_by_zip.csv (1.8GB)        │     │
│  │  • output/cluster_names.json (2.7KB)               │     │
│  │  • Ollama LLM (localhost:11434)                    │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### API Specifications

#### 1. `/api/stats` (GET)

**Purpose**: Return aggregated permit statistics

**Response**:
```json
{
  "totalPermits": 2405158,
  "clusterDistribution": [
    {
      "id": 0,
      "name": "New Residential Construction",
      "count": 2405158,
      "percentage": 100
    }
  ],
  "topZips": [
    { "zip": "78746", "count": 3388 },
    { "zip": "78704", "count": 2847 }
  ],
  "energyStats": {
    "solar": 0,
    "hvac": 42211,
    "electrical": 82657,
    "newConstruction": 130359,
    "remodels": 44081
  },
  "clusterNames": {
    "0": { "name": "New Residential Construction" }
  },
  "lastUpdated": "2025-12-30T17:01:40.435Z"
}
```

**Caching Strategy**:
1. Check memory cache (`global.statsCache`)
2. Check disk cache (`.stats-cache.json`)
3. Stream CSV and compute

**Performance**: 11ms (memory) | 58ms (disk) | 60s (compute)

#### 2. `/api/chat` (POST)

**Purpose**: Answer questions with LLM insights

**Request**:
```json
{
  "message": "Where are generators?",
  "mode": "scout",
  "existingBlocks": []
}
```

**Response** (SSE stream):
```
event: block
data: {"headline":"Resilience is Wealth","insight":"...","confidence":"high"}

event: done
data: {}
```

**Performance**: 15-41 seconds

#### 3. `/api/story/suggest` (POST)

**Purpose**: Generate contextual questions

**Request**:
```json
{
  "blocks": [],
  "mode": "scout"
}
```

**Response**:
```json
{
  "questions": [
    "Where is solar growing?",
    "Which areas have batteries?",
    "Solar-to-storage ratio?"
  ]
}
```

**Performance**: 5 seconds

### Caching System

**Two-Tier Cache**:

1. **Memory Cache** (Node.js `global` object)
   - Survives hot reloads
   - Cleared on server restart
   - Fastest: 11-16ms

2. **Disk Cache** (`.stats-cache.json`)
   - Survives server restarts
   - 4.2KB file
   - Fast: 58ms

**Cache Regeneration**:
```bash
# Clear cache
curl -X POST http://localhost:3000/api/stats

# Regenerate cache file
node scripts/precompute_stats.js
```

### LLM Integration

**Local LLM Setup**:
- **Server**: Ollama (http://localhost:11434)
- **Model**: Llama 3.2 3B
- **Hardware**: Jetson AGX Orin (GPU-accelerated)
- **Keep-alive**: 30 minutes (model stays in GPU memory)

**Environment Variables**:
```bash
VLLM_BASE_URL=http://localhost:11434/v1
VLLM_MODEL_NAME=llama3.2:3b
```

**API Call Example**:
```typescript
const response = await fetch(`${ollamaUrl}/api/generate`, {
  method: 'POST',
  body: JSON.stringify({
    model: 'llama3.2:3b',
    prompt: 'Question here',
    stream: false,
    keep_alive: '30m',
    options: {
      temperature: 0.8,
      num_predict: 400,
      num_ctx: 512
    }
  })
});
```

### Future Enhancements

1. **Database Layer**
   - Replace CSV reads with Postgres queries
   - Use Neon serverless Postgres
   - Add indexes for fast lookups

2. **GraphQL API**
   - Replace REST with GraphQL
   - Flexible querying
   - Reduced over-fetching

3. **Real-Time Updates**
   - WebSocket connections
   - Live permit updates
   - Real-time LLM streaming

4. **API Authentication**
   - Add API keys
   - Rate limiting
   - Usage tracking

---

## Layer 4: UI Layer

### Purpose
Render interactive visualizations and handle user interactions.

### Technology Stack
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS
- **Maps**: Mapbox GL
- **Charts**: Recharts
- **Icons**: Lucide React
- **State**: React Hooks (useState, useEffect)

### Directory Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Intro page (/)
│   │   ├── story/
│   │   │   └── page.tsx             # Story Builder (/story)
│   │   ├── dashboard/
│   │   │   └── page.tsx             # Map & Chat (/dashboard)
│   │   └── api/                     # API routes (Layer 3)
│   │
│   ├── components/
│   │   ├── Navigation.tsx           # Top navigation bar
│   │   ├── FloatingQuestions.tsx    # Floating question bubbles
│   │   ├── StorylineCards.tsx       # Storyline selection cards
│   │   ├── StoryCards.tsx           # Story insight cards
│   │   ├── OnboardingWizard.tsx     # First-time user onboarding
│   │   ├── PermitMap.tsx            # Mapbox map component
│   │   ├── ToolCallsPanel.tsx       # Debug panel for API calls
│   │   └── ...
│   │
│   └── lib/
│       ├── chat-schema.ts           # TypeScript schemas
│       └── modes.ts                 # Mode configurations
│
├── public/
│   └── ...
├── package.json
└── next.config.js
```

### UI Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     LAYER 4: UI LAYER                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Page 1: Intro (/)                                 │     │
│  │                                                     │     │
│  │  • Hardcoded hero stats                            │     │
│  │  • Feature highlights                              │     │
│  │  • Navigation cards to Story/Dashboard            │     │
│  │  • No API calls                                    │     │
│  │  • Fast load: ~40-100ms                            │     │
│  │                                                     │     │
│  │  Components:                                       │     │
│  │  • Static JSX (no components)                      │     │
│  │  • Lucide icons                                    │     │
│  │  • Tailwind styling                                │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Page 2: Story Builder (/story)                   │     │
│  │                                                     │     │
│  │  State Management:                                 │     │
│  │  • activeStoryline (selected storyline)            │     │
│  │  • questions[] (floating questions)                │     │
│  │  • cards[] (story cards)                           │     │
│  │  • isLoading (API call state)                      │     │
│  │                                                     │     │
│  │  User Flow:                                        │     │
│  │  1. OnboardingWizard (first time)                  │     │
│  │  2. StorylineCards (select storyline)              │     │
│  │  3. FloatingQuestions (ask questions)              │     │
│  │  4. StoryCards (view insights)                     │     │
│  │                                                     │     │
│  │  API Calls:                                        │     │
│  │  • POST /api/chat (get insights)                   │     │
│  │  • POST /api/story/suggest (get questions)         │     │
│  │                                                     │     │
│  │  Components:                                       │     │
│  │  • OnboardingWizard                                │     │
│  │  • StorylineCards                                  │     │
│  │  • FloatingQuestions                               │     │
│  │  • StoryCards                                      │     │
│  │  • ToolCallsPanel                                  │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Page 3: Map & Chat (/dashboard)                  │     │
│  │                                                     │     │
│  │  State Management:                                 │     │
│  │  • stats (from /api/stats)                         │     │
│  │  • messages[] (chat history)                       │     │
│  │  • loading (API state)                             │     │
│  │                                                     │     │
│  │  Layout:                                           │     │
│  │  • Left: Mapbox map (full width)                   │     │
│  │  • Right: Chat sidebar                             │     │
│  │  • Top: Search bar                                 │     │
│  │                                                     │     │
│  │  API Calls:                                        │     │
│  │  • GET /api/stats (load statistics)                │     │
│  │  • POST /api/chat (chat messages)                  │     │
│  │                                                     │     │
│  │  Components:                                       │     │
│  │  • PermitMap (Mapbox GL)                           │     │
│  │  • Chat sidebar (messages)                         │     │
│  │  • Stats cards                                     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Shared Components                                 │     │
│  │                                                     │     │
│  │  • Navigation (all pages)                          │     │
│  │  • Loading states                                  │     │
│  │  • Error boundaries                                │     │
│  │  • Icons (Lucide)                                  │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

**Intro Page**:
```
page.tsx
  └── Static JSX (no components)
```

**Story Page**:
```
page.tsx
  ├── OnboardingWizard (conditional)
  ├── StorylineCards (conditional)
  ├── FloatingQuestions (conditional)
  ├── StoryCards (conditional)
  └── ToolCallsPanel
```

**Dashboard Page**:
```
page.tsx
  ├── Navigation
  ├── Search bar
  ├── PermitMap (Mapbox)
  └── Chat sidebar
      ├── Messages
      ├── Input
      └── Stats cards
```

### State Management

**No global state library** - Uses React hooks:

```typescript
// Story page state
const [activeStoryline, setActiveStoryline] = useState<Storyline | null>(null);
const [questions, setQuestions] = useState<string[]>([]);
const [cards, setCards] = useState<StoryCardItem[]>([]);
const [isLoading, setIsLoading] = useState(false);

// Dashboard state
const [stats, setStats] = useState<any>(null);
const [messages, setMessages] = useState<Message[]>([]);
const [loading, setLoading] = useState(false);
```

### Styling System

**Tailwind CSS** - Utility-first:

```tsx
<div className="min-h-screen bg-black text-white story-bg">
  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
    <h3 className="text-white font-semibold mb-2">Title</h3>
    <p className="text-white/50 text-sm">Description</p>
  </div>
</div>
```

**Theme**:
- Background: Pure black (`bg-black`)
- Text: White with opacity (`text-white/40`, `text-white/50`)
- Cards: `bg-white/5` with `border-white/10`
- Accents: Purple, Blue, Amber, Green

### Future Enhancements

1. **Global State Management**
   - Add Zustand or Jotai
   - Persist state across pages
   - Offline support

2. **Progressive Web App (PWA)**
   - Service workers
   - Offline mode
   - Install prompt

3. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support

4. **Performance**
   - Code splitting
   - Lazy loading
   - Image optimization

---

## Deployment Architecture

### Current Setup (Development)

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT ENVIRONMENT                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Layer 1: Data Processing (Python)                 │     │
│  │  • Local scripts                                   │     │
│  │  • Manual execution                                │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Layer 2: ML Pipeline (Python)                     │     │
│  │  • Local scripts                                   │     │
│  │  • Output to local filesystem                      │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Layer 3: API + Layer 4: UI (Next.js)              │     │
│  │  • bun run dev (localhost:3000)                    │     │
│  │  • Reads from local output/ files                  │     │
│  │  • Calls local Ollama (localhost:11434)            │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Local LLM (Ollama)                                │     │
│  │  • localhost:11434                                 │     │
│  │  • Llama 3.2 3B                                    │     │
│  │  • GPU: Jetson AGX Orin                            │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Production Architecture (Planned)

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION ENVIRONMENT                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Layer 1: Data Processing                          │     │
│  │  • Scheduled job (daily/weekly)                    │     │
│  │  • Downloads latest permits from Austin Open Data  │     │
│  │  • Stores in cloud storage (S3)                    │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Layer 2: ML Pipeline                              │     │
│  │  • GPU instance (DGX/NVIDIA Cloud)                 │     │
│  │  • Triggered after data download                   │     │
│  │  • Outputs to Postgres database                    │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Database (Neon Postgres)                          │     │
│  │  • Serverless Postgres                             │     │
│  │  • Stores enriched permit data                     │     │
│  │  • Fast queries with indexes                       │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Layer 3: API (Next.js API Routes)                 │     │
│  │  • Vercel serverless functions                     │     │
│  │  • Queries Postgres                                │     │
│  │  • Calls remote LLM (vLLM on GPU instance)         │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Layer 4: UI (Next.js Frontend)                    │     │
│  │  • Vercel Edge (CDN)                               │     │
│  │  • Static pages cached                             │     │
│  │  • API calls to serverless functions               │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  LLM Service (vLLM)                                │     │
│  │  • GPU instance (DGX Spark / NVIDIA Cloud)         │     │
│  │  • 8B model (better quality than 3B)               │     │
│  │  • API endpoint for Next.js                        │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Responsibilities

| Layer | Development | Production |
|-------|-------------|------------|
| **Layer 1: Data** | Local scripts | Scheduled cloud job (AWS Lambda, GCP Cloud Functions) |
| **Layer 2: ML** | Local Python | GPU instance (DGX, NVIDIA Cloud) |
| **Layer 3: API** | Next.js local | Vercel serverless functions |
| **Layer 4: UI** | Next.js local | Vercel Edge (CDN) |
| **Database** | Local CSV files | Neon Postgres (serverless) |
| **LLM** | Local Ollama | Remote vLLM (GPU instance) |

---

## Summary

### Clear Separation of Concerns

1. **Layer 1 (Data Processing)**: Download → Clean → Validate
   - Input: Austin Open Data API
   - Output: Cleaned CSV files
   - Technology: Python + pandas

2. **Layer 2 (ML Pipeline)**: Extract → Cluster → Enrich
   - Input: Cleaned CSV files
   - Output: Enriched CSV files + JSON metadata
   - Technology: Python + scikit-learn + pandas

3. **Layer 3 (API)**: Serve → Cache → Stream
   - Input: Enriched CSV files + LLM
   - Output: JSON responses
   - Technology: Next.js API Routes + Ollama

4. **Layer 4 (UI)**: Render → Interact → Visualize
   - Input: API responses
   - Output: Interactive web pages
   - Technology: Next.js + React + Tailwind

### Data Flow

```
Austin Open Data
    ↓ (Layer 1: Data Processing)
Cleaned CSV (data/)
    ↓ (Layer 2: ML Pipeline)
Enriched CSV + Clusters (output/)
    ↓ (Layer 3: API Layer)
JSON Responses + LLM Insights
    ↓ (Layer 4: UI Layer)
Interactive Web App
```

### Key Benefits

- **Modularity**: Each layer can be developed/deployed independently
- **Scalability**: Layers can scale independently based on load
- **Maintainability**: Clear boundaries make debugging easier
- **Testability**: Each layer can be tested in isolation
- **Flexibility**: Swap implementations without affecting other layers

---

**Last Updated**: 2025-12-30
