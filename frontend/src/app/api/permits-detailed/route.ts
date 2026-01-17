import { NextRequest, NextResponse } from 'next/server';
import { db, permits } from '@/db';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cluster = searchParams.get('cluster');
  const energyOnly = searchParams.get('energyOnly') === 'true';
  const energyType = searchParams.get('energyType');
  const projectType = searchParams.get('projectType');
  const buildingType = searchParams.get('buildingType');
  const trade = searchParams.get('trade');
  const limit = parseInt(searchParams.get('limit') || '1000');

  try {
    console.log(`[Permits API] Query: cluster=${cluster}, energyOnly=${energyOnly}, energyType=${energyType}, projectType=${projectType}, buildingType=${buildingType}, trade=${trade}, limit=${limit}`);
    const startTime = Date.now();

    // Build conditions array
    const conditions = [];

    if (cluster) {
      conditions.push(eq(permits.clusterId, parseInt(cluster)));
    }

    if (energyType) {
      conditions.push(eq(permits.energyType, energyType));
    } else if (energyOnly) {
      conditions.push(eq(permits.isEnergyPermit, true));
    }

    // LLM category filters
    if (projectType) {
      conditions.push(eq(permits.projectType, projectType));
    }
    if (buildingType) {
      conditions.push(eq(permits.buildingType, buildingType));
    }
    if (trade) {
      conditions.push(eq(permits.trade, trade));
    }

    // Build query - select all columns from permits table
    let query = db.select().from(permits);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.limit(limit) as any;

    // Execute query
    const result = await query;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Permits API] Returned ${result.length} permits in ${elapsed}s`);

    return NextResponse.json({
      permits: result,
      total: result.length,
    });
  } catch (error) {
    console.error('Error loading permits:', error);
    return NextResponse.json(
      { error: 'Failed to load permits', permits: [], total: 0 },
      { status: 500 }
    );
  }
}
