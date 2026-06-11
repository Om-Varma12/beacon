import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import Image from 'next/image'

export function Hero() {
  const [scrollTop, setScrollTop] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const logoRef = useRef<HTMLDivElement>(null)
  const lastAngle = useRef(0)

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Track scroll position for continuous scaling (desktop only)
  useEffect(() => {
    if (isMobile) return
    const container = document.querySelector('.alive-scroll-container') || window

    const handleScroll = () => {
      const currentScrollTop = container === window
        ? window.scrollY
        : (container as HTMLElement).scrollTop
      setScrollTop(currentScrollTop)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [isMobile])

  // 0px scroll -> scale 1.00; 800px scroll -> scale 0.92
  const scrollScale = Math.max(0.92, 1.00 - (scrollTop / 800) * 0.08)

  // Mouse Parallax value (Z-axis rotation only — desktop)
  const mouseRotate = useMotionValue(0)
  const springRotate = useSpring(mouseRotate, { stiffness: 150, damping: 20 })

  useEffect(() => {
    if (isMobile) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!logoRef.current) return

      const rect = logoRef.current.getBoundingClientRect()
      const logoCenterX = rect.left + rect.width / 2
      const logoCenterY = rect.top + rect.height / 2

      const dx = e.clientX - logoCenterX
      const dy = e.clientY - logoCenterY

      const theta = Math.atan2(dy, dx)
      const thetaDegrees = theta * (180 / Math.PI)
      const targetAngle = thetaDegrees + 90

      let diff = targetAngle - (lastAngle.current % 360)
      if (diff > 180) diff -= 360
      if (diff < -180) diff += 360

      const nextAngle = lastAngle.current + diff
      mouseRotate.set(nextAngle)
      lastAngle.current = nextAngle
    }

    const handleMouseLeave = () => {
      let diff = 0 - (lastAngle.current % 360)
      if (diff > 180) diff -= 360
      if (diff < -180) diff += 360

      const nextAngle = lastAngle.current + diff
      mouseRotate.set(nextAngle)
      lastAngle.current = nextAngle
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isMobile, mouseRotate])

  return (
    <section className="min-h-screen pt-24 md:pt-32 pb-16 md:pb-24 border-b border-grid/20 flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Mobile: single column. Desktop: two-column grid */}
        <div className="flex flex-col md:grid md:grid-cols-2 md:gap-16 md:items-center">
          {/* Text column */}
          <div>
            <h1 className="typography-display-xl text-forest mb-6 md:mb-8 text-5xl md:text-[96px]">
              Autonomous<br />
              Hackathon<br />
              Intelligence
            </h1>

            <div className="flex items-start gap-3 mb-8 md:mb-12">
              <div className="w-px h-10 md:h-12 bg-forest flex-shrink-0" />
              <p className="typography-technical-label text-grid leading-relaxed max-w-md text-[11px] md:text-[12px]">
                Multi-agent system for discovery, analysis, and submission generation
              </p>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              <a
                href="#waitlist"
                className="jetbrains text-[10px] uppercase px-5 md:px-6 py-3 border border-forest text-forest bg-transparent hover:bg-forest hover:text-white transition-all"
              >
                Find Opportunities
              </a>
              <a
                href="#waitlist"
                className="jetbrains text-[10px] uppercase px-5 md:px-6 py-3 border border-forest text-forest bg-transparent hover:bg-forest hover:text-white transition-all"
              >
                Explore Beacon
              </a>
            </div>
          </div>

          {/* Logo column — hidden on mobile, visible on desktop */}
          <div className="hidden md:flex justify-end items-center select-none">
            {/* Layer 1: Scroll Scale */}
            <motion.div style={{ scale: scrollScale }}>
              {/* Layer 2: Mouse Parallax (Z-Axis Rotation only) */}
              <motion.div ref={logoRef} style={{ rotate: springRotate }}>
                {/* Layer 3: Entrance Animation */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15, duration: 0.9 }}
                >
                  {/* Layer 4: Infinite Floating Motion */}
                  <motion.div
                    animate={{ y: [-6, 6, -6] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {/* Layer 5: Beacon Pulse */}
                    <motion.div
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Image
                        src="/logo.png"
                        alt="Beacon Logo"
                        width={320}
                        height={320}
                        className="object-contain select-none pointer-events-none"
                        priority
                      />
                    </motion.div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}