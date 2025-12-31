import { NextResponse } from 'next/server';
import { db, permits } from '@/db';
import { isNotNull, and, sql } from 'drizzle-orm';

// Cache in memory for performance
const globalForGeoJSON = global as unknown as { geoJSONCache: any | null };
if (!globalForGeoJSON.geoJSONCache) {
  globalForGeoJSON.geoJSONCache = null;
}

export async function GET() {
  // Check memory cache
  if (globalForGeoJSON.geoJSONCache) {
    console.log('[GeoJSON] Returning cached data');
    return NextResponse.json(globalForGeoJSON.geoJSONCache);
  }

  try {
    console.log('[GeoJSON] Loading from database...');
    const startTime = Date.now();

    // Get permits with valid coordinates
    const data = await db
      .select({
        id: permits.id,
        permitNumber: permits.permitNumber,
        latitude: permits.latitude,
        longitude: permits.longitude,
        zipCode: permits.zipCode,
        clusterId: permits.clusterId,
        energyType: permits.energyType,
        solarCapacityKw: permits.solarCapacityKw,
        issueDate: permits.issueDate,
      })
      .from(permits)
      .where(
        and(
          isNotNull(permits.latitude),
          isNotNull(permits.longitude)
        )
      )
      .limit(50000); // Limit for performance

    // Convert to GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features: data.map((p) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.longitude, p.latitude],
        },
        properties: {
          id: p.id,
          permit_number: p.permitNumber,
          zip_code: p.zipCode,
          cluster_id: p.clusterId,
          energy_type: p.energyType,
          solar_capacity_kw: p.solarCapacityKw,
          issue_date: p.issueDate,
        },
      })),
    };

    // Cache result
    globalForGeoJSON.geoJSONCache = geojson;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[GeoJSON] Generated ${geojson.features.length} features in ${elapsed}s`);

    return NextResponse.json(geojson);
  } catch (error) {
    console.error('Error generating GeoJSON:', error);
    return NextResponse.json(
      { type: 'FeatureCollection', features: [], error: 'Failed to load GeoJSON data' },
      { status: 500 }
    );
  }
}

// Clear cache
export async function POST() {
  globalForGeoJSON.geoJSONCache = null;
  return NextResponse.json({ message: 'Cache cleared' });
}
