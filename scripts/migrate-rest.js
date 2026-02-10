#!/usr/bin/env node

/**
 * CrankDoc Database Migration Script (REST API)
 * Uses Supabase REST API to execute SQL
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

/**
 * Execute SQL via Supabase Management API
 */
function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL);
    const postData = JSON.stringify({
      query: sql
    });

    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Manual instructions for SQL execution
 */
function printManualInstructions() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║        Manual Migration Instructions                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('The Supabase direct database connection requires additional setup.');
  console.log('Please execute the SQL files manually using the Supabase Dashboard:\n');

  console.log('📋 Step-by-Step Instructions:');
  console.log('─────────────────────────────\n');

  console.log('1. Open Supabase SQL Editor:');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);

  console.log('2. Run the Schema Migration:');
  console.log('   - Open: supabase/migrations/001_initial_schema.sql');
  console.log('   - Copy entire file contents');
  console.log('   - Paste into SQL Editor');
  console.log('   - Click "Run" or press Ctrl+Enter\n');

  console.log('3. Run the Seed Data:');
  console.log('   - Open: supabase/seed.sql');
  console.log('   - Copy entire file contents');
  console.log('   - Paste into SQL Editor');
  console.log('   - Click "Run" or press Ctrl+Enter\n');

  console.log('4. Verify Migration:');
  console.log('   - Run: node scripts/verify-schema-rest.js');
  console.log('   - Or check Tables in Supabase Dashboard\n');

  console.log('📁 Files to execute:');
  console.log(`   1. ${path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql')}`);
  console.log(`   2. ${path.join(__dirname, '..', 'supabase', 'seed.sql')}\n`);

  console.log('✅ After running both files, your database will have:');
  console.log('   - motorcycles table (6 pilot bikes)');
  console.log('   - diagnostic_trees table (2 sample trees)');
  console.log('   - dtc_codes table (7 sample codes)\n');
}

async function migrate() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  CrankDoc Database Migration Tool   ║');
  console.log('╚══════════════════════════════════════╝\n');
  console.log(`📍 Project: ${projectRef}`);
  console.log(`🔗 URL: ${SUPABASE_URL}\n`);

  // Print manual instructions
  printManualInstructions();
}

migrate();
