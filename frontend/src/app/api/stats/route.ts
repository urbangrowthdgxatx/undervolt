import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

let cachedStats: any | null = null;

function loadStats() {
  if (cachedStats) {
    return cachedStats;
  }

  try {
    // Load cluster names
    const namesPath = join(process.cwd(), '..', 'output', 'cluster_names.json');
    const clusterNames = JSON.parse(readFileSync(namesPath, 'utf-8'));

    // Load permit data
    const dataPath = join(process.cwd(), '..', 'output', 'permit_summary_by_zip.csv');
    const csvContent = readFileSync(dataPath, 'utf-8');
    const lines = csvContent.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',');

    // Parse all data for stats
    const permits = lines.slice(1).map(line => {
      const values = line.split(',');
      const row: any = {};
      headers.forEach((header, i) => {
        row[header.trim()] = values[i]?.trim() || '';
      });
      return row;
    });

    // Calculate statistics
    const totalPermits = permits.length;

    // Cluster distribution
    const clusterCounts: Record<string, number> = {};
    permits.forEach(p => {
      const cluster = p.f_cluster || '0';
      clusterCounts[cluster] = (clusterCounts[cluster] || 0) + 1;
    });

    const clusterDistribution = Object.entries(clusterCounts).map(([id, count]) => ({
      id: parseInt(id),
      name: clusterNames[id]?.name || `Cluster ${id}`,
      count,
      percentage: (count / totalPermits) * 100,
    })).sort((a, b) => b.count - a.count);

    // ZIP code stats
    const zipCounts: Record<string, number> = {};
    permits.forEach(p => {
      const zip = p.zip_code;
      if (zip) {
        zipCounts[zip] = (zipCounts[zip] || 0) + 1;
      }
    });

    const topZips = Object.entries(zipCounts)
      .map(([zip, count]) => ({ zip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Energy infrastructure counts (from feature columns)
    const energyStats = {
      solar: permits.filter(p => p.f_description_kw_solar === '1' || p.f_description_kw_solar === 'True').length,
      hvac: permits.filter(p => p.f_description_kw_hvac === '1' || p.f_description_kw_hvac === 'True').length,
      electrical: permits.filter(p => p.f_description_kw_electrical === '1' || p.f_description_kw_electrical === 'True').length,
      newConstruction: permits.filter(p => p.f_description_kw_new === '1' || p.f_description_kw_new === 'True').length,
      remodels: permits.filter(p => p.f_description_kw_remodel === '1' || p.f_description_kw_remodel === 'True').length,
    };

    cachedStats = {
      totalPermits,
      clusterDistribution,
      topZips,
      energyStats,
      clusterNames,
      lastUpdated: new Date().toISOString(),
    };

    return cachedStats;
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
  const stats = loadStats();
  return NextResponse.json(stats);
}

// Clear cache endpoint
export async function POST() {
  cachedStats = null;
  return NextResponse.json({ message: 'Cache cleared' });
}
