import { motion } from "framer-motion";
import { SectionHeading, SectionLabel } from "./SectionPrimitives";

const steps = [
  {
    n: "01",
    title: "Discover Hackathons",
    body: "Beacon continuously scrapes Devfolio, Unstop, Devpost, HackerEarth and 50+ sources. Filter by tech stack, prize, deadline, and domain.",
    tags: ["Python", "Scraping", "NLP Parsing"],
    icon: <Radar />,
  },
  {
    n: "02",
    title: "AI Agents Analyze Themes",
    body: "Each hackathon's rules, problem statements, and judging criteria are parsed and sent to four specialized AI agents simultaneously.",
    tags: ["LangGraph", "GPT-4o", "Parallel"],
    icon: <Orbit />,
  },
  {
    n: "03",
    title: "Multi-Agent Debate & Ranking",
    body: "Business, Innovation, Practical, and Judge agents debate each theme. They score, argue, and converge on the highest-potential idea for your team.",
    tags: ["Multi-Agent", "Scoring", "Consensus"],
    icon: <Bars />,
  },
  {
    n: "04",
    title: "Generate Submission Assets",
    body: "Beacon generates pitch deck outline, solution architecture diagram, technical documentation, feature roadmap, and executive summary — all ready to present.",
    tags: ["PDF", "PPTX", "Docs"],
    icon: <Docs />,
  },
];

function Radar() {
  return (
    <div className="relative h-20 w-20">
      {[0, 0.6, 1.2].map((d, i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full border radar-pulse"
          style={{ borderColor: "var(--accent-blue)", animationDelay: `${d}s` }}
        />
      ))}
      <span
        className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "var(--accent-blue)", boxShadow: "var(--glow-blue)" }}
      />
    </div>
  );
}
function Orbit() {
  const colors = ["var(--accent-blue)", "var(--accent-amber)", "#a855f7", "var(--accent-green)"];
  return (
    <div className="relative h-20 w-20 spin-slow">
      <span
        className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "var(--accent-blue)", boxShadow: "var(--glow-blue)" }}
      />
      {colors.map((c, i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full"
            style={{
              background: c,
              transform: `translate(${Math.cos(a) * 32 - 5}px, ${Math.sin(a) * 32 - 5}px)`,
              boxShadow: `0 0 8px ${c}`,
            }}
          />
        );
      })}
    </div>
  );
}
function Bars() {
  return (
    <div className="flex h-20 items-end gap-1.5">
      {[40, 70, 55, 85, 60].map((h, i) => (
        <motion.span
          key={i}
          animate={{ height: [`${h * 0.5}%`, `${h}%`, `${h * 0.7}%`] }}
          transition={{ duration: 1.6 + i * 0.1, repeat: Infinity, ease: "easeInOut" }}
          className="w-3 rounded-sm"
          style={{
            background:
              i === 3
                ? "var(--accent-blue)"
                : i === 1
                  ? "var(--accent-amber)"
                  : "var(--text-dim)",
            boxShadow: i === 3 ? "0 0 12px var(--accent-blue)" : undefined,
          }}
        />
      ))}
    </div>
  );
}
function Docs() {
  return (
    <div className="relative h-20 w-20">
      {[0, 6, 12].map((o, i) => (
        <span
          key={i}
          className="absolute h-16 w-12 rounded-md border bg-[var(--bg-secondary)]"
          style={{
            left: o + 8,
            top: o + 2,
            borderColor: "var(--accent-blue)",
            opacity: 0.5 + i * 0.2,
          }}
        />
      ))}
      <span className="absolute right-1 top-1 text-xl" style={{ color: "var(--accent-amber)" }}>
        ✦
      </span>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative py-28"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel>// HOW IT WORKS</SectionLabel>
        <SectionHeading>From Zero To Submission-Ready In 4 Steps</SectionHeading>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.08 }}
              className="glass relative min-h-[280px] overflow-hidden rounded-2xl p-8"
            >
              <span
                className="pointer-events-none absolute right-4 top-0 font-mono-b font-bold leading-none"
                style={{
                  fontSize: "8rem",
                  color: "var(--accent-blue)",
                  opacity: 0.05,
                }}
              >
                {s.n}
              </span>

              <div className="relative mb-6">{s.icon}</div>

              <h3 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                {s.body}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {s.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-[var(--border-line)] bg-[var(--bg-primary)]/60 px-2 py-1 font-mono-b text-[10px] text-[var(--text-secondary)]"
                  >
                    [{t}]
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
