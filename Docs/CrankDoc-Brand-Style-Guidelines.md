# CrankDoc Brand & Style Guidelines

> v0.5 makeover (2026-10). Replaces the earlier "Lumière" warm-beige direction.
> Mockups: CrankDoc Makeover canvas, page "v3 — Apple-style".

## 1. Direction

Apple-style: calm, precise, generous whitespace, native-feeling on iPhone.
The product itself (diagnostic steps, specs, codes) is the hero imagery.

- Light theme by default; dark mode follows the device (`prefers-color-scheme`).
- One accent colour (blue) for everything tappable. Nothing else is coloured
  except the three safety ratings, so colour always means something.
- iOS patterns on mobile: large titles, inset grouped lists, segmented
  controls, frosted top bar and tab bar.
- Apple-*inspired*: no Apple logos, no copied pages, no SF font files shipped
  (the system font is used where the device has it).

## 2. Colour tokens

Defined in `src/app/globals.css`. Use the Tailwind names, never raw hex.

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | #F5F5F7 | #000000 | Page |
| `card` | #FFFFFF | #1C1C1E | Cards, grouped lists |
| `foreground` | #1D1D1F | #F5F5F7 | Text |
| `muted-foreground` | #6E6E73 | #98989F | Secondary text |
| `primary` | #0071E3 | #0A84FF | Buttons, active tab, links |
| `link` | #0066CC | #2997FF | Inline text links |
| `separator` | rgba(60,60,67,.29) | rgba(84,84,88,.65) | Hairlines in lists |
| `input` | rgba(118,118,128,.12) | rgba(118,118,128,.24) | Search fields |
| `inverse` | #1D1D1F | #F5F5F7 | Selected filter pills |

Safety ratings — each has a dot colour, a readable text colour and a tint:

| Rating | Label | Tokens |
|---|---|---|
| green | Beginner-safe | `safe`, `safe-foreground`, `safe-background` |
| yellow | Care required | `caution`, `caution-foreground`, `caution-background` |
| red | Pro recommended | `danger`, `danger-foreground`, `danger-background` |

Always pair a safety colour with its text label (`SafetyBadge`).

## 3. Typography

- Font stack: `-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, …`.
  SF Pro on Apple devices; Inter (self-hosted via `next/font`) elsewhere.
- Large headings: weight 600, tight tracking (`tracking-[-0.03em]`).
- iOS sizes: large title 34px bold, body 17px, secondary 15px, caption 13px,
  section headers 13px uppercase in `muted-foreground`.

## 4. Components

| Component | Rule |
|---|---|
| Button | Rounded pill (`rounded-full`). Primary = blue fill, white text. Height 48px (44px minimum touch target). |
| Card | `rounded-[20px] bg-card shadow-card`, no border. Large marketing tiles may use 28px. |
| Grouped list | `GroupedList` + `ListRow` (`src/components/ui/grouped-list.tsx`): 12px radius, hairline separators inset 16px, chevron on tappable rows. |
| Segmented control | `SegmentedControl` for 2–4 mutually exclusive views (grid/table). |
| Filter pills | `Button variant="pill"` / `"pill-active"`. |
| Search field | 10px radius, `bg-input`, no border. |
| Navigation | Desktop: frosted sticky top bar, small centred links. Mobile: frosted top bar (logo + search) and a 5-slot tab bar (Home, Diagnose, Bikes, Codes, More). |
| App icon | Orange gradient rounded square with a white trace line (`AppIcon` in `Logo.tsx`). The only place orange is used. |

## 5. Motion

- Subtle only: button press scales to 98%, colour transitions ~150ms.
- No bounce, no parallax. Respect `prefers-reduced-motion` (handled globally).

## 6. Accessibility

- Text contrast 4.5:1 minimum in both themes (tokens are chosen for this).
- 44×44px minimum touch targets.
- Status never by colour alone: safety and severity always carry a text label.
