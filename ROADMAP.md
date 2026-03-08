# Project Roadmap

## Current Iteration: v0.5 — Polish & Content Expansion

### High Priority
- [ ] Smart search UI (cross-feature search)
- [ ] PWA configuration (installable, offline caching)
- [ ] Mechanic tester recruitment and feedback loop

### Medium Priority
- [ ] Landing page / onboarding flow improvements
- [ ] Performance optimization (lazy loading, image optimization)
- [ ] SEO audit (meta tags, structured data for Google)
- [ ] Responsive design audit — test on various phone sizes

### Low Priority
- [ ] Learning Mode (explains "why" behind diagnostic steps)
- [ ] User accounts and saved progress
- [ ] Community-contributed diagnostic trees

## Backlog
- [ ] Wiring diagrams
- [ ] Workshop management features (seat licensing, teams)
- [ ] Hardware integration (OBD-II dongle pairing)
- [ ] Monetization (freemium tiers, workshop licenses)
- [ ] Multi-language / i18n
- [ ] Full native offline mode (Capacitor + SQLite)

## Completed Iterations

### v0.1 — Foundation (✅ 2026-02-10)
- [x] Next.js project with TypeScript + TailwindCSS + shadcn/ui (✅ 2026-02-10)
- [x] Supabase project and initial database schema (✅ 2026-02-10)
- [x] Vercel deployment (git push = live) (✅ 2026-02-10)
- [x] App shell: navigation, dark theme, responsive layout (✅ 2026-02-10)
- [x] GitHub repository and CI pipeline (lint, type-check, test, build) (✅ 2026-02-16)

### v0.2 — Motorcycle Database & Core Pages (✅ 2026-02-16)
- [x] Motorcycle database with 18 entries (11 models + 7 Kymco scooters) (✅ 2026-02-16)
- [x] Bikes page with grid/table views, category filters, search (✅ 2026-02-10)
- [x] Bike detail page with specs, service intervals, diagnostic trees tabs (✅ 2026-02-10)
- [x] VIN decoder page (NHTSA vPIC API integration) (✅ 2026-02-10)
- [x] NHTSA recalls page with filters (✅ 2026-02-10)
- [x] DTC code lookup page (664 codes, 11 manufacturers, search + filters) (✅ 2026-02-10)

### v0.3 — Diagnostic Engine & Content (✅ 2026-02-16)
- [x] Diagnostic tree data model (trees, nodes, edges) (✅ 2026-02-10)
- [x] Tree walker UI — guided 3-step flow (bike → symptom → walk tree) (✅ 2026-03-03)
- [x] 119 diagnostic trees (2,977 nodes) across all pilot models + universals (✅ 2026-02-16)
- [x] 205 service intervals with torque/fluid specs (✅ 2026-02-16)
- [x] 31 technical documents (SVG diagrams) (✅ 2026-02-16)
- [x] Import/seed scripts for all data types (✅ 2026-02-16)
- [x] Tree validation script (✅ 2026-02-16)

### v0.4 — Glossary, RAG & Scraping (✅ 2026-03-04)
- [x] Glossary/lexicon page (205 terms, 30 SVG illustrations) (✅ 2026-03-03)
- [x] Glossary redesign: expandable table with image zoom (✅ 2026-03-03)
- [x] RAG system foundation — vector DB, parsing, chunking, query API (✅ 2026-03-03)
- [x] Web scraping pipeline for motorcycle specs (manufacturer scrapers, headless fetcher) (✅ 2026-03-03)
- [x] Admin manual coverage dashboard with Supabase Storage (✅ 2026-03-04)
- [x] Home page redesign with hero card and integrated CTA (✅ 2026-03-03)
- [x] Diagnose page redesign — guided 3-step flow (✅ 2026-03-03)
- [x] UI consistency fixes — filter pills, badges, table columns, spacing (✅ 2026-03-04)
