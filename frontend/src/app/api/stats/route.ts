import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Use global to persist across hot reloads in development
const globalForStats = global as unknown as { statsCache: any | null; statsCacheTime: number };
if (!globalForStats.statsCache) {
  globalForStats.statsCache = null;
  globalForStats.statsCacheTime = 0;
}
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadStats() {
  const now = Date.now();
  if (globalForStats.statsCache && (now - globalForStats.statsCacheTime) < CACHE_TTL) {
    return globalForStats.statsCache;
  }

  console.log("[Stats] Loading from Supabase...");
  const startTime = Date.now();

  try {
    const [clustersRes, keywordsRes, energyZipsRes, earliestRes, latestRes] = await Promise.all([
      supabase.from('clusters').select('*').order('id'),
      supabase.from('cluster_keywords').select('*').order('cluster_id').order('rank'),
      supabase.from('energy_stats_by_zip').select('*').order('total_energy_permits', { ascending: false }),
      supabase.from('permits').select('issue_date').order('issue_date', { ascending: true }).not('issue_date', 'is', null).limit(1),
      supabase.from('permits').select('issue_date').order('issue_date', { ascending: false }).not('issue_date', 'is', null).limit(1),
    ]);

    if (clustersRes.error) throw clustersRes.error;

    const clusters = clustersRes.data || [];
    const keywords = keywordsRes.data || [];
    const energyZips = energyZipsRes.data || [];
    const earliest = earliestRes.data?.[0]?.issue_date || null;
    const latest = latestRes.data?.[0]?.issue_date || null;

    const totalPermits = clusters.reduce((sum: number, c: any) => sum + (c.count || 0), 0);

    // Group keywords by cluster_id
    const keywordsByCluster: Record<number, any[]> = {};
    for (const kw of keywords) {
      if (!keywordsByCluster[kw.cluster_id]) keywordsByCluster[kw.cluster_id] = [];
      keywordsByCluster[kw.cluster_id].push({ keyword: kw.keyword, frequency: kw.frequency });
    }

    // Aggregate energy stats across all ZIPs
    const energyTotals = energyZips.reduce((acc: any, z: any) => {
      acc.solar += z.solar || 0;
      acc.battery += z.battery || 0;
      acc.evCharger += z.ev_charger || 0;
      acc.generator += z.generator || 0;
      acc.panelUpgrade += z.panel_upgrade || 0;
      acc.hvac += z.hvac || 0;
      acc.totalCapacity += z.total_solar_capacity_kw || 0;
      return acc;
    }, { solar: 0, battery: 0, evCharger: 0, generator: 0, panelUpgrade: 0, hvac: 0, totalCapacity: 0 });

    const stats = {
      totalPermits,
      dateRange: earliest && latest ? { earliest, latest } : null,
      clusterDistribution: clusters.map((c: any) => ({
        id: c.id,
        name: c.name,
        count: c.count,
        percentage: c.percentage,
        keywords: keywordsByCluster[c.id] || [],
      })),
      topZips: energyZips.slice(0, 20).map((z: any) => ({
        zip: z.zip_code,
        count: z.total_energy_permits,
        solar: z.solar,
        battery: z.battery,
        ev_charger: z.ev_charger,
        generator: z.generator,
        panel_upgrade: z.panel_upgrade,
        hvac: z.hvac,
      })),
      energyStats: {
        battery: energyTotals.battery,
        solar: energyTotals.solar,
        panelUpgrade: energyTotals.panelUpgrade,
        generator: energyTotals.generator,
        hvac: energyTotals.hvac,
        evCharger: energyTotals.evCharger,
        solarStats: {
          total_permits: energyTotals.solar,
          with_capacity_data: 0,
          avg_capacity_kw: energyTotals.solar > 0 ? Math.round(energyTotals.totalCapacity / energyTotals.solar) : 0,
          total_capacity_kw: energyTotals.totalCapacity,
        },
      },
    };

    globalForStats.statsCache = stats;
    globalForStats.statsCacheTime = now;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Stats] Data loaded from Supabase in ${elapsed}s`);

    return stats;
  } catch (error) {
    console.error("Error loading stats:", error);
    return {
      totalPermits: 0,
      dateRange: null,
      clusterDistribution: [],
      topZips: [],
      energyStats: {
        battery: 0, solar: 0, panelUpgrade: 0,
        generator: 0, hvac: 0, evCharger: 0,
        solarStats: { total_permits: 0, with_capacity_data: 0, avg_capacity_kw: 0, total_capacity_kw: 0 },
      },
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
  return NextResponse.json({ message: "Cache cleared (memory)" });
}
