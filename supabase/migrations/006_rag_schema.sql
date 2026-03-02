-- RAG System Schema
-- Adds pgvector support, document source tracking, vector-embedded chunks,
-- and AI extraction job tracking for the CrankDoc RAG pipeline.

-- ============================================================
-- 0. Enable pgvector extension
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. Document Sources — tracks each ingested document
-- ============================================================
CREATE TABLE IF NOT EXISTS document_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('pdf', 'scan', 'web', 'manual_entry')),
  file_path TEXT,
  file_hash TEXT,
  motorcycle_id UUID REFERENCES motorcycles(id) ON DELETE SET NULL,
  make TEXT,
  model TEXT,
  year_start INTEGER,
  year_end INTEGER,
  manual_type TEXT CHECK (manual_type IN ('service_manual', 'owners_manual', 'parts_catalog', 'tsb')),
  total_pages INTEGER,
  processing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_sources_motorcycle ON document_sources(motorcycle_id);
CREATE INDEX IF NOT EXISTS idx_doc_sources_hash ON document_sources(file_hash);
CREATE INDEX IF NOT EXISTS idx_doc_sources_status ON document_sources(processing_status);

-- ============================================================
-- 2. Document Chunks — the core vector table
-- ============================================================
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_source_id UUID NOT NULL REFERENCES document_sources(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_length INTEGER NOT NULL,
  embedding vector(512) NOT NULL,

  -- Rich metadata for filtering and context
  motorcycle_id UUID REFERENCES motorcycles(id) ON DELETE SET NULL,
  make TEXT,
  model TEXT,
  section_title TEXT,
  section_hierarchy TEXT[],
  page_numbers INTEGER[],
  content_type TEXT NOT NULL DEFAULT 'prose'
    CHECK (content_type IN ('prose', 'spec_table', 'procedure', 'diagram_caption', 'torque_table', 'wiring_info')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Metadata filtering indexes
CREATE INDEX IF NOT EXISTS idx_chunks_document ON document_chunks(document_source_id);
CREATE INDEX IF NOT EXISTS idx_chunks_motorcycle ON document_chunks(motorcycle_id);
CREATE INDEX IF NOT EXISTS idx_chunks_make_model ON document_chunks(make, model);
CREATE INDEX IF NOT EXISTS idx_chunks_content_type ON document_chunks(content_type);

-- ============================================================
-- 3. Extraction Jobs — tracks AI extraction runs
-- ============================================================
CREATE TABLE IF NOT EXISTS extraction_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_source_id UUID NOT NULL REFERENCES document_sources(id) ON DELETE CASCADE,
  extraction_type TEXT NOT NULL
    CHECK (extraction_type IN ('specs', 'service_intervals', 'procedures', 'dtc_codes', 'diagnostic_trees')),
  target_table TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'needs_review')),
  result_data JSONB,
  review_notes TEXT,
  error_message TEXT,
  chunks_used UUID[],
  llm_model TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  cost_usd DECIMAL(8,6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_extraction_jobs_source ON extraction_jobs(document_source_id);
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_status ON extraction_jobs(status);

-- ============================================================
-- 4. RLS Policies
-- ============================================================
ALTER TABLE document_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON document_sources FOR SELECT USING (true);
CREATE POLICY "Public read access" ON document_chunks FOR SELECT USING (true);
CREATE POLICY "Public read access" ON extraction_jobs FOR SELECT USING (true);

-- ============================================================
-- 5. Similarity Search Function
-- ============================================================
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(512),
  match_count INTEGER DEFAULT 10,
  filter_motorcycle_id UUID DEFAULT NULL,
  filter_make TEXT DEFAULT NULL,
  filter_model TEXT DEFAULT NULL,
  filter_content_type TEXT DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  section_title TEXT,
  section_hierarchy TEXT[],
  page_numbers INTEGER[],
  content_type TEXT,
  make TEXT,
  model TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    dc.section_title,
    dc.section_hierarchy,
    dc.page_numbers,
    dc.content_type,
    dc.make,
    dc.model,
    (1 - (dc.embedding <=> query_embedding))::FLOAT AS similarity
  FROM document_chunks dc
  WHERE
    (filter_motorcycle_id IS NULL OR dc.motorcycle_id = filter_motorcycle_id)
    AND (filter_make IS NULL OR dc.make = filter_make)
    AND (filter_model IS NULL OR dc.model = filter_model)
    AND (filter_content_type IS NULL OR dc.content_type = filter_content_type)
    AND (1 - (dc.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON TABLE document_sources IS 'Tracks ingested source documents (PDFs, scans, web pages) for the RAG pipeline';
COMMENT ON TABLE document_chunks IS 'Vector-embedded text chunks for RAG similarity search';
COMMENT ON TABLE extraction_jobs IS 'Tracks AI-powered structured data extraction from documents';
