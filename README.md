# Undervolt

> Energy is the bottleneck to the frontier.

Austin is electrifying. Solar panels, EV chargers, and battery systems are spreading across the city. But buried in 2.2 million construction permits is a different story: 634 generator permits — more than EV chargers. For every 7 solar installations, only 1 battery. The city is generating clean power but can't store it. Trust in the grid is fractured.

**Undervolt** uses DGX-accelerated LLM extraction to surface hidden infrastructure signals from permit text. The result is a real-time map of Austin's energy transition — where it's thriving, where it's stalling, and where the next investment should go.

This isn't failure. It's transition under constraint.

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

## Extraction Pipeline

A config-driven, reusable pipeline. Add a new feature? Just add a YAML config.

```
Raw Data (2.2M permits)
    → Clean (select columns)
    → Build Prompt (from YAML config)
    → LLM Extraction (vLLM on DGX)
    → Parse JSON → Validate
    → Save Parquet
```

### Directory Structure

```
undervolt/
├── config/
│   ├── pipeline.yaml              # Global settings (DB, model, batch size)
│   └── features/                  # One YAML per feature group
│       ├── solar.yaml
│       ├── ev.yaml
│       ├── battery.yaml
│       ├── generator.yaml
│       ├── adu.yaml
│       └── panel_upgrade.yaml
│
├── src/undervolt/
│   ├── config/                    # Config loading + validation
│   ├── data/                      # CSV/Postgres/Parquet loaders
│   ├── extraction/                # LLM pipeline + prompt building
│   └── cli.py                     # Entry point
│
├── frontend/                      # Next.js visualization
└── output/features/               # Parquet output
```

### Feature Config Example

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
  examples:
    - input: "Install 8.5 kW solar PV system"
      output: '{"is_solar": true, "solar_kw": 8.5}'
```

### Adding a New Feature

1. Create `config/features/pool.yaml`
2. Run `python -m undervolt extract`

**No code changes required.**

### CLI Commands

```bash
# Full extraction
python -m undervolt extract

# Test on 100 rows
python -m undervolt extract --limit 100

# Specific features only
python -m undervolt extract --features solar generator

# List configured features
python -m undervolt list
```

---

## Output Schema

```json
{
  "permit_num": "2023-045678",
  "lat": 30.2672,
  "lng": -97.7431,
  "zip": "78704",
  "district": 9,
  "year": 2023,
  "valuation": 28500,
  "contractor": "Tesla Energy",

  "is_solar": true,
  "solar_kw": 8.5,
  "is_ev": false,
  "has_battery": true,
  "has_generator": false,
  "generator_kw": null,
  "is_adu": false,
  "is_panel_upgrade": false
}
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

## Frontend

```bash
cd frontend
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

Features:
- **Story Mode:** Guided 5-stage narrative about Austin's energy transition
- **Explore Mode:** Chat-based queries ("show solar", "district 10", "solar trend")
- **Map:** Mapbox visualization with signal filtering
- **Charts:** Trend data over time

---

## Tech Stack

- **Extraction:** vLLM + Mistral-7B on DGX
- **Data:** Neon Postgres, cuDF/RAPIDS
- **Frontend:** Next.js 16, React 19, Tailwind, Mapbox, Recharts
- **Output:** Parquet (RAPIDS-compatible)

---

## License

MIT
