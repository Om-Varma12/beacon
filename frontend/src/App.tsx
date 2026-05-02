import './App.css'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { StickyContentSwitch } from './components/ProblemSection'
import { BentoGrid } from './components/BentoGrid'
import { FormCTA } from './components/FormCTA'
import { Testimonials } from './components/Testimonials'
import { Footer } from './components/Footer'

function App() {
  return (
    <>
      <div className="mosaic-bg" />
      <div className="relative z-10 h-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory">
        <Navbar />
        <Hero />
        <StickyContentSwitch />
        <BentoGrid />
        <FormCTA />
        <Testimonials />
        <Footer />
      </div>
    </>
  )
}

export default App