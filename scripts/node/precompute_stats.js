#!/usr/bin/env node

/**
 * Precompute stats from CSV to avoid slow runtime processing
 * Run this once: node scripts/precompute_stats.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const CSV_FILE = path.join(OUTPUT_DIR, 'permit_summary_by_zip.csv');
const CACHE_FILE = path.join(OUTPUT_DIR, '.stats-cache.json');
const CLUSTER_NAMES_FILE = path.join(OUTPUT_DIR, 'cluster_names.json');

async function precomputeStats() {
  console.log('[Precompute] Loading cluster names...');
  const clusterNames = JSON.parse(fs.readFileSync(CLUSTER_NAMES_FILE, 'utf-8'));

  console.log('[Precompute] Processing CSV...');
  const startTime = Date.now();

  const fileStream = fs.createReadStream(CSV_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers = [];
  let totalPermits = 0;
  const clusterCounts = {};
  const zipCounts = {};
  const energyStats = {
    solar: 0,
    hvac: 0,
    electrical: 0,
    newConstruction: 0,
    remodels: 0,
  };

  let isFirstLine = true;
  let rowCount = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    if (isFirstLine) {
      headers = line.split(',').map(h => h.trim());
      isFirstLine = false;
      continue;
    }

    const values = line.split(',');
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i]?.trim() || '';
    });

    totalPermits++;
    rowCount++;

    if (rowCount % 100000 === 0) {
      console.log(`[Precompute] Processed ${rowCount.toLocaleString()} rows...`);
    }

    // Count clusters
    const cluster = row.f_cluster || '0';
    clusterCounts[cluster] = (clusterCounts[cluster] || 0) + 1;

    // Count ZIPs
    const zip = row.zip_code;
    if (zip) {
      zipCounts[zip] = (zipCounts[zip] || 0) + 1;
    }

    // Count energy features
    if (row.f_description_kw_solar === '1' || row.f_description_kw_solar === 'True') energyStats.solar++;
    if (row.f_description_kw_hvac === '1' || row.f_description_kw_hvac === 'True') energyStats.hvac++;
    if (row.f_description_kw_electrical === '1' || row.f_description_kw_electrical === 'True') energyStats.electrical++;
    if (row.f_description_kw_new === '1' || row.f_description_kw_new === 'True') energyStats.newConstruction++;
    if (row.f_description_kw_remodel === '1' || row.f_description_kw_remodel === 'True') energyStats.remodels++;
  }

  const clusterDistribution = Object.entries(clusterCounts).map(([id, count]) => ({
    id: parseInt(id),
    name: clusterNames[id]?.name || `Cluster ${id}`,
    count,
    percentage: (count / totalPermits) * 100,
  })).sort((a, b) => b.count - a.count);

  const topZips = Object.entries(zipCounts)
    .map(([zip, count]) => ({ zip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const stats = {
    totalPermits,
    clusterDistribution,
    topZips,
    energyStats,
    clusterNames,
    lastUpdated: new Date().toISOString(),
  };

  console.log(`[Precompute] Writing cache file...`);
  fs.writeFileSync(CACHE_FILE, JSON.stringify(stats, null, 2));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Precompute] ✅ Complete! Processed ${totalPermits.toLocaleString()} permits in ${elapsed}s`);
  console.log(`[Precompute] Cache saved to: ${CACHE_FILE}`);
  console.log(`[Precompute] Cache size: ${(fs.statSync(CACHE_FILE).size / 1024).toFixed(1)} KB`);
}

precomputeStats().catch(error => {
  console.error('[Precompute] Error:', error);
  process.exit(1);
});
