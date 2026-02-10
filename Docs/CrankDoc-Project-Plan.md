# CrankDoc — Project Plan

**Status:** Final
**Date:** 2026-02-10
**Context:** Solo non-developer building with AI assistance. Budget flexible. No time pressure. Goal is a full MVP.

---

## 1. Context & Why This Plan Exists

The CrankDoc project brief identifies a genuine gap: no free, structured, interactive motorcycle diagnostic decision tree exists anywhere. Mechanics either "ask the senior guy" or dig through static PDFs. CrankDoc fills this gap with an app that walks users through structured diagnostic flows, model by model, symptom by symptom.

This plan turns the brief into an actionable build guide. It makes the key decisions the brief left open and defines a phased development approach optimized for a solo non-developer leveraging AI tools.

---

## 2. Key Decisions

### 2.1 Tech Stack: Next.js + Supabase + Vercel

**Recommendation: Web app (mobile-optimized), not native mobile.**

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend** | Next.js 15 (App Router) | Most AI-friendly React framework. File-based routing. SSR + static generation. Massive ecosystem. |
| **UI** | TailwindCSS + shadcn/ui | Professional UI without design skills. Consistent components. Dark theme support (workshop-friendly). |
| **Backend/DB** | Supabase (PostgreSQL) | Auth, database, storage, real-time — one service. SQL is ideal for structured spec/diagnostic data. Row-level security. |
| **Hosting** | Vercel | Zero-config deployment. `git push` = live. Free tier is generous. Edge functions for API routes. |
| **Language** | TypeScript | One language everywhere. Best AI code-generation support. Type safety catches errors early. |

**Why web instead of native mobile:**
- 10x simpler to develop, deploy, and iterate (no Xcode, no Android Studio, no app store reviews)
- The core UX — selecting symptoms, tapping through decision trees, reading specs — is purely informational content display. No camera, GPS, or hardware access needed.
- Mobile-responsive web looks and feels native when done well (especially with a dark workshop theme)
- Can add "install to home screen" (PWA) for app-like experience
- If native is needed later, can wrap with Capacitor (same codebase → iOS + Android apps)

**Why NOT React Native/Expo:**
- Adds significant toolchain complexity (build configs, native modules, simulator management)
- For a non-developer, the web development feedback loop (save → see changes) is dramatically faster
- The app doesn't need anything that requires native platform access

**Offline strategy (phased):**
- Phase 1: Aggressive caching with service workers. Spec data and diagnostic trees cache on first load.
- Phase 2: Full PWA with offline manifest. Core functionality works without network.
- Phase 3 (if needed): Capacitor wrapper with SQLite for true native offline.

### 2.2 MVP Scope

**In scope (MVP):**
- Diagnostic Decision Trees — the core feature
- Motorcycle selector (Year/Make/Model)
- VIN decoder (NHTSA vPIC API)
- Basic spec display per model
- Recall/TSB lookup per model
- DTC code lookup (generic OBD-II)
- Mobile-optimized dark theme UI
- No user accounts required — free, open access

**Out of scope (post-MVP):**
- Learning Mode (explains "why" behind steps)
- User accounts and saved progress
- Community-contributed diagnostic trees
- Wiring diagrams
- Workshop management features
- Full offline mode
- Native app store builds
- Monetization (freemium, subscriptions)

### 2.3 Content Strategy: AI-Generated + Human Review

The diagnostic trees ARE the product. The app is just a delivery mechanism. Content quality is everything.

**Pipeline:**
1. Pull NHTSA complaint data for target models, cluster by component and failure pattern
2. Use Claude to generate structured decision trees as JSON from complaint patterns + general diagnostic knowledge
3. Import JSON into Supabase via script
4. Review trees by walking through them in the app itself (the tree viewer IS the review tool)
5. Mark trees as draft/published via a minimal admin toggle page
6. Validate with real mechanics (find 3-5 testers via motorcycle forums/Reddit)
7. Iterate based on feedback

**Tooling approach:** No visual tree editor in MVP. Trees are authored as JSON (AI-generated), imported via script, reviewed by using the app. A visual editor is only built later if content volume demands it.

**Initial target:** 5 pilot models × 10-15 failure modes each = 50-75 diagnostic trees at launch

**Pilot models (high-volume, good NHTSA data):**
1. Honda CBR600RR (sportbike, huge community)
2. Yamaha MT-07 (popular naked, common starter bike)
3. Harley-Davidson Sportster (cruiser segment, very different diagnostic patterns)
4. Kawasaki Ninja 400 (beginner-friendly, high volume)
5. BMW R1250GS (adventure/touring, electronic-heavy)

