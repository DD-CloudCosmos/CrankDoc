# CrankDoc UX/UI Audit Report

**Prepared by:** Priya (QA)
**Date:** 2026-03-08
**App version:** Live at crankdoc.vercel.app (commit `b9189a9`)
**Methodology:** Code analysis (all components + pages) + live app testing (mobile 390px + desktop 1440px via Playwright)

---

## Executive Summary

CrankDoc has a **solid visual foundation** with consistent styling, good mobile-first responsive design, and a clean component architecture. However, the live app reveals several **critical discrepancies** between the codebase and production, and important UX gaps that should be addressed before expanding the user base.

**Scorecard:**

| Category | Score | Notes |
|----------|-------|-------|
| Visual consistency | 8/10 | Strong CSS variable system, consistent card/shadow patterns |
| Mobile UX | 7/10 | Good responsive layouts, but nav truncation and touch target issues |
| Accessibility | 5/10 | Semantic HTML solid, but gaps in aria-live, keyboard nav, screen reader support |
| Loading/error states | 4/10 | Client-side pages OK, server-side pages missing Suspense/skeletons |
| Navigation & discoverability | 4/10 | Critical: VIN hidden, Glossary/Recalls/Admin hidden on some viewports, nav inconsistent |
| Content accuracy | 3/10 | Live app shows 6 bikes (not 18), 57 trees (not 119), stats counter wrong |
| SEO | 4/10 | Static pages OK, dynamic pages missing metadata entirely |

---

## CRITICAL FINDINGS (P0 — Fix Before Next Release)

### 1. Navigation is inconsistent across pages

**Observed on live app:**
- **Home, Diagnose, Bikes, DTC, VIN pages:** Mobile nav shows only **4 items** (Home, Diagnose, Bikes, DTC)
- **Glossary page:** Mobile nav shows **7 items** (Home, Diagnose, Bikes, DTC, Glossary, Recalls, Admin)
- **Desktop nav (all pages):** Shows only **4 items** (Home, Diagnose, Bikes, DTC)

**Impact:** Glossary, Recalls, VIN, and Admin are **unreachable** from most pages. Users can only find them by:
- Clicking feature cards on the home page (VIN Decoder, but no Glossary/Recalls cards)
- Landing on the glossary page directly (which then shows the full nav)

**Root cause:** Likely a conditional nav rendering issue — the Navigation component may be rendering different item sets based on route or viewport.

**Severity:** CRITICAL — 3 of 7 features are hidden from users

### 2. Live data doesn't match database totals

**Observed on live app:**

| Metric | Expected (per DB) | Live App Shows | Location |
|--------|-------------------|----------------|----------|
| Motorcycles | 18 | 6 | /bikes page |
| Diagnostic trees | 119 | 57 | /diagnose page, home counter |
| Motorcycle Models (home stat) | 18 | 6 | Home page hero |
| DTC codes | 664 | 664 | /dtc page — correct |
| Glossary terms | 205 | 220 | /glossary page |

**Impact:** Users see dramatically less content than exists. The 7 Kymco scooters and ~62 diagnostic trees are invisible. The "Scooter" category doesn't appear in the bikes filter.

**Possible causes:**
- Data not seeded to production Supabase (only local/staging)
- RLS policies filtering out scooter records
- Query filtering to specific categories only

**Severity:** CRITICAL — more than half the content is missing in production

### 3. Diagnose page shows flat list instead of guided 3-step flow

**Expected (per code):** Guided flow: Select Bike → Choose Symptom → Walk Tree
**Observed:** Flat alphabetical list of all 57 diagnostic trees with no bike selection, no category grouping, no step indicator

**Impact:** The core feature of CrankDoc — the guided diagnostic experience — is not working as designed. Users are dumped into an overwhelming alphabetical list of all trees with no context for which bike they apply to.

**Severity:** CRITICAL — core feature UX is broken in production

### 4. Admin page has no authentication

**Location:** `src/app/admin/layout.tsx:23` — TODO comment: "Add auth check when admin auth is implemented"
**Observed:** `/admin` and `/admin/manuals` are publicly accessible to anyone

**Severity:** CRITICAL — security/privacy risk

### 5. PWA icon missing (404)

**Observed in console on every page:**
```
Failed to load resource: the server responded with a status of 404 ()
  → /icons/icon-192.png
Error while trying to use the following icon... isn't a valid image
```

