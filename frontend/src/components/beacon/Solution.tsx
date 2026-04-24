import { motion } from "framer-motion";
import { SectionHeading, SectionLabel, SectionSub } from "./SectionPrimitives";

const nodes = [
  { title: "Discover", sub: "Auto-index 200+ hackathon sources", color: "var(--accent-blue)", icon: "🔭", sample: "47 new hackathons indexed today" },
  { title: "Analyze", sub: "Extract themes, rules, judging criteria", color: "var(--accent-amber)", icon: "🧠", sample: "12 themes parsed · 4 weight vectors" },
  { title: "Debate", sub: "4 AI agents argue best approach", color: "#a855f7", icon: "💬", sample: "Round 3/5 · consensus 71%" },
  { title: "Decide", sub: "Judge agent picks winner with score", color: "var(--accent-green)", icon: "🏆", sample: "Verdict: 88.3 / 100" },
  { title: "Generate", sub: "Pitch deck, docs, architecture — ready", color: "var(--accent-blue)", icon: "🚀", sample: "Deck.pdf · arch.md · roadmap.md" },
];

function Hex({ color, icon, glow }: { color: string; icon: string; glow?: boolean }) {
  return (
    <div className="relative">
      <svg width="84" height="96" viewBox="0 0 84 96">
        <polygon
          points="42,2 80,24 80,72 42,94 4,72 4,24"
          fill={`${color}22`}
          stroke={color}
          strokeWidth="2"
          style={glow ? { filter: `drop-shadow(0 0 12px ${color})` } : undefined}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl">{icon}</span>
    </div>
  );
}

export function Solution() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel>// THE SOLUTION</SectionLabel>
        <SectionHeading>One AI Workflow. Discovery To Submission.</SectionHeading>
        <SectionSub>Beacon compresses 16 hours of pre-work into under 5 minutes.</SectionSub>

        <div className="relative mx-auto mt-16 max-w-3xl">
          {nodes.map((n, i) => (
            <motion.div
              key={n.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.1 }}
              className="relative grid grid-cols-[120px_1fr] gap-6 pb-10"
            >
              <div className="flex flex-col items-center">
                <Hex color={n.color} icon={n.icon} glow={i === nodes.length - 1} />
                {i < nodes.length - 1 && (
                  <svg width="2" height="60" className="mt-2">
                    <line
                      x1="1" y1="0" x2="1" y2="60"
                      stroke="var(--accent-blue)"
                      strokeWidth="1.5"
                      strokeDasharray="6 6"
                      className="dash-flow"
                    />
                  </svg>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <div
                    className="font-mono-b text-[10px] uppercase tracking-widest"
                    style={{ color: n.color }}
                  >
                    Step 0{i + 1}
                  </div>
                  <h3 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                    {n.title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{n.sub}</p>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                  className="ml-auto hidden glass rounded-lg px-4 py-3 font-mono-b text-xs text-[var(--text-secondary)] md:block"
                  style={{ borderColor: `${n.color}55` }}
                >
                  → {n.sample}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
