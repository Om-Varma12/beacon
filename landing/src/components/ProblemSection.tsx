import { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const problems = [
  {
    id: 1,
    title: 'Endless Hackathon Hunting',
    description: 'The "Discovery Fatigue." Scrolling through Devfolio, Unstop, and Devpost for hours, comparing prizes instead of problems. You haven\'t even started, and you\'re already exhausted.',
    icon: 'lucide:search',
    number: '01',
    tags: ['#DiscoveryDebt', '#LeadLoss'],
    stat: '6+ hours wasted',
    color: 'coral'
  },
  {
    id: 2,
    title: 'Analysis Paralysis',
    description: 'Five tracks, four team members, zero decisions. You spend the first night debating tech stacks and niche problem statements while other teams are already pushing their first commit.',
    icon: 'lucide:puzzle',
    number: '02',
    tags: ['#DecisionDebt'],
    stat: '30% time lost',
    color: 'mint'
  },
  {
    id: 3,
    title: 'The Alignment Gap',
    description: 'You build a technical masterpiece that completely misses the judge\'s criteria. High-quality code for the wrong problem statement is still a losing project.',
    icon: 'lucide:target',
    number: '03',
    tags: ['#AlignmentGap'],
    stat: '87% misalignment',
    color: 'gold'
  },
  {
    id: 4,
    title: 'PPT Panic Attack',
    description: 'Submission is in 30 minutes. You\'re still screen-recording your buggy demo and wrestling with Canva. The presentation shouldn\'t be the hardest part of the hack.',
    icon: 'lucide:presentation',
    number: '04',
    tags: ['#PresentationDebt'],
    stat: '4.2 hours avg',
    color: 'coral'
  },
  {
    id: 5,
    title: 'Time Hemorrhage',
    description: 'The clock is your enemy, not the code. Most teams lose because they mismanage the most finite resource: 36 hours. You lost before you even typed `npm install`.',
    icon: 'lucide:clock',
    number: '05',
    tags: ['#TimeDebt'],
    stat: '49% wasted',
    color: 'mint'
  }
]

const content = [
  {
    heading: 'Hackathons are <span class="text-coral">broken</span> by design.',
    description: "The first 12 hours of every build are usually lost to chaos. We're fixing the friction points that kill great projects before they even start.",
    badge: 'The Hard Truth',
    stat: '49% Time Wasted'
  },
  {
    heading: 'Decision fatigue is a <span class="text-coral">silent killer.</span>',
    description: "Teams spend 30% of their total hackathon time just deciding what to build. That's time you could be using to iterate on your core product.",
    badge: 'Analysis Paralysis',
    stat: '30% Time Lost'
  },
  {
    heading: 'Great code <span class="text-coral">isn\'t enough</span> anymore.',
    description: "Alignment with track sponsors and problem statements is the difference between a 'cool project' and a winning submission.",
    badge: 'The Alignment Gap',
    stat: '87% Misalignment'
  },
  {
    heading: 'Design is the <span class="text-coral">final bottleneck.</span>',
    description: "You can build a rocket, but if the pitch deck looks like a 2005 PowerPoint, the judges won't board it.",
    badge: 'Presentation Debt',
    stat: '4.2 Hours Avg'
  },
  {
    heading: 'Your time is your <span class="text-coral">leverage.</span>',
    description: "Stop bleeding hours on manual processes. Beacon automates the hunt so you can focus on the heart of your project.",
    badge: 'Time Hemorrhage',
    stat: '49% Wasted'
  }
]

const colorMap = {
  coral: 'bg-coral',
  mint: 'bg-mint',
  gold: 'bg-gold'
}

const iconColorMap = {
  coral: 'text-coral',
  mint: 'text-mint',
  gold: 'text-gold'
}

// ─── Mobile: Plain stacked cards ──────────────────────────────────────────────
function MobileProblemCards() {
  return (
    <section className="bg-primary-container border-b border-white/10 py-16 px-6">
      <div className="mb-10">
        <span className="typography-technical-sm text-white/50">THE HARD TRUTH</span>
        <h2 className="typography-display-lg text-white mt-2 text-4xl leading-tight">
          Hackathons are <span className="text-coral">broken</span> by design.
        </h2>
      </div>

      <div className="flex flex-col gap-5">
        {problems.map((problem) => (
          <div
            key={problem.id}
            className="bg-white/5 border border-white/10 p-6 relative"
          >
            <div className="absolute top-4 right-4 typography-technical-sm text-white/30">
              ID // 01-0{problem.id}
            </div>

            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <div className={`w-10 h-10 border border-white/15 bg-white/5 flex items-center justify-center ${iconColorMap[problem.color as keyof typeof iconColorMap]} relative`}>
                  <Icon icon={problem.icon} width={18} />
                  <div className={`absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center text-[8px] font-bold text-black ${colorMap[problem.color as keyof typeof colorMap]}`}>
                    {problem.number}
                  </div>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <h3 className="space-grotesk text-lg font-bold text-white">{problem.title}</h3>
                <p className="text-sm text-white/70 leading-relaxed">{problem.description}</p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {problem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="typography-technical-sm px-2 py-0.5 bg-white/5 border border-white/10 text-white/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Icon icon="lucide:bar-chart-2" width={12} className="text-white/40" />
                  <span className="typography-technical-sm text-white/50">{problem.stat}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Desktop: Sticky two-column ───────────────────────────────────────────────
function DesktopStickySwitch() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const badgeRef = useRef<HTMLSpanElement>(null)
  const statRef = useRef<HTMLSpanElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    const heading = headingRef.current
    const description = descriptionRef.current
    const badge = badgeRef.current
    const stat = statRef.current

    if (!section || !heading || !description || !badge || !stat) return

    const scroller = section.closest('.overflow-y-auto') as HTMLElement
    if (!scroller) return

    let currentIndex = -1

    const swapContent = (index: number) => {
      if (currentIndex === index) return
      currentIndex = index
      setActiveIndex(index)

      gsap.to([heading, description, badge, stat], {
        opacity: 0,
        y: -10,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
          heading.innerHTML = content[index].heading
          description.textContent = content[index].description
          badge.textContent = content[index].badge
          stat.textContent = content[index].stat
          gsap.to([heading, description, badge, stat], {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: 'power2.out'
          })
        }
      })
    }

    const cardElements = section.querySelectorAll('.problem-card')
    cardElements.forEach((card, index) => {
      ScrollTrigger.create({
        trigger: card as HTMLElement,
        scroller: scroller,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => swapContent(index),
        onEnterBack: () => swapContent(index)
      })
    })

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [])

  const currentProblem = problems[activeIndex]

  return (
    <section ref={sectionRef} data-scroll-corridor="true" className="relative bg-primary-container border-b border-white/10">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-2 gap-16">
          {/* Left Sticky Column */}
          <div className="sticky top-0 h-screen flex flex-col justify-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 border border-white/20 px-3 py-1.5 bg-white/5">
                <div className={`w-2 h-2 ${colorMap[currentProblem.color as keyof typeof colorMap]}`} />
                <span ref={badgeRef} className="typography-technical-sm text-white">
                  {content[0].badge}
                </span>
              </div>

              <h2
                ref={headingRef}
                className="typography-display-lg text-white"
                dangerouslySetInnerHTML={{ __html: content[0].heading }}
              />

              <p ref={descriptionRef} className="typography-body-lg text-white/70 leading-relaxed max-w-md">
                {content[0].description}
              </p>

              <div className="bg-white/5 border border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="typography-technical-sm text-white/50">Impact</p>
                    <p className="space-grotesk text-2xl font-bold text-white mt-1">
                      {currentProblem.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <span ref={statRef} className="space-grotesk text-3xl font-bold text-gold">
                      {content[0].stat}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-white/50">
                <div className="flex -space-x-1">
                  <div className="flex h-8 w-8 items-center justify-center border border-primary-container bg-white text-[10px] font-bold text-black jetbrains">JD</div>
                  <div className="flex h-8 w-8 items-center justify-center border border-primary-container bg-zinc-700 text-[10px] font-bold jetbrains">AS</div>
                  <div className="flex h-8 w-8 items-center justify-center border border-primary-container bg-zinc-600 text-[10px] font-bold text-white jetbrains">+50</div>
                </div>
                <p className="typography-technical-sm italic">Join 5k+ hackers optimized by Beacon</p>
              </div>
            </div>
          </div>

          {/* Right Column — scrollable cards */}
          <div>
            {problems.map((problem) => (
              <div
                key={problem.id}
                className="problem-card min-h-screen flex items-center justify-center py-8"
              >
                <div className="bg-white/5 border border-white/10 p-8 w-full max-w-lg hover:border-white/30 transition-all relative">
                  <div className="absolute top-4 right-4 typography-technical-sm text-white/40">
                    ID // 01-0{problem.id}
                  </div>
                  <div className="flex flex-col gap-6">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        <div className={`w-12 h-12 border border-white/15 bg-white/5 flex items-center justify-center ${iconColorMap[problem.color as keyof typeof iconColorMap]} relative`}>
                          <Icon icon={problem.icon} width={20} />
                          <div className={`absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center text-[8px] font-bold text-black ${colorMap[problem.color as keyof typeof colorMap]}`}>
                            {problem.number}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="space-grotesk text-xl font-bold text-white">{problem.title}</h3>
                        <p className="typography-body-md text-white/70">{problem.description}</p>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {problem.tags.map((tag) => (
                            <span key={tag} className="typography-technical-sm px-2 py-0.5 bg-white/5 border border-white/10 text-white/60">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Icon icon="lucide:bar-chart-2" width={14} className="text-white/40" />
                          <span className="typography-technical-sm text-white/50">{problem.stat}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Export: picks layout by screen size ──────────────────────────────────────
export function StickyContentSwitch() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return isMobile ? <MobileProblemCards /> : <DesktopStickySwitch />
}
