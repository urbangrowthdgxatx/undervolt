# ACTUAL Data Lineage - Complete Audit Trail

**Every single record accounted for from 2.4M to 18K**

## TL;DR: The Missing 2.3 Million Permits

**NOT MISSING** - They're in `permit_data_enriched.csv` (2.4M rows)
**PROBLEM** - Downstream scripts only load 100K samples, not full file

---

## Complete Lineage (Actual File Counts)

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: RAW AUSTIN DATA                                         │
│ File: data/Issued_Construction_Permits_20251212.csv             │
│ Records: 2,458,644 permits                                      │
│ Size: ~500MB                                                     │
│ Code: Manual download from Austin Open Data                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: CLEANING + NLP + CLUSTERING                             │
│ File: output/permit_data_enriched.csv                           │
│ Records: 2,423,632 permits (-35,012 invalid coords)             │
│ Size: ~1.9GB                                                     │
│ Code: src/pipeline/main.py (python -m src.pipeline.main)        │
│                                                                  │
│ Actions:                                                         │
│ - Remove invalid lat/lng (-35,012)                              │
│ - Add 80 NLP feature columns (f_*)                              │
│ - Add cluster assignments (f_cluster 0-7)                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: CLUSTER NAMING (⚠️ SAMPLE ONLY!)                        │
│ File: output/permit_data_named_clusters.csv                     │
│ Records: 100,000 permits (⚠️ ONLY A SAMPLE!)                    │
│ Size: ~92MB                                                      │
│ Code: scripts/python/name_clusters.py (line 160)                │
│                                                                  │
│ ⚠️ CRITICAL BUG:                                                 │
│   df = pd.read_csv(data_path, nrows=100000)  ← Hard-coded limit!│
│                                                                  │
│ What happened to 2.3M permits?                                   │
│ → Still in permit_data_enriched.csv (2.4M rows)                 │
│ → This script only copies 100K with cluster names               │
│ → NOT A DATA LOSS - just didn't copy them to new file           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: ENERGY EXTRACTION                                       │
│ File: output/energy_permits.csv                                 │
│ Records: 18,050 permits (from 100K sample)                      │
│ Size: 3.2MB                                                      │
│ Code: scripts/python/track_energy_infrastructure.py             │
│                                                                  │
│ Reads: permit_data_named_clusters.csv (100K rows)               │
│ Filters: Energy keywords (solar, battery, EV, etc.)             │
│ Result: 18,050 energy permits (18.1% of 100K sample)            │
│                                                                  │
│ ⚠️ If we processed all 2.4M permits:                             │
│   Expected: ~430,000 energy permits (18.1% of 2.4M)             │
│   Actual: 18,050 (because only 100K were processed)             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: DATABASE INGESTION                                      │
│ File: data/undervolt.db                                         │
│ Records: 18,050 permits                                          │
│ Size: 5.7MB                                                      │
│ Code: scripts/ingest-data.ts                                    │
│                                                                  │
│ Reads: output/energy_permits.csv (18,050 rows)                  │
│ Action: Insert all 18,050 into database                         │
│ Result: 100% loaded, no loss                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Real Story

### Where Are The 2.4 Million Permits?

**They're still here!**

```bash
$ wc -l output/permit_data_enriched.csv
2,423,633  # All permits are in this file!
```

**What went wrong?**

The `name_clusters.py` script has a hard-coded sample limit:

```python
# scripts/python/name_clusters.py line 160
df = pd.read_csv(data_path, nrows=100000)  # ← ONLY LOADS 100K!
```

This creates `permit_data_named_clusters.csv` with only 100K rows.

Then `track_energy_infrastructure.py` reads THIS file (not the full 2.4M):

```python
# scripts/python/track_energy_infrastructure.py line 22
def load_permit_data(path='output/permit_data_named_clusters.csv', sample_size=None):
    # Loads from named_clusters.csv (100K rows), not enriched.csv (2.4M rows)
```

---

