# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Beacon is a Next.js 16 SaaS landing page for an AI-powered hackathon idea generation platform. It features a Three.js WebGL hero, GSAP scroll animations, and Lenis smooth scrolling.

## Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

- **Next.js 16 App Router** — All pages are React Server Components by default; interactive components use `"use client"` directive
- **`@/*` path alias** — Maps to `./src/*` (configured in `tsconfig.json`)
- **Three.js components** — Must use `dynamic(() => import(...), { ssr: false })` since Three.js requires browser APIs. Never render a Three.js canvas server-side.
- **GSAP + ScrollTrigger** — Used for scroll-driven animations. Components using GSAP must be client components. GSAP contexts (`gsap.context()`) should be reverted in the cleanup function of `useEffect`.
- **Lenis** — Provides smooth inertia scrolling via `LenisProvider` wrapping the app. Lenis runs a `requestAnimationFrame` loop.
- **Tailwind CSS v4** — Uses `@import "tailwindcss"` syntax (no separate `tailwind.config.ts`); custom CSS variables defined in `globals.css` under `:root` and `@theme inline`.

## Key Files

- `src/app/page.tsx` — Main landing page (client component) containing all sections
- `src/components/three/BeaconCanvas.tsx` — Three.js WebGL hero canvas
- `src/components/LenisProvider.tsx` — Smooth scroll provider
- `src/app/globals.css` — Global styles, CSS variables, keyframe animations, custom utilities

## Design Decisions

- Dark theme: background `#030712`, primary accent `#7c3aed` (violet)
- Fonts: Space Grotesk (display/headings), Inter (body) via Google Fonts
- Animation stack: Three.js (hero) + GSAP ScrollTrigger (sections) + CSS keyframes (micro-interactions)
- All glass-card styled elements use `backdrop-filter: blur(20px)` with semi-transparent backgrounds
