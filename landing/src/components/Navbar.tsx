import { Icon } from '@iconify/react'

interface NavbarProps {
  visible?: boolean
}

export function Navbar({ visible = true }: NavbarProps) {
  return (
    <nav className={`fixed top-0 left-0 right-0 bg-paper border-b border-grid/20 z-50 transition-transform duration-300 ease-in-out transform ${
      visible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="w-8 h-8 bg-forest flex items-center justify-center">
          <Icon icon="lucide:zap" className="text-white text-sm" />
        </a>

        {/* Center Navigation
        <div className="flex items-center gap-8">
          <a href="#products" className="jetbrains text-[10px] uppercase tracking-wider text-forest hover:text-coral transition-colors">
            01 // PRODUCTS
          </a>
          <a href="#features" className="jetbrains text-[10px] uppercase tracking-wider text-forest hover:text-coral transition-colors">
            02 // FEATURES
          </a>
          <a href="#pricing" className="jetbrains text-[10px] uppercase tracking-wider text-forest hover:text-coral transition-colors">
            03 // PRICING
          </a>
          <a href="#docs" className="jetbrains text-[10px] uppercase tracking-wider text-forest hover:text-coral transition-colors">
            04 // DOCS
          </a>
        </div> */}

        {/* Right Buttons */}
        <div className="flex items-center gap-4">
          <a href="#signin" className="jetbrains text-[10px] uppercase px-4 py-2 border border-forest text-forest bg-transparent hover:bg-forest hover:text-white transition-all">
            Sign In
          </a>
          <a href="#start" className="jetbrains text-[10px] uppercase px-4 py-2 border border-forest text-forest bg-transparent hover:bg-forest hover:text-white transition-all">
            Get Started
          </a>
        </div>
      </div>
    </nav>
  )
}