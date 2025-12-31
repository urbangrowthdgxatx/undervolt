import { NextResponse } from 'next/server';
import { db, clusters, clusterKeywords, energyStatsByZip, permits } from '../../../../../src/db';
import { eq, sql, desc } from 'drizzle-orm';

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
    // Load clusters with keywords
    const clustersData = await db.select().from(clusters);

    // Load keywords for each cluster
    const keywordsData = await db.select().from(clusterKeywords);

    // Group keywords by cluster
    const keywordsByCluster = keywordsData.reduce((acc, kw) => {
      if (!acc[kw.clusterId]) acc[kw.clusterId] = [];
      acc[kw.clusterId].push({ keyword: kw.keyword, frequency: kw.frequency });
      return acc;
    }, {} as Record<number, Array<{ keyword: string; frequency: number }>>);

    // Transform cluster data to match expected format
    const clusterDistribution = clustersData.map((cluster) => ({
      id: cluster.id,
      name: cluster.name,
      count: cluster.count,
      percentage: cluster.percentage,
      keywords: keywordsByCluster[cluster.id] || [],
    })).sort((a, b) => b.count - a.count);

    // Calculate total permits from clusters
    const totalPermits = clusterDistribution.reduce((sum, c) => sum + c.count, 0);

    // Load top ZIPs from energy stats
    const topZipsData = await db
      .select()
      .from(energyStatsByZip)
      .orderBy(desc(energyStatsByZip.totalEnergyPermits))
      .limit(15);

    const topZips = topZipsData.map((z) => ({
      zip: z.zipCode,
      count: z.totalEnergyPermits,
      solar: z.solar,
      battery: z.battery,
      ev_charger: z.evCharger,
      generator: z.generator,
      panel_upgrade: z.panelUpgrade,
      hvac: z.hvac,
    }));

    // Calculate energy stats from energy_stats_by_zip table
    const energyTotals = await db
      .select({
        totalSolar: sql<number>`SUM(${energyStatsByZip.solar})`,
        totalBattery: sql<number>`SUM(${energyStatsByZip.battery})`,
        totalEvCharger: sql<number>`SUM(${energyStatsByZip.evCharger})`,
        totalPanelUpgrade: sql<number>`SUM(${energyStatsByZip.panelUpgrade})`,
        totalGenerator: sql<number>`SUM(${energyStatsByZip.generator})`,
        totalHvac: sql<number>`SUM(${energyStatsByZip.hvac})`,
        totalSolarCapacity: sql<number>`SUM(${energyStatsByZip.totalSolarCapacityKw})`,
        avgSolarCapacity: sql<number>`AVG(${energyStatsByZip.avgSolarCapacityKw})`,
        permitCount: sql<number>`SUM(${energyStatsByZip.totalEnergyPermits})`,
      })
      .from(energyStatsByZip);

    const totals = energyTotals[0];

    const energyStats = {
      battery: Number(totals.totalBattery) || 0,
      solar: Number(totals.totalSolar) || 0,
      panelUpgrade: Number(totals.totalPanelUpgrade) || 0,
      generator: Number(totals.totalGenerator) || 0,
      hvac: Number(totals.totalHvac) || 0,
      evCharger: Number(totals.totalEvCharger) || 0,
      solarStats: {
        total_permits: Number(totals.totalSolar) || 0,
        with_capacity_data: Number(totals.permitCount) || 0,
        avg_capacity_kw: Number(totals.avgSolarCapacity) || 0,
        total_capacity_kw: Number(totals.totalSolarCapacity) || 0,
      },
    };

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