## Actual Numbers at Each Stage

| Stage | Records | File | Sample? |
|-------|---------|------|---------|
| **Raw Data** | 2,458,644 | `Issued_Construction_Permits_20251212.csv` | No |
| **Cleaned** | 2,423,632 | `permit_data_enriched.csv` | No |
| **Named Clusters** | 100,000 | `permit_data_named_clusters.csv` | ⚠️ YES |
| **Energy Filter** | 18,050 | `energy_permits.csv` | ⚠️ From 100K sample |
| **Database** | 18,050 | `undervolt.db` | ⚠️ From 100K sample |

---

## Impact Analysis

### Current State (100K Sample)

- Energy permits found: **18,050** (18.1% of 100K)
- Energy keywords detected:
  - Battery: 10,377
  - Solar: 2,436
  - Panel Upgrade: 1,523
  - Generator: 1,483
  - HVAC: 1,312
  - EV Charger: 919

### Projected (Full 2.4M Dataset)

If we process ALL 2,423,632 permits:

- Expected energy permits: **~438,000** (18.1% of 2.4M)
- Projected by type (scaled 24x):
  - Battery: ~250,000
  - Solar: ~58,000
  - Panel Upgrade: ~37,000
  - Generator: ~36,000
  - HVAC: ~32,000
  - EV Charger: ~22,000

**We're only seeing 4% of the total energy permits!**

---

## Root Cause: Hard-Coded Samples

### Bug #1: name_clusters.py (line 160)

```python
# BEFORE (current bug):
df = pd.read_csv(data_path, nrows=100000)  # ← Always 100K

# AFTER (fixed):
df = pd.read_csv(data_path, low_memory=False)  # ← Load all data
```

### Bug #2: Wrong Input File

```python
# track_energy_infrastructure.py line 22
# BEFORE (reads sampled file):
def load_permit_data(path='output/permit_data_named_clusters.csv', sample_size=None):

# AFTER (should read full file):
def load_permit_data(path='output/permit_data_enriched.csv', sample_size=None):
```

---

## How To Fix

### Option 1: Quick Fix (Use Full enriched.csv)

Skip the cluster naming step and read directly from enriched data:

```python
# Edit track_energy_infrastructure.py line 257
df = load_permit_data(path='output/permit_data_enriched.csv')  # ← Use full file
```

**Impact**: Process all 2.4M permits, find ~438K energy permits

### Option 2: Fix name_clusters.py

Remove the hard-coded sample limit:

```python
# Edit scripts/python/name_clusters.py line 160
df = pd.read_csv(data_path, low_memory=False)  # ← Remove nrows limit
```

Then re-run the full pipeline.

**Impact**: Creates full named_clusters.csv with 2.4M rows

### Option 3: Use New Unified Pipeline

The `run_pipeline.py` doesn't have this bug:

```bash
python run_pipeline.py  # Processes all data by default
```

**Impact**: Clean pipeline from raw → database with no sampling

---

## Recommended Action

**Immediate**: Run unified pipeline on full dataset

```bash
# This will process ALL 2.4M permits
python run_pipeline.py

# Output will be:
# - output/permit_data_enriched.csv (2.4M rows)
# - output/energy_permits.csv (~438K rows)
```

Then re-ingest to database:

```bash
npm run db:reset  # Will now load ~438K energy permits
```

---

## Summary

| Question | Answer |
|----------|--------|
| **Where are 2.4M permits?** | In `permit_data_enriched.csv` (never deleted) |
| **Why only 18K in database?** | Downstream scripts only processed 100K sample |
| **Is this a data loss?** | No - data exists, just not fully processed |
| **How many energy permits exist?** | ~438K (estimated from 18.1% match rate) |
| **Currently in database?** | 18K (4% of total energy permits) |
| **Fix required?** | Remove hard-coded samples, process full dataset |

---

**The 2.3 million permits are NOT missing - they're sitting in `permit_data_enriched.csv` waiting to be processed!**
