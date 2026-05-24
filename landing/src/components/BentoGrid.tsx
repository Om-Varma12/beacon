import { Icon } from '@iconify/react'

export function BentoGrid() {
  return (
    <section id="features" className="min-h-screen py-24 border-b border-grid/20 snap-start flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-8">
        <div className="mb-12">
          <span className="typography-technical-label text-grid">02. Core Capabilities</span>
        </div>

        <div className="grid grid-cols-2 gap-px bg-grid/20">
          {/* Cell 1: Auto-Discovery */}
          <div className="bg-paper p-8 relative rounded-none">
            {/* Technical ID */}
            <div className="absolute top-4 right-4 typography-technical-sm text-grid/40">
              ID // 02-01
            </div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="typography-technical-label text-forest font-semibold">Auto-Discovery</h3>
              <Icon icon="lucide:search" className="text-xl text-coral" />
            </div>
            <p className="typography-body-md text-grid leading-relaxed mb-6">
              Scrapes hackathon platforms, extracts rules, themes, deadlines, and judging criteria automatically.
            </p>
            <div className="bg-white border border-grid/20 p-4 rounded-none">
              <div className="typography-technical-sm text-grid space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-coral rounded-none" />
                  <span>STATUS: ACTIVE</span>
                </div>
                <div className="text-grid/60">Scanned: 47 platforms</div>
                <div className="text-grid/60">Found: 128 events</div>
              </div>
            </div>
          </div>

          {/* Cell 2: Multi-Agent Analysis */}
          <div className="bg-paper p-8 relative rounded-none">
            {/* Technical ID */}
            <div className="absolute top-4 right-4 typography-technical-sm text-grid/40">
              ID // 02-02
            </div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="typography-technical-label text-forest font-semibold">Multi-Agent Analysis</h3>
              <Icon icon="lucide:brain" className="text-xl text-mint" />
            </div>
            <p className="typography-body-md text-grid leading-relaxed mb-6">
              Multiple AI agents debate innovation, feasibility, impact, and execution to select optimal direction.
            </p>
            <div className="bg-white border border-grid/20 p-4 rounded-none">
              <div className="typography-technical-sm text-grid space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-mint rounded-none" />
                  <span>AGENT_INNOVATION: 89%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-mint rounded-none" />
                  <span>AGENT_FEASIBILITY: 76%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-mint rounded-none" />
                  <span>AGENT_IMPACT: 92%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cell 3: Submission Generation */}
          <div className="bg-paper p-8 relative rounded-none">
            {/* Technical ID */}
            <div className="absolute top-4 right-4 typography-technical-sm text-grid/40">
              ID // 02-03
            </div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="typography-technical-label text-forest font-semibold">Submission Generation</h3>
              <Icon icon="lucide:file-text" className="text-xl text-gold" />
            </div>
            <p className="typography-body-md text-grid leading-relaxed mb-6">
              Generates problem statements, solution ideas, architecture, tech stack, pitch decks, and documentation.
            </p>
            <div className="bg-white border border-grid/20 p-4 rounded-none">
              <div className="typography-technical-sm text-grid space-y-1">
                <div>✓ Problem Statement</div>
                <div>✓ Solution Idea</div>
                <div>✓ Architecture</div>
                <div>✓ Tech Stack</div>
                <div>✓ Pitch Deck</div>
                <div>✓ Documentation</div>
              </div>
            </div>
          </div>

          {/* Cell 4: Network Topology */}
          <div className="bg-paper p-8 flex items-center justify-center relative rounded-none">
            {/* Technical ID */}
            <div className="absolute top-4 right-4 typography-technical-sm text-grid/40">
              ID // 02-04
            </div>
            <div className="relative w-64 h-64 border border-forest rounded-none flex items-center justify-center">
              {/* Central Node */}
              <div className="absolute w-4 h-4 bg-forest rounded-none z-20" />

              {/* Dashed Square Orbit Path */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 256 256">
                <rect x="58" y="58" width="140" height="140" fill="none" stroke="#022617" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
              </svg>

              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 256 256">
                <line x1="128" y1="128" x2="128" y2="58" stroke="#022617" strokeWidth="1" opacity="0.2" />
                <line x1="128" y1="128" x2="68.4" y2="178.6" stroke="#022617" strokeWidth="1" opacity="0.2" />
                <line x1="128" y1="128" x2="187.6" y2="178.6" stroke="#022617" strokeWidth="1" opacity="0.2" />
              </svg>

              {/* Orbiting Nodes */}
              <div className="absolute w-full h-full">
                <div className="orbit-node absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-2 h-2 bg-coral rounded-none" />
                </div>
                <div className="orbit-node absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-2 h-2 bg-mint rounded-none" />
                </div>
                <div className="orbit-node absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-2 h-2 bg-gold rounded-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}