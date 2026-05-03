import { Icon } from '@iconify/react'

export function Testimonials() {
  return (
    <section className="min-h-screen py-24 border-t border-grid/20 snap-start flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-8">
        <div className="mb-12">
          <span className="jetbrains text-[10px] uppercase tracking-widest text-grid">04. System Feedback</span>
        </div>

        <div className="grid grid-cols-3 gap-px bg-grid/20">
          {/* Testimonial 1 */}
          <div className="bg-paper border border-grid/20 p-6">
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
            <p className="jetbrains text-xs leading-relaxed text-grid mb-6">
              Reduced our hackathon prep from 6 hours to 15 minutes. The multi-agent debate system is incredibly sophisticated.
            </p>
            <div className="pt-4 border-t border-grid/20 flex items-center gap-3">
              <div className="w-10 h-10 bg-forest" />
              <div>
                <div className="jetbrains text-[10px] uppercase tracking-wider text-forest">Sarah Chen</div>
                <div className="jetbrains text-[10px] text-grid/60">Full-Stack Engineer</div>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-paper border border-grid/20 p-6">
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
            <p className="jetbrains text-xs leading-relaxed text-grid mb-6">
              The generated pitch deck and architecture diagrams were production-ready. Won our first hackathon using this.
            </p>
            <div className="pt-4 border-t border-grid/20 flex items-center gap-3">
              <div className="w-10 h-10 bg-forest" />
              <div>
                <div className="jetbrains text-[10px] uppercase tracking-wider text-forest">Marcus Rivera</div>
                <div className="jetbrains text-[10px] text-grid/60">Product Designer</div>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-paper border border-grid/20 p-6">
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
            <p className="jetbrains text-xs leading-relaxed text-grid mb-6">
              As a team lead, coordinating 5 people across timezones was chaos. This platform streamlined everything perfectly.
            </p>
            <div className="pt-4 border-t border-grid/20 flex items-center gap-3">
              <div className="w-10 h-10 bg-forest" />
              <div>
                <div className="jetbrains text-[10px] uppercase tracking-wider text-forest">Priya Malik</div>
                <div className="jetbrains text-[10px] text-grid/60">ML Engineer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}