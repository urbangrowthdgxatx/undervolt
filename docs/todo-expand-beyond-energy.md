# TODO: Expand Beyond Energy Permits

## Current State

The system currently **only focuses on energy-related permits** (18,050 out of 2,458,644 total):

- **Energy keywords filtered**: solar, battery, EV charger, panel upgrade, generator, HVAC
- **Coverage**: Only 0.7% of total Austin permits
- **Database**: Only contains energy permits

## Why This Matters

Austin's construction data reveals signals beyond just energy:

1. **Urban growth patterns**: New residential/commercial development
2. **Infrastructure trends**: Foundation repairs, demolition, remodeling
3. **Economic indicators**: Total valuations, housing unit creation
4. **Gentrification signals**: High-value renovations in specific ZIPs
5. **Climate adaptation**: Pool construction (heat), HVAC upgrades
6. **Building codes**: Electrical panel upgrades, structural improvements

## Expansion Plan

### Phase 1: Add Non-Energy Clusters (Keep Current System)

**Goal**: Analyze all 2.4M permits while maintaining energy focus

**Changes**:
1. Run ML pipeline on **full dataset** (no energy filtering)
   - Input: 2,458,644 permits
   - Output: 2.4M permits with cluster_id (0-N clusters)
   - Clustering: Increase from 8 → 15-20 clusters

2. Update database schema:
   - Keep `isEnergyPermit` flag for filtering
   - Add new fields:
     ```typescript
     totalJobValuation: real('total_job_valuation')
     housingUnits: integer('housing_units')
     numberOfFloors: integer('number_of_floors')
     permitType: text('permit_type') // residential, commercial, etc.
     workClass: text('work_class')
     statusDate: text('status_date')
     completedDate: text('completed_date')
     ```

3. Update ingestion script:
   - Load all permits (not just energy)
   - Batch size: 5,000 (instead of 1,000) for performance
   - Estimated time: ~10-15 seconds for 2.4M records

4. Update APIs:
   - Add `?energy_only=true` filter to `/api/permits-detailed`
   - Create `/api/permits-all` for full dataset
   - Add filters: `?permit_type=residential&min_valuation=100000`

### Phase 2: Multi-Category Analysis

**New cluster categories** (estimated from ML pipeline):

| Category | Est. Count | Insights Available |
|----------|------------|-------------------|
| **Energy Infrastructure** | 18,050 (0.7%) | Solar/battery/EV adoption |
| **New Construction** | 500,000 (20%) | Development hotspots, housing growth |
| **Renovations & Remodels** | 800,000 (33%) | Gentrification, property upgrades |
| **Demolition** | 50,000 (2%) | Urban redevelopment patterns |
| **Foundation & Structural** | 200,000 (8%) | Aging infrastructure, soil issues |
| **HVAC & Mechanical** | 400,000 (16%) | Climate adaptation trends |
| **Electrical & Plumbing** | 300,000 (12%) | Code compliance, upgrades |
| **Pools & Outdoor** | 100,000 (4%) | Luxury amenities, heat adaptation |
| **Commercial** | 50,000 (2%) | Business growth, mixed-use |
| **Multi-Family** | 40,000 (1.6%) | Density increases |

### Phase 3: New Dashboard Views

**1. Urban Growth Dashboard**
- Heat map: New construction density by ZIP
- Time series: Housing units created per year
- Valuation trends: Total investment by area

**2. Infrastructure Health Dashboard**
- Foundation repair clusters (soil stability issues)
- Electrical panel upgrade patterns (aging housing stock)
- Demolition trends (redevelopment signals)

**3. Climate Adaptation Dashboard**
- Pool construction rates (heat response)
- HVAC upgrade patterns
- Generator installations (grid reliability concerns)

**4. Economic Signals Dashboard**
- High-value renovations (gentrification proxy)
- Commercial permit activity (business growth)
- Multi-family construction (density trends)

### Phase 4: Geospatial Analysis

**New queries enabled with full dataset**:

```typescript
// Find gentrifying neighborhoods
db.select()
  .from(permits)
  .where(and(
    eq(permits.workClass, 'Remodel'),
    gte(permits.totalJobValuation, 100000)
  ))
  .groupBy(permits.zipCode)
  .orderBy(desc(sql`COUNT(*)`));

// Track new housing unit creation
db.select({
  year: sql`strftime('%Y', issue_date)`,
  totalUnits: sql`SUM(housing_units)`,
  totalValuation: sql`SUM(total_job_valuation)`
})
  .from(permits)
  .where(eq(permits.permitType, 'New Construction'))
  .groupBy(sql`strftime('%Y', issue_date)`);

// Identify infrastructure problem areas
db.select()
  .from(permits)
  .where(like(permits.workDescription, '%foundation%'))
  .groupBy(permits.zipCode)
  .having(sql`COUNT(*) > 100`); // ZIPs with excessive foundation issues
```

