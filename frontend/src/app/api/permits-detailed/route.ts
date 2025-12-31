import { NextRequest, NextResponse } from 'next/server';
import { db, permits } from '@/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cluster = searchParams.get('cluster');
  const limit = parseInt(searchParams.get('limit') || '1000');

  try {
    console.log(`[Permits API] Query: cluster=${cluster}, limit=${limit}`);
    const startTime = Date.now();

    // Build query
    let query = db.select().from(permits);

    // Filter by cluster if specified
    if (cluster) {
      query = query.where(eq(permits.clusterId, parseInt(cluster))) as any;
    }

    // Apply limit
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
