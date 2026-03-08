# CrankDoc

## Project Overview

Motorcycle and scooter diagnostic decision tree web app. Mobile-first, dark-themed, workshop-friendly. Users select a bike and symptom, then walk through interactive diagnostic flows to find root causes. Free, no-login MVP.

**Type:** Full-stack web application
**Stack:** Next.js 16.1.6 (App Router) + TypeScript + TailwindCSS 4 + shadcn/ui, Supabase (PostgreSQL), Vercel
**Active agents:** All (Sofia, Marcus, Elena, Jake, Priya, Alex, Kai, Nina, Ravi, Clara, Bob)

## Architecture

Next.js App Router frontend deployed on Vercel. Supabase provides PostgreSQL database, auth (admin-only), and file storage (manuals). API routes in `src/app/api/` proxy external services (NHTSA, VIN decoding) and serve data. Diagnostic trees are JSON-authored, imported via scripts, and walked interactively in the UI. RAG pipeline (Phase 2-4) provides vector search over specs and docs.

## Key Directories

- `src/app/` — App Router pages and API routes (Elena + Alex)
  - `src/app/bikes/` — Motorcycle database browser
  - `src/app/diagnose/` — Diagnostic tree flow (core feature)
  - `src/app/dtc/` — DTC code lookup
  - `src/app/recalls/` — NHTSA recall viewer
  - `src/app/vin/` — VIN decoder
  - `src/app/glossary/` — Technical glossary/lexicon
  - `src/app/admin/` — Admin dashboard (manual coverage)
  - `src/app/api/` — API routes (DTC, glossary, recalls, VIN, RAG)
- `src/components/` — Reusable UI components with co-located tests (Elena + Jake)
- `src/components/ui/` — shadcn/ui primitives
- `src/lib/` — Utilities, Supabase client, RAG, scraper, recalls logic
- `src/hooks/` — Custom React hooks (Elena)
- `src/types/` — TypeScript type definitions (including Supabase generated types)
- `src/test/` — Test setup and utilities (Nina)
- `data/` — Seed data: trees (JSON), DTCs, service intervals, tech docs, images, manuals
- `scripts/` — Import/seed scripts (trees, DTCs, intervals, motorcycles, tech docs, recalls, glossary)
- `supabase/migrations/` — Database migrations (Marcus ONLY)
- `Docs/` — Project plan, brand guidelines, decisions, architecture plans
- `.github/workflows/` — CI pipeline (Kai)
- `public/` — Static assets, icons, illustrations

## Common Commands

- Dev server: `npm run dev`
- Run tests: `npm run test`
- Test watch: `npm run test:watch`
- Test coverage: `npm run test:coverage`
- Lint: `npm run lint`
- Type check: `npx tsc --noEmit`
- Build: `npm run build`
- Scrape specs: `npm run scrape:specs`

## State Files

@ROADMAP.md
@TODO.md

## Conventions