This selection covers: sportbike, naked, cruiser, beginner, and adventure segments — with different engine configs (inline-4, parallel twin, V-twin, parallel twin, boxer twin) to validate that the tree model works across diverse platforms.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   User's Phone                   │
│              (Mobile Browser / PWA)              │
├─────────────────────────────────────────────────┤
│                                                  │
│   Next.js Frontend (Vercel)                      │
│   ├── /                    Landing / Home        │
│   ├── /diagnose            Symptom picker        │
│   ├── /diagnose/[treeId]   Decision tree walker  │
│   ├── /bikes               Year/Make/Model DB    │
│   ├── /bikes/[id]          Motorcycle profile    │
│   ├── /vin                 VIN decoder           │
│   ├── /dtc                 DTC code lookup       │
│   ├── /admin               Tree editor (auth'd)  │
│   └── /api/*               API routes            │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│   Supabase                                       │
│   ├── PostgreSQL           All structured data   │
│   ├── Auth                 Admin access only      │
│   ├── Storage              Images, diagrams       │
│   └── Edge Functions       NHTSA API proxy        │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│   External APIs (read-only)                      │
│   ├── NHTSA vPIC           VIN decoding          │
│   ├── NHTSA Complaints     Failure mode data     │
│   ├── NHTSA Recalls        Recall lookups        │
│   └── API Ninjas           Spec enrichment       │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Data Model (Core Tables)

```sql
-- Motorcycle identification
motorcycles (
  id, make, model, year, category,
  engine_type, displacement_cc, cylinders,
  power_hp, torque_nm, weight_kg,
  fuel_system, cooling, transmission,
  image_url, source -- track data provenance
)

-- Diagnostic trees
diagnostic_trees (
  id, symptom_slug, symptom_name, symptom_description,
  difficulty_level, -- beginner/intermediate/advanced
  estimated_time_minutes,
  applies_to_makes[], applies_to_models[],
  year_range_start, year_range_end,
  is_universal, -- applies to all bikes
  root_node_id, status -- draft/review/published
)

-- Tree nodes (each step in the diagnostic flow)
diagnostic_nodes (
  id, tree_id,
  node_type, -- 'question' | 'action' | 'result' | 'info'
  title, content_markdown,
  image_urls[], video_url,
  safety_warning,
  spec_reference, -- e.g., "Battery: 12.4V minimum"
  tools_needed[] -- e.g., ["multimeter", "socket set"]
)

-- Edges between nodes (the branching logic)
diagnostic_edges (
  id, from_node_id, to_node_id,
  condition_label, -- "Yes", "No", "< 12.4V", etc.
  sort_order
)

-- DTC code definitions
dtc_codes (
  id, code, description, severity,
  possible_causes[], applies_to_makes[]
)

-- NHTSA recall cache
recalls (
  id, motorcycle_id, campaign_number,
  description, consequence, remedy,
  recall_date, nhtsa_id
)
```

---

## 4. Development Phases

### Phase 0: Project Foundation (Week 1-2)

**Goal:** Working project skeleton with deployment pipeline.

- [ ] Initialize Next.js 15 project with TypeScript, TailwindCSS, shadcn/ui
- [ ] Set up Supabase project and database schema
- [ ] Configure Vercel deployment (git push = live)
- [ ] Set up the app shell: navigation, dark theme, responsive layout
- [ ] Create CLAUDE.md with project conventions for consistent AI-assisted development
- [ ] Set up Git repository

**Milestone:** Empty app deploys to a live URL with navigation working.

### Phase 1: Motorcycle Database (Week 3-5)

**Goal:** Users can find their motorcycle and see basic specs.

- [ ] Import Kaggle motorcycle specs dataset into Supabase
- [ ] Build Year → Make → Model cascading selector component
- [ ] Build motorcycle profile page (specs display)
- [ ] Integrate NHTSA vPIC API for VIN decoding
- [ ] Build VIN scan page (manual entry, decode, show results)
- [ ] Add search functionality (by model name)
- [ ] Pull and display NHTSA recalls per model

**Milestone:** User enters VIN or selects Year/Make/Model → sees specs + recalls.

### Phase 2: Diagnostic Engine (Week 6-10) — THE CORE

**Goal:** Users can walk through interactive diagnostic decision trees.

- [ ] Implement decision tree data model in Supabase
- [ ] Build the tree walker UI — the main diagnostic experience:
  - Symptom selection screen (categorized list)
  - Step-by-step node display (question → tap answer → next step)
  - Progress indicator (where am I in the tree?)
  - Result/resolution screen with summary of path taken
  - Back/restart navigation
  - Safety warnings and difficulty ratings displayed prominently
- [ ] Build minimal admin page:
  - List all trees with status (draft/published)
  - Toggle tree status
  - Protected by Supabase auth (admin-only)
- [ ] Create content pipeline tooling:
  - Script to pull NHTSA complaints for target models
  - Prompt templates for Claude to generate tree JSON
  - Import script: JSON → Supabase (validates schema, creates nodes + edges)
  - Generate first tree: "Engine won't start" for Honda CBR600RR
- [ ] Review workflow: use the tree walker UI to walk through generated trees, iterate on JSON until the flow is correct

**Milestone:** A user can select "Engine won't start" for a Honda CBR600RR and walk through a complete diagnostic tree to resolution.

### Phase 3: Content Population (Week 11-14)

**Goal:** Enough diagnostic content to be genuinely useful.

- [ ] Generate diagnostic trees for all 5 pilot models using AI pipeline
- [ ] Create universal trees (not model-specific) for common symptoms:
  - Engine won't start
  - Engine starts but dies / rough idle
  - Overheating
  - Battery draining
  - Brake issues
  - Chain/drive problems
  - Electrical faults (lights, signals)
  - Unusual noises
  - Oil leaks
  - Suspension problems
- [ ] Review and refine all generated content
- [ ] Add images/photos to key diagnostic steps
- [ ] Recruit 3-5 mechanic testers for validation feedback
- [ ] Iterate on trees based on feedback

**Milestone:** 50-75 published diagnostic trees covering the pilot models and universal symptoms.

### Phase 4: Reference & Polish (Week 15-18)

**Goal:** Round out the MVP feature set and polish the experience.

- [ ] DTC code lookup page (search by code, see description + possible causes)
- [ ] Import OBD-II DTC database (~11,000 standard codes)
- [ ] Add model-specific DTC codes where available (Harley, BMW)
- [ ] Service interval display per model (where data available)
- [ ] Landing page / onboarding flow
- [ ] PWA configuration (installable, basic offline caching)
- [ ] Performance optimization (lazy loading, image optimization)
- [ ] SEO basics (meta tags, structured data for Google)
- [ ] Analytics integration (understand how users use diagnostic trees)
- [ ] Responsive design audit — test on various phone sizes

**Milestone:** Complete MVP. A real user can install CrankDoc on their phone, find their bike, and diagnose common problems.

---

## 5. Content Pipeline (Detail)

This is the most critical workflow in the project. The app is just a viewer — the trees are the product.

### Step 1: Data Gathering (per model)
```
For each pilot model:
1. Query NHTSA Complaints API → get all complaints
2. Cluster complaints by NHTSA component category
3. Rank clusters by frequency → these are the top failure modes
4. Cross-reference with StackExchange/forums for repair knowledge
5. Note any model-specific quirks or known issues
```

### Step 2: AI Tree Generation
```
For each model × failure mode:
1. Feed Claude a prompt with:
   - The target symptom and model
   - Relevant NHTSA complaint narratives
   - General diagnostic principles for that system
   - The node schema (question/action/result/info)
2. Claude generates a structured decision tree in JSON
3. Output follows the exact database schema for direct import
```

### Step 3: Human Review
```
For each generated tree:
1. Import JSON into Supabase via import script
2. Open the tree in the app's tree walker (use the app as the review tool)
3. Walk through every branch manually
4. Check: Are the diagnostic steps logical?
5. Check: Are specs/values accurate for this model?
6. Check: Are safety warnings present where needed?
7. If issues found → edit JSON → re-import → re-walk
8. When satisfied → mark as "published" via admin page
```

### Step 4: Validation
```
Share beta access with mechanic testers:
1. Ask them to use trees on real diagnostic scenarios
2. Collect feedback: "Where did the tree lead you wrong?"
3. Track completion rates and drop-off points
4. Iterate on problem areas
```

---

## 6. External Services & Costs

| Service | Purpose | Cost |
|---------|---------|------|
| **Vercel** | Frontend hosting | Free tier (hobby), $20/mo (pro) |
| **Supabase** | Database, auth, storage | Free tier (500MB DB), $25/mo (pro) |
| **API Ninjas** | Spec enrichment | Free (50K calls/mo) or $9.99/mo |
| **NHTSA APIs** | VIN, recalls, complaints | Free, no auth |
| **Claude API** | Content generation pipeline | Pay-per-use (~$0.01-0.05 per tree) |
| **Vercel Analytics** | Usage tracking | Included in Vercel plan |
| **GitHub** | Code repository | Free |
| **Domain** | crankdoc.com (or similar) | ~$12/year |

**Estimated monthly cost at MVP:** $0-50/month depending on tier choices.

---

## 7. Legal & Safety Framework

A layered approach to liability, built into the app from day one:

**Layer 1 — Global Disclaimers (on every page)**
- Footer text: *"CrankDoc provides diagnostic guidance for educational reference only. Always follow manufacturer service manual procedures. For safety-critical work, consult a qualified mechanic."*
- Brief notice before starting any diagnostic tree

**Layer 2 — Safety Ratings (per tree)**
- Green: Safe for beginners (battery check, oil level, chain tension)
- Yellow: Requires care, some mechanical skill (coolant system, electrical)
- Red: Professional recommended (brake system, fuel system, structural)
- Red-tagged trees include explicit "stop and consult a professional if unsure" warnings

**Layer 3 — Content Guardrails (embedded in tree nodes)**
- Safety warnings at relevant nodes ("Disconnect battery before electrical work")
- Trees know their limits ("If you smell fuel, stop immediately")
- Never instruct users to defeat safety systems
- Never encourage work beyond stated skill level

**Layer 4 — Legal Review (before public launch)**
- Get a lawyer to review disclaimer language before going live
- Does not block development — build with layers 1-3, get legal review before public launch

---

## 8. Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI-generated trees contain inaccurate diagnostic advice | High — could damage trust or cause harm | Every tree goes through human review + mechanic validation. Safety warnings mandatory. Safety rating system (green/yellow/red). |
| Spec data has gaps or errors | Medium — frustrating UX | Cross-reference multiple sources. Show data provenance. Allow user feedback ("this spec is wrong"). |
| No mechanics available for validation | High — can't verify content quality | Post on r/Fixxit, ADVrider, local motorcycle clubs. Offer early access in exchange for feedback. |
| Offline doesn't work well enough | Medium — fails core use case | Phase 1: aggressive caching. Phase 2: PWA. Phase 3: Capacitor+SQLite if needed. Design for offline from the start even if we implement it progressively. |
| Legal liability for incorrect diagnostic advice | Medium-High | 4-layer safety framework (see Section 7). Legal review before public launch. |
| Content generation doesn't scale | Medium — stuck at 50 trees | The JSON + import pipeline is designed for batch generation. Claude API can generate trees programmatically. If quality is good, scaling is a throughput problem, not a design problem. |

---

## 9. What This Plan Does NOT Cover (Future)

These are intentionally deferred. They are good ideas from the brief but not MVP:

- **Learning Mode** — explaining the "why" behind diagnostic steps
- **User accounts** — saved bikes, diagnostic history, progress tracking
- **Community contributions** — user-submitted diagnostic trees
- **Wiring diagrams** — complex to digitize and display
- **Workshop management** — seat licensing, team features
- **Hardware integration** — OBD-II dongle pairing
- **Monetization** — freemium tiers, workshop licenses
- **Multi-language** — i18n infrastructure (but we'll keep strings externalizable)

---

## 10. Verification Strategy

After each phase, verify with these checks:

**Phase 0:**
- App loads on mobile browser at the live Vercel URL
- Dark theme renders correctly
- Navigation works between all stub pages

**Phase 1:**
- Can search for "Honda CBR600RR 2020" and see specs
- Can enter a VIN and get decoded motorcycle info
- Recalls display for known recalled models

**Phase 2:**
- Can start a diagnostic flow and walk through to resolution
- All branches in a tree are reachable (no dead ends)
- Back/restart navigation works
- JSON import script successfully loads a tree into Supabase
- Admin page shows tree list and can toggle draft/published status

**Phase 3:**
- At least 50 published trees accessible to users
- All 5 pilot models have model-specific trees
- Universal trees work when no model is selected

**Phase 4:**
- PWA installs on Android/iOS home screen
- DTC search returns results for common codes
- Page load time < 3 seconds on mobile
- All pages render correctly on phones (320px - 428px width)

---

## 11. First Session Deliverable

When we start building, the first coding session will:
1. Initialize the Next.js project with TypeScript + TailwindCSS + shadcn/ui
2. Set up the project structure and routing
3. Create the dark-themed app shell (header, navigation, layout)
4. Set up Supabase connection
5. Deploy to Vercel
6. Create CLAUDE.md with project conventions

This gives us a live, deployed foundation to build every subsequent feature on.
