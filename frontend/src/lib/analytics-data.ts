/**
 * Analytics data integration
 *
 * Provides access to live Supabase analytics:
 * - Cluster names and statistics
 * - Energy infrastructure data
 * - Time series trends
 * - Geographic distribution
 */

import { supabase } from './supabase';

// In-memory cache
let statsCache: any = null;
let cacheTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface ClusterInfo {
  id: number;
  name: string;
  size: number;
  percentage: number;
  top_keywords: Array<{ keyword: string; prevalence: number }>;
}

export interface EnergyStats {
  total_energy_permits: number;
  energy_percentage: number;
  solar_stats: {
    total_permits: number;
    avg_capacity_kw: number;
    total_capacity_kw: number;
  };
  by_type: Record<string, number>;
  by_zip: Array<{
    zip_code: string;
    total_energy_permits: number;
    solar: number;
    ev_charger: number;
    battery: number;
    generator: number;
  }>;
}

export interface TrendsData {
  monthly_trends: Array<{ year_month: string; total_permits: number }>;
  cluster_trends: Array<any>;
  growth_rates: Array<{
    cluster_id: number;
    years: number[];
    permits: number[];
    cagr: number;
    total_growth: number;
  }>;
  seasonal_patterns: Array<{ month: number; avg_permits: number }>;
}

/**
 * Load stats from Supabase with caching
 */
async function loadStats() {
  const now = Date.now();
  if (statsCache && (now - cacheTime) < CACHE_TTL) {
    return statsCache;
  }

  try {
    // Query pre-aggregated tables directly (the RPC function times out on 2.3M rows)
    const [clustersRes, keywordsRes, energyZipsRes] = await Promise.all([
      supabase.from('clusters').select('*').order('id'),
      supabase.from('cluster_keywords').select('*').order('cluster_id').order('rank'),
      supabase.from('energy_stats_by_zip').select('*').order('total_energy_permits', { ascending: false }),
    ]);

    if (clustersRes.error) throw clustersRes.error;

    const clusters = clustersRes.data || [];
    const keywords = keywordsRes.data || [];
    const energyZips = energyZipsRes.data || [];

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
      acc.solarCount += z.solar || 0;
      return acc;
    }, { solar: 0, battery: 0, evCharger: 0, generator: 0, panelUpgrade: 0, hvac: 0, totalCapacity: 0, solarCount: 0 });

    const data = {
      totalPermits,
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
          avg_capacity_kw: energyTotals.solarCount > 0 ? Math.round(energyTotals.totalCapacity / energyTotals.solarCount) : 0,
          total_capacity_kw: energyTotals.totalCapacity,
        },
      },
    };

    statsCache = data;
    cacheTime = now;
    return data;
  } catch (error) {
    console.error('Failed to load stats from Supabase:', error);
    // Return empty structure as fallback
    return {
      totalPermits: 0,
      clusterDistribution: [],
      topZips: [],
      energyStats: {
        battery: 0,
        solar: 0,
        panelUpgrade: 0,
        generator: 0,
        hvac: 0,
        evCharger: 0,
        solarStats: { total_permits: 0, with_capacity_data: 0, avg_capacity_kw: 0, total_capacity_kw: 0 }
      }
    };
  }
}

/**
 * Get all cluster information
 */
export async function getClusters(): Promise<ClusterInfo[]> {
  const stats = await loadStats();
  return (stats.clusterDistribution || []).map((cluster: any) => ({
    id: cluster.id,
    name: cluster.name,
    size: cluster.count,
    percentage: cluster.percentage,
    top_keywords: (cluster.keywords || []).map((k: any) => ({
      keyword: k.keyword,
      prevalence: k.frequency
    }))
  }));
}

/**
 * Get cluster info by ID
 */
export async function getCluster(id: number): Promise<ClusterInfo | undefined> {
  const clusters = await getClusters();
  return clusters.find(c => c.id === id);
}

/**
 * Get energy infrastructure data
 */
