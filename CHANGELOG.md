# Changelog

All notable changes to this project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

### Changed

### Fixed

### Removed

## [0.4.0] — 2026-03-04

### Added
- Glossary/lexicon page with 205 terms and 30 SVG illustrations (#10)
- Glossary redesign: expandable table with image zoom (#11)
- RAG system foundation — vector DB schema, parsing, chunking, query API (#13, #14)
- Web scraping pipeline with manufacturer scrapers, headless fetcher, robots.txt compliance (#16, #17, #18)
- Admin manual coverage dashboard with Supabase Storage migration (#20, #24)
- Home page redesign with hero card and integrated CTA (#19)
- Diagnose page redesign with guided 3-step flow (#21)

### Fixed
- Glossary category filter case mismatch (#12)
- Admin nav link and dynamic manuals page (#22)
- Manual coverage dashboard stats (#23)
- UI consistency: filter pills, badge styles, table column widths (#25)
- Diagnose page equal heights, spacing, and contrast (#26)

## [0.3.0] — 2026-02-16

### Added
- 119 diagnostic trees (2,977 nodes) across all pilot models and universals
- 664 DTC codes across 11 manufacturers
- 205 service intervals with torque/fluid specs
- 31 technical documents (SVG diagrams)
- 7 Kymco scooter models with model-specific trees
- 8 universal scooter diagnostic trees (CVT belt, variator, cold start, etc.)
- NHTSA recalls integration with import script
- Import/seed scripts for all data types
- Tree validation script

## [0.2.0] — 2026-02-10

### Added
- Motorcycle database with bike grid/table views and category filters
- Bike detail page with specs, service intervals, and diagnostic tree tabs
- VIN decoder page (NHTSA vPIC API)
- DTC code lookup page with search and manufacturer/category filters
- Recalls page with filtering
- Tree walker UI for interactive diagnostic flows
- Component test suite (co-located with source)

## [0.1.0] — 2026-02-10

### Added
- Next.js 16 project with TypeScript, TailwindCSS 4, shadcn/ui
- Supabase project and initial database schema
- Vercel deployment pipeline
- App shell: navigation, dark theme, responsive layout
- CI pipeline: lint, type-check, test, build (GitHub Actions)
