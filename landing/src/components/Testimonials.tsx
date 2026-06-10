import { Icon } from '@iconify/react'

export function Testimonials() {
  return (
    <section className="min-h-screen py-24 border-t border-grid/20 flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-8">
        <div className="mb-12">
          <span className="typography-technical-label text-grid">04 // SYSTEM FEEDBACK</span>
        </div>

        <div className="grid grid-cols-3 gap-px bg-grid/20">
          {/* Testimonial 1 */}
          <div className="bg-paper border border-grid/20 p-6 relative rounded-none">
            {/* Technical ID */}
            <div className="absolute top-4 right-4 typography-technical-sm text-grid/40">
              ID // 04-01
            </div>
            <div className="flex items-center justify-between mb-4">
              <Icon icon="lucide:quote" className="text-2xl text-forest" />
              <div className="flex gap-1">
                <Icon icon="lucide:star" className="text-xs text-gold" />
                <Icon icon="lucide:star" className="text-xs text-gold" />
                <Icon icon="lucide:star" className="text-xs text-gold" />
                <Icon icon="lucide:star" className="text-xs text-gold" />
                <Icon icon="lucide:star" className="text-xs text-gold" />
              </div>
            </div>
            <p className="typography-body-md text-grid mb-6">
              Reduced our hackathon prep from 6 hours to 15 minutes. The multi-agent debate system is incredibly sophisticated.
            </p>
            <div className="pt-4 border-t border-grid/20 flex items-center gap-3">
              <div className="w-10 h-10 bg-forest rounded-none" />
              <div>
                <div className="typography-technical-sm text-forest font-semibold">Sarah Chen</div>
                <div className="typography-technical-sm text-grid/60">Full-Stack Engineer</div>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-paper border border-grid/20 p-6 relative rounded-none">
            {/* Technical ID */}
            <div className="absolute top-4 right-4 typography-technical-sm text-grid/40">
              ID // 04-02
            </div>
            <div className="flex items-center justify-between mb-4">
              <Icon icon="lucide:quote" className="text-2xl text-forest" />
              <div className="flex gap-1">
                <Icon icon="lucide:star" className="text-xs text-gold" />
                <Icon icon="lucide:star" className="text-xs text-gold" />
                <Icon icon="lucide:star" className="text-xs text-gold" />
                <Icon icon="lucide:star" className="text-xs text-gold" />
                <Icon icon="lucide:star" className="text-xs text-gold" />
              </div>
            </div>
            <p className="typography-body-md text-grid mb-6">
              The generated pitch deck and architecture diagrams were production-ready. Won our first hackathon using this.
            </p>
            <div className="pt-4 border-t border-grid/20 flex items-center gap-3">
              <div className="w-10 h-10 bg-forest rounded-none" />
              <div>
                <div className="typography-technical-sm text-forest font-semibold">Marcus Rivera</div>
                <div className="typography-technical-sm text-grid/60">Product Designer</div>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-paper border border-grid/20 p-6 relative rounded-none">
            {/* Technical ID */}
            <div className="absolute top-4 right-4 typography-technical-sm text-grid/40">
              ID // 04-03
            </div>
            <div className="flex items-center justify-between mb-4">
              <Icon icon="lucide:quote" className="text-2xl text-forest" />
              <div className="flex gap-1">
                <Icon icon="lucide:star" className="text-xs text-gold" />
                <Icon icon="lucide:star" className="text-xs text-gold" />
                <Icon icon="lucide:star" className="text-xs text-gold" />
                <Icon icon="lucide:star" className="text-xs text-gold" />
                <Icon icon="lucide:star" className="text-xs text-gold" />
              </div>
            </div>
            <p className="typography-body-md text-grid mb-6">
              As a team lead, coordinating 5 people across timezones was chaos. This platform streamlined everything perfectly.
            </p>
            <div className="pt-4 border-t border-grid/20 flex items-center gap-3">
              <div className="w-10 h-10 bg-forest rounded-none" />
              <div>
                <div className="typography-technical-sm text-forest font-semibold">Priya Malik</div>
                <div className="typography-technical-sm text-grid/60">ML Engineer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}