# Stats API Optimization - Complete

## Problem

The `/api/stats` endpoint was taking **3-5 minutes** to respond because it processed 2.4M CSV rows on every request.

## Root Cause

1. CSV file has 2,405,158 rows (2.4 million permits!)
2. Line-by-line streaming with string operations (`split()`, `trim()`) is slow
3. Next.js hot reloads cleared the in-memory cache
4. Each request started from scratch = 3-5 minute wait

## Solution

**Pre-compute stats once, cache to disk, read instantly**

### 1. Created Precompute Script

`scripts/precompute_stats.js` - Run once to generate cache:

```bash
node scripts/precompute_stats.js
```

**Output:**
```
[Precompute] ✅ Complete! Processed 2,405,158 permits in 60.4s
[Precompute] Cache saved to: output/.stats-cache.json
[Precompute] Cache size: 4.2 KB
```

### 2. API Reads Cache File

`frontend/src/app/api/stats/route.ts` now:
1. Checks global memory cache (instant if already loaded)
2. Checks disk cache file `.stats-cache.json` (58ms first load)
3. Falls back to CSV processing only if cache missing

## Performance

| Before | After |
|--------|-------|
| **3-5 minutes** (CSV streaming) | **58 milliseconds** (cache read) |
| 2.4M rows processed per request | 4.2 KB file read per request |
| Timeout issues, slow UX | Instant, smooth UX |

## Cache File Structure

```json
{
  "totalPermits": 2405158,
  "clusterDistribution": [...],
  "topZips": [...],
  "energyStats": {
    "solar": 0,
    "hvac": 42211,
    "electrical": 82657,
    "newConstruction": 130359,
    "remodels": 44081
  },
  "clusterNames": {...},
  "lastUpdated": "2025-12-30T17:01:40.435Z"
}
```

**Size:** 4.2 KB (compressed statistics from 2.4M rows!)

## Flow Diagram

### Before
```
Client Request
  ↓
API reads CSV: 2.4M rows × (split, parse, count)
  ↓
3-5 minutes later...
  ↓
Response
```

### After
```
Client Request
  ↓
API checks memory cache (globalForStats) → Cache hit? → Instant response
  ↓ (miss)
API reads .stats-cache.json (4.2 KB)
  ↓
58ms later...
  ↓
Response
```

## Caching Strategy

1. **Global Memory Cache** - Persists across hot reloads using Node.js `global` object
2. **Disk Cache File** - Persists across server restarts
3. **Fallback to CSV** - Only if both caches missing (shouldn't happen in production)

## Regenerating Cache

When CSV data updates:

```bash
# Regenerate cache (takes ~60s)
node scripts/precompute_stats.js

# Or clear API cache to force regeneration
curl -X POST http://localhost:3000/api/stats
```

## Production Deployment

1. Run `node scripts/precompute_stats.js` during build/deployment
2. Commit `.stats-cache.json` to git (4.2 KB, worth it!)
3. API serves instantly without CSV processing

## Files Changed

1. `scripts/precompute_stats.js` - New precompute script
2. `frontend/src/app/api/stats/route.ts` - Updated to use disk cache
3. `output/.stats-cache.json` - Generated cache file (4.2 KB)

## Test Results

```bash
$ time curl -s http://localhost:3000/api/stats > /dev/null

real    0m0.058s
user    0m0.003s
sys     0m0.012s
```

**Result:** 58 milliseconds! ✅
