# Architecture Decision Records

This file records significant technical decisions made during the project.
Decisions are debated by agents following the debate protocol and synthesized by Sofia.

---

## DEC-001: Next.js + Supabase + Vercel stack (Inferred from codebase)

**Status:** Inferred
**Context:** Solo non-developer building a diagnostic web app. Needed a full-stack solution with minimal operational complexity. Project plan (Docs/CrankDoc-Project-Plan.md) documents the rationale.
**Choice:** Next.js 16 (App Router) + TypeScript + TailwindCSS 4 + shadcn/ui for frontend. Supabase (PostgreSQL) for database, auth, and storage. Vercel for hosting.
**Evidence:** `package.json` dependencies, `next.config.ts`, `.vercel/` directory, Supabase client in `src/lib/supabase/`, migrations in `supabase/migrations/`
**Note:** This decision predates the agent framework. Rationale documented in project plan Section 2.1.

---

## DEC-002: Web app over native mobile (Inferred from codebase)

**Status:** Inferred
**Context:** Target users are mechanics in workshops using phones. Could have gone native (React Native/Expo) or web.
**Choice:** Mobile-optimized web app with PWA pathway. No native mobile.
**Evidence:** Next.js web stack, no native tooling in repo, PWA planned in roadmap, responsive dark theme throughout.
**Note:** This decision predates the agent framework. Rationale documented in project plan Section 2.1.

---

## DEC-003: JSON-authored diagnostic trees with import scripts (Inferred from codebase)

**Status:** Inferred
**Context:** Diagnostic decision trees are the core product. Needed a content authoring strategy.
**Choice:** Trees authored as JSON files in `data/trees/`, imported into Supabase via `scripts/import-trees.js`. No visual tree editor in MVP. Validation via `scripts/validate-trees.js`.
**Evidence:** 119 JSON tree files in `data/trees/`, import and validation scripts in `scripts/`, tree walker UI in `src/app/diagnose/` and `src/components/TreeWalker.tsx`
**Note:** This decision predates the agent framework. Visual editor deferred to post-MVP per project plan Section 2.3.

---

## DEC-004: Free, no-login MVP (Inferred from codebase)

**Status:** Inferred
**Context:** MVP targets broadest possible audience. User accounts add complexity.
**Choice:** No user authentication required. All content freely accessible. Supabase auth used only for admin features.
**Evidence:** No auth middleware in pages, no login/signup routes, admin page is the only auth-gated area.
**Note:** This decision predates the agent framework. User accounts are in the post-MVP backlog.

---

## DEC-005: Dark theme as default (Inferred from codebase)

**Status:** Inferred
**Context:** Target users work in motorcycle workshops — dark theme reduces eye strain and is more practical in garage environments.
**Choice:** Dark theme as the primary/default theme. Warm beige (`#F2E8D8`) page background with white (`#FFFFFF`) card surfaces.
**Evidence:** TailwindCSS theme configuration, `bg-card` usage throughout components, brand style guidelines in `Docs/CrankDoc-Brand-Style-Guidelines.md`
**Note:** This decision predates the agent framework.

---

## DEC-006: Vitest + React Testing Library for testing (Inferred from codebase)

**Status:** Inferred
**Context:** Testing framework choice for a Next.js + React project.
**Choice:** Vitest for test runner, React Testing Library for component tests, Playwright for E2E. Tests co-located with source files.
**Evidence:** `vitest.config.ts`, 87 test files co-located with components, `@testing-library/react` in devDependencies, `playwright` in devDependencies
**Note:** This decision predates the agent framework. Testing is mandatory — documented in CLAUDE.md.

---

## DEC-007: Kymco scooter expansion (Inferred from codebase)

**Status:** Inferred
**Context:** Original pilot models were 5 motorcycles. Expanded to include 7 Kymco scooter models (David trains at Scooter Point, Aarschot, services Kymco).
**Choice:** Added "scooter" category with 7 Kymco models (Agility 125, Like 125i, People S 125i, Downtown 125i, Downtown 300i, X-Town 300i, AK 550i). Added universal scooter trees (CVT belt, variator, etc.).
**Evidence:** 18 motorcycles in DB (11 original + 7 Kymco), 56 Kymco-specific trees + 8 universal scooter trees in `data/trees/`, Kymco DTC codes (62) in `data/dtc/`
**Note:** This decision predates the agent framework.

---

## DEC-008: RAG pipeline for spec enrichment (Inferred from codebase)

**Status:** Inferred
**Context:** Needed to enrich motorcycle data from external sources (manufacturer sites, spec databases).
**Choice:** RAG system with vector DB (pgvector via Supabase), document parsing/chunking, query API, and extraction pipeline. Web scraping with headless browser and robots.txt compliance.
**Evidence:** `supabase/migrations/006_rag_schema.sql`, `src/lib/rag/`, `src/lib/scraper/`, `src/app/api/rag/`
**Note:** This decision predates the agent framework.
