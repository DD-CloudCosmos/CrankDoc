# CrankDoc — Project Brief

**Version:** 0.1  
**Date:** 2026-02-10  
**Author:** David Deceuninck  
**Status:** Pre-planning

---

## 1. Vision

CrankDoc is a mobile-first application that guides junior motorcycle mechanics through structured diagnostic troubleshooting. It replaces the "ask the senior guy" bottleneck with interactive decision trees, spec lookups, and step-by-step repair guidance — essentially an expert mechanic in your pocket.

### Core Value Proposition

No free, structured motorcycle diagnostic decision-tree database exists publicly. This is the gap CrankDoc fills. By building the first open structured diagnostic knowledge base for motorcycles, CrankDoc creates a defensible moat that is expensive to replicate.

---

## 2. Target Users

### Primary: Junior Mechanics (0–3 years experience)

- Apprentices in workshops who need guided troubleshooting
- Can identify parts and use tools, but lack diagnostic intuition
- Need "what to check next" guidance, not basic tool instructions
- Work across multiple brands and model years

### Secondary: DIY Enthusiasts

- Experienced riders maintaining their own bikes
- Comfortable with basic maintenance but stuck on intermittent faults
- Want torque specs, wiring diagrams, and service intervals on-demand

### Tertiary: Workshop Managers

- Want a training tool for onboarding new techs
- Need consistent diagnostic quality across their team

---

## 3. Scope

- **Geographic scope:** Global (multi-language from inception, start with English)
- **Depth:** Maximum — decision trees, wiring diagrams, torque specs, service intervals, DTC lookups
- **Initial coverage target:** Top 50 motorcycle models × top 20 failure modes per model = ~1,000 diagnostic paths at launch

---

## 4. Core Features

### 4.1 Diagnostic Decision Trees (MVP priority)

The primary feature. User selects a symptom (e.g., "engine won't start," "rough idle," "electrical fault") and the app walks them through a branching diagnostic flow:

- "Check battery voltage → if below 12.4V → charge/replace → retest"
- "Is the starter motor cranking? → Yes/No → [branch]"
- Each node can include: photos, torque specs, video links, safety warnings
- Trees are model-aware (a Honda CBR600RR has different paths than a Harley Sportster)

### 4.2 Motorcycle Spec Database

- Year/Make/Model lookup with 30+ specification fields
- VIN decoder integration (NHTSA vPIC API, free)
- Service intervals per manufacturer recommendation
- Torque specs for common fasteners per model

### 4.3 Reference Library

- Wiring diagrams (starting with most popular models)
- Diagnostic Trouble Code (DTC) lookup
- Common recall/TSB information per model
- Quick-reference safety procedures

### 4.4 Learning Mode

- Explains the "why" behind each diagnostic step
- Links symptoms to underlying mechanical/electrical theory
- Progress tracking for junior mechanics
- Quiz/certification paths (future)

---

## 5. Data Architecture

### 5.1 Foundation Layer — Motorcycle Specifications

| Source | Type | Coverage | Cost | License |
|--------|------|----------|------|---------|
| Kaggle Motorcycle Specs Dataset | CSV bulk | 1970–2022 | Free | Open |
| API Ninjas Motorcycles API | REST API | Tens of thousands of models, 30+ fields | Free tier (30/query) | Commercial |
| NHTSA vPIC API | REST API | US-market 1981+, 130+ attributes, VIN decode | Free, no auth | Public domain |
| Motorcycle Specs Database (RapidAPI) | REST API | 40,000+ models 1900–present | Free 500–1,000 calls/month | Freemium |
| GitHub: arthurkao/vehicle-make-model-data | MySQL/JSON/CSV | 19,722+ models | Free | Open source |
| Teoalida/Bikez Database | CSV/DB | 42,565 models, 607 brands, 88 columns | Commercial (free sample) | Commercial |

**Recommended seeding strategy:** Start with Kaggle CSV for bulk import, enrich gaps with API Ninjas, use NHTSA vPIC for VIN identification (zero cost).

