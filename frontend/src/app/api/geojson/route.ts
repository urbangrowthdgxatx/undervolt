import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

let cachedGeoJSON: any | null = null;

export async function GET() {
  if (cachedGeoJSON) {
    return NextResponse.json(cachedGeoJSON);
  }

  try {
    const path = join(process.cwd(), 'public', 'data', 'permits.geojson');
    const content = readFileSync(path, 'utf-8');
    cachedGeoJSON = JSON.parse(content);

    return NextResponse.json(cachedGeoJSON);
  } catch (error) {
    console.error('Error loading GeoJSON:', error);
    return NextResponse.json(
      { error: 'Failed to load GeoJSON data' },
      { status: 500 }
    );
  }
}

// Clear cache
export async function POST() {
  cachedGeoJSON = null;
  return NextResponse.json({ message: 'Cache cleared' });
}
