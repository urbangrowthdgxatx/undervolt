import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cluster = searchParams.get("cluster");
  const zip = searchParams.get("zip");
  const energyType = searchParams.get("energyType");
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    console.log(
      `[Permits API] Query: cluster=${cluster}, zip=${zip}, energyType=${energyType}, limit=${limit}, offset=${offset}`
    );
    const startTime = Date.now();

    // Build query with filters
    let query = supabase.from("permits").select("*", { count: "estimated" });

    if (cluster) {
      query = query.eq("cluster_id", parseInt(cluster));
    }
    if (zip) {
      query = query.eq("zip_code", zip);
    }
    if (energyType) {
      query = query.eq("energy_type", energyType);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error("[Permits API] Supabase error:", error);
      throw error;
    }

    // Get cluster names for enrichment
    const { data: clustersData } = await supabase
      .from("clusters")
      .select("id, name, percentage");

    const clusterNames = (clustersData || []).reduce(
      (acc: Record<number, { name: string; percentage: number }>, c) => {
        acc[c.id] = { name: c.name, percentage: c.percentage };
        return acc;
      },
      {}
    );

    // Map snake_case to camelCase and enrich with cluster names
    const enriched = (data || []).map((p) => ({
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
      cluster_name:
        clusterNames[p.cluster_id || 0]?.name || `Cluster ${p.cluster_id}`,
    }));

    const total = count || 0;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `[Permits API] Returned ${(data || []).length}/${total} permits in ${elapsed}s`
    );

    return NextResponse.json({
      data: enriched,
      total,
      offset,
      limit,
      cluster_names: clusterNames,
    });
  } catch (error) {
    console.error("Error loading permits:", error);
    return NextResponse.json(
      {
        data: [],
        total: 0,
        offset,
        limit,
        error: "Failed to load permits",
      },
      { status: 500 }
    );
  }
}