### 5.2 Diagnostic Intelligence Layer — Failure Modes & Troubleshooting

| Source | Type | Value | License |
|--------|------|-------|---------|
| NHTSA Complaints API | REST API (JSON) | Structured failure-mode data by make/model/year, decades of coverage | Public domain |
| NHTSA Recalls API | REST API (JSON) | Official recall data with root causes | Public domain |
| StackExchange Motor Vehicle Maintenance | XML dump (~62.5 MB) | Expert Q&A, tagged | CC-BY-SA 4.0 (commercial OK) |
| Reddit r/Fixxit | Archives (Arctic Shift) | ~17,300 subs, titles require year/make/model | Reddit Public Content Policy (check) |
| iFixit | Public API | Step-by-step repair guides with photos | CC BY-NC-SA 3.0 (thin moto coverage) |

**Key insight:** NHTSA complaints are the most valuable free structured source. Each complaint contains make, model, year, component, and a narrative describing the failure. Clustering these by component and failure mode produces the seed data for decision trees.

### 5.3 Reference Layer — Specs, Diagrams, Manuals

| Source | Content | Access |
|--------|---------|--------|
| MaintenanceSchedule.com | Curated service schedules | Scrape/parse |
| TightTorque.com | Growing torque spec database | Scrape/parse |
| Dan's Motorcycle / CycleTerminal.com | Free wiring diagram collections | Scrape/parse |
| DTCSearch.com / Klavkarr.com | ~11,000 OBD-II DTC definitions | Scrape/parse |
| CarlSalter.com | Largest service manual archive (30+ brands) | PDF, manual extraction |
| Motorcycle-Manual.com | PDFs, wiring diagrams, DTC lists | PDF, manual extraction |

### 5.4 Government APIs — Recalls & Safety

| Source | Coverage | Cost |
|--------|----------|------|
| NHTSA full suite (vPIC, Recalls, Complaints, FARS) | US, 1975+ | Free, no auth, public domain |
| Transport Canada VRDB | Canada | Free (API key) |
| EU Safety Gate | EU weekly recall data | Free (Excel/API) |
| EPA Motorcycle Emissions Data | Emissions 1982–present | Free (XLSX) |

### 5.5 Open-Source Projects Worth Studying

| Project | Tech Stack | Relevance |
|---------|-----------|-----------|
| LubeLogger (2,000+ stars) | ASP.NET Core, MIT | Production-ready maintenance tracking schema |
| Moto-Mecanico | Flutter/Dart, MPL-2.0 | Motorcycle-specific task definitions |
| Bike MD | Python/Django/PostgreSQL | Symptom-to-fix data model (small student project) |
| AndrOBD | Android | OBD-II communication, DTC databases |
| GarageBuddy | ASP.NET Core, MIT | Garage management patterns |

---

## 6. Brand Identity

### Name: CrankDoc

- **Rationale:** "Crank" = unmistakably engine/mechanical. "Doc" = diagnostic authority + approachability. Two punchy syllables. Works globally.
- **Tone:** Confident expert who's also your approachable mate in the workshop. Not clinical, not intimidating. Think "the senior mechanic who actually enjoys teaching juniors."
- **Visual direction:** Bold, high-contrast. Dark backgrounds, industrial accent colors (yellows, reds). Strong typography. A crankshaft silhouette integrated into a stethoscope or diagnostic symbol works for the logo.
- **App icon concept:** Crankshaft cross-section inside a circular diagnostic symbol.
- **In-app voice:** Direct, concise, uses proper mechanical terminology but explains it. "Check valve clearance (the gap between the cam lobe and the valve stem) — spec is 0.15mm intake, 0.20mm exhaust."

---

## 7. Technical Considerations

### Platform

