# CrankDoc Brand Style Guidelines (Revised Based on Lumière Reference)

---

## 1. Visual Direction Extracted from Reference

The Lumière reference establishes a very specific design language:

- Warm neutral monochrome palette
- Large soft rounded surfaces
- High-contrast black anchors
- Editorial typography
- Generous spacing
- Card-based modular layout
- Floating bottom navigation (mobile)

CrankDoc should adopt the *structural elegance* of this system — not the skincare aesthetic, but the compositional discipline.

---

## 2. Color System (Refined)

### Core Palette

| Token | Hex | Usage |
|--------|------|--------|
| Soft Mist | #F2E8D8 | Primary background |
| Pale Beige | #EADFCB | Section surfaces |
| Warm Neutral | #D8CBB4 | Subtle panels |
| Deep Black | #1F1F1F | Anchors, nav, emphasis |
| Pure White | #FFFFFF | Cards |

### Accent Strategy

Unlike typical SaaS products, the reference uses:

- Black as the primary emphasis color
- Beige tones for warmth
- Minimal chromatic accents

For CrankDoc:

- Use black for primary CTAs and nav bars
- Use beige for dashboard headers and highlight panels
- Avoid blue/tech-style accents

---

## 3. Typography System

### Font Direction

Primary inspiration: Neue Haas Grotesk Display Pro

Production alternative:
- Inter (UI)
- General Sans
- SF Pro

### Hierarchy

| Role | Size | Weight |
|------|------|--------|
| Display | 40–48px | 600 |
| H1 | 32–36px | 600 |
| H2 | 24–28px | 500 |
| Body | 16px | 400 |
| Small | 14px | 400 |

Typography Rules:

- Tight letter spacing on large headings
- Generous margins around titles
- No decorative typography

---

## 4. Layout Language

### Structural Characteristics from Reference

- Large rounded containers (24–32px radius)
- Floating cards
- Layered depth via subtle shadows
- Centered content blocks

### Desktop Grid

- 12-column layout
- Wide breathing margins (min 80px outer padding)
- Main reading column max-width 760px

### Mobile

- Floating bottom navigation
- Rounded content panels
- Large tappable pills

---

## 5. Component System

### Cards

- Radius: 24px (important)
- Background: White
- Shadow: 0 10px 30px rgba(0,0,0,0.08)
- Generous internal padding (24px minimum)

Cards should feel elevated and tactile.

---

### Pills / Selection Chips

Inspired directly from the routine selector:

- Fully rounded (999px)
- Neutral background
- Selected state: Black background, white icon/text
- Icon-centered alignment

Use this for:
- Filters
- Tags
- Status indicators

---

### Buttons

Primary:
- Background: #1F1F1F
- Text: #FFFFFF
- Radius: 16px
- Height: 48px minimum

Secondary:
- Background: #EADFCB
- Text: #1F1F1F

No sharp-corner buttons.

---

### Navigation (Critical)

Desktop:
- Minimal top navigation
- Black highlight for active items
- No heavy sidebars unless absolutely necessary

Mobile:
- Floating bottom navigation bar
- Black background
- Rounded container
- Center primary action emphasized

---

## 6. Depth & Elevation

The reference achieves premium feel through:

- Soft shadows
- Layer stacking
- Visual breathing space

Avoid:

- Harsh drop shadows
- Heavy outlines
- Dense layouts

---

## 7. Motion

- Smooth fade transitions
- Slight lift on hover (2–4px translateY)
- Modal: scale 98% → 100% with fade
- No bounce or overshoot

---

## 8. Dashboard Structure Proposal (CrankDoc)

### Hero Section

- Large greeting or workspace title
- Beige background panel
- Rounded container

### Primary Actions

- Large black pill CTA
- Secondary beige pill actions

### Document Modules

- Large white cards
- Clear title
- Minimal metadata
- Soft shadow

---

## 9. Document View Structure

- Centered reading column
- Large title
- Minimal toolbar
- Floating action buttons instead of heavy top bars

Maintain elegance and whitespace.

---

## 10. Design Tokens

### Radius

- Small: 12px
- Medium: 16px
- Large: 24px
- Pill: 999px

### Spacing

- XS: 8px
- S: 16px
- M: 24px
- L: 40px
- XL: 64px
- XXL: 96px

### Elevation

- Soft: 0 6px 20px rgba(0,0,0,0.06)
- Card: 0 10px 30px rgba(0,0,0,0.08)
- Modal: 0 20px 60px rgba(0,0,0,0.12)

---

## 11. What CrankDoc Must Avoid

- Blue SaaS gradients
- Small tight cards
- Overloaded toolbars
- Sharp corners
- Excess icon noise

---

## 12. Design Goal

CrankDoc should feel:

- Editorial
- Architectural
- Calm
- Structured
- Confident

The reference is not about beauty — it is about restraint, spacing, and tactile surfaces. That is the direction forward.
