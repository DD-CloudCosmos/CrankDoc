#!/usr/bin/env node

/**
 * Run Supabase migrations and seed data
 * Uses the Supabase REST API to execute SQL files
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

/**
 * Execute SQL via Supabase REST API
 */
async function executeSql(sql, description) {
  console.log(`\nExecuting: ${description}...`);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✓ Success: ${description}`);
          resolve(data);
        } else {
          console.error(`✗ Failed: ${description}`);
          console.error(`Status: ${res.statusCode}`);
          console.error(`Response: ${data}`);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`✗ Error: ${description}`);
      console.error(error);
      reject(error);
    });

    // Note: Supabase doesn't have a direct SQL execution endpoint via REST API
    // We'll need to use the postgres connection or management API instead
    // For now, let's use a workaround via the SQL editor approach

    req.write(JSON.stringify({ query: sql }));
    req.end();
  });
}

/**
 * Alternative: Use pg client to connect directly
 */
async function executeSqlDirect(sql, description) {
  console.log(`\nExecuting: ${description}...`);

  // We'll use curl to hit the Supabase SQL API endpoint
  const { execSync } = require('child_process');

  try {
    // Write SQL to temp file
    const tempFile = path.join(__dirname, '..', 'temp.sql');
    fs.writeFileSync(tempFile, sql);

    // Use psql or the REST API to execute
    // For Supabase, we can use the database URL with connection pooler
    const dbUrl = `postgresql://postgres.${projectRef}:${SERVICE_ROLE_KEY}@${projectRef}.pooler.supabase.com:6543/postgres`;

    console.log('Note: Direct SQL execution requires psql or the Supabase Management API');
    console.log('Please run the SQL files manually in the Supabase SQL Editor:');
    console.log(`1. Go to: ${SUPABASE_URL.replace('.supabase.co', '.supabase.co/project/' + projectRef + '/sql/new')}`);
    console.log('2. Copy the contents of the SQL file and execute it');

    // Clean up
    fs.unlinkSync(tempFile);

    return true;
  } catch (error) {
    console.error(`✗ Error: ${description}`);
    console.error(error.message);
    throw error;
  }
}

async function main() {
  console.log('CrankDoc Database Migration Tool');
  console.log('=================================');
  console.log(`Project: ${projectRef}`);

  try {
    // Read SQL files
    const schemaPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
    const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('\n📋 SQL files loaded successfully');
    console.log(`   - Schema: ${schemaPath}`);
    console.log(`   - Seed: ${seedPath}`);

    // Since Supabase REST API doesn't have a direct SQL execution endpoint,
    // we need to use the SQL editor or pg client
    console.log('\n⚠️  Manual Step Required:');
    console.log('The Supabase REST API does not support direct SQL execution.');
    console.log('Please execute the SQL files manually using one of these methods:\n');

    console.log('Method 1: Supabase Dashboard (Recommended)');
    console.log('-------------------------------------------');
    console.log(`1. Go to: ${SUPABASE_URL}/project/${projectRef}/editor`);
    console.log('2. Click "SQL Editor" in the left sidebar');
    console.log('3. Click "+ New query"');
    console.log('4. Copy the contents of: supabase/migrations/001_initial_schema.sql');
    console.log('5. Paste and click "Run"');
    console.log('6. Repeat for: supabase/seed.sql\n');

    console.log('Method 2: Using psql (Advanced)');
    console.log('--------------------------------');
    console.log('If you have PostgreSQL client installed:');
    console.log(`psql "postgresql://postgres:${SERVICE_ROLE_KEY}@db.${projectRef}.supabase.co:5432/postgres" -f supabase/migrations/001_initial_schema.sql`);
    console.log(`psql "postgresql://postgres:${SERVICE_ROLE_KEY}@db.${projectRef}.supabase.co:5432/postgres" -f supabase/seed.sql\n`);

    console.log('After running the migrations, you can verify with:');
    console.log('  node scripts/verify-schema.js\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();
