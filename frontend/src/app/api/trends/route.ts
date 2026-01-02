import { NextResponse } from 'next/server';
import { db, permits, trends } from '@/db';
import { sql } from 'drizzle-orm';

// Cache in memory for performance
const globalForTrends = global as unknown as { trendsCache: any | null };
if (!globalForTrends.trendsCache) {
  globalForTrends.trendsCache = null;
}

export async function GET() {
  // Check memory cache
  if (globalForTrends.trendsCache) {
    console.log('[Trends] Returning cached data');
    return NextResponse.json(globalForTrends.trendsCache);
  }

  try {
    console.log('[Trends] Loading from database...');
    const startTime = Date.now();

    // Try loading from trends table first
    const trendsData = await db.select().from(trends);

    // Filter to monthly data only
    const monthlyTrends = trendsData.filter(t => t.periodType === 'month');

    if (monthlyTrends.length > 0) {
      // Sort by period descending
      const sorted = monthlyTrends.sort((a, b) => b.period.localeCompare(a.period));

      // Format from trends table
      const result = {
        monthly: sorted.map((t) => ({
          month: t.period,
          total: t.totalPermits,
          solar: t.solar,
          battery: t.battery,
          ev_charger: t.evCharger,
          generator: 0, // Not in schema
          panel_upgrade: 0, // Not in schema
          hvac: 0, // Not in schema
        })),
        lastUpdated: new Date().toISOString(),
      };

      globalForTrends.trendsCache = result;

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[Trends] Loaded ${sorted.length} months from trends table in ${elapsed}s`);

      return NextResponse.json(result);
    }

    // Fallback: Calculate from permits table
    console.log('[Trends] Trends table empty, calculating from permits...');

    const monthlyData = await db
      .select({
        month: sql<string>`strftime('%Y-%m', ${permits.issueDate})`,
        total: sql<number>`count(*)`,
        solar: sql<number>`sum(case when ${permits.energyType} = 'solar' then 1 else 0 end)`,
        battery: sql<number>`sum(case when ${permits.energyType} = 'battery' then 1 else 0 end)`,
        ev_charger: sql<number>`sum(case when ${permits.energyType} = 'ev_charger' then 1 else 0 end)`,
        generator: sql<number>`sum(case when ${permits.energyType} = 'generator' then 1 else 0 end)`,
        panel_upgrade: sql<number>`sum(case when ${permits.energyType} = 'panel_upgrade' then 1 else 0 end)`,
        hvac: sql<number>`sum(case when ${permits.energyType} = 'hvac' then 1 else 0 end)`,
      })
      .from(permits)
      .where(sql`${permits.issueDate} IS NOT NULL AND ${permits.issueDate} != ''`)
      .groupBy(sql`strftime('%Y-%m', ${permits.issueDate})`);

    // Sort by month descending and limit to last 60 months
    const sorted = monthlyData
      .filter(m => m.month)
      .sort((a, b) => (b.month || '').localeCompare(a.month || ''))
      .slice(0, 60);

    const result = {
      monthly: sorted.map((m) => ({
        month: m.month,
        total: Number(m.total) || 0,
        solar: Number(m.solar) || 0,
        battery: Number(m.battery) || 0,
        ev_charger: Number(m.ev_charger) || 0,
        generator: Number(m.generator) || 0,
        panel_upgrade: Number(m.panel_upgrade) || 0,
        hvac: Number(m.hvac) || 0,
      })),
      lastUpdated: new Date().toISOString(),
    };

    globalForTrends.trendsCache = result;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Trends] Calculated ${sorted.length} months from permits in ${elapsed}s`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error loading trends:', error);
    return NextResponse.json(
      { monthly: [], error: 'Failed to load trends data' },
      { status: 500 }
    );
  }
}

// Clear cache
export async function POST() {
  globalForTrends.trendsCache = null;
  return NextResponse.json({ message: 'Cache cleared' });
}
