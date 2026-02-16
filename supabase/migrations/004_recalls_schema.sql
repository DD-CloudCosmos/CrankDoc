-- Recalls table for storing NHTSA (and future EU/OECD) recall data
-- Each row is one recall campaign for one model year

CREATE TABLE IF NOT EXISTS recalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nhtsa_campaign_number TEXT NOT NULL,
  data_source TEXT NOT NULL DEFAULT 'nhtsa',
  manufacturer TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  model_year INTEGER NOT NULL,
  component TEXT,
  summary TEXT,
  consequence TEXT,
  remedy TEXT,
  notes TEXT,
  report_received_date TEXT,
  park_it BOOLEAN DEFAULT false,
  park_outside BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(nhtsa_campaign_number, model_year, data_source)
);

CREATE INDEX idx_recalls_make_model ON recalls(make, model);
CREATE INDEX idx_recalls_make_model_year ON recalls(make, model, model_year);

ALTER TABLE recalls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON recalls FOR SELECT USING (true);
