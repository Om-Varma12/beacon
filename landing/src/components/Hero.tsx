export function Hero() {
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

          {/* Right: Abstract Wireframe */}
          <div className="flex justify-end">
            <div className="relative w-80 h-80 border border-forest flex items-center justify-center">
              {/* Concentric Square Orbits */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320">
                <rect x="40" y="40" width="240" height="240" fill="none" stroke="#022617" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                <rect x="80" y="80" width="160" height="160" fill="none" stroke="#022617" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                <line x1="0" y1="160" x2="320" y2="160" stroke="#3a3a38" strokeWidth="1" opacity="0.2" />
                <line x1="160" y1="0" x2="160" y2="320" stroke="#3a3a38" strokeWidth="1" opacity="0.2" />
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