import { useState } from 'react'
import { Icon } from '@iconify/react'

const faqs = [
  {
    question: 'What exactly is Beacon and what does it do?',
    answer:
      'Beacon is an autonomous multi-agent system built specifically for hackathon competitors. It handles the entire pre-build workflow that most teams waste their first 12 hours on — finding the right hackathon, parsing rules and sponsor priorities, debating project ideas through an adversarial AI protocol, and generating a submission-ready package including a pitch deck, README, and code scaffold. Think of it as an AI co-founder that does the strategic groundwork so your team can spend 100% of their time building.'
  },
  {
    question: 'How does the multi-agent debate actually work?',
    answer:
      'When you provide a hackathon brief, Beacon spins up three distinct AI agent personas — a Critic who stress-tests ideas for market saturation and feasibility, a Strategist who maps concepts to sponsor ROI and winning patterns, and an Architect who validates technical viability within a 36-hour sprint. These agents challenge each other\'s reasoning in a structured multi-turn dialogue. The final idea is only committed to when all three agents converge on an alignment score above a set threshold. The result is a concept that is novel, technically feasible, and sponsor-aligned — all before you write a single line of code.'
  },
  {
    question: 'Which hackathon platforms does Beacon support?',
    answer:
      'Beacon currently supports Unstop as its primary hackathon discovery platform. We chose to go deep on one platform before expanding — so every match, deadline, and bounty you see is accurately indexed and freshly verified. Support for Devpost, Devfolio, Gitcoin, and ETHGlobal is on the roadmap and will roll out progressively.'
  },
  {
    question: 'Can I use Beacon for a solo hackathon, or is it only for teams?',
    answer:
      'Beacon is currently built for solo developers. The entire workflow — from hackathon discovery to submission generation — is optimised for a single builder who wants to move fast and compete smart without the overhead of team coordination. Team collaboration features are something we are actively exploring for a future release, and early waitlist members will get first access when they land.'
  },
  {
    question: 'What does the submission generator actually produce?',
    answer:
      'The submission generator produces a complete, ready-to-submit package tailored to the specific hackathon\'s submission rules. This includes a structured README with system architecture diagrams, a video demo script aligned to the pitch format, a presentation deck outline with narrative flow, a working monorepo scaffold pre-configured with the recommended tech stack, and pre-integrated elements like telemetry hooks, design tokens, and SEO metadata. Everything is generated to meet the exact word counts, file formats, and criteria specified in the hackathon brief.'
  },
  {
    question: 'How does Beacon detect if my idea is too generic?',
    answer:
      'Beacon\'s Novelty Assurance Engine cross-references a database of over 10,000 past hackathon submissions to calculate a uniqueness score for your project concept. It flags boilerplate idea patterns — things like "AI chatbot for X" or "blockchain solution for Y" — that judges see repeatedly and immediately deprioritize. If your concept\'s novelty score falls below the threshold, the agent debate loop continues until it surfaces a differentiating angle. The final concept you receive is verified to have a distinct value proposition and an architecture that looks intentional, not templated.'
  },
  {
    question: 'Is my project idea kept private and secure?',
    answer:
      'Yes. Every session in Beacon is isolated and scoped to your account. Project ideas, hackathon briefs, and generated outputs are never shared across users or used to train shared models. Your intellectual property remains yours. All data in transit is encrypted, and session data is purged after a configurable retention window. We treat your competitive advantage with the same confidentiality you would expect from any professional tool.'
  },
  {
    question: 'How early before a hackathon should I start using Beacon?',
    answer:
      'Ideally, use Beacon as soon as you identify a hackathon you want to enter — even weeks before it starts. The earlier you feed Beacon the event details, the more time its discovery and evaluation engines have to surface competitor intelligence, track sponsor announcements, and refine the alignment score of your chosen concept. That said, Beacon is also built to operate under time pressure. If you start the night before submissions open, it will still generate a complete strategic brief and submission package within minutes, not hours.'
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  return (
    <section className="py-16 md:py-24 px-6 md:px-8 border-b border-grid/20 bg-transparent">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10 md:mb-14">
          <span className="typography-technical-label text-grid">QUESTIONS &amp; ANSWERS</span>
          <h2 className="space-grotesk text-3xl md:text-4xl font-bold mt-2 text-primary">
            Frequently Asked Questions
          </h2>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={idx}
                className={`border transition-all duration-200 ${
                  isOpen
                    ? 'border-forest/40 bg-surface-container-low/80'
                    : 'border-outline/20 bg-white/60 hover:border-outline/40'
                }`}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex items-start justify-between gap-4 p-5 md:p-6 text-left cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="space-grotesk text-base md:text-[17px] font-semibold text-primary leading-snug">
                    {faq.question}
                  </span>
                  <Icon
                    icon="lucide:chevron-down"
                    width={18}
                    className={`shrink-0 mt-0.5 text-grid/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 md:px-6 pb-5 md:pb-6">
                    <div className="w-6 h-px bg-forest/30 mb-4" />
                    <p className="text-sm md:text-[15px] text-primary/70 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FAQ
