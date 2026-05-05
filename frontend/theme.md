# HackAgent Design System

## Color Palette
- **Paper**: #F7F7F5 (background)
- **Forest Green**: #1A3C2B (primary brand color, headings, buttons)
- **Grid**: #3A3A38 (borders, dividers, secondary text)
- **Coral**: #FF8C69 (accent - urgent states, discovery)
- **Mint**: #9EFFBF (accent - success states, normal deadlines)
- **Gold**: #F4D35E (accent - selection, prizes, paid badges)

## Typography
- **Display/Headers**: Space Grotesk (font-weight: 700, letter-spacing: -0.05em, line-height: 0.9)
  - H1: text-6xl (page titles)
  - H2: text-2xl (card titles)
  - H3: text-lg (sub-headers)
- **Body Text**: General Sans (regular weight for readable content)
  - Base: text-lg (descriptions)
  - Small: text-sm (secondary text)
  - Micro: text-xs (labels)
- **Monospace/Labels**: JetBrains Mono (all navigation, labels, metadata, form labels)
  - Font sizes: 10px (nav, buttons), 9px (technical), 8px (micro-labels)
  - Letter spacing: 0.1em (nav), widest (buttons)

## Border & Styling Rules
- All borders: 1px hairlines in #3A3A38 at 20% opacity
- Corner markers: 10px x 10px L-shaped borders in Forest green (#1A3C2B)
- Border radius: 0px (flat edges) or 2px (subtle, minimal)
- No box shadows, no gradients, no depth effects
- Background pattern: SVG mosaic grid with interlocking rectangular panels, 0.5px hairlines at 30% opacity

## Animation Library
- **Fade In + Slide Up**: fadeInUp animation (0.8s cubic-bezier(0.16, 1, 0.3, 1))
- **Stagger Classes**: .stagger-1 through .stagger-5 (0.1s increments)
- **Line Draw**: drawLine animation for SVG strokes (2s ease-out with 1s delay)
- **Pulse Glow**: pulseGlow on center nodes (3s ease-in-out, infinite)
- **Orbit Rotate**: Linear 20s infinite rotation for multi-agent nodes
- **Navigation Underline**: Smooth width expansion on hover (0.3s ease-out)
- **Card Hover**: border-color and background-color transition (0.3s ease-out)
- **Row Hover**: background-color shift on table rows (0.3s ease-out)

## Navigation Component

### Fixed Header with Glassmorphism
```html
<header className="fixed top-0 left-0 right-0 h-16 bg-paper/80 backdrop-blur-md border-b border-grid/20 z-50 flex items-center px-6 lg:px-16">
  <div className="flex-1 flex items-center">
    <a href="#" className="w-9 h-9 bg-forest flex items-center justify-center rounded-none hover:scale-105 transition-transform">
      <span className="text-white font-display text-2xl">H</span>
    </a>
  </div>

  <nav className="hidden lg:flex items-center space-x-8">
    <a href="#" className="font-mono text-[10px] tracking-[0.1em] text-forest hover:opacity-70 transition-opacity">
      01. DISCOVER
    </a>
    <a href="#" className="font-mono text-[10px] tracking-[0.1em] text-forest font-bold border-b border-forest">
      02. DASHBOARD
    </a>
  </nav>

  <div className="flex-1 flex justify-end space-x-4">
    <a href="#" className="w-9 h-9 border border-grid/30 flex items-center justify-center rounded-sm hover:bg-forest hover:text-white transition-all">
      <Icon icon="lucide:bell" className="text-base" />
    </a>
    <a href="#" className="w-9 h-9 bg-forest text-white flex items-center justify-center rounded-sm hover:opacity-90 transition-opacity">
      <Icon icon="lucide:user" className="text-base" />
    </a>
  </div>
</header>
```

## Hackathon Listing Components

### Page Header Pattern
```html
<div className="mb-12">
  <div className="flex items-center space-x-4 mb-4">
    <div className="w-px h-8 bg-forest"></div>
    <p className="font-mono text-sm tracking-[0.1em] uppercase">INTELLIGENT DISCOVERY ENGINE</p>
  </div>
  <h1 className="font-display text-6xl text-forest tracking-tight mb-4">Active Hackathons</h1>
  <p className="text-grid/60 text-lg">Discover and participate in top-tier competitive programming events worldwide</p>
</div>
```

### Search & Sort Controls
```html
<div className="flex items-center space-x-4">
  <div className="flex-1 relative">
    <Icon icon="lucide:search" className="absolute left-4 top-1/2 -translate-y-1/2 text-grid/40 text-lg" />
    <input
      type="text"
      placeholder="Search hackathons by name, college, theme..."
      className="w-full bg-white border border-grid/20 pl-12 pr-4 py-3 text-sm font-mono focus:outline-none focus:border-forest transition-colors rounded-none"
    />
  </div>
  <div className="relative">
    <select className="bg-white border border-grid/20 px-6 py-3 text-[10px] font-mono tracking-widest uppercase focus:outline-none focus:border-forest transition-colors rounded-none appearance-none pr-10">
      <option>SORT BY: DEADLINE</option>
      <option>SORT BY: PRIZES (HIGH TO LOW)</option>
      <option>SORT BY: NEWEST</option>
      <option>SORT BY: TEAM SIZE</option>
    </select>
    <Icon icon="lucide:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-grid/60 text-sm pointer-events-none" />
  </div>
</div>
```

### Filter Tags
```html
<div className="flex items-center space-x-3">
  <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">ACTIVE FILTERS:</span>
  <div className="filter-tag px-3 py-1 border border-grid/20 flex items-center space-x-2 rounded-sm cursor-pointer">
    <span className="font-mono text-[9px] tracking-wider uppercase">MODE: REMOTE</span>
    <Icon icon="lucide:x" className="text-xs" />
  </div>
  <button className="px-3 py-1 border border-forest/30 flex items-center space-x-2 rounded-sm hover:bg-forest hover:text-white transition-all">
    <Icon icon="lucide:plus" className="text-xs" />
    <span className="font-mono text-[9px] tracking-wider uppercase">ADD FILTER</span>
  </button>
</div>
```

### Results Counter with View Toggle
```html
<div className="mb-6 flex items-center justify-between">
  <p className="font-mono text-[10px] tracking-widest uppercase text-grid/60">
    SHOWING 1-8 OF 150 HACKATHONS
  </p>
  <div className="flex items-center space-x-2">
    <button className="w-8 h-8 border border-forest bg-forest text-gold flex items-center justify-center rounded-sm transition-colors">
      <Icon icon="lucide:layout-list" className="text-sm" />
    </button>
    <button className="w-8 h-8 border border-grid/30 flex items-center justify-center rounded-sm hover:bg-forest hover:text-gold hover:border-forest transition-colors">
      <Icon icon="lucide:layout-grid" className="text-sm" />
    </button>
  </div>
</div>
```

## Table/List View Components

### Table Header (Sticky)
```html
<div className="bg-paper border-b border-grid/20 py-4 px-8 sticky top-16 z-40">
  <div className="grid grid-cols-12 gap-4 items-center">
    <div className="col-span-5">
      <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">HACKATHON</span>
    </div>
    <div className="col-span-2">
      <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">COLLEGE</span>
    </div>
    <div className="col-span-1">
      <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">TEAM</span>
    </div>
    <div className="col-span-1">
      <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">MODE</span>
    </div>
    <div className="col-span-1">
      <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">DEADLINE</span>
    </div>
    <div className="col-span-1">
      <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">PRIZES</span>
    </div>
    <div className="col-span-1">
      <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">ACTION</span>
    </div>
  </div>
</div>
```

### Table Row
```html
<div className="hackathon-row border-b border-grid/20 py-5 px-8">
  <div className="grid grid-cols-12 gap-4 items-center">
    <div className="col-span-5">
      <h3 className="font-display font-bold text-lg text-forest mb-1">Hackathon Name</h3>
      <p className="font-mono text-[10px] text-grid/60 leading-relaxed line-clamp-2">Description text here...</p>
    </div>
    <div className="col-span-2">
      <p className="font-mono text-xs text-grid/60">College Name</p>
    </div>
    <div className="col-span-1">
      <div className="flex items-center space-x-1">
        <Icon icon="lucide:users" className="text-grid/60 text-sm" />
        <span className="font-mono text-xs text-forest">3-5</span>
      </div>
    </div>
    <div className="col-span-1">
      <span className="mode-badge-remote px-3 py-1 font-mono text-[10px] tracking-wider uppercase rounded-sm inline-block">
        REMOTE
      </span>
    </div>
    <div className="col-span-1">
      <p className="font-mono text-xs deadline-normal">Jan 15, 2025</p>
      <p className="font-mono text-[9px] mt-0.5 text-grid/40 uppercase">28 DAYS LEFT</p>
    </div>
    <div className="col-span-1">
      <p className="font-display font-bold text-sm text-gold">$100K</p>
    </div>
    <div className="col-span-1">
      <button className="action-btn w-full border border-grid/30 py-2 font-mono text-[10px] tracking-widest uppercase rounded-sm">
        VIEW
      </button>
    </div>
  </div>
</div>
```

## Grid/Card View Components

### Grid Layout
```html
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <HackathonCard {...hackathonData} />
</div>
```

### Hackathon Card
```html
<div className="bg-paper border border-grid/20 p-5 card-hover min-h-60 flex flex-col justify-between">
  <div className="flex items-center gap-2 mb-4">
    <span className="mode-badge-remote px-2 py-1 font-mono text-[10px] tracking-widest border">REMOTE</span>
    <span className="mode-badge-offline px-2 py-1 font-mono text-[10px] tracking-widest border ml-1.5">$100K</span>
    <span className="ml-auto font-mono text-[8px] text-mint tracking-wider">28 DAYS LEFT</span>
  </div>

  <h3 className="font-display text-lg font-bold text-forest mb-2 leading-tight">Hackathon Name</h3>
  <p className="text-sm text-grid/80 mb-4 line-clamp-3">Description text here...</p>

  <div className="w-full h-px bg-grid/15 mb-4"></div>

  <div className="flex items-center divide-x divide-grid/20">
    <div className="pr-3 flex items-center gap-1.5">
      <Icon icon="lucide:users" className="text-[10px] text-grid/60" />
      <span className="font-mono text-[9px] text-grid/80">3-5 MEMBERS</span>
    </div>
    <div className="px-3 flex items-center gap-1.5">
      <Icon icon="lucide:building-2" className="text-[10px] text-grid/60" />
      <span className="font-mono text-[9px] text-grid/80 max-w-xs whitespace-normal">COLLEGE NAME</span>
    </div>
    <div className="pl-3 flex items-center gap-1.5">
      <Icon icon="lucide:calendar" className="text-[10px] text-grid/60" />
      <span className="font-mono text-[9px] text-grid/80">JAN 15</span>
    </div>
  </div>
</div>
```

## Badge Components

### Mode Badges
```css
.mode-badge-remote {
  background-color: rgba(158, 255, 191, 0.15);
  color: #1A3C2B;
  border: 1px solid var(--mint);
}

.mode-badge-hybrid {
  background-color: rgba(255, 140, 105, 0.15);
  color: #1A3C2B;
  border: 1px solid var(--coral);
}

.mode-badge-offline {
  background-color: rgba(244, 211, 94, 0.15);
  color: #1A3C2B;
  border: 1px solid var(--gold);
}
```

### Deadline States
```css
.deadline-urgent {
  color: var(--coral);
}

.deadline-normal {
  color: var(--forest);
}
```

## Pagination Component
```html
<div className="mt-8 flex items-center justify-between">
  <button className="px-6 py-2 border border-grid/30 font-mono text-[10px] tracking-widest uppercase rounded-sm hover:bg-forest hover:text-white transition-all flex items-center space-x-2">
    <Icon icon="lucide:chevron-left" className="text-sm" />
    <span>PREVIOUS</span>
  </button>

  <div className="flex items-center space-x-2">
    <button className="w-10 h-10 border border-forest bg-forest text-white font-mono text-xs rounded-sm">1</button>
    <button className="w-10 h-10 border border-grid/30 font-mono text-xs rounded-sm hover:bg-forest hover:text-white transition-all">2</button>
    <button className="w-10 h-10 border border-grid/30 font-mono text-xs rounded-sm hover:bg-forest hover:text-white transition-all">3</button>
    <span className="font-mono text-xs text-grid/40">...</span>
    <button className="w-10 h-10 border border-grid/30 font-mono text-xs rounded-sm hover:bg-forest hover:text-white transition-all">19</button>
  </div>

  <button className="px-6 py-2 border border-grid/30 font-mono text-[10px] tracking-widest uppercase rounded-sm hover:bg-forest hover:text-white transition-all flex items-center space-x-2">
    <span>NEXT</span>
    <Icon icon="lucide:chevron-right" className="text-sm" />
  </button>
</div>
```

## CSS Utilities

### Card Hover Effect
```css
.card-hover {
  transition: all 0.3s ease-out;
}

.card-hover:hover {
  border-color: var(--forest);
  background-color: rgba(26, 60, 43, 0.02);
  cursor: pointer;
}
```

### Row Hover Effect
```css
.hackathon-row {
  transition: background-color 0.3s ease-out, border-color 0.3s ease-out;
}

.hackathon-row:hover {
  background-color: #F0F0EE;
}

.hackathon-row:hover .action-btn {
  border-color: var(--forest);
}
```

### Action Button
```css
.action-btn {
  transition: all 0.3s ease-out;
}

.action-btn:hover {
  background-color: var(--forest);
  color: white;
}
```

### Filter Tag
```css
.filter-tag {
  transition: all 0.2s ease-out;
}

.filter-tag:hover {
  background-color: var(--forest);
  color: white;
}
```

### Text Truncation
```css
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

## Spacing & Layout Scale
- Section padding: pt-24 (after navbar), px-6 lg:px-16 (horizontal), pb-16 (bottom)
- Grid gap: gap-4 (cards)
- Table row padding: py-5 px-8
- Card padding: p-5
- Button padding: px-6 py-2 (pagination), py-2 (action buttons)
- Input padding: pl-12 pr-4 py-3 (search), px-6 py-3 (select)

## Interaction Rules
1. All hover states use smooth transitions (0.3s minimum)
2. Focus states on form inputs: border color changes to Forest green
3. Navigation links: opacity-70 on hover
4. Buttons: opacity-90 on hover
5. Logo: scale-105 on hover
6. Card backgrounds: border-color and background-color shift on hover
7. Table rows: background-color shift on hover
8. View toggle buttons: active state shows forest background with gold text
9. Micro-interactions should feel "snappy" with CSS cubic-bezier easing

## Icon Usage
- **lucide:search** - Search input
- **lucide:chevron-down** - Select dropdown
- **lucide:x** - Remove filter
- **lucide:plus** - Add filter
- **lucide:layout-list** - List view toggle
- **lucide:layout-grid** - Grid view toggle
- **lucide:users** - Team size
- **lucide:building-2** - College/organization
- **lucide:calendar** - Date/deadline
- **lucide:bell** - Notifications
- **lucide:user** - User profile
- **lucide:chevron-left** - Previous page
- **lucide:chevron-right** - Next page

## Responsive Breakpoints
- Mobile: < 1024px (single column grid, hidden nav)
- Tablet: 1024px - 1280px (2 column grid)
- Desktop: ≥ 1280px (3 column grid, full nav)

## Component State Management
- **viewMode**: 'list' | 'grid' - Controls display mode
- **currentPage**: number - Current page number
- **searchQuery**: string - Search input value
- **sortBy**: string - Sort option
- **activeFilters**: string[] - Array of active filters

## Data Structure
```typescript
interface Hackathon {
  id: string;
  name: string;
  description: string;
  college: string;
  teamSize: string;
  mode: 'remote' | 'hybrid' | 'offline';
  deadline: string;
  daysLeft: string;
  isUrgent?: boolean;
  prize: string;
}
```