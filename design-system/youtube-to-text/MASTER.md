# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** YouTube to Text
**Updated:** 2026-02-25
**Category:** Content / Transcript Reading Platform
**Core UX priority:** Readability above everything else

---

## Visual Identity

**Style:** Brutalism + Old Newspaper
**Mood:** Raw, editorial, stark, high contrast, printed matter, old press
**Best For:** Content-heavy reading, editorial sites, transcript archives

---

## Style References

Source files: `reference/`

### 1. `photo_2026-02-25_20-38-38.jpg`
- **What:** Black-and-white cartoon character — a man in glasses, suit and tie
- **Style cues:** Halftone dot textures (newspaper print reproduction), thick ink outlines, stipple shading, retro comic-book illustration, grain/noise on paper
- **Use for:** Illustration style, decorative elements, character mascots, halftone patterns in backgrounds or cards

### 2. `lunamom_preschool_boy_...png`
- **What:** Crayon-style illustration of a small boy holding a strawberry
- **Style cues:** Hand-drawn texture, rough crayon strokes, soft pencil outlines, warm naive illustration, childlike simplicity
- **Use for:** Friendly/approachable mascot option, error pages, empty states, onboarding illustrations

### 3. `task_01kj66gafxf6rr2jxadp96tf12_1771882231_img_1.webp`
- **What:** (Could not decode — likely another character/illustration variant)
- **Style cues:** Same design family as the other references

### Visual principles from references:
- **Halftone dots** — use CSS `radial-gradient` dot patterns to mimic newspaper print
- **Thick outlines** — all illustrations and decorative elements use heavy black strokes
- **Paper grain** — subtle noise overlay on backgrounds replicates aged newsprint
- **Monochrome** — references are black-and-white or very muted; no saturated colors
- **Hand-drawn feel** — imperfect, human, slightly rough edges

---

## Approved Design Elements

These elements were approved by the user and must be preserved:

1. **Paper background** — `#f5f0e8` with subtle SVG noise texture overlay
2. **Large editorial headlines** — Cormorant Garamond, bold, clamp-sized
3. **Horizontal rules** — double (3px + 1px), thin (1px), thick (4px) separators
4. **Top info strip** — VOL / ESTABLISHED / PRICE in typewriter font
5. **Masthead** — UnifrakturMaguntia blackletter, centered
6. **Dateline** — date left, slogan right
7. **Dropcap** — large first letter in Cormorant Garamond

---

## Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Primary | `#0a0a0a` | Text, borders, fills |
| Background | `#f5f0e8` | Page background (paper) |
| Surface | `#ffffff` | CTA boxes, input backgrounds |
| Muted text | `#333` / `#444` | Strip text, labels |
| Dashed lines | `#bbb` / `#ccc` | List separators |

**Rule:** Strictly black-and-white. No color accents.

---

## Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Masthead | UnifrakturMaguntia | 400 | Site title only |
| Headlines | Cormorant Garamond | 600–700 | h1, h2, big headlines |
| Body text | Libre Baskerville | 400–700 | Paragraphs, reading content |
| Section headings | Libre Baskerville | 700 | h3, browse headings (readable!) |
| Labels/meta | Special Elite | 400 | Dates, counts, labels, input |

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=UnifrakturMaguntia&family=Special+Elite&display=swap');
```

**IMPORTANT:** Do NOT use Cormorant Garamond or UnifrakturMaguntia for small/secondary headings — they are hard to read at small sizes. Use Libre Baskerville bold for anything below h2.

---

## Layout Rules

- `max-width: 960px` centered container
- Sharp corners everywhere: `border-radius: 0`
- Visible borders: `2-4px solid #0a0a0a`
- No smooth gradients, no shadows, no blur
- Two-column layouts use `2px solid` vertical dividers
- Justified text with `hyphens: auto` for body content
- `line-height: 1.7` for body text (readability first)

---

## Component Patterns

### Buttons
```css
border: 2px solid #0a0a0a;
border-radius: 0;
background-color: #0a0a0a;
color: #f5f0e8;
cursor: pointer;
transition: background-color 0.15s, color 0.15s;
/* Hover: invert colors */
```

### CTA Box (Classified Ad Style)
```css
border: 3px solid #0a0a0a;
background-color: #fff;
/* ::before label badge in black */
```

### Tags
```css
border: 2px solid #0a0a0a;
padding: 6px 12px;
/* Hover: fill black, text white */
```

### Channel List
```css
border-bottom: 1px dashed #bbb;
/* Name left (bold), count right (typewriter) */
/* Hover: subtle background tint */
```

### Horizontal Rules
```css
.rule--double { border-top: 3px; border-bottom: 1px; height: 6px; }
.rule--thin   { border-top: 1px; }
.rule--thick  { border-top: 4px; }
```

---

## Anti-Patterns (Do NOT Use)

- No emojis as icons — use SVG only
- No border-radius (ever)
- No gradients or shadows
- No smooth/glossy effects
- No color — strictly monochrome
- No decorative fonts for readable content (use Libre Baskerville)
- No layout-shifting hover effects
- No transitions longer than 300ms

---

## Decorative Techniques

### Paper Noise Texture (background overlay)
```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.06;
  background-image: url("data:image/svg+xml,%3Csvg width='200' height='200'
    xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence
    type='fractalNoise' baseFrequency='0.75' numOctaves='4'
    stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25'
    filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  z-index: 9999;
}
```

### Halftone Dot Pattern (decorative fills)
```css
background: radial-gradient(circle, #0a0a0a 1px, transparent 1px);
background-size: 6px 6px;
```

### Dropcap
```css
float: left;
font-family: 'Cormorant Garamond', serif;
font-size: 4.2rem;
font-weight: 700;
line-height: 0.8;
padding-right: 8px;
padding-top: 4px;
```

---

## Pre-Delivery Checklist

- [ ] No emojis used as icons
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150–300ms)
- [ ] Text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] All body text uses Libre Baskerville (not decorative fonts)
- [ ] Horizontal rules consistent with approved patterns
- [ ] Paper background preserved
- [ ] Monochrome only — no color accents
- [ ] Halftone/noise textures match reference style
