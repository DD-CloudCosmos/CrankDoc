-- CrankDoc Initial Database Schema
-- Creates tables for motorcycles, diagnostic trees, and DTC codes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Motorcycles Table
CREATE TABLE motorcycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year_start INTEGER NOT NULL,
  year_end INTEGER,
  engine_type TEXT,
  displacement_cc INTEGER,
  category TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on make/model for faster lookups
CREATE INDEX idx_motorcycles_make_model ON motorcycles(make, model);

-- Diagnostic Trees Table
CREATE TABLE diagnostic_trees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  motorcycle_id UUID REFERENCES motorcycles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  tree_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on motorcycle_id for faster lookups
CREATE INDEX idx_diagnostic_trees_motorcycle_id ON diagnostic_trees(motorcycle_id);

-- DTC Codes Table
CREATE TABLE dtc_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT,
  common_causes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on code for faster lookups
CREATE INDEX idx_dtc_codes_code ON dtc_codes(code);

-- Enable Row Level Security
ALTER TABLE motorcycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE dtc_codes ENABLE ROW LEVEL SECURITY;

-- Create public read access policies (MVP is read-only)
CREATE POLICY "Public read access" ON motorcycles
  FOR SELECT USING (true);

CREATE POLICY "Public read access" ON diagnostic_trees
  FOR SELECT USING (true);

CREATE POLICY "Public read access" ON dtc_codes
  FOR SELECT USING (true);

-- Comments for documentation
COMMENT ON TABLE motorcycles IS 'Motorcycle models supported by CrankDoc';
COMMENT ON TABLE diagnostic_trees IS 'Decision tree data for diagnostic troubleshooting';
COMMENT ON TABLE dtc_codes IS 'Diagnostic Trouble Code (DTC) reference data';
