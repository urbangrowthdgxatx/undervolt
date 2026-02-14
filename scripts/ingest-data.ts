#!/usr/bin/env tsx

/**
 * Data Ingestion Script
 *
 * Populates SQLite database from CSV and JSON files
 *
 * Usage: npx tsx scripts/ingest-data.ts
 */

import { readFileSync, createReadStream } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';
import { parse as parseStream } from 'csv-parse';
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

// Helper to detect energy-related permits from description
function detectEnergyType(description: string): string | null {
  if (!description) return null;
  const desc = description.toLowerCase();

  if (desc.includes('solar') || desc.includes('photovoltaic') || desc.includes('pv system')) return 'solar';
  if (desc.includes('battery') || desc.includes('energy storage') || desc.includes('powerwall')) return 'battery';
  if (desc.includes('ev charger') || desc.includes('electric vehicle') || desc.includes('charging station')) return 'ev_charger';
  if (desc.includes('panel upgrade') || desc.includes('electrical panel') || desc.includes('service upgrade')) return 'panel_upgrade';
  if (desc.includes('generator') || desc.includes('backup power')) return 'generator';
  if (desc.includes('hvac') || desc.includes('heat pump') || desc.includes('air conditioning')) return 'hvac';

  return null;
}

async function ingestPermits() {
  console.log('[Permits] Loading permit_data_named_clusters.csv (full dataset) with streaming...');
  const csvPath = join(OUTPUT_DIR, 'permit_data_named_clusters.csv');

  // Also try to load LLM categories if available
  let llmCategories: Record<string, any> = {};
  try {
    const llmPath = join(process.cwd(), 'data', 'llm_categories.json');
    const llmData = JSON.parse(readFileSync(llmPath, 'utf-8'));
    llmCategories = llmData.permits || {};
    console.log(`[Permits] Loaded ${Object.keys(llmCategories).length} LLM categories`);
  } catch {
    console.log('[Permits] No LLM categories found, continuing without them');
  }

  const BATCH_SIZE = 50;  // SQLite has a ~999 variable limit, 50 rows × 17 cols = 850 vars
  let batch: any[] = [];
  let totalInserted = 0;

  return new Promise<void>((resolve, reject) => {
    const parser = createReadStream(csvPath)
      .pipe(parseStream({
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true,
      }));

    parser.on('data', async (record: any) => {
      const description = record.description || '';
      const energyType = detectEnergyType(description);
      const llmCat = llmCategories[record.permit_num] || {};

      batch.push({
        permitNumber: record.permit_num || `PERMIT_${totalInserted}_${Date.now()}`,
        address: record.original_address_1 || null,
        zipCode: record.zip_code ? String(record.zip_code).replace('.0', '') : 'UNKNOWN',
        latitude: record.latitude ? parseFloat(record.latitude) : null,
        longitude: record.longitude ? parseFloat(record.longitude) : null,
        clusterId: record.f_cluster ? parseInt(record.f_cluster) : null,
        workDescription: description.substring(0, 1000) || null,  // Limit description length
        isEnergyPermit: energyType !== null,
        energyType: energyType,
        solarCapacityKw: null,
        projectType: llmCat.project_type || null,
        buildingType: llmCat.building_type || null,
        scale: llmCat.scale || null,
        trade: llmCat.trade || null,
        isGreen: llmCat.is_green === true || llmCat.is_green === 'true',
        totalJobValuation: record.total_job_valuation ? parseFloat(record.total_job_valuation) : null,
        issueDate: record.issued_date || null,
      });

      if (batch.length >= BATCH_SIZE) {
        parser.pause();
        try {
          await db.insert(permits).values(batch).onConflictDoNothing();
          totalInserted += batch.length;
          if (totalInserted % 100000 === 0) {
            console.log(`[Permits] Inserted ${totalInserted.toLocaleString()} permits...`);
          }
          batch = [];
        } catch (err) {
          console.error('Batch insert error:', err);
        }
        parser.resume();
      }
    });

    parser.on('end', async () => {
      // Insert remaining batch
      if (batch.length > 0) {
        await db.insert(permits).values(batch).onConflictDoNothing();
        totalInserted += batch.length;
      }

      await db.insert(cacheMetadata).values({
        key: 'permits',
        lastUpdated: new Date().toISOString(),
        recordCount: totalInserted,
        sourceFile: 'permit_data_named_clusters.csv',
      }).onConflictDoUpdate({
        target: cacheMetadata.key,
        set: {
          lastUpdated: new Date().toISOString(),
          recordCount: totalInserted,
        },
      });

      console.log(`[Permits] ✓ Inserted ${totalInserted.toLocaleString()} permits`);
      resolve();
    });

    parser.on('error', reject);
  });
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
