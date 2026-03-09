# Current Tasks

## In Progress

## Ready

### TODO-001: Smart search UI
- **Agent:** Elena (Frontend)
- **Branch:** `feat/TODO-001-smart-search`
- **Acceptance criteria:** Cross-feature search bar that searches bikes, DTCs, glossary terms, and diagnostic trees from a single input. Results grouped by category.
- **Dependencies:** None (all data sources already exist)
- **Complexity:** M

### TODO-002: PWA configuration
- **Agent:** Kai (Infrastructure)
- **Branch:** `feat/TODO-002-pwa-setup`
- **Acceptance criteria:** App installable on mobile home screen. Service worker caches core pages and diagnostic tree data. Offline indicator when disconnected.
- **Dependencies:** None
- **Complexity:** M

### TODO-003: README overhaul
- **Agent:** Clara (Documentation)
- **Branch:** `docs/TODO-003-readme`
- **Acceptance criteria:** Replace boilerplate Next.js README with project-specific content: what CrankDoc is, screenshots, setup instructions, data seeding guide, architecture overview.
- **Dependencies:** None
- **Complexity:** S

### TODO-004: Clean up stale branches
- **Agent:** Kai (Infrastructure)
- **Branch:** N/A (maintenance)
- **Acceptance criteria:** Remove merged remote branches (feature/glossary, feature/home-redesign, feature/storage-manuals, feature/admin-manual-coverage, and old claude/* branches). Prune local tracking refs.
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

### TODO-019: Standardize filter UI
- **Agent:** Elena (Frontend)
- **Branch:** `fix/TODO-019-filter-consistency`
- **Acceptance criteria:** Recalls page uses pill button filters matching BikeFilters pattern instead of dropdown selects. Make, Model (cascading), and Year filters all use pills.
- **Dependencies:** None
- **Complexity:** S
- **Completed:** 2026-03-09