- Mobile-first (iOS + Android)
- Offline-capable (mechanics don't always have signal in workshops/garages)
- Consider: React Native / Flutter for cross-platform, or PWA for rapid prototyping

### Data Storage

- Local SQLite for offline spec lookups and decision trees
- Cloud sync for updates, community contributions, and analytics
- The decision tree structure suggests a graph database or at minimum a tree/DAG stored in relational tables

### Decision Tree Data Model (conceptual)

```
DiagnosticTree
├── tree_id
├── symptom (e.g., "Engine won't start")
├── applies_to [make, model, year_range]
└── root_node_id

DiagnosticNode
├── node_id
├── tree_id
├── node_type (question | action | result | info)
├── content (text, images, specs)
├── safety_warning (optional)
└── children [
      { condition: "Yes", next_node_id },
      { condition: "No", next_node_id },
      { condition: "Voltage < 12.4V", next_node_id }
    ]
```

### Key API Integrations

- NHTSA vPIC: VIN → Year/Make/Model/Specs (free, no auth)
- NHTSA Complaints: Model → Known failure modes (free, no auth)
- API Ninjas: Model → Detailed specs (free tier)

---

## 8. Competitive Landscape

### Direct competitors (motorcycle-specific diagnostics)

- **TOPDON TopScan Moto:** Hardware dongle + app, $99/year subscription after first year. Only supports 7 brands initially. Focuses on OBD/DTC reading, not guided troubleshooting.
- **Cyclepedia:** Subscription-based repair manual service. Comprehensive but expensive and not structured as decision trees.

### Adjacent tools

- **Torque Pro:** Android OBD-II app (millions of downloads). Car-focused, not motorcycle-specific diagnostic guidance.
- **Digital Wrench:** Workshop management software ($39.95/month+). Repair tracking, not troubleshooting guidance.
- **LubeLogger:** Open-source maintenance tracking. No diagnostic intelligence.

### CrankDoc's differentiation

None of these provide structured, interactive diagnostic decision trees for motorcycles. They either sell hardware, track work orders, or provide static manuals. CrankDoc is the first to guide you through "my bike has this symptom, what do I check next?" in an interactive, model-aware way.

---

## 9. Monetization Options (to discuss)

- **Freemium:** Free for top 10 models, subscription for full library
- **Workshop licenses:** Per-seat pricing for professional shops
- **Content partnerships:** Manufacturers contribute official diagnostic paths
- **Community contributions:** Users submit and vote on diagnostic paths (Wikipedia model)
- **Hardware partnerships:** OBD-II dongle bundles

---

## 10. Open Questions for Planning

1. **Tech stack decision:** Native (Swift/Kotlin), cross-platform (Flutter/React Native), or PWA?
2. **MVP scope:** What are the minimum models and symptoms to launch with?
3. **Decision tree authoring:** How do we efficiently create 1,000 diagnostic paths? Manual + AI-assisted extraction from NHTSA complaints?
4. **Offline strategy:** How much data needs to live on-device? Full spec database? All trees?
5. **Community model:** Do we allow user-submitted diagnostic paths? How do we quality-control them?
6. **Regulatory:** Any liability considerations for diagnostic guidance? Disclaimer strategy?
7. **Content pipeline:** What's the workflow for converting service manual PDFs into structured decision trees?
8. **Backend:** Self-hosted vs. cloud? What's the expected scale at launch?

---

## 11. Suggested First Planning Steps

1. **Define MVP feature set** — pick the smallest slice that proves the concept
2. **Select 5 pilot models** — choose high-volume bikes with good NHTSA complaint data (e.g., Honda CBR600RR, Yamaha R6, Harley Sportster, Kawasaki Ninja 400, BMW R1200GS)
3. **Build one complete diagnostic tree** — "Engine won't start" for one model, end to end, to validate the data model and UX
4. **Prototype the decision tree UI** — interactive walkthrough with branching
5. **Seed the spec database** — import Kaggle dataset, verify against API Ninjas
6. **Validate with real mechanics** — show the prototype to 3–5 junior mechanics and workshop managers

---

*This brief is intended to kickstart a planning session. It captures research and decisions made during the concept phase and provides enough context to begin breaking down work into concrete tasks.*
