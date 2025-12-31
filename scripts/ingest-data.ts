#!/usr/bin/env tsx

/**
 * Data Ingestion Script
 *
 * Populates SQLite database from CSV and JSON files
 *
 * Usage: npx tsx scripts/ingest-data.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';
import { db, permits, clusters, clusterKeywords, energyStatsByZip, cacheMetadata } from '../src/db';

const OUTPUT_DIR = join(process.cwd(), 'output');
const PUBLIC_DATA_DIR = join(process.cwd(), 'frontend', 'public', 'data');

async function ingestClusterData() {
  console.log('[Clusters] Loading cluster_summary.json...');
  const clusterSummaryPath = join(PUBLIC_DATA_DIR, 'cluster_summary.json');
  const clusterSummary = JSON.parse(readFileSync(clusterSummaryPath, 'utf-8'));

  const clusterColors: Record<number, string> = {
    0: '#10b981',  // Green - New Residential Construction
    1: '#ec4899',  // Pink - General Construction & Repairs
    2: '#f59e0b',  // Amber - Electrical & Roofing Work
    4: '#3b82f6',  // Blue - HVAC Installations
    6: '#a855f7',  // Purple - Window Installations
    7: '#6366f1',  // Indigo - Foundation Repairs
  };

  console.log(`[Clusters] Inserting ${clusterSummary.length} clusters...`);

  for (const cluster of clusterSummary) {
    // Insert cluster
    await db.insert(clusters).values({
      id: cluster.id,
      name: cluster.name,
      description: cluster.description || null,
      count: cluster.count,
      percentage: cluster.percentage,
      color: clusterColors[cluster.id] || '#6b7280',
    }).onConflictDoUpdate({
      target: clusters.id,
      set: {
        name: cluster.name,
        count: cluster.count,
        percentage: cluster.percentage,
      },
    });

    // Insert keywords
    if (cluster.top_keywords && cluster.top_keywords.length > 0) {
      for (let i = 0; i < cluster.top_keywords.length; i++) {
        const kw = cluster.top_keywords[i];
        await db.insert(clusterKeywords).values({
          clusterId: cluster.id,
          keyword: kw.keyword,
          frequency: kw.prevalence || kw.frequency || 0, // Use prevalence field
          rank: i + 1,
        });
      }
    }
  }

  await db.insert(cacheMetadata).values({
    key: 'clusters',
    lastUpdated: new Date().toISOString(),
    recordCount: clusterSummary.length,
    sourceFile: 'cluster_summary.json',
  }).onConflictDoUpdate({
    target: cacheMetadata.key,
    set: {
      lastUpdated: new Date().toISOString(),
      recordCount: clusterSummary.length,
    },
  });

  console.log(`[Clusters] ✓ Inserted ${clusterSummary.length} clusters`);
}

async function ingestEnergyStats() {
  console.log('[Energy Stats] Loading energy_infrastructure.json...');
  const energyPath = join(PUBLIC_DATA_DIR, 'energy_infrastructure.json');
  const energyData = JSON.parse(readFileSync(energyPath, 'utf-8'));

  const zipData = energyData.by_zip || [];
  console.log(`[Energy Stats] Inserting ${zipData.length} ZIP records...`);

  for (const zip of zipData) {
    await db.insert(energyStatsByZip).values({
      zipCode: zip.zip_code,
      totalEnergyPermits: zip.total_energy_permits,
      solar: zip.solar,
      battery: zip.battery,
      evCharger: zip.ev_charger,
      generator: zip.generator,
      panelUpgrade: zip.panel_upgrade,
      hvac: zip.hvac,
      totalSolarCapacityKw: zip.total_solar_capacity_kw || 0,
      avgSolarCapacityKw: zip.avg_solar_capacity_kw || 0,
    }).onConflictDoUpdate({
      target: energyStatsByZip.zipCode,
      set: {
        totalEnergyPermits: zip.total_energy_permits,
        solar: zip.solar,
        battery: zip.battery,
        evCharger: zip.ev_charger,
        generator: zip.generator,
        panelUpgrade: zip.panel_upgrade,
        hvac: zip.hvac,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  await db.insert(cacheMetadata).values({
    key: 'energy_stats',
    lastUpdated: new Date().toISOString(),
    recordCount: zipData.length,
    sourceFile: 'energy_infrastructure.json',
  }).onConflictDoUpdate({
    target: cacheMetadata.key,
    set: {
      lastUpdated: new Date().toISOString(),
      recordCount: zipData.length,
    },
  });

  console.log(`[Energy Stats] ✓ Inserted ${zipData.length} ZIP records`);
}

async function ingestPermits() {
  console.log('[Permits] Loading energy_permits.csv...');
  const csvPath = join(OUTPUT_DIR, 'energy_permits.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    cast: (value, context) => {
      // Cast numeric fields
      if (context.column === 'cluster_id') return value ? parseInt(value) : null;
      if (context.column === 'latitude' || context.column === 'longitude') {
        return value ? parseFloat(value) : null;
      }
      if (context.column === 'solar_capacity_kw') return value ? parseFloat(value) : null;
      return value;
    },
  });

  console.log(`[Permits] Inserting ${records.length} permits in batches...`);

  const BATCH_SIZE = 1000;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    const values = batch.map((record: any, idx: number) => ({
      permitNumber: record.permit_number || `ENERGY_${i + idx}_${Date.now()}`,
      address: record.address || null,
      zipCode: record.zip_code ? String(record.zip_code).replace('.0', '') : 'UNKNOWN',
      latitude: record.latitude ? parseFloat(record.latitude) : null,
      longitude: record.longitude ? parseFloat(record.longitude) : null,
      clusterId: record.cluster_id ? parseInt(record.cluster_id) : null,
      workDescription: record.description || null,
      isEnergyPermit: true, // All records in energy_permits.csv are energy permits
      energyType: record.type || null, // CSV uses 'type' not 'energy_type'
      solarCapacityKw: record.capacity_kw ? parseFloat(record.capacity_kw) : null,
      issueDate: record.issued_date || null, // CSV uses 'issued_date' not 'issue_date'
    }));

    await db.insert(permits).values(values).onConflictDoNothing();

    if ((i + BATCH_SIZE) % 5000 === 0 || i + BATCH_SIZE >= records.length) {
      console.log(`[Permits] Inserted ${Math.min(i + BATCH_SIZE, records.length)}/${records.length} permits...`);
    }
  }

  await db.insert(cacheMetadata).values({
    key: 'permits',
    lastUpdated: new Date().toISOString(),
    recordCount: records.length,
    sourceFile: 'energy_permits.csv',
  }).onConflictDoUpdate({
    target: cacheMetadata.key,
    set: {
      lastUpdated: new Date().toISOString(),
      recordCount: records.length,
    },
  });

  console.log(`[Permits] ✓ Inserted ${records.length} permits`);
}

async function main() {
  const startTime = Date.now();

  try {
    console.log('='.repeat(60));
    console.log('Data Ingestion Script');
    console.log('='.repeat(60));

    await ingestClusterData();
    await ingestEnergyStats();
    await ingestPermits();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('='.repeat(60));
    console.log(`✓ All data ingested successfully in ${elapsed}s`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('Error during ingestion:', error);
    process.exit(1);
  }
}

main();
