import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'

interface NavbarProps {
  visible?: boolean
}

export function Navbar({ visible = true }: NavbarProps) {
  const [compressed, setCompressed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY <= 100) {
        setCompressed(false)
      } else {
        if (currentScrollY > lastScrollY.current) {
          setCompressed(true)
        } else if (currentScrollY < lastScrollY.current) {
          setCompressed(false)
        }
      }
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Close mobile menu on scroll
  useEffect(() => {
    if (!mobileOpen) return
    const handleScroll = () => setMobileOpen(false)
    window.addEventListener('scroll', handleScroll, { passive: true, once: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [mobileOpen])

  const springConfig = { type: 'spring' as const, stiffness: 220, damping: 26 }

  const navVariants = {
    expanded: {
      height: 64,
      backgroundColor: 'rgba(252, 249, 246, 0.75)',
      borderBottomColor: 'rgba(58, 58, 56, 0.1)',
      transition: springConfig
    },
    compressed: {
      height: 48,
      backgroundColor: 'rgba(252, 249, 246, 0.92)',
      borderBottomColor: 'rgba(58, 58, 56, 0.2)',
      transition: springConfig
    }
  }

  const logoImageVariants = {
    expanded: { scale: 1, x: 0, transition: springConfig },
    compressed: { scale: 0.75, x: -6, transition: springConfig }
  }

  const wordmarkVariants = {
    expanded: { opacity: 1, width: 150, marginLeft: 12, transition: springConfig },
    compressed: { opacity: 0, width: 0, marginLeft: 0, transition: springConfig }
  }

  const navLinksContainerVariants = {
    expanded: { gap: '16px', transition: springConfig },
    compressed: { gap: '8px', transition: springConfig }
  }

  return (
    <>
      <motion.nav
        initial="expanded"
        animate={compressed ? 'compressed' : 'expanded'}
        variants={navVariants}
        className={`fixed top-0 left-0 right-0 border-b z-50 backdrop-blur-md transition-transform duration-300 ease-in-out transform ${
          visible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 h-full flex items-center justify-between">
          {/* Logo and Wordmark */}
          <a href="#" className="flex items-center h-full">
            <div className="flex items-center origin-left">
              <motion.img
                src="/logo.png"
                alt="Logo"
                variants={logoImageVariants}
                className="w-8 h-8 object-contain flex-shrink-0"
              />
              <motion.div
                variants={wordmarkVariants}
                className="overflow-hidden flex items-center h-full select-none"
              >
                <span className="space-grotesk text-xl font-bold tracking-widest text-[rgb(24,24,24)] uppercase">
                  BEACON
                </span>
              </motion.div>
            </div>
          </a>

          {/* Desktop Buttons */}
          <motion.div
            variants={navLinksContainerVariants}
            className="hidden md:flex items-center"
          >
            <a
              href="#waitlist"
              className="jetbrains text-[10px] uppercase px-4 py-2 border border-forest text-forest bg-transparent hover:bg-forest hover:text-white transition-all select-none"
            >
              Sign In
            </a>
            <a
              href="#waitlist"
              className="jetbrains text-[10px] uppercase px-4 py-2 border border-forest text-forest bg-transparent hover:bg-forest hover:text-white transition-all select-none"
            >
              Get Started
            </a>
          </motion.div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 text-forest"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <Icon icon={mobileOpen ? 'lucide:x' : 'lucide:menu'} width={22} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-[64px] left-0 right-0 z-40 bg-paper/95 backdrop-blur-md border-b border-grid/20 flex flex-col px-6 py-8 gap-4 md:hidden"
          >
            <a
              href="#waitlist"
              onClick={() => setMobileOpen(false)}
              className="jetbrains text-[11px] uppercase px-6 py-4 border border-forest text-forest bg-transparent text-center hover:bg-forest hover:text-white transition-all"
            >
              Sign In
            </a>
            <a
              href="#waitlist"
              onClick={() => setMobileOpen(false)}
              className="jetbrains text-[11px] uppercase px-6 py-4 bg-forest text-white border border-forest text-center hover:bg-forest/80 transition-all"
            >
              Get Started
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}