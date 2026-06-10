export function FormCTA() {
  return (
    <section className="min-h-screen py-24 flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12 text-center">
            <span className="typography-technical-label text-grid">03 // DEPLOY YOUR AGENT</span>
            <h2 className="typography-headline-md text-forest mt-4">Start Your First Mission</h2>
          </div>

          <div className="relative bg-paper border border-grid/20 p-12 rounded-none">
            {/* Corner Markers */}
            <div className="corner-marker corner-tl" />
            <div className="corner-marker corner-tr" />
            <div className="corner-marker corner-bl" />
            <div className="corner-marker corner-br" />

            <form className="space-y-6">
              <div>
                <label className="typography-technical-sm text-forest mb-2 block">Hackathon URL</label>
                <input
                  type="url"
                  placeholder="https://devpost.com/hackathons"
                  className="w-full bg-transparent border-b border-grid/20 px-0 py-3 jetbrains text-sm focus:outline-none focus:border-forest transition-colors rounded-none"
                />
              </div>

              <div>
                <label className="typography-technical-sm text-forest mb-2 block">Your Role</label>
                <select className="w-full bg-transparent border-b border-grid/20 px-0 py-3 jetbrains text-sm focus:outline-none focus:border-forest transition-colors rounded-none">
                  <option className="bg-paper text-forest">Solo Builder</option>
                  <option className="bg-paper text-forest">Team Lead</option>
                  <option className="bg-paper text-forest">Observer</option>
                </select>
              </div>

              <div>
                <label className="typography-technical-sm text-forest mb-2 block">Email Notification</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  className="w-full bg-transparent border-b border-grid/20 px-0 py-3 jetbrains text-sm focus:outline-none focus:border-forest transition-colors rounded-none"
                />
              </div>

              <button
                type="submit"
                className="w-full jetbrains text-[10px] uppercase px-6 py-4 border border-forest text-forest bg-transparent hover:bg-forest hover:text-white transition-all rounded-none"
              >
                Initialize Agent System
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-grid/20">
              <div className="flex items-center justify-between typography-technical-sm text-grid">
                <span>ENCRYPTION: AES-256</span>
                <span>LATENCY: &lt;50ms</span>
                <span>UPTIME: 99.9%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}