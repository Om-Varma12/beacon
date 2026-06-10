import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface NavbarProps {
  visible?: boolean
}

export function Navbar({ visible = true }: NavbarProps) {
  const [compressed, setCompressed] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    let container: Element | Window = document.querySelector('.alive-scroll-container') || window

    const handleScroll = () => {
      const currentScrollY = container === window 
        ? window.scrollY 
        : (container as HTMLElement).scrollTop

      if (currentScrollY <= 100) {
        setCompressed(false)
      } else {
        if (currentScrollY > lastScrollY.current) {
          // Scrolling down -> Compress
          setCompressed(true)
        } else if (currentScrollY < lastScrollY.current) {
          // Scrolling up -> Expand immediately
          setCompressed(false)
        }
      }
      lastScrollY.current = currentScrollY
    }

    // Attempt to hook into the custom scroll container if it mounts slightly later
    if (container === window) {
      const timer = setTimeout(() => {
        const found = document.querySelector('.alive-scroll-container')
        if (found) {
          container.removeEventListener('scroll', handleScroll)
          container = found
          container.addEventListener('scroll', handleScroll, { passive: true })
          handleScroll()
        }
      }, 100)

      container.addEventListener('scroll', handleScroll, { passive: true })
      return () => {
        clearTimeout(timer)
        container.removeEventListener('scroll', handleScroll)
      }
    } else {
      container.addEventListener('scroll', handleScroll, { passive: true })
      return () => {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  const springConfig = { type: 'spring' as const, stiffness: 220, damping: 26 }

  const navVariants = {
    expanded: {
      height: 80,
      backgroundColor: 'rgba(252, 249, 246, 0.75)',
      borderBottomColor: 'rgba(58, 58, 56, 0.1)',
      transition: springConfig
    },
    compressed: {
      height: 56,
      backgroundColor: 'rgba(252, 249, 246, 0.92)',
      borderBottomColor: 'rgba(58, 58, 56, 0.2)',
      transition: springConfig
    }
  }

  const logoImageVariants = {
    expanded: {
      scale: 1,
      x: 0,
      transition: springConfig
    },
    compressed: {
      scale: 0.75,
      x: -6,
      transition: springConfig
    }
  }

  const wordmarkVariants = {
    expanded: {
      opacity: 1,
      width: 150,
      marginLeft: 12,
      transition: springConfig
    },
    compressed: {
      opacity: 0,
      width: 0,
      marginLeft: 0,
      transition: springConfig
    }
  }

  const navLinksContainerVariants = {
    expanded: {
      gap: '16px',
      transition: springConfig
    },
    compressed: {
      gap: '8px',
      transition: springConfig
    }
  }

  return (
    <motion.nav
      initial="expanded"
      animate={compressed ? 'compressed' : 'expanded'}
      variants={navVariants}
      className={`fixed top-0 left-0 right-0 border-b z-50 backdrop-blur-md transition-transform duration-300 ease-in-out transform ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
        {/* Logo and Wordmark */}
        <a href="#" className="flex items-center h-full">
          <div className="flex items-center origin-left">
            {/* Logo Image */}
            <motion.img
              src="/logo.png"
              alt="Logo"
              variants={logoImageVariants}
              className="w-8 h-8 object-contain flex-shrink-0"
            />

            {/* Wordmark */}
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

        {/* Right Buttons */}
        <motion.div
          variants={navLinksContainerVariants}
          className="flex items-center"
        >
          <a
            href="#signin"
            className="jetbrains text-[10px] uppercase px-4 py-2 border border-forest text-forest bg-transparent hover:bg-forest hover:text-white transition-all select-none"
          >
            Sign In
          </a>
          <a
            href="#start"
            className="jetbrains text-[10px] uppercase px-4 py-2 border border-forest text-forest bg-transparent hover:bg-forest hover:text-white transition-all select-none"
          >
            Get Started
          </a>
        </motion.div>
      </div>
    </motion.nav>
  )
}