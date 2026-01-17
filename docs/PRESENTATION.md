# Undervolt: Urban Growth Intelligence
## Jan 27, 2025 Demo Presentation

---

# PAGE 1: THE PROBLEM

## Cities Are Flying Blind

**Austin issues 150,000+ permits per year.** Inside that data: signals about where the city is growing, where the grid is stressed, and where infrastructure is failing.

**But nobody can read it.**

- 2.3 million permit records
- Unstructured text descriptions
- No semantic categorization
- Impossible to query at scale

### The Hidden Story

```
"Install 8.5kW solar array"     → Solar adoption
"New 200A panel upgrade"        → Grid stress signal
"Generator installation"        → Grid trust broken
"Battery storage system"        → Resilience investment
```

**These signals exist. They're just buried.**

---

# PAGE 2: THE SOLUTION

## GPU-Accelerated Urban Intelligence

**Undervolt transforms raw permit data into actionable insights—running entirely on edge hardware.**

### What We Built

| Component | What It Does |
|-----------|--------------|
| **GPU Clustering** | Groups 2.3M permits into 8 semantic clusters |
| **Smart Categorization** | Classifies 86% of permits by type, building, trade |
| **Local LLM** | Llama 3.2 running on-device for semantic analysis |
| **Interactive Dashboard** | Filter, explore, and discover patterns |

### The Stack

```
┌─────────────────────────────────────────┐
│  NVIDIA Jetson AGX Orin (64GB)          │
├─────────────────────────────────────────┤
│  CUDA 11.4 + RAPIDS cuDF/cuML           │
│  Ollama + Llama 3.2:3b                  │
│  SQLite + Drizzle ORM                   │
│  Next.js + React + Leaflet              │
└─────────────────────────────────────────┘
```

**Zero cloud. Zero ongoing cost. Full privacy.**

---

# PAGE 3: THE DATA

## 2.3 Million Permits Analyzed

### Scale

| Metric | Value |
|--------|-------|
| Total Permits | 2,303,817 |
| Date Range | 2009-2024 |
| Zip Codes | 150+ |
| Categorized | 86% |

### LLM Categorization Results

| Category | Top Values |
|----------|-----------|
| **Project Type** | new_construction (849K), renovation (435K), repair (384K) |
| **Building Type** | residential_single (946K), commercial (251K), multi-family (143K) |
| **Trade** | general (1.4M), landscaping (349K), electrical (184K), hvac (145K) |

### Energy Infrastructure

| Signal | Count | Insight |
|--------|-------|---------|
| Solar | 25,982 | Clean energy adoption |
| HVAC | 71,331 | Climate adaptation |
| Generators | 7,248 | Grid trust broken (+246% post-freeze) |
| EV Chargers | 3,642 | Electrification accelerating |
| Batteries | 1,161 | Storage bottleneck (1:22 vs solar) |

---

# PAGE 4: KEY FINDINGS

## What the Data Reveals

### 1. The Resilience Gap

**After the 2021 freeze, Texans stopped trusting the grid.**

- Generator permits: **+246%**
- Battery permits: **+214%**

**But resilience is unequal:**

| District | Generators | Income Level |
|----------|------------|--------------|
| District 10 (Westlake) | 2,151 | High |
| District 4 (East Austin) | 175 | Lower |

### 2. The Storage Bottleneck

**For every 22 solar installations, there's only 1 battery.**

Solar saves money when the grid is up. But when it fails, solar without storage is useless.

### 3. Growth Corridors

**Top 5 Zip Codes by Permit Volume:**

| Zip | Permits | Notable |
|-----|---------|---------|
| 78758 | 100,686 | North Austin tech corridor |
| 78704 | 93,586 | South Congress / gentrification |
| 78759 | 92,803 | Domain area growth |
| 78664 | 77,363 | Round Rock expansion |
| 78745 | 72,911 | South Austin infill |

---

# PAGE 5: LIVE DEMO

## Dashboard Walkthrough

### 1. Overview (30 sec)
- Show map with 2.3M permit markers
- Highlight cluster distribution chart
- Point out energy stats in sidebar

### 2. Filter by Energy Type (1 min)
- Click "Solar" → See adoption hotspots
- 78704 and 78744 lead in solar
- Click "Generator" → See post-freeze surge

### 3. LLM Categories (1 min)
- Filter by "new_construction" → Growth areas
- Filter by "renovation" → Gentrification signals
- Filter by "commercial" → Business corridors

### 4. Zip Code Deep Dive (30 sec)
- Select 78704 (South Congress)
- Show permit breakdown
- Highlight solar vs generator ratio

### 5. Technical Demo (1 min)
- Show Ollama running locally
- Run categorization on sample permit
- Explain GPU clustering (16x speedup)

---

# PAGE 6: ROADMAP & ASK

## What's Next

### Phase 2: Predictive Analytics
- Time-series animation of permit growth
- "Where will construction spike next?"
- Export reports as PDF/CSV

### Phase 3: Multi-City Expansion
- Houston, Dallas, San Antonio
- Real-time permit feed integration
- Mobile-responsive dashboard

### Phase 4: Advanced AI
- vLLM integration (pending CUDA 12 on Jetson)
- Fine-tuned permit classification model
- Public API for third-party integrations

## The Value Proposition

| Audience | What They Get |
|----------|---------------|
| **City Planners** | Infrastructure investment priorities |
| **Utilities** | Load forecasting by neighborhood |
| **Developers** | Grid-ready zone identification |
| **Solar Companies** | Market gap analysis |
| **Researchers** | 15 years of urban growth data |

## Technical Differentiators

- **16x speedup** with GPU clustering vs CPU
- **Zero cloud cost** - runs on $2K edge device
- **86% categorization** with hybrid rule+LLM approach
- **Local LLM** - no data leaves the device

---

## Contact

**Project:** Undervolt - Austin Urban Growth Intelligence

**GitHub:** github.com/urbangrowthdgxatx/undervolt

**Hardware:** NVIDIA Jetson AGX Orin 64GB

**Demo:** http://[jetson-ip]:3000/dashboard
