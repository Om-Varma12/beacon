import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { SectionHeading, SectionLabel } from "./SectionPrimitives";

const faqs = [
  {
    q: "How does the AI choose the winning idea?",
    a: "Four specialized agents evaluate each theme independently across market value, uniqueness, feasibility, and judge-alignment. The JUDGE_AGENT runs a weighted consensus algorithm and produces a composite 0-100 score. The highest-scoring idea wins.",
  },
  {
    q: "Can I add hackathons that aren't in your database?",
    a: "Yes. Paste any hackathon URL and Beacon will scrape, parse, and run the full agent debate on it within 90 seconds.",
  },
  {
    q: "What exactly does it generate for submission?",
    a: "Pitch deck outline (slide-by-slide), solution architecture description, technical documentation draft, feature roadmap, MVP scope, and executive one-pager.",
  },
  {
    q: "Can my team use it together?",
    a: "Team plan supports up to 8 seats with shared debate history, team voting on agent suggestions, and real-time collaboration on generated assets.",
  },
  {
    q: "Which AI models power the agents?",
    a: "GPT-4o for all four agents. Orchestrated via LangGraph with parallel async execution. Each agent has a specialized system prompt and memory context.",
  },
  {
    q: "Is this cheating in hackathons?",
    a: "Beacon helps with discovery and planning — the actual building, coding, and presenting is 100% you. It's like having a strategy coach, not a substitute.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative py-28" style={{ background: "var(--bg-secondary)" }}>
      <div className="mx-auto max-w-3xl px-6">
        <SectionLabel>// FAQ</SectionLabel>
        <SectionHeading>Questions? The Judge Agent Has Answers.</SectionHeading>

        <div className="mt-10">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="border-b border-[var(--border-line)]">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="font-display text-base font-semibold text-[var(--text-primary)]">
                    {f.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    className="font-mono-b text-lg"
                    style={{ color: "var(--accent-blue)" }}
                  >
                    ›
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 pr-8 text-sm leading-relaxed text-[var(--text-secondary)]">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
