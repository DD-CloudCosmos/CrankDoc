# Changelog

All notable changes to this project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- Apple-style landing page with a live product window built from a real diagnostic guide (#28)
- First-visit onboarding and "My Garage" (bikes + experience level, stored on the device) (#28)
- Garage shortcuts in Diagnose; guides and steps above your experience level are flagged (#28)
- "Your answers" trail in the tree walker (#28)
- Automatic dark mode following the OS setting (#28)
- `/dtc?q=` deep links and a KYMCO filter for fault codes (#28)
- Branded error page with retry (#28)

### Changed
- Complete visual redesign: Apple-style tokens, system font (SF Pro / Inter), grouped lists, segmented controls, frosted navigation (#28)
- Mobile tab bar: Home, Diagnose, Bikes, Codes, More; VIN decoder added to navigation (#28)
- Dropped the multi-agent persona workflow: removed the persona hooks and replaced persona ownership rules in CLAUDE.md, TODO.md, ROADMAP.md and DECISIONS.md with plain conventions
- Safety labels: Beginner-safe, Care required, Pro recommended (#28)

### Fixed
- Inter font never loaded (body font resolved to Tailwind's default stack) (#28)
- Installed PWAs kept serving stale pages: navigations are now network-first and the cache version is bumped (#28)
- Nested link/button markup on back buttons and not-found pages; unlabeled glossary search and VIN fields (#28)
- Severity/difficulty colours unreadable in dark mode (#28)

### Removed
- Warm-beige "Lumière" theme and the HowItWorks component (#28)

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
