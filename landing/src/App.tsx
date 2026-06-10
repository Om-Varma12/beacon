import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import './App.css'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { StickyContentSwitch } from './components/ProblemSection'
import { BehindTheIntelligence } from './components/behind-the-intelligence'
import { ScrollJourney } from './components/ScrollJourney'
// import { BentoGrid } from './components/BentoGrid'
// import { FormCTA } from './components/FormCTA'
// import { Testimonials } from './components/Testimonials'
import FAQ from './components/FAQ'
import { RegisterSection } from './components/RegisterSection'
import { Footer } from './components/Footer'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ container: containerRef })
  const smoothScrollProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.35,
  })
  const scannerY = useTransform(smoothScrollProgress, [0, 1], ['12vh', '88vh'])


  return (
    <>
      <div className="mosaic-bg" />
      <motion.div
        className="fixed left-0 top-0 z-[60] h-px origin-left bg-coral"
        style={{ scaleX: smoothScrollProgress }}
      />
      <motion.div
        className="pointer-events-none fixed right-4 z-[60] hidden h-8 w-px bg-forest/50 md:block"
        style={{ top: scannerY }}
      />
      <div ref={containerRef} className="alive-scroll-container relative z-10 h-screen overflow-y-auto overflow-x-hidden">
        <motion.div
          className="alive-scroll-content"
          initial={shouldReduceMotion ? false : { opacity: 0.96 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Navbar />
          <Hero />
          <StickyContentSwitch />
          <BehindTheIntelligence />
          <ScrollJourney />
          {/* <BentoGrid />
          <FormCTA />
          <Testimonials /> */}
          <RegisterSection />
          <FAQ />
          <Footer />
        </motion.div>
      </div>
    </>
  )
}

export default App
