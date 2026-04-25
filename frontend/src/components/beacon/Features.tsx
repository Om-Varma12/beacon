import { motion } from "framer-motion";
import { SectionHeading, SectionLabel } from "./SectionPrimitives";

const features = [
  { t: "Multi-Agent Debate", d: "4 specialized agents argue and converge on your best idea", c: "var(--accent-blue)", icon: "⚡" },
  { t: "Hackathon Discovery", d: "Auto-index 200+ sources updated in real time", c: "var(--accent-amber)", icon: "📡" },
  { t: "Theme Intelligence", d: "Deep NLP analysis of problem statements and judging rubrics", c: "#a855f7", icon: "🧠" },
  { t: "Submission Generator", d: "Pitch decks, architecture docs, feature roadmaps auto-generated", c: "var(--accent-green)", icon: "📑" },
  { t: "Template Detection", d: "Finds and fills official submission templates automatically", c: "var(--accent-blue)", icon: "📐" },
  { t: "Judge Scoring Engine", d: "Weighted consensus algorithm with confidence scores", c: "var(--accent-amber)", icon: "⚖" },
  { t: "Idea Ranking", d: "Composite ranked list of approaches with reasoning", c: "var(--accent-green)", icon: "🏆" },
  { t: "Async Processing", d: "All 4 agents run in parallel. Results in under 90 seconds.", c: "#a855f7", icon: "⚡" },
];

export function Features() {
  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel>// CAPABILITIES</SectionLabel>
        <SectionHeading>Everything You Need To Dominate</SectionHeading>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="glass group rounded-xl p-5 transition-colors hover:border-[var(--accent-blue)]/50"
              style={{ ["--accent" as string]: f.c }}
            >
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-colors"
                style={{
                  background: `${f.c}18`,
                  border: `1px solid ${f.c}55`,
                  color: f.c,
                }}
              >
                {f.icon}
              </div>
              <h3 className="font-display font-bold text-[var(--text-primary)]">{f.t}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
