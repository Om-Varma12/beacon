import { Icon } from '@iconify/react'

export function FAQ() {
  return (
    <section className="py-24 px-8 border-b border-grid/20 bg-paper/55 snap-start">
      <div className="max-w-3xl mx-auto bg-paper/35 p-6">
        <h2 className="font-display text-4xl mb-12 text-center uppercase text-primary">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <details className="group border border-outline/20 bg-white/75 p-6 open:bg-surface-container-low/95 transition-all">
            <summary className="list-none flex justify-between items-center cursor-pointer font-headline-md text-lg">
              How does AI choose ideas?
              <Icon icon="lucide:chevron-down" className="shrink-0 transition-transform group-open:rotate-180" width={20} />
            </summary>
            <div className="mt-4 text-sm opacity-70 leading-relaxed font-body-md">
              Beacon uses a multi-agent adversarial protocol. Four distinct LLM personalities (Business, Innovation, Practical, Judge) debate the merits of a concept against a specific hackathon's prize criteria and historical data.
            </div>
          </details>

          <details className="group border border-outline/20 bg-white/75 p-6 open:bg-surface-container-low/95 transition-all">
            <summary className="list-none flex justify-between items-center cursor-pointer font-headline-md text-lg">
              Can I use my own hackathons?
              <Icon icon="lucide:chevron-down" className="shrink-0 transition-transform group-open:rotate-180" width={20} />
            </summary>
            <div className="mt-4 text-sm opacity-70 leading-relaxed font-body-md">
              Yes, Pro and Team users can input custom URLs or PDF rulesets. Beacon will parse them instantly using our specialized indexing engine.
            </div>
          </details>

          <details className="group border border-outline/20 bg-white/75 p-6 open:bg-surface-container-low/95 transition-all">
            <summary className="list-none flex justify-between items-center cursor-pointer font-headline-md text-lg">
              Does it generate PPTs?
              <Icon icon="lucide:chevron-down" className="shrink-0 transition-transform group-open:rotate-180" width={20} />
            </summary>
            <div className="mt-4 text-sm opacity-70 leading-relaxed font-body-md">
              Beacon generates structured slide deck content and visual diagrams. You can export these to Markdown or directly into our hosted presentation viewer.
            </div>
          </details>

          <details className="group border border-outline/20 bg-white/75 p-6 open:bg-surface-container-low/95 transition-all">
            <summary className="list-none flex justify-between items-center cursor-pointer font-headline-md text-lg">
              Can teams collaborate?
              <Icon icon="lucide:chevron-down" className="shrink-0 transition-transform group-open:rotate-180" width={20} />
            </summary>
            <div className="mt-4 text-sm opacity-70 leading-relaxed font-body-md">
              Team accounts feature shared workspaces where your real-world team can view agent debates and vote on the final winner.
            </div>
          </details>
        </div>
      </div>
    </section>
  )
}

export default FAQ
