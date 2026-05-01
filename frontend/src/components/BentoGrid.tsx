import { Icon } from '@iconify/react'

export function BentoGrid() {
  return (
    <section id="features" className="min-h-screen py-24 border-b border-grid/20 snap-start flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-8">
        <div className="mb-12">
          <span className="jetbrains text-[10px] uppercase tracking-widest text-grid">02. Core Capabilities</span>
        </div>

        <div className="grid grid-cols-2 gap-px bg-grid/20">
          {/* Cell 1: Auto-Discovery */}
          <div className="bg-paper p-8 border-l-2 border-coral">
            <div className="flex items-center justify-between mb-6">
              <h3 className="jetbrains text-xs uppercase tracking-wider text-forest font-semibold">Auto-Discovery</h3>
              <Icon icon="lucide:search" className="text-xl text-coral" />
            </div>
            <p className="text-sm text-grid leading-relaxed mb-6">
              Scrapes hackathon platforms, extracts rules, themes, deadlines, and judging criteria automatically.
            </p>
            <div className="bg-white border border-grid/20 p-4">
              <div className="jetbrains text-[10px] text-grid space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-coral" />
                  <span>STATUS: ACTIVE</span>
                </div>
                <div className="text-grid/60">Scanned: 47 platforms</div>
                <div className="text-grid/60">Found: 128 events</div>
              </div>
            </div>
          </div>

          {/* Cell 2: Multi-Agent Analysis */}
          <div className="bg-paper p-8 border-l-2 border-mint">
            <div className="flex items-center justify-between mb-6">
              <h3 className="jetbrains text-xs uppercase tracking-wider text-forest font-semibold">Multi-Agent Analysis</h3>
              <Icon icon="lucide:brain" className="text-xl text-mint" />
            </div>
            <p className="text-sm text-grid leading-relaxed mb-6">
              Multiple AI agents debate innovation, feasibility, impact, and execution to select optimal direction.
            </p>
            <div className="bg-white border border-grid/20 p-4">
              <div className="jetbrains text-[10px] text-grid space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-mint" />
                  <span>AGENT_INNOVATION: 89%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-mint" />
                  <span>AGENT_FEASIBILITY: 76%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-mint" />
                  <span>AGENT_IMPACT: 92%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cell 3: Submission Generation */}
          <div className="bg-paper p-8 border-l-2 border-gold">
            <div className="flex items-center justify-between mb-6">
              <h3 className="jetbrains text-xs uppercase tracking-wider text-forest font-semibold">Submission Generation</h3>
              <Icon icon="lucide:file-text" className="text-xl text-gold" />
            </div>
            <p className="text-sm text-grid leading-relaxed mb-6">
              Generates problem statements, solution ideas, architecture, tech stack, pitch decks, and documentation.
            </p>
            <div className="bg-white border border-grid/20 p-4">
              <div className="jetbrains text-[10px] text-grid space-y-1">
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
          <div className="bg-paper p-8 flex items-center justify-center">
            <div className="relative w-64 h-64 border border-forest rounded-full flex items-center justify-center">
              {/* Central Node */}
              <div className="absolute w-4 h-4 bg-forest rounded-full z-20" />

              {/* Dashed Orbit Path */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 256 256">
                <circle cx="128" cy="128" r="70" fill="none" stroke="#1A3C2B" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
              </svg>

              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 256 256">
                <line x1="128" y1="128" x2="128" y2="58" stroke="#1A3C2B" strokeWidth="1" opacity="0.2" />
                <line x1="128" y1="128" x2="68.4" y2="178.6" stroke="#1A3C2B" strokeWidth="1" opacity="0.2" />
                <line x1="128" y1="128" x2="187.6" y2="178.6" stroke="#1A3C2B" strokeWidth="1" opacity="0.2" />
              </svg>

              {/* Orbiting Nodes */}
              <div className="absolute w-full h-full">
                <div className="orbit-node absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 bg-coral rounded-full" />
                </div>
                <div className="orbit-node absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 bg-mint rounded-full" />
                </div>
                <div className="orbit-node absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 bg-gold rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}