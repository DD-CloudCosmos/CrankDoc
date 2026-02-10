# CrankDoc Database Setup Guide

## Overview

This guide will walk you through setting up the Supabase database for CrankDoc.

**IMPORTANT:** The migration must be applied manually via the Supabase Dashboard before the Motorcycle Database feature will work.

## What Was Created

### 1. SQL Migration Files

**`supabase/migrations/001_initial_schema.sql`**
- Creates three main tables: `motorcycles`, `diagnostic_trees`, `dtc_codes`
- Sets up indexes for performance
- Enables Row Level Security (RLS) with public read access
- Adds helpful comments for documentation

**`supabase/seed.sql`**
- Seeds 6 pilot motorcycles (Honda, Yamaha, Harley, Kawasaki, BMW)
- Adds 2 sample diagnostic trees with complete decision flow
- Includes 7 common DTC codes with descriptions

### 2. TypeScript Types

**`src/types/database.types.ts`**
- Complete TypeScript definitions for all tables
- Helper types for queries: `Motorcycle`, `DiagnosticTree`, `DtcCode`
- Decision tree node interfaces for working with JSONB data
- Provides full type safety and autocomplete in the app

### 3. Utility Scripts

**`scripts/migrate-rest.js`**
- Prints instructions for manual migration
- Usage: `npm run db:migrate`

**`scripts/verify-schema-rest.js`**
- Verifies tables exist and have data
- Shows count and sample data from each table
- Usage: `npm run db:verify`

**`scripts/test-api.js`**
- Tests Supabase API connection
- Runs queries on all tables
- Tests JOIN operations
- Usage: `npm run db:test`

### 4. Documentation

**`supabase/README.md`**
- Detailed setup instructions
- Schema documentation
- Troubleshooting guide

## Setup Instructions

### Step 1: Run the Migrations

You need to manually execute the SQL files in the Supabase Dashboard:

1. **Open the SQL Editor:**
   ```
   https://supabase.com/dashboard/project/hcpfviemzpdnrhnxrvip/sql/new
   ```

2. **Run Schema Migration:**
   - Open `supabase/migrations/001_initial_schema.sql` in your text editor
   - Copy all contents (Ctrl+A, Ctrl+C)
   - Paste into Supabase SQL Editor
   - Click "Run" or press Ctrl+Enter
   - Wait for success message: "Success. No rows returned"

3. **Run Seed Data:**
   - Open `supabase/seed.sql` in your text editor
   - Copy all contents (Ctrl+A, Ctrl+C)
   - Paste into Supabase SQL Editor
   - Click "Run" or press Ctrl+Enter
   - Wait for success message

### Step 2: Verify the Setup

Run the verification script:

```bash
npm run db:verify
```

You should see:
- ✅ All tables exist (motorcycles, diagnostic_trees, dtc_codes)
- ✅ 6 motorcycles listed
- ✅ 2 diagnostic trees listed
- ✅ 7 DTC codes listed
- ✅ RLS policies configured

### Step 3: Test the API

Run the API test:

```bash
npm run db:test
```

This will:
- Query motorcycles table
- Query diagnostic trees
- Query DTC codes
- Test JOIN operations between tables

If all tests pass, your database is ready! 🎉

## Database Schema

### Motorcycles Table

Stores motorcycle models with specifications:

```typescript
{
  id: string              // UUID primary key
  make: string            // "Honda", "Yamaha", etc.
  model: string           // "CBR600RR", "MT-07", etc.
  year_start: number      // First production year
  year_end: number | null // Last year (null if still in production)
  engine_type: string     // "inline-4", "v-twin", etc.
  displacement_cc: number // Engine size in cc
  category: string        // "sport", "cruiser", "adventure", etc.
  image_url: string       // URL to bike image (optional)
  created_at: string      // Timestamp
}
```

### Diagnostic Trees Table

Stores decision trees for troubleshooting:

