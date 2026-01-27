import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Use global to persist across hot reloads in development
const globalForStats = global as unknown as { statsCache: any | null };
if (!globalForStats.statsCache) {
  globalForStats.statsCache = null;
}

async function loadStats() {
  if (globalForStats.statsCache) {
    console.log("[Stats] Returning cached data from memory");
    return globalForStats.statsCache;
  }

  console.log("[Stats] Loading from Supabase...");
  const startTime = Date.now();

  try {
    const { data, error } = await supabase.rpc("get_dashboard_stats");

    if (error) {
      console.error("[Stats] RPC error:", error);
      throw error;
    }

    const stats = data as Record<string, unknown>;

    // Cache in memory
    globalForStats.statsCache = stats;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Stats] Data loaded from Supabase in ${elapsed}s`);

    return stats;
  } catch (error) {
    console.error("Error loading stats:", error);
    return {
      totalPermits: 0,
      clusterDistribution: [],
      topZips: [],
      energyStats: {},
      llmCategories: {},
      error: "Failed to load stats",
    };
  }
}

export async function GET() {
  const stats = await loadStats();
  return NextResponse.json(stats);
}

// Clear cache endpoint
export async function POST() {
  globalForStats.statsCache = null;
  return NextResponse.json({ message: "Cache cleared (memory)" });
}
