import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cluster = searchParams.get("cluster");
  const energyOnly = searchParams.get("energyOnly") === "true";
  const energyType = searchParams.get("energyType");
  const projectType = searchParams.get("projectType");
  const buildingType = searchParams.get("buildingType");
  const trade = searchParams.get("trade");
  const limit = parseInt(searchParams.get("limit") || "1000");

  try {
    console.log(
      `[Permits Detailed API] Query: cluster=${cluster}, energyOnly=${energyOnly}, energyType=${energyType}, projectType=${projectType}, buildingType=${buildingType}, trade=${trade}, limit=${limit}`
    );
    const startTime = Date.now();

    // Build query with conditional filters
    let query = supabase.from("permits").select("*");

    if (cluster) {
      query = query.eq("cluster_id", parseInt(cluster));
    }

    if (energyType) {
      query = query.eq("energy_type", energyType);
    } else if (energyOnly) {
      query = query.eq("is_energy_permit", true);
    }

    // LLM category filters
    if (projectType) {
      query = query.eq("project_type", projectType);
    }
    if (buildingType) {
      query = query.eq("building_type", buildingType);
    }
    if (trade) {
      query = query.eq("trade", trade);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error("[Permits Detailed API] Supabase error:", error);
      throw error;
    }

    // Map snake_case to camelCase for frontend consumers
    const result = (data || []).map((p) => ({
      id: p.id,
      permitNumber: p.permit_number,
      address: p.address,
      zipCode: p.zip_code,
      latitude: p.latitude,
      longitude: p.longitude,
      clusterId: p.cluster_id,
      workDescription: p.work_description,
      isEnergyPermit: p.is_energy_permit,
      energyType: p.energy_type,
      solarCapacityKw: p.solar_capacity_kw,
      issueDate: p.issue_date,
      createdAt: p.created_at,
      projectType: p.project_type,
      buildingType: p.building_type,
      scale: p.scale,
      trade: p.trade,
      isGreen: p.is_green,
    }));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `[Permits Detailed API] Returned ${result.length} permits in ${elapsed}s`
    );

    return NextResponse.json({
      permits: result,
      total: result.length,
    });
  } catch (error) {
    console.error("Error loading permits:", error);
    return NextResponse.json(
      { error: "Failed to load permits", permits: [], total: 0 },
      { status: 500 }
    );
  }
}
