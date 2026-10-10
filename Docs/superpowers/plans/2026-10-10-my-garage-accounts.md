# My Garage Accounts and Bike Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Users can sign in and keep a private collection of individual motorcycles, including two of the same model.

**Architecture:** Add cookie-based user clients alongside the existing public and administrator clients. Store physical bikes in a new owner-restricted table. Keep the existing browser selections available until an explicit import succeeds.

**Tech Stack:** The existing Next.js/TypeScript/Tailwind/Supabase stack, pinned `@supabase/ssr@0.12.7` and `@supabase/supabase-js@2.114.0`, Vitest and local Supabase.

**Spec:** [Approved design](../specs/2026-10-10-my-garage-design.md). Read the [umbrella plan](2026-10-10-my-garage.md) first for limits, preparation, release boundaries and shared contracts.

## Global Constraints

- "Personal users can access only their own motorcycles, jobs and attachments."
- "Keep catalogue models and personal motorcycles separate."
- "Do not silently discard browser data or invent mileage/history while migrating it."
- "Provider selection and implementation are outside this workload."
- Apply every constraint and shared decision in the umbrella plan. Do not change public read policies or the existing administrator authentication.

## Review Focus

- Cookie refresh must retain the administrator guard and the new session cookies on redirects.
- Neither service-worker caches nor server caches can contain private account pages.
- Browser import retries must create at most one imported bike per selected model; ordinary Add bike must allow duplicates.
- Unknown year/variant is acceptable for a bike record but cannot silently select verified variant-specific content.
- Signing out clears private client state; back navigation must not restore another user's loaded garage.

## File map and public interfaces

New account utilities: `src/lib/supabase/auth-browser.ts`, `auth-server.ts`, `auth-proxy.ts`, and `src/lib/account.ts`, each with a colocated test. Keep the current public `client.ts`/`server.ts` intact.

New routes: `src/app/account/page.tsx`, `actions.ts`, `AccountForm.tsx`, `src/app/auth/callback/route.ts`, and `src/app/account/reset-password/page.tsx`. Every route/form/action gets a colocated test.

New garage domain: `src/lib/garageBikes.ts` for parsing/input validation and `garageRepository.server.ts` for owner-scoped queries. New pages/components live under `src/app/garage/`: collection page, `GarageCollection.tsx`, `GarageBikeCard.tsx`, `BikeForm.tsx`, `ImportGarage.tsx`, actions, and `[bikeId]/page.tsx`/`BikeWorkspace.tsx`, all with colocated tests. Later stages add maintenance sections to BikeWorkspace.

```ts
// src/lib/account.ts
export type AccountContext = {
  client: import('@supabase/supabase-js').SupabaseClient<import('@/types/database.types').Database>;
  userId: string;
}
export function safeReturnPath(value: string | null): string
export async function getAccount(): Promise<AccountContext | null>

// src/lib/garageBikes.ts
export type BikeInput = {
  motorcycleId: string | null; nickname: string; make: string; model: string;
  year: number | null; variant: string; market: string; registration: string;
  mileageKm: number | null;
}
export type BikeView = BikeInput & {
  id: string; archivedAt: string | null; photoPath: string | null;
  libraryImageUrl: string | null; modelReferenceUrl: string | null;
}
export function parseBikeInput(input: unknown): BikeInput

// src/lib/garageRepository.server.ts; the account is verified before calling these.
export function listBikes(account: AccountContext, archived?: boolean): Promise<BikeView[]>
export function getBike(account: AccountContext, id: string): Promise<BikeView | null>
export function addBike(account: AccountContext, input: BikeInput, id: string): Promise<BikeView>
export function editBike(account: AccountContext, id: string, input: BikeInput): Promise<BikeView>
export function archiveBike(account: AccountContext, id: string, archive: boolean): Promise<void>
export function removeBike(account: AccountContext, id: string): Promise<void>
export function importSelectedModels(account: AccountContext, modelIds: string[]): Promise<BikeView[]>
```

### Task 1: Accounts, cookie sessions and private-page cache boundaries

**Files:** Account/client files above; modify `src/proxy.ts`, `src/proxy.test.ts`, `public/sw.js`, `src/app/page.tsx`, `.env.example`, `package.json` and lockfile. Add `src/lib/privatePaths.ts`, its test, and `src/test/serviceWorkerPrivacy.test.ts`.

