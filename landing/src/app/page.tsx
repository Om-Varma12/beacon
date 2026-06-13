'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { StickyContentSwitch } from '../components/ProblemSection';
import { BehindTheIntelligence } from '../components/behind-the-intelligence';
import { ScrollJourney } from '../components/ScrollJourney';
// import { BentoGrid } from '../components/BentoGrid';
// import { FormCTA } from '../components/FormCTA';
// import { Testimonials } from '../components/Testimonials';
import FAQ from '../components/FAQ';
import { RegisterSection } from '../components/RegisterSection';
import { Footer } from '../components/Footer';

export default function Home() {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothScrollProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.35,
  });
  const scannerY = useTransform(smoothScrollProgress, [0, 1], ['12vh', '88vh']);

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    return scrollYProgress.onChange((v) => {
      setShowScrollTop(v > 0.05);
    });
  }, [scrollYProgress]);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      
      <motion.button
        onClick={handleScrollToTop}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: showScrollTop ? 1 : 0, scale: showScrollTop ? 1 : 0.8 }}
        transition={{ duration: 0.2 }}
        className={`fixed bottom-6 right-5 md:bottom-8 md:right-8 z-[70] flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-forest text-paper shadow-lg hover:bg-forest/90 transition-colors ${showScrollTop ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-label="Scroll to top"
      >
        <Icon icon="lucide:arrow-up" width={20} color="white"/>
      </motion.button>

      <div className="alive-scroll-container relative z-10">
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
  );
}
