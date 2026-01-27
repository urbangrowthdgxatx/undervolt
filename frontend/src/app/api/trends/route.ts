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

    // Load from trends table, filter to monthly
    const { data: trendsData, error } = await supabase
      .from("trends")
      .select("*")
      .eq("period_type", "month")
      .order("period", { ascending: false })
      .limit(60);

    if (error) {
      console.error("[Trends] Supabase error:", error);
      throw error;
    }

    const result = {
      monthly: (trendsData || []).map((t) => ({
        month: t.period,
        total: t.total_permits,
        solar: t.solar,
        battery: t.battery,
        ev_charger: t.ev_charger,
        generator: 0,
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
