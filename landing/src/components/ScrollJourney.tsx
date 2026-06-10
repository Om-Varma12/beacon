import { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const journeySteps = [
  {
    id: 1,
    number: '01',
    title: 'FIND HACKATHON',
    description: 'Discover the perfect opportunity that matches your skills and passion',
    icon: 'lucide:search',
    position: 'left' as const,
    color: 'coral' as const
  },
  {
    id: 2,
    number: '02',
    title: 'ANALYZE RULES',
    description: 'Deep dive into requirements and constraints to maximize your success',
    icon: 'lucide:puzzle',
    position: 'right' as const,
    color: 'mint' as const
  },
  {
    id: 3,
    number: '03',
    title: 'DEBATE THEME',
    description: 'Explore multiple angles and refine your approach through AI dialogue',
    icon: 'lucide:message-square',
    position: 'left' as const,
    color: 'gold' as const
  },
  {
    id: 4,
    number: '04',
    title: 'CHOOSE WINNER',
    description: 'Select the strongest concept from intelligent recommendations',
    icon: 'lucide:trophy',
    position: 'right' as const,
    color: 'coral' as const
  },
  {
    id: 5,
    number: '05',
    title: 'GENERATE SUBMISSION',
    description: 'Transform your winning idea into a polished, ready-to-submit project',
    icon: 'lucide:file-text',
    position: 'left' as const,
    color: 'mint' as const
  }
]

const stepColorMap = {
  coral: 'bg-coral text-white',
  mint: 'bg-mint text-white',
  gold: 'bg-gold text-white'
}

const stepDotColorMap = {
  coral: 'bg-coral ring-coral/20',
  mint: 'bg-mint ring-mint/20',
  gold: 'bg-gold ring-gold/20'
}

// ─── Mobile: vertical timeline ────────────────────────────────────────────────
function MobileJourney() {
  return (
    <section className="bg-paper border-b border-grid/20 py-16 px-6">
      {/* Header */}
      <div className="mb-12 text-center">
        <h2 className="typography-display-lg text-forest text-4xl leading-tight">
          One AI Workflow<br />
          <span className="text-coral">From Discovery To Submission</span>
        </h2>
      </div>

      {/* Vertical timeline */}
      <div className="relative pl-8">
        {/* Left border line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-coral/30" />

        <div className="flex flex-col gap-10">
          {journeySteps.map((step) => (
            <div key={step.id} className="relative">
              {/* Dot */}
              <div className={`absolute -left-8 top-1 w-4 h-4 rounded-none ring-4 ${stepDotColorMap[step.color]} flex-shrink-0`} />

              {/* Content */}
              <div>
                <div className="typography-technical-sm text-coral mb-1">STEP {step.number}</div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center justify-center w-7 h-7 ${stepColorMap[step.color]}`}>
                    <Icon icon={step.icon} width={14} />
                  </span>
                  <h3 className="space-grotesk text-lg font-bold text-forest">{step.title}</h3>
                </div>
                <p className="text-sm text-grid leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-16 text-center">
        <h3 className="space-grotesk text-2xl font-bold text-forest mb-3">Ready to Start?</h3>
        <p className="text-sm text-grid mb-6">Your AI-powered hackathon journey awaits</p>
        <a
          href="#waitlist"
          className="inline-block jetbrains text-[10px] uppercase px-8 py-4 bg-gradient-to-r from-coral to-gold text-white font-semibold"
        >
          Begin Your Journey
        </a>
      </div>
    </section>
  )
}

// ─── Desktop: animated SVG path ───────────────────────────────────────────────
function DesktopJourney() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const svg = svgRef.current
    const path = pathRef.current

    if (!section || !svg || !path) return

    const scroller = section.closest('.overflow-y-auto') as HTMLElement
    if (!scroller) return

    let cachedPathLength = 0
    let pathStartTop = 0
    let pathEndBottom = 0

    const calculatePath = () => {
      const steps = journeySteps.map(step =>
        document.getElementById(`step-${step.id}`)
      ).filter(Boolean) as HTMLElement[]

      if (steps.length === 0) return

      const svgRect = svg.getBoundingClientRect()
      const points = steps.map(step => {
        const node = step.querySelector('.step-node') as HTMLElement
        if (!node) return { x: 0, y: 0 }
        const rect = node.getBoundingClientRect()
        return {
          x: rect.left + rect.width / 2 - svgRect.left,
          y: rect.top + rect.height / 2 - svgRect.top
        }
      })

      let pathData = `M ${points[0].x} ${points[0].y}`
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1]
        const current = points[i]
        const midY = (prev.y + current.y) / 2
        pathData += ` C ${prev.x} ${midY}, ${current.x} ${midY}, ${current.x} ${current.y}`
      }

      const lastPoint = points[points.length - 1]
      let conclusionY = lastPoint.y
      const footer = document.getElementById('journey-footer')
      if (footer) {
        const footerRect = footer.getBoundingClientRect()
        const centerX = svgRect.width / 2
        conclusionY = footerRect.top + footerRect.height / 3 - svgRect.top
        const midY = (lastPoint.y + conclusionY) / 2
        pathData += ` C ${lastPoint.x} ${midY}, ${centerX} ${midY}, ${centerX} ${conclusionY}`
      }

      path.setAttribute('d', pathData)
      const length = path.getTotalLength()
      cachedPathLength = length
      pathStartTop = points[0]?.y || 0
      pathEndBottom = conclusionY
      path.setAttribute('stroke-dasharray', `${length} ${length}`)
      path.setAttribute('stroke-dashoffset', length.toString())

      const container = document.getElementById('journey-container-desktop')
      if (container) svg.style.height = container.scrollHeight + 'px'
    }

    const updatePathProgress = () => {
      if (cachedPathLength === 0) calculatePath()
      if (cachedPathLength === 0) return

      const containerTop = section.offsetTop
      const pathStartAbsolute = containerTop + pathStartTop
      const pathEndAbsolute = containerTop + pathEndBottom
      const viewCenter = scroller.scrollTop + scroller.clientHeight * 0.5
      const progress = Math.max(0, Math.min(1, (viewCenter - pathStartAbsolute) / (pathEndAbsolute - pathStartAbsolute)))
      path.setAttribute('stroke-dashoffset', (cachedPathLength * (1 - progress)).toString())
    }

    setTimeout(() => { calculatePath(); updatePathProgress() }, 150)

    const scrollHandler = () => requestAnimationFrame(updatePathProgress)
    scroller.addEventListener('scroll', scrollHandler)

    const resizeHandler = () => setTimeout(() => { calculatePath(); updatePathProgress() }, 100)
    window.addEventListener('resize', resizeHandler)

    const triggers: ScrollTrigger[] = []
    journeySteps.forEach((step) => {
      const stepSection = document.getElementById(`step-${step.id}-section`)
      const stepElement = document.getElementById(`step-${step.id}`)
      if (!stepSection || !stepElement) return

      const stepNode = stepElement.querySelector('.step-node') as HTMLElement
      const stepContent = stepElement.querySelector('.step-content') as HTMLElement

      const trigger = ScrollTrigger.create({
        trigger: stepSection,
        scroller: scroller,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => {
          if (stepNode) gsap.to(stepNode, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' })
          if (stepContent) gsap.to(stepContent, { opacity: 1, y: 0, x: 0, duration: 0.8, ease: 'back.out(1.7)' })
        },
        onEnterBack: () => {
          if (stepNode) gsap.to(stepNode, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' })
          if (stepContent) gsap.to(stepContent, { opacity: 1, y: 0, x: 0, duration: 0.8, ease: 'back.out(1.7)' })
        },
        onLeave: () => {
          if (stepNode) gsap.to(stepNode, { opacity: 0, scale: 0.5, duration: 0.4 })
          if (stepContent) gsap.to(stepContent, { opacity: 0, duration: 0.4 })
        },
        onLeaveBack: () => {
          if (stepNode) gsap.to(stepNode, { opacity: 0, scale: 0.5, duration: 0.4 })
          if (stepContent) gsap.to(stepContent, { opacity: 0, duration: 0.4 })
        }
      })
      triggers.push(trigger)
    })

    return () => {
      scroller.removeEventListener('scroll', scrollHandler)
      window.removeEventListener('resize', resizeHandler)
      triggers.forEach(t => t.kill())
    }
  }, [])

  return (
    <section ref={sectionRef} id="journey-container-desktop" data-scroll-corridor="true" className="relative bg-paper border-b border-grid/20">
      <div id="journey-hero" className="h-screen min-h-[700px] flex items-center justify-center px-8">
        <div className="text-center max-w-4xl">
          <h1 className="typography-display-lg text-forest mb-8">
            One AI Workflow<br />
            <span className="text-coral">From Discovery To Submission</span>
          </h1>
          <p className="typography-body-lg text-grid mb-12">Scroll to explore the journey</p>
          <div className="animate-bounce">
            <Icon icon="lucide:chevron-down" className="w-8 h-8 mx-auto text-grid/60" />
          </div>
        </div>
      </div>

      <svg ref={svgRef} className="absolute left-0 top-0 w-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#9e4225', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#fe8b69', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#9e4225', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <path ref={pathRef} d="" stroke="url(#lineGradient)" strokeWidth="4" fill="none" strokeLinecap="round" style={{ opacity: 0.8 }} />
      </svg>

      <div className="relative" style={{ zIndex: 2 }}>
        {journeySteps.map((step) => (
          <div
            key={step.id}
            id={`step-${step.id}-section`}
            className={`h-screen min-h-[900px] flex ${step.id === 1 ? 'items-start pt-0' : 'items-center'}`}
          >
            <div className="max-w-7xl mx-auto px-8 w-full">
              <div
                id={`step-${step.id}`}
                className={`flex items-center ${
                  step.position === 'left'
                    ? 'justify-start pl-8 md:pl-16 lg:pl-32'
                    : 'justify-end pr-8 md:pr-16 lg:pr-32'
                }`}
              >
                {step.position === 'left' ? (
                  <>
                    <div className="step-node mr-8 md:mr-12 w-6 h-6 md:w-8 md:h-8 bg-coral ring-8 ring-coral/20 flex-shrink-0 relative z-10 opacity-0 scale-50" />
                    <div className="step-content text-left opacity-0">
                      <div className="inline-block">
                        <div className="typography-technical-sm text-coral mb-2 tracking-wider uppercase">STEP {step.number}</div>
                        <h2 className="typography-headline-md text-forest mb-4 tracking-tight">{step.title}</h2>
                        <p className="typography-body-md text-grid max-w-md leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="step-content text-right opacity-0">
                      <div className="inline-block">
                        <div className="typography-technical-sm text-coral mb-2 tracking-wider uppercase">STEP {step.number}</div>
                        <h2 className="typography-headline-md text-forest mb-4 tracking-tight">{step.title}</h2>
                        <p className="typography-body-md text-grid max-w-md leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                    <div className="step-node ml-8 md:ml-12 w-6 h-6 md:w-8 md:h-8 bg-coral ring-8 ring-coral/20 flex-shrink-0 relative z-10 opacity-0 scale-50" />
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div id="journey-footer" className="h-screen min-h-[700px] flex items-center justify-center relative" style={{ zIndex: 2 }}>
        <div className="text-center">
          <h2 className="typography-display-lg text-forest mb-4 tracking-tight">Ready to Start?</h2>
          <p className="typography-body-lg text-grid mb-8">Your AI-powered hackathon journey awaits</p>
          <a href="#waitlist" className="inline-block jetbrains text-[10px] uppercase px-8 py-4 bg-gradient-to-r from-coral to-gold text-white font-semibold hover:shadow-xl transition-shadow duration-300">
            Begin Your Journey
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Export: picks layout by screen size ──────────────────────────────────────
export function ScrollJourney() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return isMobile ? <MobileJourney /> : <DesktopJourney />
}
