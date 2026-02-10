# Supabase Database Setup

This directory contains SQL migrations and seed data for the CrankDoc database.

## Quick Start

### Option 1: Supabase Dashboard (Recommended)

1. **Open the SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/hcpfviemzpdnrhnxrvip/sql/new
   - Sign in if needed

2. **Run the Schema Migration:**
   - Open `migrations/001_initial_schema.sql` in your text editor
   - Copy the entire contents
   - Paste into the Supabase SQL Editor
   - Click "Run" (or press `Ctrl+Enter`)
   - Wait for success message

3. **Run the Seed Data:**
   - Open `seed.sql` in your text editor
   - Copy the entire contents
   - Paste into the Supabase SQL Editor
   - Click "Run" (or press `Ctrl+Enter`)
   - Wait for success message

4. **Verify the Migration:**
   ```bash
   node scripts/verify-schema-rest.js
   ```

### Option 2: Using Node.js Scripts

```bash
# Print manual instructions
node scripts/migrate-rest.js

# Verify schema after manual execution
node scripts/verify-schema-rest.js
```

### Option 3: Using psql (Advanced)

If you have PostgreSQL client installed:

```bash
# Get your database password from .env.local (SUPABASE_SERVICE_ROLE_KEY)

# Run schema migration
psql "postgresql://postgres:[YOUR_SERVICE_ROLE_KEY]@db.hcpfviemzpdnrhnxrvip.supabase.co:5432/postgres" \
  -f supabase/migrations/001_initial_schema.sql

# Run seed data
psql "postgresql://postgres:[YOUR_SERVICE_ROLE_KEY]@db.hcpfviemzpdnrhnxrvip.supabase.co:5432/postgres" \
  -f supabase/seed.sql
```

## Database Schema

### Tables Created

#### `motorcycles`
Stores motorcycle models and their specifications.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| make | text | Manufacturer (e.g., "Honda") |
| model | text | Model name (e.g., "CBR600RR") |
| year_start | integer | First production year |
| year_end | integer | Last production year (null if still in production) |
| engine_type | text | Engine configuration (e.g., "inline-4") |
| displacement_cc | integer | Engine displacement in cubic centimeters |
| category | text | Bike category (e.g., "sport", "cruiser") |
| image_url | text | URL to bike image (optional) |
| created_at | timestamp | Record creation timestamp |

#### `diagnostic_trees`
Stores decision tree data for diagnostic troubleshooting.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| motorcycle_id | uuid | Foreign key to motorcycles table |
| title | text | Tree title (e.g., "Engine Won't Start") |
| description | text | Detailed description |
| category | text | Problem category (e.g., "electrical") |
| difficulty | text | Skill level: "beginner", "intermediate", "advanced" |
| tree_data | jsonb | Decision tree structure (JSON) |
| created_at | timestamp | Record creation timestamp |

#### `dtc_codes`
Stores Diagnostic Trouble Code (DTC) reference data.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| code | text | DTC code (e.g., "P0301") |
| description | text | Code description |
| category | text | Code category (e.g., "powertrain") |
| common_causes | text[] | Array of common causes |
| created_at | timestamp | Record creation timestamp |

## Seed Data

The seed file includes:

- **6 Motorcycles:**
  - Honda CBR600RR (2003-2024)
  - Yamaha MT-07 (2014-present)
  - Harley-Davidson Sportster 883 (1986-2022)
  - Harley-Davidson Sportster 1200 (1988-2022)
  - Kawasaki Ninja 400 (2018-present)
  - BMW R1250GS (2019-present)

- **2 Sample Diagnostic Trees:**
  - Honda CBR600RR: "Engine Won't Start"
  - Yamaha MT-07: "Won't Idle / Stalls"

- **7 Sample DTC Codes:**
  - P0301, P0302, P0116, P0122, P0562, C1234, C1235

## Row Level Security (RLS)

All tables have RLS enabled with public read access:
- Anonymous users can SELECT from all tables
- Write operations require authentication (future feature)

## TypeScript Types

After running migrations, TypeScript types are available at:
- `src/types/database.types.ts`

To regenerate types from live database:
```bash
npx supabase gen types typescript --project-id hcpfviemzpdnrhnxrvip > src/types/database.types.ts
```

## Troubleshooting

### "Table already exists" error
If you see this error, the tables are already created. You can either:
1. Drop the existing tables and re-run the migration
2. Skip the schema migration and only run the seed data

### Network errors
- Ensure you're connected to the internet
- Check that your Supabase project is active
- Verify credentials in `.env.local`

### RLS policy errors
If you can't read data from tables:
1. Check that RLS policies are created (in the migration)
2. Verify you're using the correct API key (anon or service role)
3. Check Supabase Dashboard → Authentication → Policies

## Next Steps

After running migrations:

1. Verify schema: `node scripts/verify-schema-rest.js`
2. Test API queries: Check if you can query motorcycles from the app
3. View in dashboard: https://supabase.com/dashboard/project/hcpfviemzpdnrhnxrvip/editor
