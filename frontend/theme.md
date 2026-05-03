# HackFlow UI Theme

## Overview

This document defines the design system and theme used throughout the HackFlow website. All components should follow these guidelines to maintain visual consistency.

---

## Colors

### Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--paper` | `#F7F7F5` | Main background |
| `--forest` | `#1A3C2B` | Primary text, headings, buttons |
| `--grid` | `#3A3A38` | Secondary text, borders, muted elements |
| `--coral` | `#FF8C69` | Accent color, highlights, hover states |
| `--mint` | `#9EFFBF` | Accent color, success states |
| `--gold` | `#F4D35E` | Accent color, stars, ratings |

### Dark Theme (Problem Section Only)

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#1A1A1A` | Dark section background |
| Text Primary | `#FFFFFF` | Headings in dark theme |
| Text Secondary | `#9CA3AF` / `#6B7280` | Descriptions in dark theme |
| Text Muted | `#5A574E` / `#6B7280` | Secondary text in dark theme |
| Border | `#FFFFFF` with opacity | Borders in dark theme |
| Accent | `#E8C547` | Gold accent for dark theme |

### Color Usage Guidelines

- **Paper**: Use for main backgrounds and cards
- **Forest**: Use for primary text, headings, and important actions
- **Grid**: Use for secondary text, borders, and muted elements
- **Coral**: Use for CTAs, highlights, and interactive elements
- **Mint**: Use for success states and positive indicators
- **Gold**: Use for ratings, stars, and premium elements

---

## Typography

### Font Families

| Token | Font | Usage |
|-------|------|-------|
| `--sans` / `General Sans` | General Sans | Body text, paragraphs |
| `--heading` / `Space Grotesk` | Space Grotesk | Headings, titles |
| `--mono` / `JetBrains Mono` | JetBrains Mono | Code, labels, technical text |

### Font Sizes

| Token | Size | Usage |
|-------|------|-------|
| `--font-base` | 18px | Base body text |
| `--font-h1` | 56px (clamp 3.5rem, 7vw, 7.5rem) | Main hero heading |
| `--font-h2` | 24px | Section headings |
| `--font-h3` | 20px | Subsection headings |
| `--font-code` | 15px | Code snippets |

### Typography Scale

```css
/* Headings */
h1: 56px / 72px (desktop) / 36px (mobile)
h2: 24px / 32px (desktop) / 20px (mobile)
h3: 20px / 24px (desktop) / 18px (mobile)

/* Body */
p: 18px / 24px (desktop) / 16px (mobile)
small: 14px / 16px (desktop) / 12px (mobile)

/* Code/Labels */
jetbrains text-[10px]: 10px uppercase
jetbrains text-xs: 12px
jetbrains text-sm: 14px
```

### Typography Guidelines

- **Headings**: Use Space Grotesk with tight letter-spacing (-0.02em)
- **Body**: Use General Sans with relaxed line-height (145%)
- **Labels/Code**: Use JetBrains Mono with uppercase for emphasis
- **Tracking**: Use wider letter-spacing for uppercase text (0.2em - 0.3em)

---

## Spacing

### Container Widths

| Token | Value | Usage |
|-------|-------|-------|
| `max-w-7xl` | 1280px | Main content container |
| `max-w-5xl` | 1024px | Wide sections |
| `max-w-2xl` | 672px | Medium sections |
| `max-w-lg` | 512px | Narrow sections |
| `max-w-md` | 448px | Small sections |

### Spacing Scale

```css
/* Padding */
p-2: 8px
p-4: 16px
p-6: 24px
p-8: 32px
p-12: 48px
p-16: 64px

/* Gap */
gap-2: 8px
gap-4: 16px
gap-8: 32px
gap-16: 64px
```

---

## Components

### Buttons

#### Primary Button
```tsx
<button className="jetbrains text-[10px] uppercase px-6 py-3 bg-forest text-white hover:bg-coral transition-all">
  Button Text
</button>
```

#### Secondary Button
```tsx
<button className="jetbrains text-[10px] uppercase px-6 py-3 border border-forest text-forest hover:bg-forest hover:text-white transition-all">
  Button Text
</button>
```

### Cards

#### Default Card
```tsx
<div className="bg-white border border-grid/20 p-8">
  Card Content
</div>
```

#### Dark Card (Problem Section)
```tsx
<div className="bg-white border border-white/10 p-8">
  Card Content
</div>
```

