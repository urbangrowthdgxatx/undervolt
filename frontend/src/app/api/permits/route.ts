import { NextRequest, NextResponse } from 'next/server';
import { db, permits, clusters } from '@/db';
import { eq, sql, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cluster = searchParams.get('cluster');
  const zip = searchParams.get('zip');
  const energyType = searchParams.get('energyType');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    console.log(`[Permits API] Query: cluster=${cluster}, zip=${zip}, energyType=${energyType}, limit=${limit}, offset=${offset}`);
    const startTime = Date.now();

    // Build dynamic where conditions
    const conditions = [];

    if (cluster) {
      conditions.push(eq(permits.clusterId, parseInt(cluster)));
    }

    if (zip) {
      conditions.push(eq(permits.zipCode, zip));
    }

    if (energyType) {
      conditions.push(eq(permits.energyType, energyType));
    }

    // Get total count with filters
    const countQuery = conditions.length > 0
      ? db.select({ count: sql<number>`count(*)` }).from(permits).where(and(...conditions))
      : db.select({ count: sql<number>`count(*)` }).from(permits);

    const countResult = await countQuery;
    const total = Number(countResult[0]?.count) || 0;

    // Get paginated results
    let dataQuery = db.select().from(permits);

    if (conditions.length > 0) {
      dataQuery = dataQuery.where(and(...conditions)) as any;
    }

    const data = await dataQuery.limit(limit).offset(offset);

    // Get cluster names for enrichment
    const clustersData = await db.select().from(clusters);
    const clusterNames = clustersData.reduce((acc, c) => {
      acc[c.id] = { name: c.name, percentage: c.percentage };
      return acc;
    }, {} as Record<number, { name: string; percentage: number }>);

    // Enrich with cluster names
    const enriched = data.map((p) => ({
      ...p,
      cluster_name: clusterNames[p.clusterId || 0]?.name || `Cluster ${p.clusterId}`,
    }));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Permits API] Returned ${data.length}/${total} permits in ${elapsed}s`);

    return NextResponse.json({
      data: enriched,
      total,
      offset,
      limit,
      cluster_names: clusterNames,
    });
  } catch (error) {
    console.error('Error loading permits:', error);
    return NextResponse.json({
      data: [],
      total: 0,
      offset,
      limit,
      error: 'Failed to load permits',
    }, { status: 500 });
  }
}