- Database/migration work goes through Marcus exclusively
- Security-sensitive code requires Ravi's review
- Frontend follows Elena's established component patterns
- API contracts agreed between Elena and Alex before implementation
- All PRs require relevant reviewer approval (see git-workflow)
- Components and tests are co-located (e.g., `BikeCard.tsx` + `BikeCard.test.tsx`)
- `rounded-[24px]` is the standard border radius for card containers
- Tables use `bg-card` (white) against warm beige page background
- shadcn components created manually (CLI doesn't work on this machine)
- Supabase `.single()` with TypeScript can cause `never` narrowing — use helper functions
- Dark theme is default (workshop-friendly)
- Testing is mandatory — features must ship with tests

---

## Code Standards

### TypeScript
- Strict mode enabled. No `any` types — use `unknown` and narrow, or define proper interfaces.
- All component props must have explicit TypeScript interfaces.
- Use `type` for object shapes, `interface` for things that may be extended.
- Prefer `const` over `let`. Never use `var`.

### React / Next.js
- Use the **App Router** (not Pages Router). All routes live in `src/app/`.
- Default to **Server Components**. Only add `"use client"` when the component needs browser APIs, state, or event handlers.
- Use `next/image` for all images. Use `next/link` for all internal links.
- Colocate related files: page, components, types, and tests in the same route folder when route-specific.

### Styling
- **TailwindCSS only** — no CSS modules, no styled-components, no inline style objects.
- Use **shadcn/ui** components as the base. Customize via Tailwind classes, not by forking component internals.
- Dark theme is the default and primary theme (workshop-friendly). Light theme is secondary.
- Mobile-first: design for 320px-428px first, then scale up.

### File Naming
- Components: `PascalCase.tsx` (e.g., `BikeSelector.tsx`)
- Utilities/hooks: `camelCase.ts` (e.g., `useDecodeVin.ts`)
- Types: `camelCase.types.ts` or colocated in the component file if small
- Test files: `*.test.ts` or `*.test.tsx` next to the file they test
- Constants: `SCREAMING_SNAKE_CASE` for values, `camelCase` for the file

---

## Testing Requirements — MANDATORY

**Every feature must ship with tests. No exceptions.**

### Testing Stack
- **Vitest** — unit and integration tests
- **React Testing Library (RTL)** — component tests
- **Playwright** — end-to-end tests (via MCP server)

### Testing Rules
1. **Every new component** must have a corresponding `.test.tsx` file.
2. **Every new utility/hook** must have a corresponding `.test.ts` file.
3. **Every API route** must have tests covering success and error cases.
4. **Test files live next to the code they test** (colocated).

### What to Test

| Layer | What to Test | Tool |
|-------|-------------|------|
| **Components** | Renders correctly, user interactions, conditional rendering, accessibility | Vitest + RTL |
| **Hooks** | Return values, state changes, error handling | Vitest + `renderHook` |
| **Utilities** | Input/output, edge cases, error handling | Vitest |
| **API routes** | Response shape, status codes, error responses | Vitest |
| **Pages (E2E)** | Full user flows, navigation, form submissions | Playwright |

### Coverage Targets
- Aim for **80%+ line coverage** on utilities and hooks.
- Aim for **meaningful coverage** on components (don't test implementation details, test behavior).
- E2E tests must cover every primary user flow.

### Before Completing Any Feature
1. Write tests for the feature.
2. Run `npm run test` and ensure all tests pass.
3. Run `npm run test:coverage` and verify coverage is maintained.
4. If the feature involves UI, verify with Playwright snapshot or interaction test.

---

## Supabase Conventions

- Use the **Supabase JS client** (`@supabase/supabase-js`).
- Server-side: use the service role client (never expose service role key to the browser).
- Client-side: use the anon key client with Row Level Security (RLS) policies.
- All database types should be generated from Supabase and imported from `src/types/database.types.ts`.
- Store credentials in `.env.local` (never commit this file).

---

## Safety & Content Conventions

CrankDoc provides diagnostic guidance. All content must follow the safety framework:

- Every diagnostic tree has a **safety rating**: green (beginner-safe), yellow (care required), red (professional recommended).
- **Safety warnings** are mandatory on nodes involving electrical, fuel, brake, or structural work.
- Disclaimer text must appear on every page with diagnostic content.
- Never instruct users to defeat safety systems.
- Never encourage work beyond the stated skill level of the tree.

---

## Verification Checklist

After any code changes, run in order before committing:

1. `npm run lint` — fix any lint errors
2. `npm run test` — all tests must pass
3. `npm run build` — build must succeed

**Only commit if all three pass.**

---

## AI Development Notes

- This project is built solo with AI assistance. Keep code simple and well-documented.
- Prefer explicit over clever. A junior developer should be able to read any file and understand it.
- When adding new dependencies, justify why — prefer what's already in the stack.
- For multi-file or multi-step features, write a plan first and get user approval before coding.
- For small bug fixes (< 3 files), proceed directly.
- When running CLI tools, always use non-interactive flags (`--yes`, `--no-git`, etc.).
- If a permission error or repeated API failure occurs (3+ attempts), stop immediately and report.