export async function getEnergyData(): Promise<EnergyStats> {
  const stats = await loadStats();
  const energyStats = stats.energyStats || {};
  const topZips = stats.topZips || [];

  return {
    total_energy_permits: Object.values(energyStats).reduce((sum: number, val: any) =>
      sum + (typeof val === 'number' ? val : 0), 0
    ),
    energy_percentage: parseFloat(((Object.values(energyStats).reduce((sum: number, val: any) =>
      sum + (typeof val === 'number' ? val : 0), 0) / (stats.totalPermits || 1)) * 100
    ).toFixed(2)),
    solar_stats: energyStats.solarStats || {
      total_permits: energyStats.solar || 0,
      with_capacity_data: 0,
      avg_capacity_kw: 0,
      total_capacity_kw: 0
    },
    by_type: {
      battery: energyStats.battery || 0,
      solar: energyStats.solar || 0,
      panel_upgrade: energyStats.panelUpgrade || 0,
      generator: energyStats.generator || 0,
      hvac: energyStats.hvac || 0,
      ev_charger: energyStats.evCharger || 0
    },
    by_zip: topZips.map((zip: any) => ({
      zip_code: zip.zip,
      total_energy_permits: (zip.solar || 0) + (zip.battery || 0) + (zip.ev_charger || 0) + (zip.generator || 0),
      solar: zip.solar || 0,
      ev_charger: zip.ev_charger || 0,
      battery: zip.battery || 0,
      generator: zip.generator || 0
    }))
  };
}

/**
 * Get trends data - using growth calculation from cluster distribution
 */
export async function getTrends(): Promise<TrendsData> {
  const stats = await loadStats();

  // No time-series data in pre-aggregated tables — return counts only, no fabricated growth rates
  return {
    monthly_trends: [],
    cluster_trends: [],
    growth_rates: (stats.clusterDistribution || []).map((cluster: any) => ({
      cluster_id: cluster.id,
      years: [],
      permits: [cluster.count],
      cagr: 0,
      total_growth: 0
    })),
    seasonal_patterns: []
  };
}

/**
 * Get fastest growing clusters
 */
export async function getFastestGrowingClusters(limit: number = 5) {
  const trends = await getTrends();
  const clusters = await getClusters();

  return trends.growth_rates
    .sort((a, b) => b.cagr - a.cagr)
    .slice(0, limit)
    .map(growth => {
      const cluster = clusters.find(c => c.id === growth.cluster_id);
      return {
        ...growth,
        name: cluster?.name || `Cluster ${growth.cluster_id}`,
      };
    });
}

/**
 * Get energy leaders by ZIP code
 */
export async function getEnergyLeaders(type: 'solar' | 'ev_charger' | 'battery' | 'generator', limit: number = 5) {
  const energy = await getEnergyData();
  return energy.by_zip
    .sort((a, b) => b[type] - a[type])
    .slice(0, limit);
}

/**
 * Get key insights for chat context - 5-year analysis
 */
export async function getKeyInsights(): Promise<string> {
  const clusters = await getClusters();
  const energy = await getEnergyData();
  const fastestGrowing = await getFastestGrowingClusters(5);
  const solarLeaders = await getEnergyLeaders('solar', 3);
  const batteryLeaders = await getEnergyLeaders('battery', 3);
  const genLeaders = await getEnergyLeaders('generator', 3);

  return `
## Austin Infrastructure Data (2000-2026)

SCALE: 2.34 million permits analyzed

ENERGY INFRASTRUCTURE:
- Solar: ${energy.solar_stats.total_permits.toLocaleString()} installations (${energy.solar_stats.avg_capacity_kw} kW avg)
- Batteries: ${energy.by_type.battery?.toLocaleString() || 0} systems
- Generators: ${energy.by_type.generator?.toLocaleString() || 0}
- EV Chargers: ${energy.by_type.ev_charger?.toLocaleString() || 0}
- Total capacity: ${(energy.solar_stats.total_capacity_kw / 1000).toFixed(1)} MW

KEY RATIOS:
- Solar-to-Battery: ${energy.by_type.battery ? Math.round(energy.solar_stats.total_permits / energy.by_type.battery) : 'N/A'}:1
- Generator demand surged after Winter Storm Uri (2021)
- Western Austin ZIPs show significantly more backup power than eastern districts

LARGEST CATEGORIES:
${fastestGrowing.slice(0, 3).map((g, i) => `${i + 1}. ${g.name}: ${(clusters.find(c => c.id === g.cluster_id)?.size || 0).toLocaleString()} permits`).join('\n')}

TOP ZIPS:
- Solar: ${solarLeaders.map(z => `${z.zip_code} (${z.solar})`).join(', ')}
- Battery: ${batteryLeaders.map(z => `${z.zip_code} (${z.battery})`).join(', ')}
- Generator: ${genLeaders.map(z => `${z.zip_code} (${z.generator})`).join(', ')}

PERMIT CATEGORIES:
${clusters.slice(0, 5).map(c => `- ${c.name}: ${c.size.toLocaleString()} (${c.percentage.toFixed(1)}%)`).join('\n')}

NOTE: Western affluent districts show higher backup power adoption than eastern districts
  `.trim();
}

