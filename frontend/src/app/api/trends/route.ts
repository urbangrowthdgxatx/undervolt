import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Cache in memory for performance
const globalForTrends = global as unknown as { trendsCache: any | null };
if (!globalForTrends.trendsCache) {
  globalForTrends.trendsCache = null;
}

export async function GET() {
  // Check memory cache
  if (globalForTrends.trendsCache) {
    console.log("[Trends] Returning cached data");
    return NextResponse.json(globalForTrends.trendsCache);
  }

  try {
    console.log("[Trends] Loading from Supabase...");
    const startTime = Date.now();

    // Load from trends table
    const { data: trendsData, error: trendsError } = await supabase
      .from("trends")
      .select("*")
      .eq("period_type", "month")
      .order("period", { ascending: false })
      .limit(120);

    if (trendsError) {
      console.error("[Trends] Supabase trends error:", trendsError);
    }

    // Query generator counts by month from permits table
    const { data: generatorData, error: genError } = await supabase
      .from("permits")
      .select("issue_date")
      .eq("energy_type", "generator")
      .not("issue_date", "is", null);

    if (genError) {
      console.error("[Trends] Supabase generator error:", genError);
    }

    // Aggregate generators by month
    const genByMonth: Record<string, number> = {};
    for (const p of generatorData || []) {
      const month = p.issue_date?.substring(0, 7); // YYYY-MM
      if (month) {
        genByMonth[month] = (genByMonth[month] || 0) + 1;
      }
    }

    const result = {
      monthly: (trendsData || []).map((t) => ({
        month: t.period,
        total: t.total_permits,
        solar: t.solar,
        battery: t.battery,
        ev_charger: t.ev_charger,
        generator: genByMonth[t.period] || 0,
        panel_upgrade: 0,
        hvac: 0,
      })),
      lastUpdated: new Date().toISOString(),
    };

    globalForTrends.trendsCache = result;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `[Trends] Loaded ${(trendsData || []).length} months from Supabase in ${elapsed}s`
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error loading trends:", error);
    return NextResponse.json(
      { monthly: [], error: "Failed to load trends data" },
      { status: 500 }
    );
  }
}

// Clear cache
export async function POST() {
  globalForTrends.trendsCache = null;
  return NextResponse.json({ message: "Cache cleared" });
}
