CREATE TABLE IF NOT EXISTS glossary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  definition TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  aliases TEXT[],
  related_terms TEXT[],
  illustration_url TEXT,
  applies_to TEXT[],
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_glossary_terms_slug ON glossary_terms(slug);
CREATE INDEX idx_glossary_terms_category ON glossary_terms(category);
CREATE INDEX idx_glossary_terms_term ON glossary_terms(term);

ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON glossary_terms FOR SELECT USING (true);
