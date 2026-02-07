# Database Quick Start

## Setup (Already Done ✓)

The database is already set up and populated. You're ready to go!

## Common Operations

### View Database in Browser
```bash
npm run db:studio
```
Opens Drizzle Studio at http://localhost:4983 for visual database browsing.

### Re-ingest Data (After CSV Updates)
```bash
npm run db:ingest
```
Refreshes all data from CSV/JSON files (~1.3s).

### Reset Database (Nuclear Option)
```bash
npm run db:reset
```
Deletes database, recreates schema, and re-ingests all data.

### Generate Migration (After Schema Changes)
```bash
npm run db:generate
npm run db:push
```

## Database Location

```
/home/red/Documents/github/undervolt/data/undervolt.db
```

## Quick Stats

```bash
# Count permits
sqlite3 data/undervolt.db "SELECT COUNT(*) FROM permits;"

# Count by energy type
sqlite3 data/undervolt.db "SELECT energy_type, COUNT(*) FROM permits GROUP BY energy_type;"

# Top ZIPs
sqlite3 data/undervolt.db "SELECT zip_code, total_energy_permits FROM energy_stats_by_zip ORDER BY total_energy_permits DESC LIMIT 10;"
```

## API Endpoints (Database-Backed)

All these now query the SQLite database:

- `GET /api/stats` - Cluster stats, top ZIPs, energy totals
- `GET /api/permits-detailed?cluster=2&limit=1000` - Filtered permits
- `GET /api/geojson` - Cluster centroids (still file-based, migrate later)

## Performance

| Operation | Time |
|-----------|------|
| Full ingestion | ~1.3s |
| Stats query | ~0.1s |
| Permit filter by cluster | ~0.02s |
| Database size | 76KB (18K permits) |

## Troubleshooting

### "Database is locked"
```bash
# Kill any hanging connections
pkill -9 node
rm data/undervolt.db-shm data/undervolt.db-wal
```

### "Module not found: drizzle-orm"
```bash
cd frontend
npm install drizzle-orm better-sqlite3 --legacy-peer-deps
```

### APIs returning empty data
```bash
# Clear cache and restart
curl -X POST http://localhost:3000/api/stats
# Restart dev server
```

## Next Steps

1. **Populate trends table** - Add historical time-series data
2. **Add full-text search** - Enable FTS5 on work descriptions
3. **Expand to all permits** - Load full 2.2M permit dataset
4. **Add geospatial queries** - Radius searches, polygon filters
