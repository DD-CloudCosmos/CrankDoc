# CI/CD Pipeline Design

**Date:** 2026-02-16
**Status:** Approved

## Overview

Add automated quality gates on PRs and auto-deployment on merge to master. Two systems, each doing what it's best at: GitHub Actions for CI checks, Vercel Git integration for deploys.

## GitHub Actions CI Workflow

**File:** `.github/workflows/ci.yml`

**Triggers:**
- `pull_request` to `master`
- `push` to `master`

**Environment:** Ubuntu latest, Node 20 LTS, npm cache

**Steps (single job `ci`):**
1. Checkout code
2. Setup Node 20 with npm cache
3. `npm ci`
4. `npm run lint` (ESLint)
5. `npx tsc --noEmit` (TypeScript type check)
6. `npm run test` (Vitest, 332+ tests)
7. `npm run build` (Next.js production build)

Steps run sequentially for fast feedback — lint fails in seconds, no point running tests if types are broken.

**Secrets required (GitHub repo settings):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

No service role key needed — tests mock Supabase.

## Vercel Git Integration

**Setup:** Connect `DD-CloudCosmos/CrankDoc` GitHub repo to the existing Vercel project via Vercel dashboard.

**Behavior:**
- Push to `master` → production deploy to `crankdoc.vercel.app`
- PR opened/updated → preview deploy with unique URL
- No `vercel.json` needed — auto-detects Next.js
- Environment variables already configured in Vercel dashboard
- CLI `vercel --prod` remains as a backup option

## Branch Protection on master

**GitHub repo settings > Branches > Add rule for `master`:**
- Require status checks to pass before merge (select `ci` job)
- Require branches to be up to date before merge
- No force pushes to master
- No deletions of master
- Direct pushes still allowed (solo developer)

## Flow Summary

```
PR opened → GitHub Actions CI (lint/types/tests/build)
         → Vercel preview deploy (unique URL)
         → Both must pass to merge

PR merged → Push to master
         → GitHub Actions CI (confirms nothing broke)
         → Vercel production deploy (crankdoc.vercel.app)
```
