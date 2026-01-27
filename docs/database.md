# Database Architecture

## Overview

The Undervolt project uses **Supabase Postgres** with the **@supabase/supabase-js** client for all data storage and retrieval. This replaces the previous SQLite + Drizzle ORM approach, providing cloud-hosted Postgres with PostgREST API access and row-level security.

## Migration History

| Date | Change |
|------|--------|
| Dec 2024 | Initial SQLite + Drizzle ORM (18K energy permits) |
| Jan 2025 | Expanded to 2.3M permits in SQLite (700MB) |
| Jan 27, 2025 | **Migrated to Supabase Postgres** (2,303,817 permits) |

## Connection

```typescript
// frontend/src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Project:** `arpoymzcflsqcaqixhie`
**URL:** `https://arpoymzcflsqcaqixhie.supabase.co`
**API Row Limit:** 50,000 (configured in Dashboard > API Settings)

## Schema

### Tables

#### 1. `permits` - Individual Construction Permits (2,303,817 rows)
Stores all construction permit records with energy classification and LLM categories.

**Key Fields:**
- `permit_number` (unique) - Official permit identifier
- `zip_code` - ZIP code location
- `latitude`, `longitude` - Geocoded coordinates
- `cluster_id` - ML-assigned cluster (0-7), FK to clusters
- `energy_type` - solar, battery, ev_charger, panel_upgrade, generator, hvac
- `solar_capacity_kw` - Solar installation capacity
- `issue_date` - When permit was issued
- `project_type` - LLM-categorized: new_construction, renovation, repair, etc.
- `building_type` - LLM-categorized: residential_single, commercial, etc.
- `scale` - LLM-categorized: minor, moderate, major
- `trade` - LLM-categorized: electrical, plumbing, hvac, etc.
- `is_green` - LLM-categorized: green/sustainable permit

**Indexes:** zip_code, cluster_id, energy_type, issue_date, project_type, building_type, trade, scale, is_green

#### 2. `clusters` - ML-Generated Permit Clusters (8 rows)
Stores the 8 ML-identified permit categories.

**Fields:** id, name, description, count, percentage, color, centroid_lat, centroid_lng

#### 3. `cluster_keywords` - Top Keywords per Cluster (36 rows)
**Fields:** cluster_id (FK), keyword, frequency, rank

#### 4. `energy_stats_by_zip` - Energy Statistics by ZIP Code (840 rows)
Aggregated energy permit statistics per ZIP code.

**Fields:** zip_code (unique), total_energy_permits, solar, battery, ev_charger, generator, panel_upgrade, hvac, total_solar_capacity_kw, avg_solar_capacity_kw

#### 5. `trends` - Time-Series Permit Trends (570 rows)
**Fields:** period, period_type (year/month/quarter), total_permits, energy_permits, solar, battery, ev_charger, growth_rate

#### 6. `cache_metadata` - Data Freshness Tracking (3 rows)
**Fields:** key (unique), last_updated, record_count, source_file

### RPC Functions

#### `get_dashboard_stats()`
Consolidates all dashboard statistics into a single Postgres function call. Returns a JSON object with:
- `totalPermits` - Total permit count
- `clusterDistribution` - All 8 clusters with counts, percentages, and keywords
- `energyStats` - Breakdown by energy type + solar capacity stats
- `topZips` - Top 15 ZIP codes with energy type breakdowns
- `llmCategories` - Distribution of project_type, building_type, scale, trade
- `lastUpdated` - Timestamp

**Performance:** Single RPC call replaces 5+ separate queries. Executes in ~200ms.

## API Integration

### All 5 Database-Backed API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/stats` | `supabase.rpc('get_dashboard_stats')` | Full dashboard stats via RPC |
| `GET /api/permits` | `supabase.from('permits').select()` | Paginated permits with filters |
| `GET /api/geojson` | `supabase.from('permits').select().not('latitude','is',null)` | GeoJSON FeatureCollection (50K limit) |
| `GET /api/permits-detailed` | `supabase.from('permits').select()` | Multi-filter permit search |
| `GET /api/trends` | `supabase.from('trends').select()` | Monthly trend data |

### Column Name Mapping
Supabase returns snake_case columns. API routes map to camelCase for frontend consumers:
- `permit_number` -> `permitNumber`
- `zip_code` -> `zipCode`
- `cluster_id` -> `clusterId`
- `energy_type` -> `energyType`
- `is_energy_permit` -> `isEnergyPermit`
- `solar_capacity_kw` -> `solarCapacityKw`
- `issue_date` -> `issueDate`
- `project_type` -> `projectType`
- `building_type` -> `buildingType`
- `is_green` -> `isGreen`

## Security

- **Row Level Security (RLS):** Enabled on all tables
- **Anon key:** Read-only access via PostgREST
- **No service role key** in frontend code
- **RPC function:** `search_path = public` set to prevent mutable path attacks

## Performance

| Query | Response Time | Notes |
|-------|--------------|-------|
| Dashboard stats (RPC) | ~200ms | Single call, replaces 5+ queries |
| Permits with filters | ~100ms | Indexed lookups |
| GeoJSON (50K points) | ~500ms | Limited by row count |
| Trends (monthly) | ~50ms | Small table, indexed |

## Data Loading

### Initial Load (Jan 27, 2025)
- **Source:** SQLite database on Jetson (700MB, 2,303,817 rows)
- **Method:** Python script using psycopg2 + execute_values
- **Batch size:** 2,000 rows
- **Rate:** 4,255 rows/sec
- **Total time:** 541 seconds (~9 minutes)
- **Idempotent:** ON CONFLICT (permit_number) DO UPDATE SET (LLM columns)

### Re-aggregation
After bulk load, `energy_stats_by_zip` was re-aggregated from permits:
```sql
TRUNCATE energy_stats_by_zip;
INSERT INTO energy_stats_by_zip (...)
SELECT zip_code, count(*), sum(CASE ...) ...
FROM permits WHERE is_energy_permit = true
GROUP BY zip_code;
```

## Maintenance

### Check Counts
```sql
SELECT count(*) FROM permits;           -- 2,303,817
SELECT count(*) FROM permits WHERE is_energy_permit; -- 115,523
SELECT count(*) FROM clusters;          -- 8
SELECT count(*) FROM energy_stats_by_zip; -- 840
SELECT count(*) FROM trends;            -- 570
```

### Clear API Caches
```bash
curl -X POST http://localhost:3000/api/stats
curl -X POST http://localhost:3000/api/geojson
curl -X POST http://localhost:3000/api/trends
```

### Run ANALYZE (after data changes)
```sql
ANALYZE permits;
ANALYZE clusters;
ANALYZE energy_stats_by_zip;
ANALYZE trends;
```

## Tech Stack

- **Database:** Supabase Postgres (cloud-hosted)
- **Client:** @supabase/supabase-js v2
- **API:** PostgREST (auto-generated REST from schema)
- **RPC:** PL/pgSQL functions for complex aggregations
- **Security:** Row Level Security (RLS) with anon key