## Technical Considerations

### Database Size
- **Current**: 76KB (18,050 permits)
- **Estimated with 2.4M**: ~200-300MB
- **Solution**: Keep indexes lean, consider partitioning by year

### ML Pipeline Adjustments

**Current config** (`src/pipeline/config.py`):
```python
CLUSTERING_PARAMS = {
    "n_clusters": 8,
    "max_iter": 300,
    "n_pca_components": 10,
    "feature_prefix": "f_"
}
```

**Proposed for full dataset**:
```python
CLUSTERING_PARAMS = {
    "n_clusters": 20,  # More diverse permit types
    "max_iter": 500,   # More iterations for convergence
    "n_pca_components": 15,  # Capture more variance
    "feature_prefix": "f_"
}
```

**NLP keywords to add**:
```python
NLP_KEYWORDS = [
    # Energy (existing)
    "solar", "battery", "ev", "charger", "generator", "panel upgrade", "hvac",

    # Construction types (new)
    "new construction", "demolition", "remodel", "renovation", "addition",

    # Structural (new)
    "foundation", "structural", "framing", "beam", "column",

    # Systems (new)
    "electrical", "plumbing", "mechanical", "fire sprinkler",

    # Outdoor (new)
    "pool", "deck", "fence", "landscaping",

    # Commercial (new)
    "commercial", "retail", "office", "warehouse", "restaurant",

    # Multi-family (new)
    "multi-family", "apartment", "condo", "townhouse"
]
```

### API Performance Impact

With 2.4M permits:
- **Indexed queries**: Still fast (~0.02-0.1s with proper indexes)
- **Full table scans**: Would be slow (~5-10s)
- **Mitigation**: Ensure all filters use indexed columns

**Critical indexes needed**:
```typescript
// Add to schema.ts
export const permits = sqliteTable('permits', {
  // ... existing fields
}, (table) => ({
  zipIdx: index('zip_idx').on(table.zipCode),
  clusterIdx: index('cluster_idx').on(table.clusterId),
  energyTypeIdx: index('energy_type_idx').on(table.energyType),
  issueDateIdx: index('issue_date_idx').on(table.issueDate),

  // NEW: For non-energy analysis
  energyFlagIdx: index('energy_flag_idx').on(table.isEnergyPermit),
  permitTypeIdx: index('permit_type_idx').on(table.permitType),
  workClassIdx: index('work_class_idx').on(table.workClass),
  valuationIdx: index('valuation_idx').on(table.totalJobValuation),

  // Composite indexes for common queries
  zipYearIdx: index('zip_year_idx').on(
    table.zipCode,
    sql`strftime('%Y', issue_date)`
  ),
}));
```

## Migration Strategy

### Option 1: Parallel Systems (Recommended for now)
- Keep current energy-focused system
- Create separate `permits_all` table with full dataset
- Gradually add new dashboards
- Low risk, incremental value

### Option 2: Replace Energy Filter (Higher risk)
- Re-run ML pipeline on all 2.4M permits
- Replace database entirely
- Update frontend to have "Energy Only" toggle
- One-time migration effort

### Option 3: Hybrid Approach
- Keep energy permits in current table
- Add `permits_non_energy` table with remaining permits
- Create views that union both tables
- Best of both worlds but more complex schema

## Next Steps

1. **Immediate**: Document this expansion plan (this file)
2. **Short-term**: Run ML pipeline on sample (100K permits) to validate cluster quality
3. **Medium-term**: Expand database schema to support non-energy fields
4. **Long-term**: Build new dashboard views for urban growth, infrastructure, climate

## Why Not Do This Now?

**Current priorities**:
1. ✅ Database migration complete (18,050 energy permits)
2. ✅ Core APIs working with good performance
3. ✅ Frontend displaying energy insights
4. 🚧 Need to validate energy-focused value first
5. 🚧 Then expand to broader urban analytics

**Philosophy**:
- Start narrow (energy) to prove value
- Expand wide (all permits) once core system is solid
- Don't boil the ocean on day 1

---

**Status**: PLANNED - Returning to this after energy dashboard is production-ready
**Estimated Effort**: 2-3 days for full expansion (ML pipeline + DB + APIs + Frontend)
**Value Unlock**: 130x more data (18K → 2.4M permits), 10+ new insight categories