**Interfaces:** `createAuthBrowserClient()` returns a typed Supabase browser client; `createAuthServerClient()` returns `Promise<SupabaseClient<Database>>`; `updateAccountSession(request: NextRequest)` returns `Promise<NextResponse>`. `getAccount()` validates with `auth.getUser()` and returns null on invalid/expired sessions. `isPrivatePath(pathname: string)` recognises `/garage`, `/account`, `/auth`, `/api/garage` and descendants.

- [x] Write failing redirect and cache tests. Create independent tests for signed-in, signed-out and refreshed-cookie responses. Keep every existing administrator test and await the now-async proxy. Add this concrete redirect test:

```ts
import { expect, it } from 'vitest'
import { safeReturnPath } from '@/lib/account'

it('rejects external return destinations', () => {
  expect(safeReturnPath('https://other.example/garage')).toBe('/garage')
  expect(safeReturnPath('//other.example/garage')).toBe('/garage')
  expect(safeReturnPath('/\\other.example')).toBe('/garage')
  expect(safeReturnPath('/garage/123?tab=maintenance')).toBe('/garage/123?tab=maintenance')
})
```

- [x] Run `npx vitest run src/lib/account.test.ts src/proxy.test.ts src/test/serviceWorkerPrivacy.test.ts`. Expect missing new utilities/tests to fail before implementation.
- [x] Run `npm install --save-exact @supabase/ssr@0.12.7 @supabase/supabase-js@2.114.0` and implement the separate clients using current [Supabase cookie client guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs). Use `cookies().getAll()`/`setAll()` in the server adapter. Keep refreshed cookies/cache headers when redirecting. Add these proxy matchers alongside the existing administrator matcher:

```ts
export const config = {
  matcher: ['/admin/:path*', '/garage/:path*', '/account/:path*', '/auth/:path*', '/api/garage/:path*'],
}
```

- [x] Implement email/password sign-up, sign-in, recovery and sign-out as Server Actions using the verified cookie client, never a service-role client. Create `AuthResult = {ok: true} | {ok: false; message: string}` and `signUp(email,password)`, `signIn(email,password)`, `sendRecovery(email)`, `setPassword(password)` and `signOut()`, all returning `Promise<AuthResult>`. Use the provider's configured password requirements with an initial minimum of eight characters in both form and local Auth configuration. Do not show whether an unknown email exists when requesting recovery. Invalid code links return an actionable account page; no token is logged.

```ts
const { error } = await client.auth.signInWithPassword({ email, password })
const { error: signupError } = await client.auth.signUp({
  email, password,
  options: { emailRedirectTo: `${siteOrigin}/auth/callback?next=/garage` },
})
// Callback exchanges only the returned code; the next destination is sanitised.
const { error: callbackError } = await client.auth.exchangeCodeForSession(code)
```

`siteOrigin` comes from `NEXT_PUBLIC_SITE_URL`, with the local origin configured explicitly; do not build email redirects from an untrusted request Host. Add that variable to the existing environment example. Recovery redirects to `/auth/callback?next=/account/reset-password`; protect the password form with `getAccount()`.

- [x] Put the private-path check before every service-worker cache strategy. Private requests pass directly to the network and never fall back to CacheStorage. Bump the cache version to discard old navigation copies. Add `Cache-Control: private, no-store` to private routes, avoid hourly revalidation for them, and clear private component state on sign-out. Keep the homepage public and cached; do not render account data into its server HTML.

```js
// public/sw.js, before other fetch strategies; keep this list in sync with privatePaths tests.
const PRIVATE_PATHS = ['/garage', '/account', '/auth', '/api/garage']
if (PRIVATE_PATHS.some(p => url.pathname === p || url.pathname.startsWith(p + '/'))) {
  event.respondWith(fetch(event.request))
  return
}
```

- [x] Exercise the actual worker script with a mocked `self`/`caches` and assert that an offline private navigation never calls `caches.match` or `cache.put`. Test both ordinary navigation and a Next.js page-prefetch request. Component tests cover wrong password, confirmation pending, failed recovery, expired link, session expiry while saving, and logout followed by a second account. Replace homepage copy with "Browse without an account. Sign in to save your garage." Keep unrelated page styling unchanged.
- [x] Run targeted tests, then the project checks from the umbrella plan. Commit `feat: add personal accounts and protect private page caches`.

### Task 2: Private physical-bike records and tested database ownership

**Files:** New CLI-created `supabase/migrations/*_garage_bikes.sql`; generate/update `src/types/database.types.ts`. Create the garage domain/repository files and tests and `src/test/garageFixtures.ts` for reusable typed test data. Create `supabase/config.toml` through the CLI for local testing, `scripts/garage-test-env.ts`, `scripts/test-garage-access.ts`, and ignored `.env.garage.local`; update `.gitignore` and `supabase/README.md` only for these new workflows.

