-- Phase 5: Data Depth & Mechanic's Toolkit — Schema Evolution
--
-- Adds: generation support, expanded specs, service intervals,
-- manufacturer-specific DTC fields, technical documents, motorcycle images

-- ============================================================
-- 1. Motorcycles: Add generation and spec columns
-- ============================================================

ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS generation TEXT;
ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS fuel_system TEXT;
ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS dry_weight_kg INTEGER;
ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS horsepower DECIMAL;
ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS torque_nm DECIMAL;
ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS fuel_capacity_liters DECIMAL;
ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS oil_capacity_liters DECIMAL;
ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS coolant_capacity_liters DECIMAL;
ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS valve_clearance_intake TEXT;
ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS valve_clearance_exhaust TEXT;
ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS spark_plug TEXT;
ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS tire_front TEXT;
ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS tire_rear TEXT;

-- ============================================================
-- 2. Service Intervals: Create table with torque + fluid specs
-- ============================================================

CREATE TABLE IF NOT EXISTS service_intervals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motorcycle_id UUID NOT NULL REFERENCES motorcycles(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  interval_miles INTEGER,
  interval_km INTEGER,
  interval_months INTEGER,
  description TEXT,
  torque_spec TEXT,
  fluid_spec TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_intervals_motorcycle
  ON service_intervals(motorcycle_id);

ALTER TABLE service_intervals ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists (idempotent)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public read access" ON service_intervals;
  CREATE POLICY "Public read access" ON service_intervals
    FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add torque_spec and fluid_spec if table already existed without them
ALTER TABLE service_intervals ADD COLUMN IF NOT EXISTS torque_spec TEXT;
ALTER TABLE service_intervals ADD COLUMN IF NOT EXISTS fluid_spec TEXT;

-- ============================================================
-- 3. DTC Codes: Add manufacturer-specific fields
-- ============================================================

-- Ensure columns from earlier phases exist
ALTER TABLE dtc_codes ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE dtc_codes ADD COLUMN IF NOT EXISTS severity TEXT;
ALTER TABLE dtc_codes ADD COLUMN IF NOT EXISTS applies_to_makes TEXT[];

-- New Phase 5 columns
ALTER TABLE dtc_codes ADD COLUMN IF NOT EXISTS manufacturer TEXT;
ALTER TABLE dtc_codes ADD COLUMN IF NOT EXISTS system TEXT;
ALTER TABLE dtc_codes ADD COLUMN IF NOT EXISTS diagnostic_method TEXT;
ALTER TABLE dtc_codes ADD COLUMN IF NOT EXISTS fix_reference TEXT;

-- Index for manufacturer filtering
CREATE INDEX IF NOT EXISTS idx_dtc_codes_manufacturer ON dtc_codes(manufacturer);

-- ============================================================
-- 4. Technical Documents table
-- ============================================================

CREATE TABLE IF NOT EXISTS technical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motorcycle_id UUID REFERENCES motorcycles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  source_attribution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tech_docs_motorcycle
  ON technical_documents(motorcycle_id);

ALTER TABLE technical_documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Public read access" ON technical_documents;
  CREATE POLICY "Public read access" ON technical_documents
    FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

COMMENT ON TABLE technical_documents IS 'Wiring diagrams, torque charts, fluid charts, and reference PDFs';
COMMENT ON COLUMN technical_documents.doc_type IS 'One of: wiring_diagram, torque_chart, fluid_chart, exploded_view, reference';

-- ============================================================
-- 5. Motorcycle Images table
-- ============================================================

CREATE TABLE IF NOT EXISTS motorcycle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motorcycle_id UUID NOT NULL REFERENCES motorcycles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  source_attribution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moto_images_motorcycle
  ON motorcycle_images(motorcycle_id);

ALTER TABLE motorcycle_images ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Public read access" ON motorcycle_images;
  CREATE POLICY "Public read access" ON motorcycle_images
    FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

COMMENT ON TABLE motorcycle_images IS 'Motorcycle photos with warm-tone filtering applied at render time';
