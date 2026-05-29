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

const colorMap = {
  coral: 'bg-coral',
  mint: 'bg-mint',
  gold: 'bg-gold'
}

const textColorMap = {
  coral: 'text-coral',
  mint: 'text-mint',
  gold: 'text-gold'
}

const ringColorMap = {
  coral: 'ring-coral/20',
  mint: 'ring-mint/20',
  gold: 'ring-gold/20'
}

export function ScrollJourney() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [pathLength, setPathLength] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    const svg = svgRef.current
    const path = pathRef.current

    if (!section || !svg || !path) return

    // Find the parent scroll container
    const scroller = section.closest('.overflow-y-auto') as HTMLElement
    if (!scroller) return

    let cachedPathLength = 0

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

      // Create smooth S-curve path with cubic bezier
      let pathData = `M ${points[0].x} ${points[0].y}`

      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1]
        const current = points[i]

        // Smooth bezier control points at midpoint
        const midY = (prev.y + current.y) / 2
        const cp1x = prev.x
        const cp1y = midY
        const cp2x = current.x
        const cp2y = midY

        pathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${current.x} ${current.y}`
      }

      // Conclusion curve to center bottom
      const lastPoint = points[points.length - 1]
      const footer = document.getElementById('journey-footer')
      if (footer) {
        const footerRect = footer.getBoundingClientRect()
        const centerX = svgRect.width / 2
        const conclusionY = footerRect.top + footerRect.height / 3 - svgRect.top

        const midY = (lastPoint.y + conclusionY) / 2

        pathData += ` C ${lastPoint.x} ${midY}, ${centerX} ${midY}, ${centerX} ${conclusionY}`
      }

      path.setAttribute('d', pathData)

      const length = path.getTotalLength()
      cachedPathLength = length
      setPathLength(length)
      path.setAttribute('stroke-dasharray', `${length} ${length}`)
      path.setAttribute('stroke-dashoffset', length.toString())

      // Resize SVG to cover all content
      const container = document.getElementById('journey-container')
      if (container) {
        svg.style.height = container.scrollHeight + 'px'
      }
    }

    const updatePathProgress = () => {
      if (cachedPathLength === 0) return

      const heroSection = document.querySelector('#journey-container > .snap-start') as HTMLElement | null
      const footerSection = document.getElementById('journey-footer')

      if (!heroSection || !footerSection) return

      const heroTop = heroSection.offsetTop
      const footerBottom = footerSection.offsetTop + footerSection.offsetHeight
      const viewCenter = scroller.scrollTop + scroller.clientHeight * 0.5
      const progress = Math.max(0, Math.min(1, (viewCenter - heroTop) / (footerBottom - heroTop)))

      path.setAttribute('stroke-dashoffset', (cachedPathLength * (1 - progress)).toString())
    }

    // Initial calculation
    setTimeout(() => {
      calculatePath()
      updatePathProgress()
    }, 150)

    // Scroll handler
    const scrollHandler = () => {
      requestAnimationFrame(updatePathProgress)
    }
    scroller.addEventListener('scroll', scrollHandler)

    // Resize handler
    const resizeHandler = () => {
      setTimeout(() => {
        calculatePath()
        updatePathProgress()
      }, 100)
    }
    window.addEventListener('resize', resizeHandler)

    // Step animations
    const triggers: ScrollTrigger[] = []
    journeySteps.forEach((step) => {
      const section = document.getElementById(`step-${step.id}-section`)
      const stepElement = document.getElementById(`step-${step.id}`)
      if (!section || !stepElement) return

      const stepNode = stepElement.querySelector('.step-node') as HTMLElement
      const stepContent = stepElement.querySelector('.step-content') as HTMLElement

      const trigger = ScrollTrigger.create({
        trigger: section,
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
      triggers.forEach(trigger => trigger.kill())
    }
  }, [])

  return (
    <section ref={sectionRef} id="journey-container" className="relative bg-paper border-b border-grid/20">
      {/* Hero Section */}
      <div className="h-screen min-h-[700px] flex items-center justify-center px-8 snap-start">
        <div className="text-center max-w-4xl">
          <h1 className="typography-display-lg text-forest mb-8">
            One AI Workflow<br />
            <span className="text-coral">
              From Discovery To Submission
            </span>
          </h1>
          <p className="typography-body-lg text-grid mb-12">Scroll to explore the journey</p>
          <div className="animate-bounce">
            <Icon icon="lucide:chevron-down" className="w-8 h-8 mx-auto text-grid/60" />
          </div>
        </div>
      </div>

      {/* SVG Canvas - dynamically sized */}
      <svg
        ref={svgRef}
        className="absolute left-0 top-0 w-full pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#9e4225', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#fe8b69', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#9e4225', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          d=""
          stroke="url(#lineGradient)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          style={{ opacity: 0.8 }}
        />
      </svg>

      {/* Journey Steps */}
      <div className="relative" style={{ zIndex: 2 }}>
        {journeySteps.map((step) => (
          <div
            key={step.id}
            id={`step-${step.id}-section`}
            className="h-screen min-h-[900px] flex items-center snap-start"
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
                    <div className="step-node mr-8 md:mr-12 w-6 h-6 md:w-8 md:h-8 bg-coral rounded-none ring-8 ring-coral/20 flex-shrink-0 relative z-10 opacity-0 scale-50" />
                    <div className="step-content text-left opacity-0">
                      <div className="inline-block">
                        <div className="typography-technical-sm text-coral mb-2 tracking-wider uppercase">
                          STEP {step.number}
                        </div>
                        <h2 className="typography-headline-md text-forest mb-4 tracking-tight">
                          {step.title}
                        </h2>
                        <p className="typography-body-md text-grid max-w-md leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="step-content text-right opacity-0">
                      <div className="inline-block">
                        <div className="typography-technical-sm text-coral mb-2 tracking-wider uppercase">
                          STEP {step.number}
                        </div>
                        <h2 className="typography-headline-md text-forest mb-4 tracking-tight">
                          {step.title}
                        </h2>
                        <p className="typography-body-md text-grid max-w-md leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    <div className="step-node ml-8 md:ml-12 w-6 h-6 md:w-8 md:h-8 bg-coral rounded-none ring-8 ring-coral/20 flex-shrink-0 relative z-10 opacity-0 scale-50" />
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Section */}
      <div
        id="journey-footer"
        className="h-screen min-h-[700px] flex items-center justify-center relative snap-start"
        style={{ zIndex: 2 }}
      >
        <div className="text-center">
          <h2 className="typography-display-lg text-forest mb-4 tracking-tight">
            Ready to Start?
          </h2>
          <p className="typography-body-lg text-grid mb-8">
            Your AI-powered hackathon journey awaits
          </p>
          <a
            href="#deploy"
            className="inline-block jetbrains text-[10px] uppercase px-8 py-4 bg-gradient-to-r from-coral to-gold text-white font-semibold rounded-none hover:shadow-xl transition-shadow duration-300"
          >
            Begin Your Journey
          </a>
        </div>
      </div>
    </section>
  )
}