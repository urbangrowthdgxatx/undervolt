# Undervolt

<p align="center">
  <img src="assets/logo.png" alt="Undervolt Logo" width="200"/>
</p>

> Energy is the bottleneck to the frontier.

Austin is electrifying. Solar panels, EV chargers, and battery systems are spreading across the city. But buried in 1.2 million construction permits is a different story: generators outnumber batteries 24:1. For every 7 solar installations, only 1 battery. The city is generating clean power but can't store it. Trust in the grid is fractured.

**Undervolt** uses GPU-accelerated LLM extraction to surface hidden infrastructure signals from permit text. The result is a real-time map of Austin's energy transition — where it's thriving, where it's stalling, and where the next investment should go.

---

## Extraction Stats (In Progress)

| Metric | Value |
|--------|-------|
| **Total Permits** | 1,201,208 |
| **Processed** | 218,000+ (18%) |
| **Speed** | 7 permits/sec |
| **Model** | Llama-3.1-8B-Instruct |
| **Infrastructure** | vLLM on DGX (50 concurrent) |

### Features Found (218K sample)

| Signal | Count | Rate |
|--------|-------|------|
| Solar | 4,469 | 2.2% |
| EV Chargers | 2,954 | 1.5% |
| Generator | 1,565 | 0.8% |
| Pool | 2,035 | 1.0% |
| New Build | ~50,000 | ~25% |
| ADU | 65 | 0.03% |
| Battery | 64 | 0.03% |

---

## What Went Wrong (Lessons Learned)

### 1. Ollama is Too Slow
- **Problem:** Started with Ollama at 8 concurrent requests → 0.5 permits/sec
- **Solution:** Switched to vLLM with 50 concurrent → 7 permits/sec (14x faster)

### 2. SSH Connections Are Flaky
- **Problem:** Hostname `gx10-4a58` resolved to different IPs at different times
- **Solution:** Use IP directly with `-o ConnectTimeout=15` flag

### 3. Processes Die Without tmux
- **Problem:** Started extraction with `nohup` - died when SSH disconnected
- **Solution:** Use `tmux` for persistent sessions (`tmux new -s extract`)

### 4. Model Hallucinates Numeric Values
- **Problem:** "replace emergency generator" → model returned `solar_kw=10, sqft=2500`
- **Mitigation:** Boolean flags are reliable, numeric values need validation
- **Recommendation:** Cross-validate numeric extractions with regex on original text

### 5. Batch Saves Are Essential
- **Problem:** First 3 extraction attempts crashed and lost all progress
- **Solution:** Save every 1000 permits to CSV, auto-resume from last batch

### 6. Schema Drift in Early Batches
- **Problem:** First batches had different column order than later ones
- **TODO:** Normalize all CSVs before combining

---

## Extraction Pipeline

```
Raw Data (1.2M permits in Postgres)
    → Fetch batch (1000 permits)
    → Build prompt (15 features)
    → vLLM inference (50 concurrent)
    → Parse JSON → Validate
    → Save CSV batch
    → Repeat until done
```

### Directory Structure

```
undervolt/
├── scripts/
│   ├── extract_vllm.py           # Production extraction (vLLM)
│   ├── extract_parallel.py       # Config-driven Ollama extraction
│   ├── extract.py                # Detailed single-threaded extraction
│   └── gpu_extract.py            # cuDF/RAPIDS version
├── config/
│   ├── pipeline.yaml             # Global settings
│   └── features/energy.yaml      # Feature definitions
├── frontend/                     # Next.js visualization
│   └── src/app/api/              # Chat, story endpoints
├── assets/
│   └── logo.png                  # Undervolt logo
└── output/                       # Extraction results
```

### Running Extraction

```bash
# Set environment variables
export DATABASE_URL="postgresql://..."
export VLLM_URL="http://localhost:8000/v1/chat/completions"

# Run extraction (auto-resumes from last batch)
python scripts/extract_vllm.py
```

---

## Features Extracted

| Feature | Type | Description |
|---------|------|-------------|
| `is_solar` | bool | Solar/PV installation |
| `solar_kw` | num | System size in kW |
| `is_ev` | bool | EV charger |
| `has_battery` | bool | Powerwall/storage |
| `has_generator` | bool | Generator/Generac |
| `gen_kw` | num | Generator size |
| `is_heat_pump` | bool | Heat pump/mini-split |
| `panel_upgrade` | bool | Electrical panel upgrade |
| `amps` | num | Panel amperage |
| `is_adu` | bool | Accessory dwelling unit |
| `is_pool` | bool | Pool/spa |
| `is_new_build` | bool | New construction |
| `is_remodel` | bool | Renovation |
| `sqft` | num | Square footage |
| `prop_type` | str | sf/mf/com |

---

## Frontend

```bash
cd frontend
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

Features:
- **Story Mode:** Guided narrative about Austin's energy transition
- **Explore Mode:** Chat-based queries
- **Map:** Mapbox visualization with signal filtering
- **Charts:** Trend data over time

---

## Tech Stack

- **Extraction:** vLLM + Llama-3.1-8B on DGX
- **Data:** Neon Postgres (1.2M permits)
- **Frontend:** Next.js 16, React 19, Tailwind, Mapbox
- **Output:** CSV batches (auto-resume capable)

---

## License

MIT
