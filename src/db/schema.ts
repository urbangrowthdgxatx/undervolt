import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

/**
 * Permits table - individual construction permits
 */
export const permits = sqliteTable('permits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  permitNumber: text('permit_number').notNull().unique(),

  // Location
  address: text('address'),
  zipCode: text('zip_code').notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),

  // Classification
  clusterId: integer('cluster_id'),
  workDescription: text('work_description'),

  // Energy-specific fields
  isEnergyPermit: integer('is_energy_permit', { mode: 'boolean' }).default(false),
  energyType: text('energy_type'), // solar, battery, ev_charger, panel_upgrade, generator, hvac
  solarCapacityKw: real('solar_capacity_kw'),

  // Dates
  issueDate: text('issue_date'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
}, (table) => ({
  zipIdx: index('zip_idx').on(table.zipCode),
  clusterIdx: index('cluster_idx').on(table.clusterId),
  energyTypeIdx: index('energy_type_idx').on(table.energyType),
  issueDateIdx: index('issue_date_idx').on(table.issueDate),
}));

/**
 * Clusters table - ML-generated permit clusters
 */
export const clusters = sqliteTable('clusters', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  count: integer('count').notNull().default(0),
  percentage: real('percentage').notNull().default(0),
  color: text('color'), // Hex color for visualization

  // Centroid for map display
  centroidLat: real('centroid_lat'),
  centroidLng: real('centroid_lng'),

  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});

/**
 * Cluster keywords - top keywords for each cluster
 */
export const clusterKeywords = sqliteTable('cluster_keywords', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clusterId: integer('cluster_id').notNull().references(() => clusters.id),
  keyword: text('keyword').notNull(),
  frequency: real('frequency').notNull(),
  rank: integer('rank').notNull(),
}, (table) => ({
  clusterIdx: index('cluster_keywords_cluster_idx').on(table.clusterId),
}));

/**
 * Energy stats by ZIP code
 */
export const energyStatsByZip = sqliteTable('energy_stats_by_zip', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  zipCode: text('zip_code').notNull().unique(),

  totalEnergyPermits: integer('total_energy_permits').notNull().default(0),
  solar: integer('solar').notNull().default(0),
  battery: integer('battery').notNull().default(0),
  evCharger: integer('ev_charger').notNull().default(0),
  generator: integer('generator').notNull().default(0),
  panelUpgrade: integer('panel_upgrade').notNull().default(0),
  hvac: integer('hvac').notNull().default(0),

  // Solar capacity stats
  totalSolarCapacityKw: real('total_solar_capacity_kw').default(0),
  avgSolarCapacityKw: real('avg_solar_capacity_kw').default(0),

  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
}, (table) => ({
  zipIdx: index('energy_stats_zip_idx').on(table.zipCode),
}));

/**
 * Trends data - yearly/monthly aggregations
 */
export const trends = sqliteTable('trends', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  period: text('period').notNull(), // e.g., "2020", "2020-01", "2020-Q1"
  periodType: text('period_type').notNull(), // year, month, quarter

  totalPermits: integer('total_permits').notNull().default(0),
  energyPermits: integer('energy_permits').notNull().default(0),

  // By type
  solar: integer('solar').notNull().default(0),
  battery: integer('battery').notNull().default(0),
  evCharger: integer('ev_charger').notNull().default(0),

  // Growth metrics
  growthRate: real('growth_rate'), // % change from previous period

  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
}, (table) => ({
  periodIdx: index('trends_period_idx').on(table.period),
  periodTypeIdx: index('trends_period_type_idx').on(table.periodType),
}));

/**
 * Cache metadata - track when data was last updated
 */
export const cacheMetadata = sqliteTable('cache_metadata', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  lastUpdated: text('last_updated').notNull(),
  recordCount: integer('record_count'),
  sourceFile: text('source_file'),
});

export type Permit = typeof permits.$inferSelect;
export type NewPermit = typeof permits.$inferInsert;

export type Cluster = typeof clusters.$inferSelect;
export type NewCluster = typeof clusters.$inferInsert;

export type ClusterKeyword = typeof clusterKeywords.$inferSelect;
export type NewClusterKeyword = typeof clusterKeywords.$inferInsert;

export type EnergyStatsByZip = typeof energyStatsByZip.$inferSelect;
export type NewEnergyStatsByZip = typeof energyStatsByZip.$inferInsert;

export type Trend = typeof trends.$inferSelect;
export type NewTrend = typeof trends.$inferInsert;
