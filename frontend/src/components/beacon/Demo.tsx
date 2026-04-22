import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { DebateTerminal } from "./DebateTerminal";
import { SectionHeading, SectionLabel } from "./SectionPrimitives";

const tabs = ["Hackathon Discovery", "Agent Debate", "Winning Concept", "Generated Deck"];

const hackathons = [
  { name: "Smart India Hackathon 2025", initials: "SI", prize: "₹1,00,000", deadline: "14d 6h left", match: 91, tags: ["AI/ML", "GovTech", "FinTech"], color: "#f59e0b" },
  { name: "ETHIndia 2025", initials: "ET", prize: "$50,000", deadline: "7d 2h left", match: 87, tags: ["Web3", "ZK", "DeFi"], color: "#a855f7" },
  { name: "HackBites by Zomato", initials: "HB", prize: "₹75,000", deadline: "21d left", match: 78, tags: ["FoodTech", "Logistics", "AI"], color: "#ef4444" },
];

function ScoreLine() {
  const points = [12, 30, 55, 70, 88];
  return (
    <svg viewBox="0 0 200 100" className="h-32 w-full">
      <defs>
        <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#00d4ff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#00d4ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[20, 40, 60, 80].map((y) => (
        <line key={y} x1="0" x2="200" y1={100 - y} y2={100 - y} stroke="#1a3a5c" strokeWidth="0.5" />
      ))}
      <polyline
        fill="none"
        stroke="#00d4ff"
        strokeWidth="2"
        points={points.map((p, i) => `${(i / (points.length - 1)) * 200},${100 - p}`).join(" ")}
      />
      <polygon
        fill="url(#lg)"
        points={`0,100 ${points.map((p, i) => `${(i / (points.length - 1)) * 200},${100 - p}`).join(" ")} 200,100`}
      />
      {points.map((p, i) => (
        <circle key={i} cx={(i / (points.length - 1)) * 200} cy={100 - p} r="3" fill="#00d4ff" />
      ))}
    </svg>
  );
}

