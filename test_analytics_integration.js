#!/usr/bin/env node
/**
 * Test analytics integration without running the full frontend
 * This verifies our data files can be loaded correctly
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('TESTING ANALYTICS INTEGRATION');
console.log('='.repeat(80));
console.log();

// Test 1: Check data files exist
console.log('📁 Test 1: Checking data files...');
const dataDir = path.join(__dirname, 'frontend/public/data');
const requiredFiles = [
  'cluster_names.json',
  'energy_infrastructure.json',
  'trends.json',
  'permits.geojson',
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(dataDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`   ✅ ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`   ❌ ${file} MISSING!`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.log('\n❌ Some data files are missing!');
  process.exit(1);
}

console.log();

// Test 2: Load and validate cluster names
console.log('🏷️  Test 2: Loading cluster names...');
try {
  const clusterNames = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'cluster_names.json'), 'utf8')
  );

  console.log(`   Found ${Object.keys(clusterNames).length} clusters:`);
  Object.entries(clusterNames).forEach(([id, info]) => {
    console.log(`   ${id}. ${info.name} (${info.size.toLocaleString()} permits)`);
  });

  console.log('   ✅ Cluster names loaded successfully');
} catch (error) {
  console.log(`   ❌ Error loading cluster names: ${error.message}`);
  process.exit(1);
}

console.log();

// Test 3: Load and validate energy data
console.log('⚡ Test 3: Loading energy data...');
try {
  const energyData = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'energy_infrastructure.json'), 'utf8')
  );

  console.log(`   Total energy permits: ${energyData.metadata.total_energy_permits.toLocaleString()}`);
  console.log(`   Solar: ${energyData.summary.solar_stats.total_permits.toLocaleString()} (avg ${energyData.summary.solar_stats.avg_capacity_kw} kW)`);
  console.log(`   Batteries: ${(energyData.summary.by_type.battery || 0).toLocaleString()}`);
  console.log(`   EV Chargers: ${(energyData.summary.by_type.ev_charger || 0).toLocaleString()}`);
  console.log(`   Top ZIP: ${energyData.by_zip[0].zip_code} (${energyData.by_zip[0].total_energy_permits} permits)`);

  console.log('   ✅ Energy data loaded successfully');
} catch (error) {
  console.log(`   ❌ Error loading energy data: ${error.message}`);
  process.exit(1);
}

console.log();

// Test 4: Load and validate trends
console.log('📈 Test 4: Loading trends data...');
try {
  const trendsData = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'trends.json'), 'utf8')
  );

  console.log(`   Months analyzed: ${trendsData.monthly_trends.length}`);
  console.log(`   Clusters tracked: ${trendsData.growth_rates.length}`);
  console.log('\n   Top 3 growth rates (CAGR):');
  trendsData.growth_rates.slice(0, 3).forEach((gr, i) => {
    console.log(`   ${i + 1}. Cluster ${gr.cluster_id}: +${gr.cagr.toFixed(1)}%`);
  });

  console.log('   ✅ Trends data loaded successfully');
} catch (error) {
  console.log(`   ❌ Error loading trends data: ${error.message}`);
  process.exit(1);
}

console.log();

// Test 5: Load and validate GeoJSON
console.log('🗺️  Test 5: Loading GeoJSON...');
try {
  const geoData = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'permits.geojson'), 'utf8')
  );

  console.log(`   ZIP codes: ${geoData.metadata.total_zips}`);
  console.log(`   Total permits: ${geoData.metadata.total_permits.toLocaleString()}`);
  console.log(`   Sample: ${geoData.features[0].properties.zip_code} (${geoData.features[0].properties.total_permits} permits)`);

  console.log('   ✅ GeoJSON loaded successfully');
} catch (error) {
  console.log(`   ❌ Error loading GeoJSON: ${error.message}`);
  process.exit(1);
}

console.log();
console.log('='.repeat(80));
console.log('✅ ALL TESTS PASSED!');
console.log('='.repeat(80));
console.log();
console.log('Analytics integration is working correctly.');
console.log('The data files are ready to be used by the frontend.');
console.log();
console.log('To start the frontend:');
console.log('  cd frontend');
console.log('  npm install   # (if not already done)');
console.log('  npm run dev');
console.log();
