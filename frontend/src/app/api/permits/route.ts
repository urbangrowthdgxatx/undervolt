import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// Cache the data in memory
let cachedData: any[] | null = null;
let clusterNames: Record<string, any> | null = null;

function loadData() {
  if (cachedData && clusterNames) {
    return { permits: cachedData, names: clusterNames };
  }

  try {
    // Load cluster names
    const namesPath = join(process.cwd(), '..', 'output', 'cluster_names.json');
    const namesContent = readFileSync(namesPath, 'utf-8');
    clusterNames = JSON.parse(namesContent);

    // Load permit data (sample for now - full dataset is too large)
    const dataPath = join(process.cwd(), '..', 'output', 'permit_summary_by_zip.csv');
    const csvContent = readFileSync(dataPath, 'utf-8');

    // Parse CSV (simple parser for demo - could use papaparse for production)
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');

    // Take first 10,000 rows for performance
    cachedData = lines.slice(1, 10001)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',');
        const row: any = {};
        headers.forEach((header, i) => {
          row[header.trim()] = values[i]?.trim() || '';
        });
        return row;
      });

    return { permits: cachedData, names: clusterNames };
  } catch (error) {
    console.error('Error loading data:', error);
    return { permits: [], names: {} };
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cluster = searchParams.get('cluster');
  const zip = searchParams.get('zip');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  const { permits, names } = loadData();

  // Filter data
  let filtered = permits;

  if (cluster) {
    filtered = filtered.filter((p: any) => p.f_cluster === cluster);
  }

  if (zip) {
    filtered = filtered.filter((p: any) => p.zip_code === zip);
  }

  // Paginate
  const paginated = filtered.slice(offset, offset + limit);

  // Add cluster names to response
  const enriched = paginated.map((p: any) => ({
    ...p,
    cluster_name: names?.[p.f_cluster]?.name || `Cluster ${p.f_cluster}`,
  }));

  return NextResponse.json({
    data: enriched,
    total: filtered.length,
    offset,
    limit,
    cluster_names: names,
  });
}
