---
name: Technical Blueprint Minimalist
colors:
  surface: '#fcf9f6'
  surface-dim: '#dcdad6'
  surface-bright: '#fcf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f0'
  surface-container: '#f0edea'
  surface-container-high: '#eae8e5'
  surface-container-highest: '#e4e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#414843'
  inverse-surface: '#30302f'
  inverse-on-surface: '#f3f0ed'
  outline: '#727973'
  outline-variant: '#c1c8c1'
  surface-tint: '#436652'
  primary: '#022617'
  on-primary: '#ffffff'
  primary-container: '#1a3c2b'
  on-primary-container: '#82a790'
  inverse-primary: '#a9cfb7'
  secondary: '#9e4225'
  on-secondary: '#ffffff'
  secondary-container: '#fe8b69'
  on-secondary-container: '#742409'
  tertiary: '#002713'
  on-tertiary: '#ffffff'
  tertiary-container: '#003f21'
  on-tertiary-container: '#51b178'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c5ecd3'
  primary-fixed-dim: '#a9cfb7'
  on-primary-fixed: '#002112'
  on-primary-fixed-variant: '#2c4e3b'
  secondary-fixed: '#ffdbd1'
  secondary-fixed-dim: '#ffb59f'
  on-secondary-fixed: '#3a0a00'
  on-secondary-fixed-variant: '#7e2b10'
  tertiary-fixed: '#96f7b7'
  tertiary-fixed-dim: '#7ada9d'
  on-tertiary-fixed: '#00210f'
  on-tertiary-fixed-variant: '#00522d'
  background: '#fcf9f6'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2df'
typography:
  display-xl:
    fontFamily: Space Grotesk
    fontSize: 96px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: -0.04em
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  technical-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  technical-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '400'
    lineHeight: '1.0'
    letterSpacing: 0.1em
spacing:
  grid-unit: 4px
  gutter: 1px
  margin-sm: 16px
  margin-md: 32px
  margin-lg: 48px
---

## Brand & Style
This design system is built on the aesthetic of technical precision, architectural blueprints, and high-fidelity wireframes. It targets a sophisticated audience that values structural clarity, data density, and a "process-first" philosophy. The emotional response is one of intellectual rigour and quiet confidence.

The design style is **Technical Minimalism**. It rejects the softness of modern consumer web design in favor of a rigid, grid-bound structure. It utilizes flat 2D surfaces, sharp edges, and intentional monochromatic foundations punctuated by high-contrast functional accents. Every element should feel as though it was plotted on a drafting table rather than rendered by a browser.

## Colors
The palette is rooted in "Paper" and "Forest," providing a natural yet industrial foundation. 
- **Paper (#F7F7F5):** The primary canvas, offering a warm, non-reflective surface that mimics architectural vellum.
- **Forest (#1A3C2B):** The primary ink, used for high-level structure and primary actions.
- **Grid (#3A3A38):** Used exclusively for structural hairlines, dividers, and technical metadata.
- **Accents:** Coral (Alert/Action), Mint (Status/Success), and Gold (Warning/Highlight) are used sparingly to guide the eye through dense information.

**Implementation Note:** Borders and grid lines should maintain a 20% opacity of the Grid color to remain unobtrusive but present.

## Typography
Typography is used as a structural element. 
- **Space Grotesk** is the voice of the system, used for large-scale headers with tight tracking to emphasize the geometric construction of the characters. 
- **Inter** (serving as a substitute for General Sans) provides a clean, neutral grotesque for body copy, ensuring legibility against complex grid backgrounds.
- **JetBrains Mono** is the "metadata layer." It is used for labels, status indicators, and small-scale data points. It must always be uppercase with generous tracking to maintain a technical, plotted appearance.

## Layout & Spacing
The layout is governed by a **Fixed Mosaic Grid**. 
- **Bento Grids:** Content is organized into interlocking rectangular panels. These panels are separated by 1px "Grid" colored gutters at 20% opacity.
- **Grid Background:** A subtle mosaic grid pattern should be visible in the background, reinforcing the blueprint aesthetic.
- **Reflow:** On mobile, the mosaic collapses into a single-column stack, but the 1px dividers must remain to preserve the paneled look.
- **Precision:** All padding and margins must be multiples of the 4px grid unit.

## Elevation & Depth
This system is strictly **Flat**. 
- **No Shadows:** Depth is never communicated through drop shadows or blurs. 
- **Tonal Layering:** Hierarchy is achieved through the use of L-shaped corner markers and varying line weights or background shades. 
- **Image Treatment:** By default, images use `mix-blend-mode: luminosity` at 90% opacity to integrate into the "paper" background. On hover, they transition to full color and 100% opacity, acting as a "reveal" of the data within the blueprint.

## Shapes
Shapes are defined by geometric rigor. 
- **Edges:** The default corner radius is 0px (Sharp). For small interactive elements like buttons or tags, a maximum of 2px is permitted to avoid visual "vibration" on low-resolution displays.
- **Hairlines:** Every container is defined by a 1px solid border.
- **L-Markers:** Technical form boxes and primary panels should feature L-shaped corner markers (4px in length) at the extremities to suggest a framed technical drawing.

## Components
- **Technical Navigation:** Links are prefixed with numbered indices (e.g., 01 // OVERVIEW, 02 // NETWORK). Use JetBrains Mono.
- **Buttons:** Rectangular, 1px border, no fill. Fill with Primary Forest only on hover. Text remains JetBrains Mono uppercase.
- **Status Badges:** Instead of rounded pills, use small rectangles with a leading 8px square dot in the accent color (Mint for active, Coral for error).
- **Form Fields:** Input boxes are defined by bottom-only 1px borders or L-shaped corner markers at the top-left and bottom-right.
- **Network Topology:** Use 1px paths to connect orbiting nodes. Nodes are simple 4px or 8px squares, never circles.
- **Cards:** Use the Bento grid structure. Each card must have a technical ID in the top-right corner in 10px JetBrains Mono.