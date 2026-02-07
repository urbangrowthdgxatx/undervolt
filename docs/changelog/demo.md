# Undervolt Demo Guide

## Quick Demo (No Install Required)

The dashboard data is served from Supabase cloud Postgres. If the Jetson frontend is running, just open the URL:

### 1. Access the Dashboard

```bash
# Local (on Jetson)
open http://localhost:3000/dashboard

# Network (same LAN)
open http://192.168.4.124:3000/dashboard

# Remote (via Tailscale)
open http://100.87.236.76:3000/dashboard
```

### 2. Verify APIs

```bash
# Check stats (Supabase RPC)
curl -s http://localhost:3000/api/stats | python3 -m json.tool | head -10

# Check permits
curl -s "http://localhost:3000/api/permits?zip=78704&limit=3" | python3 -m json.tool | head -20

# Check GeoJSON
curl -s http://localhost:3000/api/geojson | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Features: {len(d[\"features\"])}')"

# Check trends
curl -s http://localhost:3000/api/trends | python3 -m json.tool | head -20
```

### 3. View Cluster Visualizations

```bash
# On Linux
xdg-open output/visualizations/cluster_2d_projection.png
xdg-open output/visualizations/cluster_characteristics.png
xdg-open output/visualizations/cluster_sizes.png
xdg-open output/visualizations/geographic_clusters.png

# Or view the text summary
cat output/visualizations/cluster_summary.txt
```

---

## Full Demo (With Node.js)

### Start the Dashboard

```bash
cd frontend

# Use Node 20
nvm use 20

# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Open browser -> http://localhost:3000/dashboard
```

### Environment Requirements

The frontend requires `frontend/.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=https://arpoymzcflsqcaqixhie.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<configured>
NEXT_PUBLIC_MAPBOX_TOKEN=<configured>
```

---

## Demo Features

### 1. Interactive Map Dashboard (`/dashboard`)

**What to show:**
- 840+ ZIP codes with permit data
- 50K permit points on the map (from Supabase)
- Click clusters to filter
- Search by ZIP code
- Real-time statistics in sidebar
- Color-coded by dominant cluster type

**Key highlights:**
- 2.3M permits in Supabase, 50K visualized on map
- 8 named clusters
- Geographic patterns visible
- Fast, responsive

### 2. Story Builder (`/` - existing feature)

**What to show:**
- Chat interface for natural language queries
- AI-powered insights (analytics engine or local LLM)
- Story block generation
- Theme synthesis

### 3. Time Series Charts

**What to show:**
- Monthly permit volume (60 months from trends table)
- Cluster growth rates
- **Demolition: +547% CAGR**
- Seasonal patterns

### 4. Energy Infrastructure Tracking

**What to show:**
- 115,523 energy permits identified
- Solar: 25,982 permits
- HVAC: 71,331 permits
- Generators: 7,248 (+246% post-freeze)
- Top ZIPs for each type

---

## Demo Script (10 Minutes)

### Intro (1 min)
"Austin is exploding with growth. But where? How? Who benefits from the energy transition?"

### The Data (1 min)
"We analyzed **2.3 million construction permits** using GPU-accelerated machine learning and LLM categorization."

**Show**: Dashboard loads stats from Supabase in <1 second

### The Insights (2 min)
"The data reveals explosive growth patterns:"

**Highlights**:
- Demolition: +547% CAGR
- 86% of permits categorized by project type, building type, trade
- 840 ZIP codes covered

### Energy Infrastructure (2 min)
"We tracked 115K energy permits to map the transition:"

**Highlights**:
- 25,982 solar installations
- Only 1,161 batteries (1:22 ratio vs solar)
- 7,248 generators (+246% after 2021 freeze)
- Post-freeze resilience gap between wealthy and lower-income districts

### Interactive Dashboard (2 min)
"Explore it all interactively:"

**Show**: Live dashboard
- Filter by energy type (solar, generator)
- Filter by cluster
- ZIP code deep dive (78704, 78758)
- Map with 50K points

### Story Builder (2 min)
"Ask it anything about Austin permits:"

- "What's growing fastest?"
- "Show me energy data"
- "Tell me about ZIP 78704"

### Technical (1 min)
"Built on the full NVIDIA stack:"

- Jetson AGX Orin for GPU clustering + local LLM
- Supabase Postgres serving 2.3M permits via PostgREST
- Single RPC call returns full dashboard stats
- 86% categorization with hybrid rule+LLM approach

---

## Key Talking Points

### Innovation
- **2.3M permits** fully loaded in Supabase cloud Postgres
- **Single RPC call** replaces 5+ separate database queries
- **Auto-cluster naming** from content analysis
- **Energy capacity extraction** via regex kW parsing
- **LLM categorization** of project type, building type, trade, scale

### Impact
- **547% CAGR** demolition growth identified
- **78758** discovered as top permit ZIP (100K+ permits)
- **1:22** battery-to-solar ratio (storage bottleneck)
- **+246%** generator permits post-2021 freeze
- **840 ZIPs** mapped with full breakdown

### Tech
- **Python**: pandas, scikit-learn, RAPIDS/cuDF
- **Frontend**: Next.js 16, TypeScript, Mapbox GL
- **Database**: Supabase Postgres + PostgREST
- **ML**: K-Means, PCA, LLM categorization
- **APIs**: 5 Supabase-backed REST endpoints + RPC

---

## Questions to Anticipate

**Q: Why Supabase instead of local SQLite?**
A: The SQLite file was 700MB and tied to the Jetson. Supabase gives us cloud-hosted Postgres with PostgREST, row-level security, and the ability to serve data without the Jetson being online. A single RPC function replaces 5+ queries.

**Q: How accurate is the clustering?**
A: 8 clusters with clear separation. Auto-naming validates semantic coherence.

**Q: Can this scale to other cities?**
A: Yes! Modular design. Just point to new Socrata API endpoint.

**Q: How fast is the frontend?**
A: Dashboard stats load in ~200ms from Supabase RPC. Map renders 50K points. Cached after first load.

**Q: What about privacy?**
A: All data is public (Austin Open Data). LLM inference runs locally on Jetson. Database is cloud-hosted but read-only via anon key with RLS.

---

## Backup Demo (No Frontend)

If you can't run the frontend, show:

1. **Terminal output** - curl the API endpoints directly
2. **PNG visualizations** - Open cluster visualizations in image viewer
3. **Supabase Dashboard** - Show the tables directly in browser
4. **Code walkthrough** - Show architecture in VS Code
5. **Documentation** - Open PRESENTATION.md

The **data insights** are the star, not just the UI.

---

## Closing

"We took 2.3 million construction permits, ran GPU-accelerated clustering and LLM categorization, loaded everything into Supabase Postgres, and built an interactive dashboard that lets you explore Austin's urban growth story."

Ready to win.
