#!/usr/bin/env node

/**
 * CrankDoc Database Migration Script
 * Executes SQL migrations using PostgreSQL client
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

// Construct database connection string for Supabase
// Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
const connectionString = `postgresql://postgres:${SERVICE_ROLE_KEY}@db.${projectRef}.supabase.co:5432/postgres`;

/**
 * Execute SQL file
 */
async function executeSqlFile(client, filePath, description) {
  console.log(`\n📄 ${description}...`);

  const sql = fs.readFileSync(filePath, 'utf8');

  try {
    await client.query(sql);
    console.log(`✅ ${description} - Success`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - Failed`);
    console.error(`   Error: ${error.message}`);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  CrankDoc Database Migration Tool   ║');
  console.log('╚══════════════════════════════════════╝\n');
  console.log(`📍 Project: ${projectRef}`);
  console.log(`🔗 Database: Supabase PostgreSQL\n`);

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Execute schema migration
    const schemaPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
    await executeSqlFile(client, schemaPath, 'Creating database schema');

    // Execute seed data
    const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
    await executeSqlFile(client, seedPath, 'Seeding initial data');

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║     Migration Completed! 🎉         ║');
    console.log('╚══════════════════════════════════════╝\n');

    console.log('📊 Created tables:');
    console.log('   - motorcycles (6 pilot bikes)');
    console.log('   - diagnostic_trees (2 sample trees)');
    console.log('   - dtc_codes (7 sample codes)\n');

    console.log('🔍 Verify with:');
    console.log('   node scripts/verify-schema.js\n');

  } catch (error) {
    console.error('\n╔══════════════════════════════════════╗');
    console.error('║     Migration Failed ❌             ║');
    console.error('╚══════════════════════════════════════╝\n');
    console.error('Error details:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your .env.local file has correct credentials');
    console.error('2. Verify network connectivity to Supabase');
    console.error('3. Check Supabase dashboard for any errors\n');
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed\n');
  }
}

// Run migration
migrate();