**Interfaces:** Repository signatures in the file map. `loadGarageTestEnv()` returns `{url:string, anonKey:string, serviceKey:string}` and refuses every URL except `localhost`/`127.0.0.1`. It parses only `.env.garage.local` and reads `API_URL`, `ANON_KEY` and `SERVICE_ROLE_KEY`, never falling back to live `.env.local`. `createLocalTestClients()` returns two signed-in clients (`a`, `b`), a local setup client (`admin`), their user IDs (`userA`, `userB`), one setup catalogue model ID (`modelId`), and `cleanup():Promise<void>`; create users and that catalogue fixture only in this isolated test environment.

- [x] Write failing `parseBikeInput` tests for optional unknown mileage, zero mileage, negative/NaN values, valid custom make/model, empty make/model, unknown year, malformed UUID and lengths from the umbrella plan. Validate against a catalogue model's year range when it is linked. An unknown year can be stored, but is not eligible for a year-specific verified template.

```ts
expect(parseBikeInput({ motorcycleId: null, nickname: '', make: 'Honda', model: 'Custom',
  year: null, variant: '', market: '', registration: '', mileageKm: 0 }).mileageKm).toBe(0)
expect(() => parseBikeInput({ motorcycleId: null, nickname: '', make: 'Honda', model: 'Custom',
  year: 2023, variant: '', market: '', registration: '', mileageKm: -1 })).toThrow()
```

- [x] Run the domain tests and confirm failure. Inspect `npx supabase init --help`/`start --help`; initialise the local config and start with `DOCKER_HOST=unix:///Users/david/.colima/crankdoc/docker.sock npx supabase start`. Capture `supabase status -o env` directly into the ignored `.env.garage.local`, set its permissions to 600, and never print the keys. Create a new migration with `npx supabase migration new garage_bikes`. Put the table and policies in the generated file:

```sql
create table public.garage_bikes (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  motorcycle_id uuid references public.motorcycles(id) on delete set null,
  nickname text not null default '', make text not null, model text not null,
  year integer, variant text not null default '', market text not null default '',
  registration text not null default '', mileage_km numeric(12,3),
  photo_path text, archived_at timestamptz, import_key text,
  created_at timestamptz not null default now(),
  unique(owner_id,id), unique(owner_id,import_key),
  check (mileage_km is null or mileage_km >= 0),
  check (length(make) between 1 and 120 and length(model) between 1 and 120),
  check (length(nickname) <= 80 and length(variant) <= 120 and length(market) <= 120),
  check (length(registration) <= 40),
  check (year is null or year between 1885 and 2100)
);
alter table public.garage_bikes enable row level security;
grant select,insert,update,delete on public.garage_bikes to authenticated;
create policy garage_bikes_owner on public.garage_bikes for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
```

- [x] Implement repository functions using the authenticated client and explicit owner filters as well as policies. Derive owner ID from the verified account, never from form data. Resolve library images from `motorcycle_images` or catalogue `image_url`; match model/year and keep unknown/custom bikes on the placeholder. Use the two existing Honda slugs for their public reference routes, catalogue ID routes for other supported models, and null for unlisted models. Reuse stored UUID IDs for retryable adds. Archive is reversible; removal requires confirmation and is a distinct action.
- [x] Generate database types from the local stack while retaining the existing exported convenience aliases. Add this complete typed fixture factory in src/test/garageFixtures.ts, then implement two-user tests with real requests:

```ts
import type { BikeView } from '@/lib/garageBikes'
export function bikeFixture(overrides: Partial<BikeView> = {}): BikeView {
  return {id:'00000000-0000-4000-8000-000000000001',motorcycleId:null,
    nickname:'Weekend bike',make:'Honda',model:'Custom',year:null,variant:'',market:'',
    registration:'',mileageKm:null,archivedAt:null,photoPath:null,libraryImageUrl:null,
    modelReferenceUrl:null,...overrides}
}
```

```ts
import assert from 'node:assert/strict'
import { createLocalTestClients } from './garage-test-env'
const { a, b, userA, userB, cleanup } = await createLocalTestClients()
try {
  const id = crypto.randomUUID()
  const added = await a.from('garage_bikes').insert({id,owner_id:userA,make:'Honda',model:'CB650RA'})
  assert.equal(added.error, null)
  assert.deepEqual((await b.from('garage_bikes').select('*').eq('id',id)).data, [])
  assert.ok((await b.from('garage_bikes').insert({id:crypto.randomUUID(),owner_id:userA,make:'Honda',model:'CB650RA'})).error)
  assert.ok((await a.from('garage_bikes').update({owner_id:userB}).eq('id',id)).error)
} finally { await cleanup() }
```

