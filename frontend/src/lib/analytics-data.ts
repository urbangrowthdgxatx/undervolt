/**
 * Analytics data integration
 *
 * Provides access to the analytics we generated:
 * - Cluster names and statistics
 * - Energy infrastructure data
 * - Time series trends
 * - Geographic distribution
 */

import clusterNames from '../../public/data/cluster_names.json';
import energyData from '../../public/data/energy_infrastructure.json';
import trendsData from '../../public/data/trends.json';
import geoData from '../../public/data/permits.geojson';

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
 * Get all cluster information
 */
export function getClusters(): ClusterInfo[] {
  return Object.entries(clusterNames).map(([id, info]: [string, any]) => ({
    id: parseInt(id),
    name: info.name,
    size: info.size,
    percentage: info.percentage,
    top_keywords: info.top_keywords,
  }));
}

/**
 * Get cluster info by ID
 */
export function getCluster(id: number): ClusterInfo | undefined {
  const info = (clusterNames as any)[id.toString()];
  if (!info) return undefined;

  return {
    id,
    name: info.name,
    size: info.size,
    percentage: info.percentage,
    top_keywords: info.top_keywords,
  };
}

/**
 * Get energy infrastructure data
 */
export function getEnergyData(): EnergyStats {
  return {
    total_energy_permits: energyData.metadata.total_energy_permits,
    energy_percentage: energyData.metadata.energy_percentage,
    solar_stats: energyData.summary.solar_stats,
    by_type: energyData.summary.by_type,
    by_zip: energyData.by_zip.slice(0, 20), // Top 20
  };
}

/**
 * Get trends data
 */
export function getTrends(): TrendsData {
  return trendsData as TrendsData;
}

/**
 * Get fastest growing clusters
 */
export function getFastestGrowingClusters(limit: number = 5) {
  const trends = getTrends();
  const clusters = getClusters();

  return trends.growth_rates
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
export function getEnergyLeaders(type: 'solar' | 'ev_charger' | 'battery' | 'generator', limit: number = 5) {
  const energy = getEnergyData();
  return energy.by_zip
    .sort((a, b) => b[type] - a[type])
    .slice(0, limit);
}

/**
 * Get key insights for chat context
 */
export function getKeyInsights(): string {
  const clusters = getClusters();
  const energy = getEnergyData();
  const fastestGrowing = getFastestGrowingClusters(5);
  const solarLeaders = getEnergyLeaders('solar', 3);
  const batteryLeaders = getEnergyLeaders('battery', 3);

  return `
## Cluster Analysis (8 Named Clusters)
${clusters.map(c => `- ${c.name}: ${c.size.toLocaleString()} permits (${c.percentage.toFixed(1)}%)`).join('\n')}

## Explosive Growth (CAGR)
${fastestGrowing.map((g, i) => `${i + 1}. ${g.name}: +${g.cagr.toFixed(1)}% CAGR`).join('\n')}

## Energy Infrastructure
- Total energy permits: ${energy.total_energy_permits.toLocaleString()} (${energy.energy_percentage}%)
- Solar: ${energy.solar_stats.total_permits.toLocaleString()} installations, avg ${energy.solar_stats.avg_capacity_kw} kW
- Total solar capacity: ${(energy.solar_stats.total_capacity_kw / 1000).toFixed(1)} MW
- EV Chargers: ${energy.by_type.ev_charger?.toLocaleString() || 0}
- Battery Systems: ${energy.by_type.battery?.toLocaleString() || 0} (surprising!)
- Generators: ${energy.by_type.generator?.toLocaleString() || 0}

## Top Energy ZIPs
Solar Leaders: ${solarLeaders.map(z => `${z.zip_code} (${z.solar})`).join(', ')}
Battery Leaders: ${batteryLeaders.map(z => `${z.zip_code} (${z.battery})`).join(', ')}

## Key Findings
- Demolition projects growing at +547% CAGR (urban redevelopment boom)
- ZIP 78758: Battery storage hub with ${batteryLeaders[0]?.battery || 801} systems
- ZIP 78744: Solar leader with ${solarLeaders[0]?.solar || 572} installations
- Batteries outnumber solar installations 4:1
  `.trim();
}

/**
 * Search for relevant data based on query
 */
export function searchAnalytics(query: string): string {
  const lowerQuery = query.toLowerCase();
  const results: string[] = [];

  // Check for cluster-related queries
  if (lowerQuery.includes('cluster') || lowerQuery.includes('type') || lowerQuery.includes('category')) {
    const clusters = getClusters();
    results.push('## Permit Clusters');
    results.push(clusters.map(c =>
      `- ${c.name}: ${c.size.toLocaleString()} permits (${c.percentage.toFixed(1)}%)`
    ).join('\n'));
  }

  // Check for growth-related queries
  if (lowerQuery.includes('grow') || lowerQuery.includes('trend') || lowerQuery.includes('increase')) {
    const growing = getFastestGrowingClusters(5);
    results.push('## Fastest Growing (CAGR)');
    results.push(growing.map((g, i) =>
      `${i + 1}. ${g.name}: +${g.cagr.toFixed(1)}% CAGR`
    ).join('\n'));
  }

  // Check for energy-related queries
  if (lowerQuery.includes('solar') || lowerQuery.includes('energy') || lowerQuery.includes('battery') ||
      lowerQuery.includes('ev') || lowerQuery.includes('grid')) {
    const energy = getEnergyData();
    results.push('## Energy Infrastructure');
    results.push(`- Solar: ${energy.solar_stats.total_permits.toLocaleString()} installations (avg ${energy.solar_stats.avg_capacity_kw} kW)`);
    results.push(`- Battery Systems: ${energy.by_type.battery?.toLocaleString() || 0}`);
    results.push(`- EV Chargers: ${energy.by_type.ev_charger?.toLocaleString() || 0}`);
    results.push(`- Total capacity: ${(energy.solar_stats.total_capacity_kw / 1000).toFixed(1)} MW`);

    if (lowerQuery.includes('solar')) {
      const leaders = getEnergyLeaders('solar', 5);
      results.push('\nTop Solar ZIPs:');
      results.push(leaders.map((z, i) =>
        `${i + 1}. ${z.zip_code}: ${z.solar} installations`
      ).join('\n'));
    }

    if (lowerQuery.includes('battery')) {
      const leaders = getEnergyLeaders('battery', 5);
      results.push('\nTop Battery ZIPs:');
      results.push(leaders.map((z, i) =>
        `${i + 1}. ${z.zip_code}: ${z.battery} systems`
      ).join('\n'));
    }
  }

  // If no specific matches, return key insights
  if (results.length === 0) {
    return getKeyInsights();
  }

  return results.join('\n\n');
}
