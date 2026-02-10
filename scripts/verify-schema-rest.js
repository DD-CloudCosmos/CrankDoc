#!/usr/bin/env node

/**
 * CrankDoc Schema Verification Script (REST API)
 * Verifies database tables using Supabase REST API
 */

const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

/**
 * Make REST API request
 */
function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: `/rest/v1${path}`,
      method: method,
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function verify() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   CrankDoc Schema Verification      ║');
  console.log('╚══════════════════════════════════════╝\n');
  console.log(`📍 Project: ${projectRef}`);
  console.log(`🔗 URL: ${SUPABASE_URL}\n`);

  try {
    // Check motorcycles table
    console.log('🏍️  Motorcycles:');
    try {
      const motorcycles = await makeRequest('/motorcycles?select=make,model,year_start,category&order=make,model');
      console.log(`   Total: ${motorcycles.length}`);

      if (motorcycles.length > 0) {
        motorcycles.forEach(bike => {
          const yearRange = bike.year_start ? `${bike.year_start}+` : 'N/A';
          console.log(`   - ${bike.make} ${bike.model} (${yearRange}, ${bike.category || 'N/A'})`);
        });
      } else {
        console.log('   ⚠️  No motorcycles found');
      }
    } catch (error) {
      console.log('   ❌ Table not found or not accessible');
      console.log(`   Error: ${error.message}`);
    }

    // Check diagnostic trees
    console.log('\n🌳 Diagnostic Trees:');
    try {
      const trees = await makeRequest('/diagnostic_trees?select=title,difficulty,motorcycle_id&order=title');
      console.log(`   Total: ${trees.length}`);

      if (trees.length > 0) {
        trees.forEach(tree => {
          console.log(`   - "${tree.title}" (${tree.difficulty || 'N/A'})`);
        });
      } else {
        console.log('   ⚠️  No diagnostic trees found');
      }
    } catch (error) {
      console.log('   ❌ Table not found or not accessible');
      console.log(`   Error: ${error.message}`);
    }

    // Check DTC codes
    console.log('\n🔧 DTC Codes:');
    try {
      const codes = await makeRequest('/dtc_codes?select=code,description&order=code&limit=10');
      console.log(`   Total: ${codes.length}${codes.length === 10 ? '+' : ''}`);

      if (codes.length > 0) {
        codes.slice(0, 5).forEach(code => {
          const desc = code.description.length > 40
            ? code.description.substring(0, 40) + '...'
            : code.description;
          console.log(`   - ${code.code}: ${desc}`);
        });
        if (codes.length > 5) {
          console.log(`   ... and ${codes.length - 5} more`);
        }
      } else {
        console.log('   ⚠️  No DTC codes found');
      }
    } catch (error) {
      console.log('   ❌ Table not found or not accessible');
      console.log(`   Error: ${error.message}`);
    }

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║    Verification Complete! ✅        ║');
    console.log('╚══════════════════════════════════════╝\n');

    console.log('💡 Next Steps:');
    console.log('   - View in Dashboard: https://supabase.com/dashboard/project/' + projectRef + '/editor');
    console.log('   - Test API: node scripts/test-api.js\n');

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure migrations have been run in Supabase SQL Editor');
    console.error('2. Check RLS policies allow public read access');
    console.error('3. Verify credentials in .env.local\n');
    process.exit(1);
  }
}

verify();