Add anonymous read/write denial, second-user edit/delete denial, duplicate model creation, and failed validation tests. Do not confuse a zero-row response with a successful mutation. Regenerate types and run `npx tsx scripts/test-garage-access.ts` against local test variables only.
- [x] Run targeted unit tests and project checks; commit `feat: store private motorcycles independently of catalogue models`.

### Task 3: Bike cards, details, navigation and explicit browser import

**Files:** Garage pages/components/actions from the file map; modify `src/components/Navigation.tsx` and its test, `src/components/home/GarageStrip.tsx` and its test. Keep `src/hooks/useGarage.ts` and `src/components/GarageQuickPicks.tsx` working for the existing no-login diagnostic shortcuts.

**Interfaces:** `GarageBikeCard({bike}: {bike:BikeView})`; `GarageCollection({initialBikes}: {initialBikes:BikeView[]})`; `BikeForm({initial,onSave}: {initial:BikeInput|null;onSave:(input:BikeInput,id:string)=>Promise<BikeView>})`; `BikeWorkspace({bike}: {bike:BikeView})`. Each form gets a stable generated ID before submission. `ImportGarage({selectedModelIds,onImport})` calls `importSelectedModels` only after the user chooses import.

- [x] Write failing component tests: two cards of the same model open different IDs; custom bike uses placeholder; unknown mileage says "Mileage not recorded"; add/edit errors retain values; archive appears under an explicit archived view; remove asks for confirmation; and signed-out access shows sign-in without changing public model pages.

```tsx
const bike: BikeView = { id:'one', motorcycleId:null, nickname:'Weekend bike', make:'Honda',
  model:'Custom', year:null, variant:'', market:'', registration:'', mileageKm:null,
  archivedAt:null, photoPath:null, libraryImageUrl:null, modelReferenceUrl:null }
render(<GarageBikeCard bike={bike} />)
expect(screen.getByRole('link', {name:/Weekend bike/})).toHaveAttribute('href','/garage/one')
expect(screen.getByText('Mileage not recorded')).toBeInTheDocument()
```

- [x] Run the new tests to confirm failure. Implement `/garage` and `/garage/[bikeId]` as dynamic server pages using `getAccount()` and owner-scoped repository calls. Render private client forms only beneath these pages. The card is a single accessible link; put Edit image later inside the bike page, not inside the clickable card.
- [x] Implement Overview/Maintenance/Bike details with the existing segmented-control and grouped-list patterns. At this stage Maintenance shows an honest empty state; stage 2 fills it. Add My Garage to the desktop navigation and mobile More menu without changing the five existing mobile tabs. Add a link from the existing homepage garage strip, while its cached server response remains public.
- [x] Implement explicit browser import. For each selected catalogue model, insert with `import_key = 'local-v1:' + modelId`, using the account/model pair to make retrying safe. Leave year, mileage and maintenance unknown. Do not erase localStorage or the experience preference. If already imported, return the existing record; ordinary Add bike has no import key and can create a second physical bike of that model. A missing catalogue ID is reported for that item without fabricating a model. Show a partial-import result and allow retry.

```ts
const {a,userA,modelId,cleanup} = await createLocalTestClients()
const account: AccountContext = {client:a,userId:userA}
try {
  const first = await importSelectedModels(account, [modelId])
  const repeated = await importSelectedModels(account, [modelId])
  expect(repeated[0].id).toBe(first[0].id)
  expect(repeated[0].year).toBeNull()
  expect(repeated[0].mileageKm).toBeNull()
} finally { await cleanup() }
```

- [x] Repeat the import using real local clients and assert row count remains one. Run component tests for cancelling import and failure/retry; verify archived records are retained and model reference doesn't expose registration.
- [x] Run all stage tests and project checks. Commit `feat: add account garage cards and individual bike pages`. Stop for the stage review before starting the maintenance plan.

Stage implementation and task/stage reviews completed locally. The ten recorded rulings and costs are in [garage-decisions.md](../../garage-decisions.md). Final scoped review passed for all blocking findings. Native browser/paper checks, the minor photo-expiry follow-up and hosted release remain tracked in [garage-acceptance.md](../../garage-acceptance.md).