export function Demo() {
  const [tab, setTab] = useState(0);

  return (
    <section
      className="relative py-28"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel>// LIVE DEMO</SectionLabel>
        <SectionHeading>See Beacon Think In Real Time</SectionHeading>

        <div className="mt-10 flex flex-wrap gap-2 border-b border-[var(--border-line)]">
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`relative px-4 py-3 font-mono-b text-xs uppercase tracking-widest transition ${
                tab === i ? "text-[var(--accent-cyan)]" : "text-[var(--text-dim)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {t}
              {tab === i && (
                <motion.span
                  layoutId="tabline"
                  className="absolute inset-x-0 -bottom-px h-0.5"
                  style={{ background: "var(--accent-cyan)", boxShadow: "0 0 12px var(--accent-cyan)" }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="mt-8 min-h-[420px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {tab === 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                  {hackathons.map((h) => (
                    <div key={h.name} className="glass rounded-2xl p-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl font-mono-b text-sm font-bold"
                          style={{ background: `${h.color}22`, color: h.color, border: `1px solid ${h.color}55` }}
                        >
                          {h.initials}
                        </div>
                        <div className="flex-1">
                          <div className="font-display font-bold text-[var(--text-primary)]">{h.name}</div>
                          <div className="font-mono-b text-[10px] text-[var(--text-dim)]">{h.deadline}</div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="font-display text-2xl font-bold" style={{ color: "var(--accent-cyan)" }}>
                          {h.prize}
                        </span>
                        <span className="font-mono-b text-xs text-[var(--text-dim)]">prize pool</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {h.tags.map((tg) => (
                          <span key={tg} className="rounded border border-[var(--border-line)] px-2 py-0.5 font-mono-b text-[10px] text-[var(--text-secondary)]">
                            {tg}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-[var(--border-line)] pt-3">
                        <span className="font-mono-b text-[10px] uppercase text-[var(--text-dim)]">Match Score</span>
                        <span className="font-mono-b text-sm font-bold text-emerald-400">{h.match}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {tab === 1 && (
                <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
                  <DebateTerminal compact />
                  <div className="glass rounded-2xl p-6">
                    <div className="font-mono-b text-xs uppercase tracking-widest text-[var(--text-dim)]">
                      Score Convergence
                    </div>
                    <h4 className="mt-1 font-display text-xl font-bold">5 rounds → Verdict 88.3</h4>
                    <ScoreLine />
                    <ul className="mt-4 space-y-2 font-mono-b text-xs text-[var(--text-secondary)]">
                      <li>↳ Round 1: 4 agents diverge (σ = 18.4)</li>
                      <li>↳ Round 3: BIZ + JUDGE align (σ = 8.1)</li>
                      <li>↳ Round 5: consensus locked (σ = 2.3)</li>
                    </ul>
                  </div>
                </div>
              )}
              {tab === 2 && (
                <div className="glass rounded-2xl p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span className="font-mono-b text-[10px] uppercase tracking-widest text-[var(--accent-amber)]">
                        WINNING CONCEPT
                      </span>
                      <h3 className="mt-2 font-display text-2xl font-bold">
                        Predictive Engineering Intelligence Platform
                      </h3>
                      <p className="mt-2 max-w-2xl text-[var(--text-secondary)]">
                        GNN-powered codebase failure risk prediction for enterprise CI/CD pipelines.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {["AI/ML", "DevTools", "B2B SaaS"].map((t) => (
                          <span key={t} className="rounded border border-[var(--border-line)] px-2 py-0.5 font-mono-b text-xs text-[var(--text-secondary)]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[var(--accent-cyan)]/40 p-4 text-center" style={{ boxShadow: "var(--glow-cyan)" }}>
                      <div className="font-mono-b text-[10px] uppercase text-[var(--text-dim)]">Composite</div>
                      <div className="font-display text-4xl font-extrabold" style={{ color: "var(--accent-cyan)" }}>
                        88.3
                      </div>
                      <div className="font-mono-b text-[10px] text-[var(--text-dim)]">/ 100</div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-4">
                    {[{ l: "Market", v: 78, c: "var(--accent-amber)" }, { l: "Uniqueness", v: 91, c: "#a855f7" }, { l: "Feasibility", v: 85, c: "var(--accent-green)" }, { l: "Composite", v: 88, c: "var(--accent-cyan)" }].map((g) => (
                      <div key={g.l}>
                        <div className="mb-1 flex justify-between font-mono-b text-[10px] text-[var(--text-dim)]">
                          <span>{g.l}</span><span>{g.v}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-primary)]">
                          <div className="h-full" style={{ width: `${g.v}%`, background: g.c }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="font-mono-b text-[10px] uppercase tracking-widest text-[var(--text-dim)]">
                        Recommended Stack
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {["Python", "FastAPI", "PyDriller", "LangGraph", "React"].map((t) => (
                          <span key={t} className="rounded border border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/10 px-2 py-1 font-mono-b text-[10px] text-[var(--accent-cyan)]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono-b text-[10px] uppercase tracking-widest text-[var(--text-dim)]">
                        Judge Reasoning
                      </div>
                      <p className="mt-2 italic text-sm text-[var(--text-secondary)]">
                        "High novelty (91) and strong feasibility (85) outweigh moderate market (78). 
                        Sponsor track alignment for DevTools tier confirmed. Recommend pursuit."
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {tab === 3 && (
                <div className="glass rounded-2xl p-8">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    {[
                      { t: "Title", c: "Predictive Engineering Intelligence", color: "var(--accent-cyan)" },
                      { t: "Problem", c: "CI/CD failures cost teams 23% of dev time", color: "#ef4444" },
                      { t: "Solution", c: "GNN risk prediction → preemptive alerts", color: "var(--accent-amber)" },
                      { t: "Architecture", c: "PyDriller → Graph DB → GNN → API", color: "#a855f7" },
                      { t: "Team & Ask", c: "4 devs · seed funding · pilot partners", color: "var(--accent-green)" },
                    ].map((s, i) => (
                      <div
                        key={s.t}
                        className="aspect-[4/3] glass rounded-lg p-3 transition hover:scale-105"
                        style={{ borderColor: `${s.color}55` }}
                      >
                        <div className="font-mono-b text-[9px] text-[var(--text-dim)]">SLIDE 0{i + 1}</div>
                        <div className="mt-1 font-display text-xs font-bold" style={{ color: s.color }}>
                          {s.t}
                        </div>
                        <div className="mt-2 text-[10px] leading-snug text-[var(--text-secondary)]">
                          {s.c}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-center">
                    <button
                      className="rounded-lg px-7 py-3 font-bold"
                      style={{
                        background: "var(--accent-cyan)",
                        color: "var(--bg-primary)",
                        boxShadow: "var(--glow-cyan)",
                      }}
                    >
                      Download Full Deck →
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
