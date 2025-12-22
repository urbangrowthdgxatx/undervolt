import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

let cachedTrends: any | null = null;

export async function GET() {
  if (cachedTrends) {
    return NextResponse.json(cachedTrends);
  }

  try {
    const path = join(process.cwd(), 'public', 'data', 'trends.json');
    const content = readFileSync(path, 'utf-8');
    cachedTrends = JSON.parse(content);

    return NextResponse.json(cachedTrends);
  } catch (error) {
    console.error('Error loading trends:', error);
    return NextResponse.json(
      { error: 'Failed to load trends data' },
      { status: 500 }
    );
  }
}

// Clear cache
export async function POST() {
  cachedTrends = null;
  return NextResponse.json({ message: 'Cache cleared' });
}
