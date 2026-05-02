export function Hero() {
  return (
    <section className="min-h-screen pt-32 pb-24 border-b border-grid/20 snap-start flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-2 gap-16 items-center">
          {/* Left: Typography */}
          <div>

            <h1 className="space-grotesk text-8xl font-bold tracking-tight leading-[0.9] text-forest mb-8">
              Autonomous<br />
              Hackathon<br />
              Intelligence
            </h1>

            <div className="flex items-start gap-3 mb-12">
              <div className="w-px h-16 bg-forest" />
              <p className="jetbrains text-sm uppercase tracking-wider text-grid leading-relaxed max-w-md">
                Multi-agent system for discovery, analysis, and submission generation
              </p>
            </div>

            <div className="flex items-center gap-4">
              <a href="#deploy" className="jetbrains text-[10px] uppercase px-6 py-3 bg-forest text-white hover:bg-coral transition-all">
                Deploy Agent
              </a>
              <a href="#learn" className="jetbrains text-[10px] uppercase px-6 py-3 border border-forest text-forest hover:bg-forest hover:text-white transition-all">
                View Docs
              </a>
            </div>
          </div>

          {/* Right: Abstract Wireframe */}
          <div className="flex justify-end">
            <div className="relative w-80 h-80 border border-forest flex items-center justify-center">
              {/* Dashed Circular Orbit */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320">
                <circle cx="160" cy="160" r="120" fill="none" stroke="#1A3C2B" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                <circle cx="160" cy="160" r="80" fill="none" stroke="#1A3C2B" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                <line x1="0" y1="160" x2="320" y2="160" stroke="#3A3A38" strokeWidth="1" opacity="0.2" />
                <line x1="160" y1="0" x2="160" y2="320" stroke="#3A3A38" strokeWidth="1" opacity="0.2" />
              </svg>

              {/* Central Node */}
              <div className="relative w-4 h-4 bg-forest z-10" />

              {/* Luminosity Image Overlay */}
              <img
                src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop"
                alt="Technical"
                className="absolute inset-8 w-64 h-64 object-cover img-luminosity"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}