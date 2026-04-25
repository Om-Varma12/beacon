import { motion } from "framer-motion";
import { SectionHeading, SectionLabel, SectionSub } from "./SectionPrimitives";

const cards = [
  { icon: "🔍", title: "Endless Hackathon Hunting", body: "Scrolling Devfolio, Unstop, Devpost for hours. Missing deadlines.", color: "var(--accent-amber)" },
  { icon: "🧩", title: "Analysis Paralysis", body: "Five themes. Four opinions. Zero decisions. Team stalls for days.", color: "#ef4444" },
  { icon: "🎯", title: "Wrong Idea, Wrong Track", body: "You build for the wrong problem statement. Judges aren't impressed.", color: "#f97316" },
  { icon: "📊", title: "PPT Pressure", body: "Night before submission. No deck. Panic mode.", color: "#a855f7" },
  { icon: "👥", title: "Team Misalignment", body: "Everyone wants to build something different. Deadlock.", color: "#ec4899" },
  { icon: "⏰", title: "Time Hemorrhage", body: "36hr hackathon. 8hrs lost to pre-planning. You lost before you started.", color: "#ef4444" },
];

const timeline = [
  { l: "DISCOVERY", h: "3h", c: "var(--accent-amber)" },
  { l: "SELECTION", h: "4h", c: "#ef4444" },
  { l: "PPT", h: "6h", c: "var(--accent-amber)" },
  { l: "DOCS", h: "3h", c: "#ef4444" },
  { l: "ACTUAL BUILDING", h: "20h", c: "var(--accent-blue)" },
];

export function Problem() {
  return (
    <section
      className="relative overflow-hidden py-28"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[var(--bg-primary)] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <SectionLabel>// THE PROBLEM</SectionLabel>
        <SectionHeading>
          Hackathons Waste 80% Of Your Time Before You Write A Line Of Code
        </SectionHeading>
        <SectionSub>The real competition isn't coding. It's the chaos before it.</SectionSub>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="glass group rounded-xl p-6 transition-shadow"
              style={{ ["--hover-glow" as string]: c.color }}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                style={{ background: `${c.color}18`, border: `1px solid ${c.color}55`, color: c.color }}
              >
                {c.icon}
              </div>
              <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
                {c.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {c.body}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 glass rounded-2xl p-6"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono-b text-xs uppercase tracking-widest text-[var(--text-secondary)]">
              Average Hackathon Time Wasted
            </span>
            <span className="font-mono-b text-xs text-[var(--text-dim)]">36hr event</span>
          </div>
          <div className="flex h-10 overflow-hidden rounded-md">
            {timeline.map((t) => (
              <div
                key={t.l}
                className="relative flex items-center justify-center text-[10px] font-bold text-black/80"
                style={{
                  flex: parseInt(t.h),
                  background: t.c,
                  opacity: t.c === "var(--accent-blue)" ? 1 : 0.78,
                }}
              >
                <span className="font-mono-b uppercase tracking-wider">
                  {t.l} {t.h}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono-b text-xs text-[var(--text-dim)]">
            Only 51% of your time goes to actual building.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