### Badges

#### Default Badge
```tsx
<span className="jetbrains text-[10px] uppercase px-3 py-1 bg-grid/10 border border-grid/20 text-grid">
  Badge Text
</span>
```

#### Accent Badge
```tsx
<span className="jetbrains text-[10px] uppercase px-3 py-1 bg-coral/10 border border-coral/20 text-coral">
  Badge Text
</span>
```

---

## Effects

### Glass Morphism
```css
.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
```

### Glow Effect
```css
.glow-dot {
  box-shadow: 0 0 10px currentColor;
}
```

### Luminosity Image
```css
.img-luminosity {
  filter: grayscale(100%);
  mix-blend-mode: luminosity;
  opacity: 0.9;
  transition: all 300ms linear;
}

.img-luminosity:hover {
  filter: grayscale(0%);
  opacity: 1;
}
```

---

## Layout Patterns

### Full-Page Sections
```tsx
<section className="min-h-screen snap-start flex flex-col justify-center">
  <div className="max-w-7xl mx-auto px-8">
    Section Content
  </div>
</section>
```

### Split Layout (2-Column)
```tsx
<div className="grid grid-cols-2 gap-16 items-center">
  <div>Left Column</div>
  <div>Right Column</div>
</div>
```

### Sticky Split Layout
```tsx
<div className="grid grid-cols-2 gap-16 h-full">
  <div className="sticky top-0 h-screen flex flex-col justify-center">
    Sticky Content
  </div>
  <div className="h-screen overflow-y-auto snap-y snap-mandatory">
    Scrollable Content
  </div>
</div>
```

---

## Animations

### Entrance Animation
```css
@keyframes entrance {
  0% { opacity: 0; transform: translateY(40px); }
  100% { opacity: 1; transform: translateY(0); }
}

.animate-entrance {
  animation: entrance 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

### Orbit Animation
```css
@keyframes orbit {
  from { transform: rotate(0deg) translateX(140px) rotate(0deg); }
  to { transform: rotate(360deg) translateX(140px) rotate(-360deg); }
}

.orbit-node {
  animation: orbit 20s linear infinite;
}
```

---

## Global Styles

### Scrollbar Hiding
```css
* {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

*::-webkit-scrollbar {
  display: none;
}
```

### Text Selection Disabled
```css
body {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
```

---

## Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Mobile | < 1024px | Adjust font sizes, padding |
| Desktop | ≥ 1024px | Full layout |

---

## Section-Specific Themes

### Hero Section
- Background: `paper`
- Heading: `forest` with `space-grotesk` font
- CTA Buttons: `forest` / `coral` on hover

### Problem Section (Dark)
- Background: `#1A1A1A`
- Text: `white` / `zinc-400`
- Cards: `bg-white` with `border-white/10`
- Accent: `#E8C547` (gold)

### Bento Grid
- Background: `paper`
- Cards: `bg-white` with colored left borders
- Icons: `coral`, `mint`, `gold`

### Form CTA
- Background: `paper`
- Form: `bg-white` with corner markers
- Button: `forest` / `coral` on hover

### Testimonials
- Background: `paper`
- Cards: `bg-white` with `border-grid/20`
- Stars: `gold`

---

## Usage Guidelines

### When to Use Each Color

- **Forest**: Primary actions, headings, important text
- **Grid**: Secondary text, borders, dividers
- **Coral**: CTAs, highlights, interactive elements
- **Mint**: Success states, positive indicators
- **Gold**: Ratings, stars, premium elements

### When to Use Each Font

- **Space Grotesk**: All headings, titles, display text
- **General Sans**: Body text, paragraphs, descriptions
- **JetBrains Mono**: Labels, code, technical text, uppercase badges

### Component Naming

- Use descriptive names for components
- Follow React naming conventions (PascalCase)
- Keep components focused and reusable

---

## Tailwind Configuration

```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F7F7F5',
        forest: '#1A3C2B',
        grid: '#3A3A38',
        coral: '#FF8C69',
        mint: '#9EFFBF',
        gold: '#F4D35E',
      },
      fontFamily: {
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
        'general-sans': ['General Sans', 'sans-serif'],
        jetbrains: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

---

## Notes

- Always use the defined color tokens instead of hardcoded values
- Maintain consistent spacing using the spacing scale
- Use the component patterns as templates for new components
- Test responsive behavior at the 1024px breakpoint
- Keep animations subtle and performant