import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'

interface ModuleData {
  id: number
  number: string
  techId: string
  title: string
  tagline: string
  description: string
  color: 'coral' | 'mint' | 'gold'
  details: string[]
  visualType: 'debate' | 'discovery' | 'eval' | 'prod' | 'template'
}

const modules: ModuleData[] = [
  {
    id: 0,
    number: '01',
    techId: 'AGENT_DEBATE_ORCHESTRATOR',
    title: 'Multi-Agent Debate',
    tagline: 'LLM Orchestration & Challenger Network',
    description: 'Proprietary LLM orchestration where agents challenge each other\'s biases to arrive at statistically superior project concepts.',
    color: 'coral',
    details: [
      'Synthesizes sponsor APIs and developer skills into problem statements',
      'Generates challenger personas representing critical judges and skeptics',
      'Facilitates multi-turn structured debate to pressure-test viability',
      'Scores final alignment before committing to code repositories'
    ],
    visualType: 'debate'
  },
  {
    id: 1,
    number: '02',
    techId: 'AUTONOMOUS_MATCHING_ENGINE',
    title: 'Hackathon Discovery',
    tagline: 'Global Hackathon Registry & Matching Engine',
    description: 'Automated search & matching across Devpost, Devfolio, Unstop, and Gitcoin to find target hackathons aligned with your profile.',
    color: 'mint',
    details: [
      'Real-time tracking of registration deadlines and prize pools',
      'Developer skill profile analysis to match maximum winning probability',
      'Auto-parses brief documents, rules, and sponsor bounties',
      'Monitors live announcements from discord and hackathon sites'
    ],
    visualType: 'discovery'
  },
  {
    id: 2,
    number: '03',
    techId: 'SPONSOR_INTENT_EVALUATOR',
    title: 'Theme Evaluation',
    tagline: 'Historical Bounties & Sponsor Intent Engine',
    description: 'Evaluating track themes, judge personas, and sponsor priorities to calculate an alignment score and probability of success.',
    color: 'gold',
    details: [
      'Predictive judge modeling based on previous winning projects',
      'Sponsor ROI mapping to align projects directly with product goals',
      'Complexity-to-Impact ratio calculation for 36-hour sprint feasibility',
      'Competitor density forecasting based on registration analytics'
    ],
    visualType: 'eval'
  },
  {
    id: 3,
    number: '04',
    techId: 'SUBMISSION_BOILERPLATE_PROD',
    title: 'Submission Generator',
    tagline: 'Pitch, Deck & Code Skeleton Assembly',
    description: 'Generating high-fidelity pitches, video demo scripts, README structures, and working boilerplate code tailored to submission rules.',
    color: 'coral',
    details: [
      'Creates working monorepos with pre-configured developer tooling',
      'Generates professional markdown READMEs with system architecture',
      'Drafts video presentation scripts aligned with pitch structures',
      'Pre-integrates telemetry, design tokens, and SEO tags'
    ],
    visualType: 'prod'
  },
  {
    id: 4,
    number: '05',
    techId: 'NOVELTY_ASSURANCE_DETECTOR',
    title: 'Template Detection',
    tagline: 'Anti-Pattern & Novelty Assurance Engine',
    description: 'Scanning historical submissions to detect patterns, preventing generic templates, and ensuring the project looks novel.',
    color: 'mint',
    details: [
      'Cross-references database of 10,000+ past submissions',
      'Flags boilerplate UI patterns that look generic to judges',
      'Validates novelty index and uniqueness score of the value prop',
      'Ensures application architecture has distinct, eye-catching elements'
    ],
    visualType: 'template'
  }
]

