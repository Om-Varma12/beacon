import { motion } from "framer-motion";
import { SectionHeading, SectionLabel, SectionSub } from "./SectionPrimitives";

const rows = [
  ["Hackathon Discovery", "Manual searching", "Auto-indexed, real-time"],
  ["Idea Generation", "Generic prompts", "Structured multi-agent debate"],
  ["Uniqueness Check", "You guess", "Scans 10k+ prior submissions"],
  ["Feasibility Analysis", "Team argues", "Stack-aware BUILD_AGENT"],
  ["Scoring / Ranking", "—", "Judge Engine, 0-100 score"],
  ["Submission Assets", "DIY in Canva", "Auto-generated deck + docs"],
  ["Hackathon Context", "—", "Rules + judging criteria aware"],
  ["Speed", "8+ hours", "Under 5 minutes"],
];

export function Comparison() {
  return (
    <section className="relative py-28" style={{ background: "var(--bg-secondary)" }}>
      <div className="mx-auto max-w-5xl px-6">
        <SectionLabel>// WHY BEACON</SectionLabel>
        <SectionHeading>Not Another AI Chat Tool</SectionHeading>
        <SectionSub>ChatGPT will answer your questions. Beacon will win your hackathon.</SectionSub>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass mt-10 overflow-hidden rounded-2xl"
        >
          <div className="grid grid-cols-3 border-b border-[var(--border-line)] font-mono-b text-[10px] uppercase tracking-widest">
            <div className="p-4 text-[var(--text-dim)]">Feature</div>
            <div className="p-4 text-[var(--text-secondary)]">Others</div>
            <div className="p-4 text-[var(--accent-blue)]" style={{ background: "rgba(0,212,255,0.06)", textShadow: "0 0 12px var(--accent-blue)" }}>
              Beacon
            </div>
          </div>
          {rows.map((r, i) => (
            <div
              key={r[0]}
              className="grid grid-cols-3 border-b border-[var(--border-line)] last:border-0 text-sm"
              style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}
            >
              <div className="p-4 font-medium text-[var(--text-primary)]">{r[0]}</div>
              <div className="p-4 text-[var(--text-secondary)]">
                {r[1] === "—" ? <span className="text-red-400">✗</span> : r[1]}
              </div>
              <div className="p-4 text-[var(--accent-blue)]" style={{ background: "rgba(0,212,255,0.04)" }}>
                <span className="text-emerald-400">✓</span> {r[2]}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
