#!/usr/bin/env node

/**
 * CrankDoc Schema Verification Script
 * Verifies database tables and data
 */

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
const connectionString = `postgresql://postgres:${SERVICE_ROLE_KEY}@db.${projectRef}.supabase.co:5432/postgres`;

async function verify() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   CrankDoc Schema Verification      ║');
  console.log('╚══════════════════════════════════════╝\n');

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check tables exist
    console.log('📋 Checking tables...\n');

    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('motorcycles', 'diagnostic_trees', 'dtc_codes')
      ORDER BY table_name;
    `;

    const tables = await client.query(tablesQuery);

    if (tables.rows.length === 3) {
      console.log('✅ All tables exist:');
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('❌ Missing tables!');
      console.log(`   Found: ${tables.rows.length}/3`);
    }

    // Check motorcycles count
    console.log('\n🏍️  Motorcycles:');
    const motorcyclesCount = await client.query('SELECT COUNT(*) FROM motorcycles');
    console.log(`   Total: ${motorcyclesCount.rows[0].count}`);

    if (motorcyclesCount.rows[0].count > 0) {
      const motorcycles = await client.query('SELECT make, model, year_start, category FROM motorcycles ORDER BY make, model');
      motorcycles.rows.forEach(bike => {
        console.log(`   - ${bike.make} ${bike.model} (${bike.year_start}+, ${bike.category})`);
      });
    }

    // Check diagnostic trees
    console.log('\n🌳 Diagnostic Trees:');
    const treesCount = await client.query('SELECT COUNT(*) FROM diagnostic_trees');
    console.log(`   Total: ${treesCount.rows[0].count}`);

    if (treesCount.rows[0].count > 0) {
      const trees = await client.query(`
        SELECT dt.title, dt.difficulty, m.make, m.model
        FROM diagnostic_trees dt
        JOIN motorcycles m ON dt.motorcycle_id = m.id
        ORDER BY m.make, dt.title
      `);
      trees.rows.forEach(tree => {
        console.log(`   - ${tree.make} ${tree.model}: "${tree.title}" (${tree.difficulty})`);
      });
    }

    // Check DTC codes
    console.log('\n🔧 DTC Codes:');
    const codesCount = await client.query('SELECT COUNT(*) FROM dtc_codes');
    console.log(`   Total: ${codesCount.rows[0].count}`);

    if (codesCount.rows[0].count > 0) {
      const codes = await client.query('SELECT code, LEFT(description, 40) as description FROM dtc_codes ORDER BY code LIMIT 5');
      codes.rows.forEach(code => {
        console.log(`   - ${code.code}: ${code.description}...`);
      });
      if (codesCount.rows[0].count > 5) {
        console.log(`   ... and ${parseInt(codesCount.rows[0].count) - 5} more`);
      }
    }

    // Check RLS policies
    console.log('\n🔒 Row Level Security:');
    const rlsQuery = `
      SELECT tablename, policyname
      FROM pg_policies
      WHERE tablename IN ('motorcycles', 'diagnostic_trees', 'dtc_codes')
      ORDER BY tablename, policyname;
    `;
    const policies = await client.query(rlsQuery);

    if (policies.rows.length > 0) {
      console.log('✅ RLS policies configured:');
      policies.rows.forEach(policy => {
        console.log(`   - ${policy.tablename}: ${policy.policyname}`);
      });
    } else {
      console.log('⚠️  No RLS policies found');
    }

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║    Verification Complete! ✅        ║');
    console.log('╚══════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verify();
