# CrankDoc — Project Conventions

## Project Overview

CrankDoc is a mobile-first web application that guides motorcycle mechanics through structured diagnostic troubleshooting via interactive decision trees, spec lookups, and step-by-step repair guidance.

**Tech Stack:** Next.js 15 (App Router) · TypeScript · TailwindCSS · shadcn/ui · Supabase (PostgreSQL) · Vercel
**Full project plan:** `Docs/CrankDoc-Project-Plan.md`

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

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (shell, nav, theme)
│   ├── page.tsx            # Landing / Home
│   ├── diagnose/           # Diagnostic tree features
│   ├── bikes/              # Motorcycle database
│   ├── vin/                # VIN decoder
│   ├── dtc/                # DTC code lookup
│   ├── admin/              # Admin pages (auth-protected)
│   └── api/                # API routes
├── components/             # Shared components
│   ├── ui/                 # shadcn/ui components
│   └── ...                 # App-specific shared components
├── lib/                    # Utilities, clients, helpers
│   ├── supabase/           # Supabase client config
│   └── ...
├── types/                  # Shared TypeScript types
└── __tests__/              # Integration tests (if not colocated)
```

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

### Test Naming Convention
```typescript
describe('ComponentName', () => {
  it('renders the expected content', () => { ... })
  it('handles user click on action button', () => { ... })
  it('shows error state when data fails to load', () => { ... })
})
```

### Running Tests
```bash
npm run test          # Run all unit/component tests
npm run test:watch    # Watch mode during development
npm run test:coverage # Coverage report
npm run test:e2e      # Playwright E2E tests
```

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

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

---

## Git Conventions

- **Branch naming:** `feature/<short-description>`, `fix/<short-description>`, `chore/<short-description>`
- **Commit messages:** Conventional commits — `feat:`, `fix:`, `chore:`, `test:`, `docs:`
- **Never commit:** `.env.local`, `node_modules/`, `.next/`, Supabase service keys
- **Always commit:** Test files alongside feature code

---

## Safety & Content Conventions

CrankDoc provides diagnostic guidance. All content must follow the safety framework:

- Every diagnostic tree has a **safety rating**: green (beginner-safe), yellow (care required), red (professional recommended).
- **Safety warnings** are mandatory on nodes involving electrical, fuel, brake, or structural work.
- Disclaimer text must appear on every page with diagnostic content.
- Never instruct users to defeat safety systems.
- Never encourage work beyond the stated skill level of the tree.

---

## AI Development Notes

- This project is built solo with AI assistance. Keep code simple and well-documented.
- Prefer explicit over clever. A junior developer should be able to read any file and understand it.
- When adding new dependencies, justify why — prefer what's already in the stack.
- shadcn/ui components are copied into the project (not imported from a package). They live in `src/components/ui/`.