```typescript
{
  id: string
  motorcycle_id: string       // Foreign key to motorcycles
  title: string               // "Engine Won't Start"
  description: string
  category: string            // "electrical", "fuel", etc.
  difficulty: string          // "beginner", "intermediate", "advanced"
  tree_data: {                // JSONB structure
    nodes: [
      {
        id: string
        type: "question" | "check" | "solution"
        text: string
        safety: "green" | "yellow" | "red"
        warning?: string
        instructions?: string
        options?: Array<{text: string, next: string}>
        action?: string
        details?: string
      }
    ]
  }
  created_at: string
}
```

### DTC Codes Table

Diagnostic Trouble Code reference:

```typescript
{
  id: string
  code: string              // "P0301", "C1234", etc.
  description: string       // Full description
  category: string          // "powertrain", "chassis", "body"
  common_causes: string[]   // Array of common causes
  created_at: string
}
```

## Pilot Data

### Motorcycles (6 bikes)

1. **Honda CBR600RR** (2003-2024, inline-4, 599cc, sport)
2. **Yamaha MT-07** (2014-present, parallel-twin, 689cc, naked)
3. **Harley-Davidson Sportster 883** (1986-2022, v-twin, 883cc, cruiser)
4. **Harley-Davidson Sportster 1200** (1988-2022, v-twin, 1202cc, cruiser)
5. **Kawasaki Ninja 400** (2018-present, parallel-twin, 399cc, sport)
6. **BMW R1250GS** (2019-present, boxer-twin, 1254cc, adventure)

### Diagnostic Trees (2 trees)

1. **Honda CBR600RR - "Engine Won't Start"**
   - Category: electrical
   - Difficulty: beginner
   - 14 decision nodes covering cranking issues, fuel problems, and ignition

2. **Yamaha MT-07 - "Won't Idle / Stalls"**
   - Category: fuel
   - Difficulty: intermediate
   - 6 decision nodes for idle and stalling issues

### DTC Codes (7 codes)

- **P0301**: Cylinder 1 Misfire
- **P0302**: Cylinder 2 Misfire
- **P0116**: Coolant Temp Sensor Issue
- **P0122**: Throttle Position Sensor Low
- **P0562**: System Voltage Low
- **C1234**: ABS Wheel Speed Sensor Front Left
- **C1235**: ABS Wheel Speed Sensor Front Right

## Using the Database in Your App

### Server Component Example

```typescript
import { createServerClient } from '@/lib/supabase/server'
import type { Motorcycle } from '@/types/database.types'

export default async function BikesPage() {
  const supabase = createServerClient()

  const { data: bikes, error } = await supabase
    .from('motorcycles')
    .select('*')
    .order('make', { ascending: true })

  if (error) {
    console.error('Error fetching bikes:', error)
    return <div>Error loading motorcycles</div>
  }

  return (
    <div>
      {bikes.map((bike: Motorcycle) => (
        <div key={bike.id}>
          <h2>{bike.make} {bike.model}</h2>
          <p>{bike.displacement_cc}cc {bike.engine_type}</p>
        </div>
      ))}
    </div>
  )
}
```

### API Route Example

```typescript
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('motorcycles')
    .select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
```

## Troubleshooting

### Error: "relation does not exist"

The tables haven't been created yet. Run the schema migration first.

### Error: "permission denied"

RLS policies may not be set up correctly. Check that the migration ran successfully.

### Error: "No rows returned" after seed

This is normal for the schema migration. The seed file should show "Success" with the number of rows inserted.

### Can't connect to database

- Verify credentials in `.env.local`
- Check that your Supabase project is active
- Ensure you're connected to the internet

## Next Steps

After database setup:

1. ✅ Verify with `npm run db:verify`
2. ✅ Test API with `npm run db:test`
3. ✅ Build the bike selector component
4. ✅ Create diagnostic tree navigation
5. ✅ Add DTC code lookup feature

## Useful Commands

```bash
# Print migration instructions
npm run db:migrate

# Verify database schema
npm run db:verify

# Test API connection
npm run db:test

# View in Supabase Dashboard
# https://supabase.com/dashboard/project/hcpfviemzpdnrhnxrvip/editor
```

## Security Notes

- All tables use Row Level Security (RLS)
- Public read access is enabled for MVP (no login required)
- Write operations will require authentication (future feature)
- Service role key is only used server-side, never in browser
- Anon key is safe to expose in browser (respects RLS)
