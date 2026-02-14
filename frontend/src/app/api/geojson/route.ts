import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Cache in memory for performance (5-minute TTL)
const CACHE_TTL_MS = 5 * 60 * 1000;
const globalForGeoJSON = global as unknown as { geoJSONCache: any | null; geoJSONCacheTime: number };
if (!globalForGeoJSON.geoJSONCache) {
  globalForGeoJSON.geoJSONCache = null;
  globalForGeoJSON.geoJSONCacheTime = 0;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedLimit = Math.min(parseInt(searchParams.get("limit") || "50000"), 50000);

  // Check memory cache (with TTL) — only serve cache when default limit
  const cacheAge = Date.now() - globalForGeoJSON.geoJSONCacheTime;
  if (requestedLimit === 50000 && globalForGeoJSON.geoJSONCache && cacheAge < CACHE_TTL_MS) {
    console.log("[GeoJSON] Returning cached data (age: " + Math.round(cacheAge / 1000) + "s)");
    return NextResponse.json(globalForGeoJSON.geoJSONCache);
  }

  try {
    console.log("[GeoJSON] Loading from Supabase...");
    const startTime = Date.now();

    // Load cluster names
    const { data: clustersData } = await supabase
      .from("clusters")
      .select("id, name");

    const clusterMap = (clustersData || []).reduce(
      (acc: Record<number, { name: string }>, c) => {
        acc[c.id] = { name: c.name };
        return acc;
      },
      {}
    );

    // Get permits with valid coordinates
    // NOTE: Supabase default row limit is 1000. Must increase in Dashboard > API Settings for this to return 50K.
    const { data, error } = await supabase
      .from("permits")
      .select(
        "id, permit_number, latitude, longitude, zip_code, cluster_id, energy_type, solar_capacity_kw, issue_date"
      )
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .limit(requestedLimit);

    if (error) {
      console.error("[GeoJSON] Supabase error:", error);
      throw error;
    }

    // Compute cluster counts from returned data
    const clusterCounts: Record<number, number> = {};
    for (const p of data || []) {
      if (p.cluster_id != null) {
        clusterCounts[p.cluster_id] = (clusterCounts[p.cluster_id] || 0) + 1;
      }
    }

    // Convert to GeoJSON
    const geojson = {
      type: "FeatureCollection",
      features: (data || []).map((p) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [p.longitude, p.latitude],
        },
        properties: {
          id: p.id,
          permit_number: p.permit_number,
          zip_code: p.zip_code,
          cluster_id: p.cluster_id,
          cluster_name:
            clusterMap[p.cluster_id || 0]?.name ||
            `Cluster ${p.cluster_id}`,
          total_permits: clusterCounts[p.cluster_id || 0] || 0,
          energy_type: p.energy_type,
          solar_capacity_kw: p.solar_capacity_kw,
          issue_date: p.issue_date,
        },
      })),
    };

    // Cache result with timestamp
    globalForGeoJSON.geoJSONCache = geojson;
    globalForGeoJSON.geoJSONCacheTime = Date.now();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `[GeoJSON] Generated ${geojson.features.length} features in ${elapsed}s`
    );

    return NextResponse.json(geojson);
  } catch (error) {
    console.error("Error generating GeoJSON:", error);
    return NextResponse.json(
      {
        type: "FeatureCollection",
        features: [],
        error: "Failed to load GeoJSON data",
      },
      { status: 500 }
    );
  }
}

// Clear cache
export async function POST() {
  globalForGeoJSON.geoJSONCache = null;
  return NextResponse.json({ message: "Cache cleared" });
}