// Visualizers (unchanged — kept for desktop)
function DebateVisualizer() {
  const [activeAgent, setActiveAgent] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setActiveAgent((prev) => (prev + 1) % 3), 2500)
    return () => clearInterval(interval)
  }, [])
  const agentLogs = [
    { agent: 'AGENT_01 CRITIC', msg: 'Warning: Chatbot is an over-saturated niche.', color: 'border-l-2 border-coral bg-coral/5 text-coral' },
    { agent: 'AGENT_02 STRATEGIST', msg: 'Pivot: Integrate Git-verified developer metrics.', color: 'border-l-2 border-gold bg-gold/5 text-secondary' },
    { agent: 'AGENT_03 ARCHITECT', msg: 'Viability: 92%. Code generation approved.', color: 'border-l-2 border-mint bg-mint/5 text-primary' }
  ]
  return (
    <div className="w-full h-full flex flex-col justify-between p-2.5 jetbrains text-[11px] text-primary">
      <div className="flex justify-between items-center border-b border-outline/25 pb-1 mb-1">
        <span className="text-outline text-[10px] font-bold">DEBATE_ORCHESTRATION_THREAD</span>
        <span className="text-mint flex items-center gap-1 font-bold"><span className="w-1.5 h-1.5 bg-mint animate-pulse" /> LIVE_FEED</span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        {agentLogs.map((log, idx) => {
          const isActive = idx === activeAgent
          return (
            <div key={idx} className={`p-1.5 pl-2.5 transition-all duration-300 rounded-none border-l-2 ${isActive ? `${log.color} translate-x-1 font-medium` : 'border-l border-outline/15 text-primary/40 bg-white/40'}`}>
              <div className="flex justify-between font-bold text-[8.5px]"><span>{log.agent}</span></div>
              <p className="font-mono text-[9.5px] leading-tight mt-0.5">{log.msg}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DiscoveryVisualizer() {
  const [scanIndex, setScanIndex] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setScanIndex((prev) => (prev + 1) % 3), 2000)
    return () => clearInterval(interval)
  }, [])
  const hackathons = [
    { name: 'DEVFOLIO_WEB3_BUILD', reward: '$25,000', match: '94%', tags: 'AI, SOLIDITY' },
    { name: 'DEVPOST_GLOBAL_HACK', reward: '$50,000', match: '89%', tags: 'NEXTJS, LLM' },
    { name: 'ETH_GLOBAL_LONDON', reward: '$40,000', match: '91%', tags: 'REACT, EVM' }
  ]
  return (
    <div className="w-full h-full flex flex-col justify-between p-2.5 jetbrains text-[11px] text-primary relative overflow-hidden">
      <div className="absolute left-0 w-full h-[1.5px] bg-coral/30 pointer-events-none" style={{ animation: 'scan-line 3s linear infinite' }} />
      <div className="flex justify-between items-center border-b border-outline/25 pb-1 mb-1">
        <span className="text-outline text-[10px] font-bold">REGISTRY_SCANNER VOL_49</span>
        <span className="text-coral font-bold">MATCH_CALCULATION</span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        {hackathons.map((h, idx) => {
          const isScanning = idx === scanIndex
          return (
            <div key={idx} className={`border p-1.5 transition-all duration-300 rounded-none ${isScanning ? 'border-coral bg-coral/5 text-primary' : 'border-outline/10 text-primary/40 bg-white/40'}`}>
              <div className="flex justify-between items-center text-[9.5px]">
                <span className="font-bold">{h.name}</span>
                <span className={isScanning ? 'text-coral font-bold' : ''}>{h.match} MATCH</span>
              </div>
              <div className="flex justify-between text-[8.5px] mt-0.5 opacity-80 font-mono">
                <span>BOUNTY: {h.reward}</span><span>STACK: {h.tags}</span>
              </div>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes scan-line { 0% { top: 0%; } 50% { top: 100%; } 100% { top: 0%; } }`}</style>
    </div>
  )
}

function EvalVisualizer() {
  const [metrics, setMetrics] = useState({ alignment: 85, compliance: 90, feasibility: 75 })
  useEffect(() => {
    const interval = setInterval(() => setMetrics({
      alignment: Math.min(100, Math.max(70, 85 + Math.floor(Math.random() * 6 - 3))),
      compliance: Math.min(100, Math.max(80, 90 + Math.floor(Math.random() * 4 - 2))),
      feasibility: Math.min(100, Math.max(65, 75 + Math.floor(Math.random() * 8 - 4)))
    }), 1500)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="w-full h-full flex flex-col justify-between p-4 jetbrains text-[11px] text-primary">
      <div className="flex justify-between items-center border-b border-outline/25 pb-2 mb-2">
        <span className="text-outline text-[10px] font-bold">SPONSOR_ALIGNMENT_ENGINE</span>
        <span className="text-secondary font-bold">PROBABILITY: 88.4%</span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-2.5">
        {[{ label: 'JUDGE_PERSONA_ALIGNMENT', val: metrics.alignment, color: 'bg-gold' }, { label: 'SPONSOR_BOUNTY_COMPLIANCE', val: metrics.compliance, color: 'bg-coral' }, { label: '36H_SPRINT_FEASIBILITY', val: metrics.feasibility, color: 'bg-mint' }].map(m => (
          <div key={m.label} className="space-y-0.5">
            <div className="flex justify-between text-[9px] font-bold"><span>{m.label}</span><span>{m.val}%</span></div>
            <div className="w-full bg-white h-2 border border-outline/20 relative">
              <div className={`${m.color} h-full transition-all duration-500`} style={{ width: `${m.val}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const allLines = ['Initializing monorepo workspace...', 'Installing Tailwind v4.0 design tokens...', 'Scaffolding dynamic React 19 pages...', 'Wiring Agentic Router engine...', 'Building Pitch Deck markdown...', 'Verifying rule compliance check...', 'Submission bundle compiled successfully.']

function ProdVisualizer() {
  const [lines, setLines] = useState<string[]>([])
  useEffect(() => {
    let currentLine = 0
    setLines([allLines[0]])
    const interval = setInterval(() => {
      currentLine++
      if (currentLine < allLines.length) setLines(prev => [...prev, allLines[currentLine]])
      else { setLines([allLines[0]]); currentLine = 0 }
    }, 1200)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="w-full h-full flex flex-col justify-between p-4 jetbrains text-[11px] text-primary">
      <div className="flex justify-between items-center border-b border-outline/25 pb-2 mb-2">
        <span className="text-outline text-[10px] font-bold">COMPILER_STDOUT BEACON_CLI</span>
        <span className="text-mint font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-mint animate-pulse" /> COMPILING</span>
      </div>
      <div className="flex-1 flex flex-col justify-end gap-1 font-mono text-[9px] overflow-hidden text-primary/80">
        {lines.map((line, idx) => (
          <div key={idx} className="flex gap-1.5 items-center">
            <span className="text-mint font-bold">{idx === lines.length - 1 ? '>' : '✔'}</span>
            <span className={idx === lines.length - 1 ? 'text-primary font-bold' : 'text-primary/50'}>{line}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TemplateVisualizer() {
  const [toggle, setToggle] = useState(false)
  useEffect(() => {
    const interval = setInterval(() => setToggle((prev) => !prev), 2000)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="w-full h-full flex flex-col justify-between p-4 jetbrains text-[11px] text-primary">
      <div className="flex justify-between items-center border-b border-outline/25 pb-2 mb-2">
        <span className="text-outline text-[10px] font-bold">NOVELTY_ASSURANCE_SYSTEM</span>
        <span className={toggle ? 'text-coral font-bold' : 'text-mint font-bold'}>{toggle ? 'BOILERPLATE_DETECTED' : 'NOVELTY_VERIFIED'}</span>
      </div>
      <div className="flex-1 flex items-center justify-center gap-3">
        <div className={`flex-1 border p-2 text-center transition-all duration-500 rounded-none ${toggle ? 'border-coral bg-coral/5 text-coral scale-95' : 'border-outline/10 text-primary/20 bg-white/40'}`}>
          <div className="font-bold text-[8px] mb-0.5">BOILERPLATE_UI</div>
          <div className="text-[10px] line-through font-mono">DEFAULT_TEMPL</div>
          <div className="text-[8px] mt-0.5 opacity-80 font-mono">Overlap: 84%</div>
        </div>
        <div className={`flex-1 border p-2 text-center transition-all duration-500 rounded-none ${!toggle ? 'border-mint bg-mint/5 text-primary scale-105' : 'border-outline/10 text-primary/20 bg-white/40'}`}>
          <div className="font-bold text-[8px] mb-0.5 text-mint">BEACON_CUSTOM</div>
          <div className="text-[10px] font-mono font-bold">NOVEL_ARCH</div>
          <div className="text-[8px] mt-0.5 opacity-80 font-mono">Overlap: 4%</div>
        </div>
      </div>
    </div>
  )
}

const dotColorMap = { coral: 'bg-coral', mint: 'bg-mint', gold: 'bg-gold' }
const borderColorMap = { coral: 'border-l-coral', mint: 'border-l-mint', gold: 'border-l-gold' }
const textColorMap = { coral: 'text-coral', mint: 'text-mint', gold: 'text-gold' }

// ─── Mobile: stacked module cards ────────────────────────────────────────────
function MobileBehindTheIntelligence() {
  return (
    <section className="py-16 px-6 border-b border-outline/20 bg-transparent">
      <h2 className="typography-display-lg text-primary mb-10 text-4xl leading-tight">
        Behind the Intelligence
      </h2>
      <div className="flex flex-col gap-6">
        {modules.map((module) => (
          <div
            key={module.id}
            className={`bg-white border border-outline/20 p-6 border-l-4 ${borderColorMap[module.color]}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2.5 h-2.5 ${dotColorMap[module.color]}`} />
              <span className="typography-technical-sm text-primary/50">MODULE {module.number}</span>
            </div>
            <h3 className="space-grotesk text-xl font-bold text-primary mb-1">{module.title}</h3>
            <p className={`typography-technical-sm mb-3 ${textColorMap[module.color]}`}>{module.tagline}</p>
            <p className="text-sm text-primary/75 leading-relaxed mb-4">{module.description}</p>
            <ul className="space-y-2">
              {module.details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[12px] text-primary/70">
                  <span className={`w-1.5 h-1.5 ${dotColorMap[module.color]} mt-1.5 flex-shrink-0`} />
                  <span className="leading-tight">{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Desktop: interactive bento grid ─────────────────────────────────────────
function DesktopBehindTheIntelligence() {
  const [activeIndex, setActiveIndex] = useState(0)

  const renderVisualizer = (type: ModuleData['visualType']) => {
    switch (type) {
      case 'debate': return <DebateVisualizer />
      case 'discovery': return <DiscoveryVisualizer />
      case 'eval': return <EvalVisualizer />
      case 'prod': return <ProdVisualizer />
      case 'template': return <TemplateVisualizer />
      default: return null
    }
  }

  const getGridClasses = (index: number, activeIdx: number) => {
    if (index === activeIdx) {
      let colStart = 'md:col-start-1'
      if (activeIdx === 1) colStart = 'md:col-start-2'
      if (activeIdx === 2 || activeIdx === 4) colStart = 'md:col-start-3'
      return `md:col-span-2 md:row-span-2 ${colStart} md:row-start-1`
    }
    const mapping: Record<number, Record<number, { col: number; row: number }>> = {
      0: { 1: { col: 3, row: 1 }, 2: { col: 4, row: 1 }, 3: { col: 3, row: 2 }, 4: { col: 4, row: 2 } },
      1: { 0: { col: 1, row: 1 }, 2: { col: 4, row: 1 }, 3: { col: 1, row: 2 }, 4: { col: 4, row: 2 } },
      2: { 0: { col: 1, row: 1 }, 1: { col: 2, row: 1 }, 3: { col: 1, row: 2 }, 4: { col: 2, row: 2 } },
      3: { 0: { col: 3, row: 1 }, 1: { col: 4, row: 1 }, 2: { col: 3, row: 2 }, 4: { col: 4, row: 2 } },
      4: { 0: { col: 1, row: 1 }, 1: { col: 2, row: 1 }, 2: { col: 1, row: 2 }, 3: { col: 2, row: 2 } }
    }
    const pos = mapping[activeIdx]?.[index]
    if (!pos) return ''
    return `md:col-start-${pos.col} md:row-start-${pos.row} md:col-span-1 md:row-span-1`
  }

  const activeColorMap = { coral: 'border-coral/30', mint: 'border-mint/30', gold: 'border-gold/30' }
  const activeDotColorMap = { coral: 'bg-coral', mint: 'bg-mint', gold: 'bg-gold' }

  return (
    <section className="min-h-screen py-24 px-margin-md border-b border-outline/20 flex items-center bg-transparent relative z-10">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="typography-display-lg text-primary mt-2">Behind the Intelligence</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-none md:grid-rows-2 gap-4 h-auto md:h-[620px] transition-all duration-500 ease-in-out">
          {modules.map((module, index) => {
            const isActive = index === activeIndex
            return (
              <motion.div
                key={module.id}
                layout
                onClick={() => { if (!isActive) setActiveIndex(index) }}
                className={`border bg-white flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${getGridClasses(index, activeIndex)} ${
                  isActive
                    ? `${activeColorMap[module.color]} p-8 border-outline/30 cursor-default`
                    : 'border-outline/20 p-6 hover:bg-surface-container-low hover:border-primary/40 cursor-pointer group'
                }`}
              >
                {isActive ? (
                  <>
                    <div className="corner-marker corner-tl" />
                    <div className="corner-marker corner-tr" />
                    <div className="corner-marker corner-bl" />
                    <div className="corner-marker corner-br" />
                    <div className="absolute top-4 right-4 typography-technical-sm text-primary/40 font-mono">SYS_ID {module.techId}</div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="inline-flex items-center gap-2 border border-outline/25 px-2.5 py-1 bg-surface-container-low mb-4">
                          <div className={`w-2.5 h-2.5 ${activeDotColorMap[module.color]}`} />
                          <span className="typography-technical-sm text-primary/80">MODULE {module.number}</span>
                        </div>
                        <h3 className="space-grotesk text-3xl font-bold text-primary mb-1">{module.title}</h3>
                        <p className="typography-technical-sm text-secondary mb-4">{module.tagline}</p>
                        <p className="typography-body-md text-primary/80 max-w-xl mb-6 leading-relaxed">{module.description}</p>
                        <div className="border-t border-outline/10 pt-4 mb-6">
                          <h4 className="typography-technical-sm text-primary/50 mb-3">SYSTEM ACTIONS:</h4>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                            {module.details.map((detail, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-[12px] text-primary/80">
                                <span className={`w-1.5 h-1.5 ${activeDotColorMap[module.color]} mt-1.5 flex-shrink-0`} />
                                <span className="font-sans leading-tight">{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="h-44 w-full bg-surface-container border border-outline/15 flex items-center justify-center mt-auto">
                        {renderVisualizer(module.visualType)}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <span className="typography-technical-sm text-primary/50 font-bold">{module.number} {module.techId.split('_')[0]}</span>
                      <Icon icon="lucide:arrow-up-right" className="text-primary/20 group-hover:text-coral transition-colors" width={16} />
                    </div>
                    <div className="mt-8 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="space-grotesk text-xl font-bold text-primary group-hover:text-coral transition-colors">{module.title}</h4>
                        <p className="text-[11px] text-primary/60 mt-1 font-mono uppercase tracking-wider">{module.tagline.split(' & ')[0]}</p>
                      </div>
                      <span className="typography-technical-sm text-primary/30 mt-auto pt-6 self-end group-hover:text-primary/70 transition-colors">SCAN MODULE ➔</span>
                    </div>
                  </>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Export: picks layout by screen size ─────────────────────────────────────
export function BehindTheIntelligence() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return isMobile ? <MobileBehindTheIntelligence /> : <DesktopBehindTheIntelligence />
}
