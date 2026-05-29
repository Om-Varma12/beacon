import { useEffect, useRef, useState } from 'react'
import './App.css'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { StickyContentSwitch } from './components/ProblemSection'
import { ScrollJourney } from './components/ScrollJourney'
import { BentoGrid } from './components/BentoGrid'
import { FormCTA } from './components/FormCTA'
import { Testimonials } from './components/Testimonials'
import { Footer } from './components/Footer'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showNavbar, setShowNavbar] = useState(true)
  const lastScrollTop = useRef(0)
  const autoHideTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop

      // Clear any existing auto-hide timer
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current)
      }

      if (scrollTop <= 10) {
        // At the very top - always show
        setShowNavbar(true)
      } else if (scrollTop > lastScrollTop.current) {
        // Scrolling down - hide immediately
        setShowNavbar(false)
      } else {
        // Scrolling up - show
        setShowNavbar(true)

        // Auto-hide after 1.5 seconds of scroll inactivity
        autoHideTimerRef.current = window.setTimeout(() => {
          setShowNavbar(false)
        }, 1500)
      }
      lastScrollTop.current = scrollTop
    }

    container.addEventListener('scroll', handleScroll)
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current)
      }
    }
  }, [])

  return (
    <>
      <div className="mosaic-bg" />
      <div ref={containerRef} className="relative z-10 h-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory">
        <Navbar visible={showNavbar} />
        <Hero />
        <StickyContentSwitch />
        <ScrollJourney />
        <BentoGrid />
        <FormCTA />
        <Testimonials />
        <Footer />
      </div>
    </>
  )
}

export default App