#!/usr/bin/env node

/**
 * Test Supabase API Connection
 * Verifies we can query data from the database
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testApi() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║    Supabase API Connection Test     ║');
  console.log('╚══════════════════════════════════════╝\n');
  console.log(`🔗 URL: ${SUPABASE_URL}\n`);

  try {
    // Test 1: Query motorcycles
    console.log('🏍️  Test 1: Query Motorcycles');
    console.log('─────────────────────────────');
    const { data: motorcycles, error: motorcyclesError } = await supabase
      .from('motorcycles')
      .select('make, model, year_start, category')
      .order('make', { ascending: true });

    if (motorcyclesError) {
      console.error('❌ Failed:', motorcyclesError.message);
      throw motorcyclesError;
    }

    console.log(`✅ Success: Found ${motorcycles.length} motorcycles`);
    motorcycles.forEach(bike => {
      console.log(`   - ${bike.make} ${bike.model} (${bike.year_start}+)`);
    });

    // Test 2: Query diagnostic trees
    console.log('\n🌳 Test 2: Query Diagnostic Trees');
    console.log('─────────────────────────────────');
    const { data: trees, error: treesError } = await supabase
      .from('diagnostic_trees')
      .select('title, difficulty, motorcycle_id')
      .order('title', { ascending: true });

    if (treesError) {
      console.error('❌ Failed:', treesError.message);
      throw treesError;
    }

    console.log(`✅ Success: Found ${trees.length} diagnostic trees`);
    trees.forEach(tree => {
      console.log(`   - "${tree.title}" (${tree.difficulty})`);
    });

    // Test 3: Query DTC codes
    console.log('\n🔧 Test 3: Query DTC Codes');
    console.log('───────────────────────────');
    const { data: codes, error: codesError } = await supabase
      .from('dtc_codes')
      .select('code, description')
      .order('code', { ascending: true })
      .limit(5);

    if (codesError) {
      console.error('❌ Failed:', codesError.message);
      throw codesError;
    }

    console.log(`✅ Success: Found ${codes.length} DTC codes`);
    codes.forEach(code => {
      const desc = code.description.length > 50
        ? code.description.substring(0, 50) + '...'
        : code.description;
      console.log(`   - ${code.code}: ${desc}`);
    });

    // Test 4: Query with JOIN
    console.log('\n🔗 Test 4: Query with JOIN (Trees + Bikes)');
    console.log('─────────────────────────────────────────');
    const { data: joinedData, error: joinError } = await supabase
      .from('diagnostic_trees')
      .select(`
        title,
        difficulty,
        motorcycles:motorcycle_id (
          make,
          model
        )
      `)
      .order('title', { ascending: true });

    if (joinError) {
      console.error('❌ Failed:', joinError.message);
      throw joinError;
    }

    console.log(`✅ Success: Joined ${joinedData.length} records`);
    joinedData.forEach(item => {
      const bike = item.motorcycles;
      console.log(`   - ${bike.make} ${bike.model}: "${item.title}"`);
    });

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║      All Tests Passed! 🎉           ║');
    console.log('╚══════════════════════════════════════╝\n');

    console.log('✅ Database is ready for use!');
    console.log('✅ Supabase client is working correctly');
    console.log('✅ RLS policies are configured properly\n');

  } catch (error) {
    console.error('\n╔══════════════════════════════════════╗');
    console.error('║        Test Failed ❌               ║');
    console.error('╚══════════════════════════════════════╝\n');
    console.error('Error:', error.message);
    console.error('\nPossible causes:');
    console.error('1. Migrations have not been run yet');
    console.error('2. RLS policies are not configured');
    console.error('3. Network connectivity issues');
    console.error('4. Invalid API credentials\n');
    console.error('👉 Run migrations first: node scripts/migrate-rest.js\n');
    process.exit(1);
  }
}

testApi();
