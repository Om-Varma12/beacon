import { Icon } from '@iconify/react'

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-paper border-b border-grid/20 z-50">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="w-8 h-8 bg-forest flex items-center justify-center">
          <Icon icon="lucide:zap" className="text-white text-sm" />
        </a>

        {/* Center Navigation */}
        <div className="flex items-center gap-8">
          <a href="#products" className="jetbrains text-[10px] uppercase tracking-wider text-forest hover:text-coral transition-colors">
            Products
          </a>
          <a href="#features" className="jetbrains text-[10px] uppercase tracking-wider text-forest hover:text-coral transition-colors">
            Features
          </a>
          <a href="#pricing" className="jetbrains text-[10px] uppercase tracking-wider text-forest hover:text-coral transition-colors">
            Pricing
          </a>
          <a href="#docs" className="jetbrains text-[10px] uppercase tracking-wider text-forest hover:text-coral transition-colors">
            Docs
          </a>
        </div>

        {/* Right Buttons */}
        <div className="flex items-center gap-4">
          <a href="#signin" className="jetbrains text-[10px] uppercase px-4 py-2 border border-forest text-forest hover:bg-forest hover:text-white transition-all">
            Sign In
          </a>
          <a href="#start" className="jetbrains text-[10px] uppercase px-4 py-2 bg-forest text-white hover:bg-coral transition-all">
            Get Started
          </a>
        </div>
      </div>
    </nav>
  )
}