-- ============================================================
-- Migration 007: Lock down service manuals and RAG tables
-- ============================================================
-- Service manuals are copyrighted and are the basis of paid content.
-- Until now the public (anon) key could read every manual's text chunks
-- and the storage bucket served every PDF from a public URL.
--
-- After this migration only the service role (server-side code and
-- scripts) can read these tables or download files from the bucket.
-- Safe to run more than once.

-- ============================================================
-- 1. Remove public read access to the RAG tables
-- ============================================================
-- RLS stays enabled with no policies, so anon and authenticated roles
-- get no rows. The service role bypasses RLS.
DROP POLICY IF EXISTS "Public read access" ON document_sources;
DROP POLICY IF EXISTS "Public read access" ON document_chunks;
DROP POLICY IF EXISTS "Public read access" ON extraction_jobs;

-- ============================================================
-- 2. Make the manuals bucket private
-- ============================================================
-- Public URLs (/storage/v1/object/public/service-manuals/...) stop working.
UPDATE storage.buckets SET public = false WHERE id = 'service-manuals';

-- ============================================================
-- 3. Replace stored public URLs with storage paths
-- ============================================================
-- document_sources.file_path held the public URL of each uploaded manual.
-- Keep only "service-manuals/<filename>", which is all the scripts need.
UPDATE document_sources
SET file_path = regexp_replace(
  file_path,
  '^https?://[^/]+/storage/v1/object/public/service-manuals/',
  'service-manuals/'
)
WHERE file_path LIKE '%/storage/v1/object/public/service-manuals/%';
