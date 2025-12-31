# Database Architecture

## Overview

The Undervolt project now uses a **SQLite database** with **Drizzle ORM** for all data storage and retrieval. This replaces the previous file-based approach for better performance, query capabilities, and maintainability.

## Database Location

```
/home/red/Documents/github/undervolt/data/undervolt.db
```

**Size**: 76KB (contains 18,050 permits + metadata)

## Schema

### Tables

#### 1. `permits` - Individual Construction Permits
Stores all construction permit records with energy classification.

**Key Fields**:
- `permit_number` (unique) - Official permit identifier
- `zip_code` - ZIP code location
- `latitude`, `longitude` - Geocoded coordinates
- `cluster_id` - ML-assigned cluster (0-7)
- `energy_type` - solar, battery, ev_charger, panel_upgrade, generator, hvac
- `solar_capacity_kw` - Solar installation capacity
- `issue_date` - When permit was issued

**Indexes**: ZIP code, cluster ID, energy type, issue date

#### 2. `clusters` - ML-Generated Permit Clusters
Stores the 8 ML-identified permit categories.

**Key Fields**:
- `id` (0-7) - Cluster identifier
- `name` - Human-readable name (e.g., "New Residential Construction")
- `count` - Number of permits in cluster
- `percentage` - % of total permits
- `color` - Hex color for visualization
- `centroid_lat`, `centroid_lng` - Map center point

#### 3. `cluster_keywords` - Top Keywords per Cluster
Top keywords extracted from permit descriptions for each cluster.

**Fields**:
- `cluster_id` - Reference to cluster
- `keyword` - Extracted keyword
- `frequency` - Prevalence score
- `rank` - Keyword ranking (1-5)

#### 4. `energy_stats_by_zip` - Energy Statistics by ZIP Code
Aggregated energy permit statistics per ZIP code.

**Key Fields**:
- `zip_code` (unique)
- `total_energy_permits`
- `solar`, `battery`, `ev_charger`, `generator`, `panel_upgrade`, `hvac` - Counts by type
- `total_solar_capacity_kw`, `avg_solar_capacity_kw` - Solar capacity metrics

#### 5. `trends` - Time-Series Permit Trends
Yearly/monthly/quarterly aggregations for trend analysis.

**Fields**:
- `period` - "2020", "2020-01", "2020-Q1"
- `period_type` - year, month, quarter
- `total_permits`, `energy_permits`
- `growth_rate` - % change from previous period

#### 6. `cache_metadata` - Data Freshness Tracking
Tracks when each data source was last updated.

## Data Ingestion

### Script
```bash
npx tsx scripts/ingest-data.ts
```

### Process
1. **Clusters** - Reads `frontend/public/data/cluster_summary.json`
   - Inserts 8 clusters + keywords
2. **Energy Stats** - Reads `frontend/public/data/energy_infrastructure.json`
   - Inserts 100 ZIP code aggregations
3. **Permits** - Reads `output/energy_permits.csv`
   - Batch inserts 18,050 energy permits (1,000 per batch)

**Performance**: ~1.3 seconds for full ingestion

### Source Files
- `/home/red/Documents/github/undervolt/output/energy_permits.csv` (3.2MB)
- `/home/red/Documents/github/undervolt/frontend/public/data/cluster_summary.json`
- `/home/red/Documents/github/undervolt/frontend/public/data/energy_infrastructure.json`

## API Integration

### Migrated APIs (Database-Backed)

#### `/api/stats`
**Before**: Read JSON files from `public/data/`
**After**: Query database for clusters, keywords, ZIP stats

**Query**:
```typescript
// Load clusters with keywords
const clustersData = await db.select().from(clusters);
const keywordsData = await db.select().from(clusterKeywords);

// Top ZIPs
const topZips = await db.select()
  .from(energyStatsByZip)
  .orderBy(desc(energyStatsByZip.totalEnergyPermits))
  .limit(15);

// Energy totals
const totals = await db.select({
  totalSolar: sql`SUM(${energyStatsByZip.solar})`,
  totalBattery: sql`SUM(${energyStatsByZip.battery})`,
  // ...
}).from(energyStatsByZip);
```

**Performance**: ~0.1s (database) vs ~0.0s (cached JSON files)

#### `/api/permits-detailed`
**Before**: Read 3.2MB CSV file with PapaParse, filter in memory
**After**: Indexed database query with WHERE clause

**Query**:
```typescript
let query = db.select().from(permits);

if (cluster) {
  query = query.where(eq(permits.clusterId, parseInt(cluster)));
}

query = query.limit(limit);
const result = await query;
```

**Performance**: ~0.02s (database with index) vs ~7s (CSV parsing)

## Advantages

### 1. Performance
- **350x faster** for filtered permit queries (indexed lookups)
- **No CSV parsing** overhead on every request
- **Efficient aggregations** with SQL SUM/AVG/COUNT

### 2. Scalability
- **Indexes** on ZIP, cluster, energy type, date
- **WAL mode** for better concurrency
- Can handle millions of permits without memory issues

### 3. Query Flexibility
- **Complex filters**: ZIP + cluster + date range
- **Sorting**: By date, capacity, location
- **Aggregations**: GROUP BY, statistical analysis

### 4. Data Integrity
- **Foreign keys** ensure cluster references are valid
- **NOT NULL constraints** on critical fields
- **Unique constraints** on permit numbers

### 5. Maintainability
- **TypeScript types** auto-generated from schema
- **Migrations** tracked in `drizzle/` folder
- **Single source of truth** for all data

## Query Examples

### Get all solar permits in ZIP 78758
```typescript
const solarIn78758 = await db.select()
  .from(permits)
  .where(
    and(
      eq(permits.zipCode, '78758'),
      eq(permits.energyType, 'solar')
    )
  );
```

### Top 10 ZIPs by battery installations
```typescript
const topBatteryZips = await db.select()
  .from(energyStatsByZip)
  .orderBy(desc(energyStatsByZip.battery))
  .limit(10);
```

### Permits issued in 2024
```typescript
const permits2024 = await db.select()
  .from(permits)
  .where(like(permits.issueDate, '2024%'));
```

## Future Enhancements

- [ ] Add `trends` table population from historical data
- [ ] Implement GraphQL API for flexible querying
- [ ] Add full-text search on `work_description`
- [ ] Create materialized views for common aggregations
- [ ] Set up automated daily data updates
- [ ] Add support for non-energy permits (expand to all 2.2M permits)

## Maintenance

### Re-ingesting Data
```bash
# Clear database
rm data/undervolt.db

# Re-run migration
npx drizzle-kit push

# Re-ingest all data
npx tsx scripts/ingest-data.ts
```

### Database Size Management
- Current: 76KB (18K permits)
- Estimated at 2.2M permits: ~9MB
- SQLite supports databases up to 281 TB

### Backup
```bash
# Backup database
cp data/undervolt.db data/undervolt.db.backup

# Restore
cp data/undervolt.db.backup data/undervolt.db
```

## Tech Stack

- **Database**: SQLite 3
- **ORM**: Drizzle ORM v0.36+
- **Driver**: better-sqlite3
- **Migration Tool**: drizzle-kit
- **Query Language**: SQL (via Drizzle's type-safe builder)
