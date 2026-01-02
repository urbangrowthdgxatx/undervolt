import { NextResponse } from 'next/server';
import { db, clusters, clusterKeywords, permits } from '@/db';
import { sql } from 'drizzle-orm';

// Use global to persist across hot reloads in development
const globalForStats = global as unknown as { statsCache: any | null };
if (!globalForStats.statsCache) {
  globalForStats.statsCache = null;
}

async function loadStats() {
  // Check memory cache first
  if (globalForStats.statsCache) {
    console.log('[Stats] Returning cached data from memory');
    return globalForStats.statsCache;
  }

  console.log('[Stats] Loading from database...');
  const startTime = Date.now();

  try {
    // Get total permits count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(permits);
    const totalPermits = Number(totalResult[0]?.count) || 0;

    // Get actual cluster counts from permits table
    const clusterCounts = await db
      .select({
        clusterId: permits.clusterId,
        count: sql<number>`count(*)`,
      })
      .from(permits)
      .groupBy(permits.clusterId);

    const countMap = clusterCounts.reduce((acc, c) => {
      if (c.clusterId !== null) {
        acc[c.clusterId] = Number(c.count);
      }
      return acc;
    }, {} as Record<number, number>);

    // Load cluster names
    const clustersData = await db.select().from(clusters);

    // Load keywords for each cluster
    const keywordsData = await db.select().from(clusterKeywords);
    const keywordsByCluster = keywordsData.reduce((acc, kw) => {
      if (!acc[kw.clusterId]) acc[kw.clusterId] = [];
      acc[kw.clusterId].push({ keyword: kw.keyword, frequency: kw.frequency });
      return acc;
    }, {} as Record<number, Array<{ keyword: string; frequency: number }>>);

    // Build cluster distribution with real counts
    const clusterDistribution = clustersData.map((cluster) => {
      const realCount = countMap[cluster.id] || 0;
      return {
        id: cluster.id,
        name: cluster.name,
        count: realCount,
        percentage: totalPermits > 0 ? Math.round((realCount / totalPermits) * 1000) / 10 : 0,
        keywords: keywordsByCluster[cluster.id] || [],
      };
    }).sort((a, b) => b.count - a.count);

    // Get energy stats directly from permits table
    const energyTotals = await db
      .select({
        solar: sql<number>`sum(case when ${permits.energyType} = 'solar' then 1 else 0 end)`,
        battery: sql<number>`sum(case when ${permits.energyType} = 'battery' then 1 else 0 end)`,
        evCharger: sql<number>`sum(case when ${permits.energyType} = 'ev_charger' then 1 else 0 end)`,
        panelUpgrade: sql<number>`sum(case when ${permits.energyType} = 'panel_upgrade' then 1 else 0 end)`,
        generator: sql<number>`sum(case when ${permits.energyType} = 'generator' then 1 else 0 end)`,
        hvac: sql<number>`sum(case when ${permits.energyType} = 'hvac' then 1 else 0 end)`,
        totalSolarCapacity: sql<number>`sum(${permits.solarCapacityKw})`,
        avgSolarCapacity: sql<number>`avg(case when ${permits.solarCapacityKw} > 0 then ${permits.solarCapacityKw} else null end)`,
      })
      .from(permits);

    const totals = energyTotals[0];

    const energyStats = {
      battery: Number(totals.battery) || 0,
      solar: Number(totals.solar) || 0,
      panelUpgrade: Number(totals.panelUpgrade) || 0,
      generator: Number(totals.generator) || 0,
      hvac: Number(totals.hvac) || 0,
      evCharger: Number(totals.evCharger) || 0,
      solarStats: {
        total_permits: Number(totals.solar) || 0,
        with_capacity_data: Number(totals.solar) || 0,
        avg_capacity_kw: Number(totals.avgSolarCapacity) || 0,
        total_capacity_kw: Number(totals.totalSolarCapacity) || 0,
      },
    };

    // Get top ZIPs by permit count
    const topZipsData = await db
      .select({
        zipCode: permits.zipCode,
        count: sql<number>`count(*)`,
        solar: sql<number>`sum(case when ${permits.energyType} = 'solar' then 1 else 0 end)`,
        battery: sql<number>`sum(case when ${permits.energyType} = 'battery' then 1 else 0 end)`,
        evCharger: sql<number>`sum(case when ${permits.energyType} = 'ev_charger' then 1 else 0 end)`,
        generator: sql<number>`sum(case when ${permits.energyType} = 'generator' then 1 else 0 end)`,
        panelUpgrade: sql<number>`sum(case when ${permits.energyType} = 'panel_upgrade' then 1 else 0 end)`,
        hvac: sql<number>`sum(case when ${permits.energyType} = 'hvac' then 1 else 0 end)`,
      })
      .from(permits)
      .groupBy(permits.zipCode);

    const topZips = topZipsData
      .filter(z => z.zipCode)
      .sort((a, b) => Number(b.count) - Number(a.count))
      .slice(0, 15)
      .map((z) => ({
        zip: z.zipCode,
        count: Number(z.count),
        solar: Number(z.solar),
        battery: Number(z.battery),
        ev_charger: Number(z.evCharger),
        generator: Number(z.generator),
        panel_upgrade: Number(z.panelUpgrade),
        hvac: Number(z.hvac),
      }));

    const stats = {
      totalPermits,
      clusterDistribution,
      topZips,
      energyStats,
      lastUpdated: new Date().toISOString(),
    };

    // Cache in memory
    globalForStats.statsCache = stats;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Stats] Data loaded from database in ${elapsed}s`);

    return stats;
  } catch (error) {
    console.error('Error loading stats:', error);
    return {
      totalPermits: 0,
      clusterDistribution: [],
      topZips: [],
      energyStats: {},
      clusterNames: {},
      error: 'Failed to load stats',
    };
  }
}

export async function GET() {
  const stats = await loadStats();
  return NextResponse.json(stats);
}

// Clear cache endpoint
export async function POST() {
  globalForStats.statsCache = null;
  return NextResponse.json({ message: 'Cache cleared (memory)' });
}