**Impact:** PWA manifest fails, install-to-home-screen won't work, browser shows warnings

**Severity:** HIGH — broken PWA functionality, console errors on every page load

---

## HIGH FINDINGS (P1 — Address Soon)

### 6. No loading states on server-rendered pages

**Affected pages:** `/bikes`, `/bikes/[id]`, `/diagnose`

These pages fetch data server-side with no Suspense boundaries. If queries are slow:
- User sees blank white/beige area until all data loads
- No skeleton loaders, no spinners, no "Loading..." text
- Bike detail page runs 6 parallel queries in `Promise.all()` — if NHTSA recalls API is slow, entire page hangs

**Client-side pages (DTC, Glossary, Recalls) are fine** — they show spinners while loading.

### 7. Bike detail page has no error handling for parallel queries

**Location:** `src/app/bikes/[id]/page.tsx`
- `Promise.all()` with 6 queries and no try-catch
- If ANY query fails, the entire page throws a 500 error
- No fallback content (e.g., "Recalls unavailable")

### 8. Missing dynamic SEO metadata

| Page | Current Title | Should Be |
|------|--------------|-----------|
| Bike detail | "CrankDoc — Motorcycle..." (generic) | "Honda CBR600RR Specs \| CrankDoc" |
| Diagnose tree | "Diagnostic Trees \| CrankDoc" (generic) | "Engine Won't Start — CBR600RR \| CrankDoc" |
| DTC search | "DTC Code Lookup \| CrankDoc" (static) | "P0301 — Cylinder Misfire \| CrankDoc" |

No pages have dynamic Open Graph images for social sharing.

### 9. Inconsistent back navigation patterns

| Page | Back Button Text | Style |
|------|-----------------|-------|
| Bike detail | "← Back to all bikes" | `ArrowLeft` icon + text |
| Diagnose tree | "&larr; Back to symptoms" | HTML entity (inconsistent) |
| Diagnose step 2 | "Change" | Context button, not back |

Should standardize to `← Back to {destination}` using lucide `ArrowLeft` icon everywhere.

### 10. Hardcoded error card styling

All error states use `border-red-200 bg-red-50 text-red-700` instead of CSS variables. These won't adapt if the theme changes.

---

## MEDIUM FINDINGS (P2 — Scheduled for Future)

### 11. Touch targets too small in some places

| Element | Current Size | Minimum (WCAG) |
|---------|-------------|-----------------|
| Small buttons (`size="sm"`) | 32px | 44px |
| Nav icons (mobile) | 20px | 24px+ |
| Filter pills | ~30-40px | 44px |

Default buttons at 48px (`h-12`) are fine.

### 12. Accessibility gaps

