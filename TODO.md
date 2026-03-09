# Current Tasks

## In Progress

### TODO-009: Seed production Supabase with all data
- **Agent:** Marcus (DBA)
- **Branch:** N/A (data operation)
- **Acceptance criteria:** Production shows 18 motorcycles, 119 diagnostic trees, 664 DTCs, 205 service intervals, 205 glossary terms. Run all import scripts against production env.
- **Dependencies:** None
- **Complexity:** S
- **Status:** 🏗️ 2026-03-08 — NEEDS MARCUS

## Ready


### TODO-011: Verify production after deploy + seed
- **Agent:** Priya (QA)
- **Branch:** N/A (verification)
- **Acceptance criteria:** Re-test all 5 P0 findings from UX/UI audit. All resolved except TODO-012 (admin auth).
- **Dependencies:** TODO-008, TODO-009
- **Complexity:** S


## Parked (from v0.5 backlog)

### TODO-003: README overhaul
- **Agent:** Clara (Documentation)
- **Branch:** `docs/TODO-003-readme`
- **Acceptance criteria:** Replace boilerplate Next.js README with project-specific content: what CrankDoc is, screenshots, setup instructions, data seeding guide, architecture overview.
- **Dependencies:** None
- **Complexity:** S

### TODO-005: SEO and structured data audit
- **Agent:** Elena (Frontend) + Clara (Documentation)
- **Branch:** `feat/TODO-005-seo-audit`
- **Acceptance criteria:** All pages have proper meta tags, Open Graph data, and JSON-LD structured data. Lighthouse SEO score ≥ 90.
- **Dependencies:** None
- **Complexity:** M

### TODO-006: Responsive design audit
- **Agent:** Jake (UI/UX)
- **Branch:** `fix/TODO-006-responsive-audit`
- **Acceptance criteria:** All pages tested and fixed for 320px–428px viewport widths. No horizontal overflow, no unreadable text, no broken layouts on mobile.
- **Dependencies:** None
- **Complexity:** M

### TODO-007: Performance optimization
- **Agent:** Alex (Backend) + Elena (Frontend)
- **Branch:** `feat/TODO-007-performance`
- **Acceptance criteria:** Lazy load images, optimize bundle size, add loading states. Lighthouse performance score ≥ 80 on mobile.
- **Dependencies:** None
- **Complexity:** M

## Blocked

## Done (this iteration)

### TODO-008: Force Vercel redeploy (✅ 2026-03-08)
- Redeployed production. Nav, diagnose flow, PWA icons all verified working.

### TODO-012: Admin auth middleware (✅ 2026-03-09)
- Middleware protects `/admin/*` routes. Login page + API with timing-safe SHA-256 comparison. Open redirect prevention. httpOnly secure cookie. Logout button. 13 tests. Security-reviewed by Ravi. Requires `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` env vars on Vercel.

### TODO-013: Suspense/loading states on server pages (✅ 2026-03-08)
- Added `loading.tsx` skeletons for `/bikes`, `/bikes/[id]`, `/diagnose`. Branch merged to master.

### TODO-014: Error handling on bike detail Promise.all (✅ 2026-03-08)
- Replaced `Promise.all()` with `Promise.allSettled()` + `getSettledValue` helper. Branch merged to master.

### TODO-015: Dynamic SEO metadata (✅ 2026-03-08)
- Added `generateMetadata()` to bike detail and diagnose tree pages with Open Graph tags. Branch merged to master.

### TODO-016: Standardize back navigation (✅ 2026-03-08)
- Created `BackButton` component with lucide ArrowLeft. Applied to bike detail and diagnose tree pages. 3 tests. Branch merged to master.

### TODO-017: Accessibility pass (✅ 2026-03-09)
- Skip link, aria-live regions, keyboard nav for expandable rows, sr-only text. 12 new tests.

### TODO-018: Touch target sizing (✅ 2026-03-09)
- 44px min touch targets on sm buttons, mobile nav, view toggles, glossary pills.

### TODO-019: Standardize filter UI (✅ 2026-03-09)
- Recalls page converted from dropdown selects to pill buttons. Cascading make→model filters.

### TODO-010: Add npm seed scripts to package.json (✅ 2026-03-09)
- Added 8 npm scripts: `seed:motorcycles`, `seed:dtc`, `seed:trees`, `seed:intervals`, `seed:tech-docs`, `seed:glossary`, `seed:recalls`, `seed:all`. Order in `seed:all` respects FK dependencies (motorcycles first).

### TODO-020: Error styling to CSS variables (✅ 2026-03-09)
- All error states now use `--destructive` CSS vars instead of hardcoded red classes. 9 source files + 2 test files updated.

### TODO-001: Smart search UI (✅ 2026-03-09)
- Cross-feature search bar searching bikes, DTCs, glossary, diagnostic trees, and recalls. API route with 5 parallel Supabase queries. 300ms debounced hook with AbortController. Desktop inline dropdown + mobile full-screen overlay. 49 new tests. 876 total tests passing.

### TODO-002: PWA enhancement (✅ 2026-03-09)
- OfflineIndicator component, expanded SW caching (glossary/recalls/dtc + API network-first), iOS PWA metadata, SW update detection. 6 new tests.

### TODO-004: Clean up stale branches (✅ 2026-03-09)
- Deleted 10 remote branches (5 claude/*, 4 feature/*, 1 fix/*). Deleted 13 stale local branches. Pruned remote tracking refs. Only `origin/master` remains remotely.
