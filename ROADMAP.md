# Project Roadmap

## Current Iteration: v0.4.1 — UX/UI Audit Fixes

Triggered by Priya's UX/UI audit (2026-03-08). Fixing P0–P2 findings before resuming v0.5 features.

### Sprint 1: Ship-Blocking (Infrastructure + Data)
- [x] Force Vercel redeploy — serve current master (✅ 2026-03-08)
- [-] Seed production Supabase — all 18 bikes, 119 trees, full dataset (🏗️ 2026-03-08, Marcus)
- [ ] Add npm seed scripts to package.json (Kai)
- [ ] Verify production — re-test all P0 findings (Priya)

### Sprint 2: High Priority Code Fixes (P0-4 + P1s) ✅ 2026-03-09
- [x] Admin auth middleware — protect `/admin/*` routes (✅ 2026-03-09)
- [x] Suspense/loading states on server pages — bikes, bike detail, diagnose (✅ 2026-03-08)
- [x] Error handling — `Promise.allSettled()` on bike detail page (✅ 2026-03-08)
- [x] Dynamic SEO metadata — bike detail + diagnose tree pages (✅ 2026-03-08)
- [x] Standardize back navigation — `BackButton` component with lucide icon (✅ 2026-03-08)

### Sprint 3: Medium Priority Polish (P2s) ✅ 2026-03-09
- [x] Accessibility pass — aria-live, keyboard nav, skip link (✅ 2026-03-09)
- [x] Touch target sizing — 44px minimum for all interactive elements (✅ 2026-03-09)
- [x] Standardize filter UI — pills everywhere, remove dropdown selects (✅ 2026-03-09)
- [x] Error styling → CSS variables (✅ 2026-03-09)

## Next Iteration: v0.5 — Polish & Launch Prep

### High Priority
- [ ] Smart search UI (cross-feature search)
- [-] PWA configuration (installable, offline caching) (🏗️ 2026-03-09, Kai)
- [ ] Mechanic tester recruitment and feedback loop

### Medium Priority
- [ ] Landing page / onboarding flow improvements
- [ ] Performance optimization (lazy loading, image optimization)
- [ ] SEO audit (meta tags, structured data for Google)
- [ ] Responsive design audit — test on various phone sizes

### Low Priority
- [ ] Learning Mode (explains "why" behind diagnostic steps)

## v0.6 — Infrastructure & Environments

### Domain & Hosting Setup
- [ ] Configure `accept.crankdoc.app` as staging domain (GoDaddy CNAME → Vercel)
- [ ] Configure `www.crankdoc.com` → redirect to `crankdoc.app`
- [ ] Rename current Vercel project to `crankdoc-staging`
- [ ] Keep `crankdoc.app` apex unconnected until production launch

### Production Environment (at launch)
- [ ] Create `crankdoc-prod` Vercel project
- [ ] Create separate Supabase production project
- [ ] Run migrations + seed scripts against prod Supabase
- [ ] Point `crankdoc.app` at production Vercel project
- [ ] Separate env vars per environment (Supabase keys, Stripe keys, admin secrets)

## v1.0 — Commercialization & Paid Launch

### Strategy: Freemium with Workshop Tiers

**Free tier (acquisition funnel):**
- Universal diagnostic trees (not bike-specific)
- DTC code lookup (limited results)
- Glossary + VIN decoder
- Goal: get mechanics using the app daily, build habit

**Pro tier — Individual Mechanic (~€9.99/mo):**
- All model-specific diagnostic trees
- Full DTC database (all manufacturers)
- Service intervals with torque/fluid specs
- Recalls monitoring for saved bikes
- Offline mode (PWA with cached trees)
- Priority new model coverage

**Workshop tier (~€29.99/mo per seat):**
- Everything in Pro
- Multi-seat licensing (team management)
- Workshop branding
- Diagnostic history / job tracking
- API access for integration with shop management systems

### Technical Requirements for Monetization
- [ ] User accounts — Supabase Auth (email + social login)
- [ ] Subscription management — Stripe integration (checkout, billing portal, webhooks)
- [ ] Entitlement system — middleware that checks subscription tier before serving gated content
- [ ] Usage tracking — which features are used, conversion funnel analytics
- [ ] Paywall UI — upgrade prompts on gated features, pricing page

### Go-to-Market Strategy
- [ ] **Validate pricing** — interview 5-10 mechanics at Scooter Point + online forums
- [ ] **Beta program** — 20-50 free Pro accounts for early testers, collect feedback
- [ ] **Content moat** — expand to 30+ models, 500+ trees before launch (hard to replicate)
- [ ] **SEO landing pages** — "{Make} {Model} diagnostic guide" pages for organic traffic
- [ ] **YouTube/TikTok** — short "how to diagnose X" videos linking to CrankDoc
- [ ] **Motorcycle forum presence** — ADVRider, Reddit r/motorcycles, model-specific forums
- [ ] **Workshop partnerships** — Scooter Point as first paying customer / case study
- [ ] **Affiliate/referral** — mechanics refer other mechanics, get free months

### Revenue Milestones
- [ ] First paying customer
- [ ] 100 free users (validates demand)
- [ ] 10 Pro subscribers (validates willingness to pay)
- [ ] 3 Workshop accounts (validates B2B angle)
- [ ] €1,000 MRR (sustainable side project)

## Backlog
- [ ] Wiring diagrams
- [ ] Hardware integration (OBD-II dongle pairing)
- [ ] Multi-language / i18n (Dutch first, then German/French for Benelux)
- [ ] Full native offline mode (Capacitor + SQLite)
- [ ] AI-powered diagnosis (RAG + LLM suggesting probable causes)
- [ ] Manufacturer partnerships (official service data licensing)

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