**Missing:**
- `aria-live="polite"` on loading/error states (screen readers won't announce changes)
- Keyboard support for expandable table rows (DTC, Glossary) — only click, no Enter/Space
- Skip-to-main-content link (hidden, for keyboard users)
- `sr-only` text for icon-only buttons

**Present and good:**
- `aria-label` on toggle buttons, search inputs, view switches
- `alt` text on images (sourced from database)
- `focus-visible` ring styles on all interactive elements
- `aria-hidden="true"` on decorative SVGs
- `prefers-reduced-motion` respected for animations

**Overall a11y score estimate:** ~60% WCAG AA compliance

### 13. Filter UI inconsistency

- Bikes, DTC, Glossary pages use **pill buttons** for filtering
- Recalls page uses **dropdown selects** for filtering
- Recalls model filter is not cascading (doesn't filter by selected make)

Should standardize on one pattern.

### 14. VIN Decoder page is sparse

- No VIN format guidance before user types
- No "Try Another" button after successful decode
- No example VIN for testing
- Page is mostly empty white space

### 15. Recalls table colSpan mismatch

`RecallList.tsx` uses `colSpan={6}` on detail rows but the table has 7 columns (expand + 6 data). May cause layout issues on some viewports.

---

## LOW FINDINGS (P3 — Nice to Have)

### 16. Home page stats counter shows wrong numbers
- "6 Motorcycle Models" (should be 18 if all data were present)
- "57 Diagnostic Trees" (should be 119)
- These appear to be live queries, so they'll self-correct when data issues are fixed

### 17. Glossary alphabetic filter A-Z buttons can reflow awkwardly on narrow mobile

### 18. No footer on any page
- Acceptable for a tool-focused app, but a minimal footer with links could improve navigation

### 19. "How It Works" section describes a 3-step guided flow that doesn't match the actual diagnose page experience

---

## DESIGN SYSTEM ASSESSMENT

### What's Working Well

**CSS Variables (globals.css)**
- Clean theming: `--background: #F2E8D8`, `--card: #FFFFFF`, `--primary: #1F1F1F`
- Shadow hierarchy: `--shadow-soft`, `--shadow-card`, `--shadow-modal`
- All components use CSS vars consistently (except error states)

**Component Patterns**
- `rounded-[24px]` consistently applied to cards, filters, nav, tables
- `rounded-[16px]` for buttons, `rounded-[999px]` for badges — clear hierarchy
- Co-located tests (every component has a `.test.tsx`)
- shadcn/ui base with consistent Tailwind customization

**Dark Theme**
- Warm beige background with white cards creates good visual hierarchy
- Not a true "dark mode" but excellent for workshop/low-light environments
- WCAG AA compliant contrast ratios throughout

**Responsive Design**
- Mobile-first approach consistently applied
- Strategic column hiding on tables (`sm:hidden`, `md:hidden`)
- Bottom nav bar on mobile (fixed, rounded pill, clear active states)
- `pb-16` reserved on all pages for mobile nav overlap

**Animations**
- Subtle `riseIn` animation on hero and cards
- `prefers-reduced-motion` respected (good a11y)
- Hover effects: `-translate-y-1` lift on cards (tactile feel)

### Areas Needing Attention

**Navigation Architecture**
- Inconsistent item count across pages
- No desktop nav for Glossary/Recalls/Admin
- VIN Decoder has no nav entry anywhere

**Data Loading Strategy**
- Mixed approach: some pages server-side (no loading states), some client-side (with spinners)
- No skeleton loaders anywhere
- No Suspense boundaries on server-side pages

**Error Handling**
- Client-side pages: good (try-catch + error cards)
- Server-side pages: poor (no try-catch, 500 errors on failures)

---

## RECOMMENDED ACTION PLAN

### Sprint 1 (Ship-blocking)
1. **Fix navigation** — ensure all 7 nav items show on all pages, all viewports
2. **Investigate missing data** — why only 6 bikes and 57 trees in production?
3. **Fix diagnose page** — restore the guided 3-step flow (bike → symptom → tree)
4. **Fix PWA icon** — add `/icons/icon-192.png` or update manifest

### Sprint 2 (High priority)
5. **Add Suspense/loading states** to server-rendered pages (bikes list, bike detail, diagnose)
6. **Add error handling** to bike detail `Promise.all()`
7. **Implement admin auth** (even basic middleware redirect)
8. **Add dynamic SEO metadata** for bike detail and diagnose tree pages
9. **Standardize back navigation** pattern

### Sprint 3 (Medium priority)
10. **Accessibility pass** — aria-live regions, keyboard nav for expandable rows, skip link
11. **Increase touch targets** for small buttons and filter pills
12. **Standardize filter UI** (pills vs dropdowns)
13. **Error styling** — move to CSS variables

### Sprint 4 (Polish)
14. **VIN page improvements** (format guidance, try-another button)
15. **Skeleton loaders** for tables
16. **Footer** with nav links
17. **Cascade recalls filter** (model by make)

---

## SCREENSHOTS

All screenshots captured at mobile (390x844) and desktop (1440x900) viewports. Files saved in project root:

- `priya-report-home-mobile.png` — Home page, full mobile scroll
- `priya-report-home-desktop.png` — Home page, full desktop view
- `priya-report-diagnose-mobile.png` — Diagnose page (flat list, no guided flow)
- `priya-report-bikes-mobile.png` — Bikes page (only 6 models visible)
- `priya-report-dtc-mobile.png` — DTC page (working well)
- `priya-report-glossary-mobile.png` — Glossary page (full nav visible here)
- `priya-report-vin-mobile.png` — VIN Decoder (sparse, no nav entry)

---

## CONSOLE ERRORS (All Pages)

Every page logs these errors:
```
ERROR: Failed to load resource: /icons/icon-192.png (404)
WARNING: Error while trying to use the following icon... isn't a valid image
WARNING: The resource .../icons/icon-512.png was preloaded... not used
```

---

*Report prepared for team review. Screenshots available in project root. Questions → Priya or David.*