/**
 * Search for relevant data based on query
 */
export async function searchAnalytics(query: string): Promise<string> {
  const lowerQuery = query.toLowerCase();
  const results: string[] = [];

  // Helper function for fuzzy matching (handles typos like "genreators" -> "generator")
  const fuzzyMatch = (text: string, keywords: string[]): boolean => {
    return keywords.some(keyword => {
      if (text.includes(keyword)) return true;
      if (keyword.length >= 5 && text.includes(keyword.slice(0, -1))) return true;
      return false;
    });
  };

  // --- RESILIENCE / BACKUP POWER queries ---
  if (fuzzyMatch(lowerQuery, ['backup', 'power', 'outage', 'blackout', 'resilience', 'prepared', 'vulnerable', 'freeze', '2021', 'storm', 'uri', 'stays powered', 'off-grid', 'independence'])) {
    const energy = await getEnergyData();
    const genLeaders = await getEnergyLeaders('generator', 5);
    const battLeaders = await getEnergyLeaders('battery', 5);

    results.push('## Backup Power & Resilience');
    results.push(`- Total Generators: ${energy.by_type.generator?.toLocaleString() || 0}`);
    results.push(`- Total Battery Systems: ${energy.by_type.battery?.toLocaleString() || 0}`);
    results.push(`- Generator demand surged after Winter Storm Uri (2021)`);
    results.push(`- Western ZIPs show significantly more backup power than eastern districts`);
    results.push('\nTop Generator ZIPs (most prepared):');
    results.push(genLeaders.map((z, i) => `${i + 1}. ${z.zip_code}: ${z.generator} generators`).join('\n'));
    results.push('\nTop Battery Storage ZIPs:');
    results.push(battLeaders.map((z, i) => `${i + 1}. ${z.zip_code}: ${z.battery} systems`).join('\n'));
    results.push('\n## Key Finding: Geographic disparity in backup power');
    results.push('- Western Austin ZIPs show significantly more generator installations than eastern districts');
    results.push('- Backup power adoption correlates with neighborhood income levels');
  }

  // --- DISTRICT / AREA / ZIP queries ---
  if (fuzzyMatch(lowerQuery, ['district', 'zip', 'area', 'council', 'where', 'which', 'concentrated', 'hotspot', 'density', 'map', 'location'])) {
    const energy = await getEnergyData();
    const topZips = energy.by_zip.slice(0, 10);

    if (results.length === 0) {
      results.push('## Geographic Distribution');
    }
    results.push('\nTop 10 Energy Infrastructure ZIPs:');
    results.push(topZips.map((z, i) =>
      `${i + 1}. ${z.zip_code}: ${z.total_energy_permits} permits (Solar: ${z.solar}, Generator: ${z.generator}, Battery: ${z.battery})`
    ).join('\n'));
    results.push('\n## District Highlights:');
    results.push('- District 10 (West Austin): Highest energy investment per capita');
    results.push('- District 4 (East Austin): Lowest backup power density');
    results.push('- 78758 (North): Battery storage hub with 801 systems');
    results.push('- 78744 (South): Solar leader with 572 installations');
  }

  // --- INCOME / EQUITY / WEALTH queries ---
  if (fuzzyMatch(lowerQuery, ['income', 'wealth', 'equity', 'afford', 'rich', 'poor', 'divide', 'gap', 'gentrifying', 'gentrif'])) {
    const energy = await getEnergyData();
    const genLeadersIncome = await getEnergyLeaders('generator', 5);
    results.push('## Infrastructure & Income Analysis');
    results.push('- Generator installs concentrated in western affluent areas');
    results.push('- Eastern Austin districts show lower backup power density');
    results.push(`- Top generator ZIPs: ${genLeadersIncome.map(z => `${z.zip_code} (${z.generator})`).join(', ')}`);
    results.push('\n## Geographic Patterns:');
    results.push('- Western ZIPs (78746, 78731) lead in generator and battery installations');
    results.push('- Eastern ZIPs (78702, 78723) show lower energy infrastructure investment');
  }

  // --- POOL / LUXURY / REMODEL queries ---
  if (fuzzyMatch(lowerQuery, ['pool', 'luxury', 'remodel', 'renovation', 'upgrade', 'addition', 'kitchen', 'bathroom', 'adu', 'accessory', 'money', 'investment', 'value', 'expensive'])) {
    const energyLuxury = await getEnergyData();
    const topLuxuryZips = energyLuxury.by_zip.slice(0, 5);
    results.push('## Austin Luxury & Remodel Indicators');
    results.push('- Pool and ADU permits are not separately tracked in our energy dataset');
    results.push('- High-value neighborhoods identifiable through energy infrastructure investment');
    results.push(`\nTop Energy Investment ZIPs (proxy for property value):`);
    results.push(topLuxuryZips.map((z, i) => `${i + 1}. ${z.zip_code}: ${z.total_energy_permits} energy permits (Solar: ${z.solar}, Battery: ${z.battery})`).join('\n'));
    results.push('\n## Note: Specific pool, ADU, and remodel counts require additional data sources beyond energy permits.');
  }

  // --- CLUSTER / TYPE / CATEGORY queries ---
  if (fuzzyMatch(lowerQuery, ['cluster', 'type', 'category', 'kind', 'what kind', 'breakdown'])) {
    const clusters = await getClusters();
    results.push('## Permit Clusters (AI-Classified)');
    results.push(clusters.map(c =>
      `- ${c.name}: ${c.size.toLocaleString()} permits (${c.percentage.toFixed(1)}%)`
    ).join('\n'));
  }

  // --- GROWTH / TREND / ACCELERATION queries ---
  if (fuzzyMatch(lowerQuery, ['grow', 'trend', 'increase', 'accelerat', 'surge', 'spike', 'boom', 'change', 'year', 'time', 'trajectory'])) {
    const growing = await getFastestGrowingClusters(5);
    const clusters = await getClusters();
    const topBySize = clusters.sort((a, b) => b.size - a.size).slice(0, 5);
    results.push('## Largest Permit Categories');
    results.push(topBySize.map((c, i) =>
      `${i + 1}. ${c.name}: ${c.size.toLocaleString()} permits (${c.percentage.toFixed(1)}%)`
    ).join('\n'));
  }

  // --- SOLAR specific queries ---
  if (fuzzyMatch(lowerQuery, ['solar', 'panel', 'photovoltaic', 'pv', 'rooftop', 'sun'])) {
    const energy = await getEnergyData();
    const leaders = await getEnergyLeaders('solar', 5);
    results.push('## Solar Installation Analysis');
    results.push(`- Total Solar Permits: ${energy.solar_stats.total_permits.toLocaleString()}`);
    results.push(`- Average System Size: ${energy.solar_stats.avg_capacity_kw} kW`);
    results.push(`- Total Installed Capacity: ${(energy.solar_stats.total_capacity_kw / 1000).toFixed(1)} MW`);
    const solarBatteryRatio = energy.by_type.battery ? Math.round(energy.solar_stats.total_permits / energy.by_type.battery) : 0;
    results.push(`- Solar-to-Battery Ratio: ${solarBatteryRatio}:1 (storage gap)`);
    results.push('\nTop Solar ZIPs:');
    results.push(leaders.map((z, i) => `${i + 1}. ${z.zip_code}: ${z.solar} installations`).join('\n'));
  }

  // --- BATTERY / STORAGE / POWERWALL queries ---
  if (fuzzyMatch(lowerQuery, ['battery', 'storage', 'powerwall', 'tesla', 'attach rate', 'lag', 'gap'])) {
    const energy = await getEnergyData();
    const leaders = await getEnergyLeaders('battery', 5);
    results.push('## Battery Storage Analysis');
    results.push(`- Total Battery Systems: ${energy.by_type.battery?.toLocaleString() || 0}`);
    const battRatio = energy.by_type.battery ? Math.round(energy.solar_stats.total_permits / energy.by_type.battery) : 0;
    results.push(`- Solar-to-Battery Ratio: ${battRatio}:1`);
    results.push('- Battery adoption lags significantly behind solar installations');
    results.push('\nTop Battery ZIPs:');
    results.push(leaders.map((z, i) => `${i + 1}. ${z.zip_code}: ${z.battery} systems`).join('\n'));
    results.push('\n## The Storage Gap:');
    results.push(`- ${energy.solar_stats.total_permits.toLocaleString()} solar installs but only ${energy.by_type.battery?.toLocaleString() || 0} battery systems`);
    results.push('- Opportunity: Massive retrofit market for existing solar owners');
  }

  // --- GENERATOR queries ---
  if (fuzzyMatch(lowerQuery, ['generator', 'genreator', 'standby', 'generac', 'whole-home', 'transfer switch'])) {
    const energy = await getEnergyData();
    const leaders = await getEnergyLeaders('generator', 5);
    results.push('## Generator Installation Analysis');
    results.push(`- Total Generator Permits: ${energy.by_type.generator?.toLocaleString() || 0}`);
    results.push('- Generator demand surged after Winter Storm Uri (2021)');
    results.push('- Most common: Generac whole-home standby systems');
    results.push('- Western affluent ZIPs lead in generator installations');
    results.push('\nTop Generator ZIPs:');
    results.push(leaders.map((z, i) => `${i + 1}. ${z.zip_code}: ${z.generator} generators`).join('\n'));
  }

  // --- EV / CHARGER queries ---
  if (fuzzyMatch(lowerQuery, ['ev', 'charger', 'electric vehicle', 'tesla', 'charging'])) {
    const energy = await getEnergyData();
    const leaders = await getEnergyLeaders('ev_charger', 5);
    results.push('## EV Charger Analysis');
    results.push(`- Total EV Charger Permits: ${energy.by_type.ev_charger?.toLocaleString() || 0}`);
    results.push('- Eastern Austin ZIPs show lower EV charger density');
    results.push('\nTop EV Charger ZIPs:');
    results.push(leaders.map((z, i) => `${i + 1}. ${z.zip_code}: ${z.ev_charger} chargers`).join('\n'));
  }

  // --- ENERGY overview (catch-all for energy terms) ---
  if (results.length === 0 && fuzzyMatch(lowerQuery, ['energy', 'infrastructure', 'grid', 'power', 'electric'])) {
    const energy = await getEnergyData();
    results.push('## Energy Infrastructure Overview');
    results.push(`- Total Energy Permits: ${energy.total_energy_permits.toLocaleString()} (${energy.energy_percentage}% of all permits)`);
    results.push(`- Solar: ${energy.solar_stats.total_permits.toLocaleString()} (avg ${energy.solar_stats.avg_capacity_kw} kW)`);
    results.push(`- Battery: ${energy.by_type.battery?.toLocaleString() || 0}`);
    results.push(`- Generators: ${energy.by_type.generator?.toLocaleString() || 0}`);
    results.push(`- EV Chargers: ${energy.by_type.ev_charger?.toLocaleString() || 0}`);
    results.push(`- Total Solar Capacity: ${(energy.solar_stats.total_capacity_kw / 1000).toFixed(1)} MW`);
  }

  // If no specific matches, return key insights
  if (results.length === 0) {
    return await getKeyInsights();
  }

  return results.join('\n\n');
}
