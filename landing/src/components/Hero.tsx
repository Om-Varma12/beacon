import { useState, useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export function Hero() {
  const [scrollTop, setScrollTop] = useState(0)

  // Track scroll position of the custom scroll container for continuous scaling
  useEffect(() => {
    const container = document.querySelector('.alive-scroll-container') || window

    const handleScroll = () => {
      const currentScrollTop = container === window
        ? window.scrollY
        : (container as HTMLElement).scrollTop
      setScrollTop(currentScrollTop)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // 0px scroll -> scale 1.00; 800px scroll -> scale 0.92
  const scrollScale = Math.max(0.92, 1.00 - (scrollTop / 800) * 0.08)

  // Mouse Parallax value (Z-axis rotation only)
  const mouseRotate = useMotionValue(0)

  // Spring animation for smooth lag-free tracking without snap jumps
  const springRotate = useSpring(mouseRotate, { stiffness: 150, damping: 20 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth } = window
      const centerX = innerWidth / 2
      
      const dx = (e.clientX - centerX) / centerX // range -1 to 1

      mouseRotate.set(dx * 60)  // rotate up to 60 degrees towards cursor
    }

    const handleMouseLeave = () => {
      mouseRotate.set(0)
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [mouseRotate])

  return (
    <section className="min-h-screen pt-32 pb-24 border-b border-grid/20 flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-2 gap-16 items-center">
          {/* Left: Typography */}
          <div>
            <h1 className="typography-display-xl text-forest mb-8">
              Autonomous<br />
              Hackathon<br />
              Intelligence
            </h1>

            <div className="flex items-start gap-3 mb-12">
              <div className="w-px h-12 bg-forest" />
              <p className="typography-technical-label text-grid leading-relaxed max-w-md">
                <br></br>Multi-agent system for discovery, analysis, and submission generation<br></br>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <a href="#deploy" className="jetbrains text-[10px] uppercase px-6 py-3 border border-forest text-forest bg-transparent hover:bg-forest hover:text-white transition-all">
                Deploy Agent
              </a>
              <a href="#learn" className="jetbrains text-[10px] uppercase px-6 py-3 border border-forest text-forest bg-transparent hover:bg-forest hover:text-white transition-all">
                View Docs
              </a>
            </div>
          </div>

          {/* Right: Centerpiece Animated Logo */}
          <div className="flex justify-end items-center select-none">
            {/* Layer 1: Scroll Scale */}
            <motion.div style={{ scale: scrollScale }}>
              {/* Layer 2: Mouse Parallax (Z-Axis Rotation only) */}
              <motion.div style={{ rotate: springRotate }}>
                {/* Layer 3: Entrance Animation */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 100, damping: 15, duration: 0.9 }}
                >
                  {/* Layer 4: Infinite Floating Motion */}
                  <motion.div
                    animate={{ y: [-6, 6, -6] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {/* Layer 5: Beacon Pulse */}
                    <motion.div
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <img
                        src="/logo.png"
                        alt="Beacon Logo"
                        className="w-72 h-72 object-contain select-none pointer-events-none"
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