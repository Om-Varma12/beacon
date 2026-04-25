import { motion } from "framer-motion";
import { SectionHeading, SectionLabel, SectionSub } from "./SectionPrimitives";

interface Agent {
  id: string;
  name: string;
  color: string;
  role: string;
  desc: string;
  caps: string[];
  highlight?: boolean;
  avatar: React.ReactNode;
  status?: string;
  verdict?: string;
}

function TriFace({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20 spin-slow">
      <polygon points="50,8 88,72 12,72" fill={`${color}22`} stroke={color} strokeWidth="2" />
      <polygon points="50,30 70,62 30,62" fill={color} opacity="0.6" />
      <circle cx="38" cy="55" r="3" fill={color} />
      <circle cx="62" cy="55" r="3" fill={color} />
    </svg>
  );
}
function Crystal({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20 spin-slow">
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <line
          key={a}
          x1="50" y1="50"
          x2={50 + Math.cos((a * Math.PI) / 180) * 40}
          y2={50 + Math.sin((a * Math.PI) / 180) * 40}
          stroke={color}
          strokeWidth="2"
        />
      ))}
      <circle cx="50" cy="50" r="10" fill={color} opacity="0.6" />
    </svg>
  );
}
function HexGrid({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <polygon
            key={`${row}-${col}`}
            points="10,2 18,6 18,14 10,18 2,14 2,6"
            transform={`translate(${col * 22 + (row % 2) * 11 + 14},${row * 18 + 18})`}
            fill={`${color}33`}
            stroke={color}
            strokeWidth="1"
          >
            <animate attributeName="fill-opacity" values="0.2;0.8;0.2" dur={`${2 + row * 0.4 + col * 0.2}s`} repeatCount="indefinite" />
          </polygon>
        ))
      )}
    </svg>
  );
}
function Scales({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      <line x1="50" y1="10" x2="50" y2="80" stroke={color} strokeWidth="2" />
      <circle cx="50" cy="10" r="3" fill={color} />
      <g className="balance" style={{ transformOrigin: "50px 28px" }}>
        <line x1="20" y1="28" x2="80" y2="28" stroke={color} strokeWidth="2" />
        <circle cx="20" cy="42" r="10" fill={`${color}33`} stroke={color} strokeWidth="1.5" />
        <circle cx="80" cy="42" r="10" fill={`${color}33`} stroke={color} strokeWidth="1.5" />
        <line x1="20" y1="28" x2="20" y2="34" stroke={color} />
        <line x1="80" y1="28" x2="80" y2="34" stroke={color} />
      </g>
      <rect x="40" y="80" width="20" height="6" fill={color} />
    </svg>
  );
}

const agents: Agent[] = [
  {
    id: "biz",
    name: "BIZ_AGENT",
    color: "var(--accent-amber)",
    role: "Market Intelligence",
    desc: "Evaluates every idea for real-world market value, business model fit, and prize alignment. Thinks like a VC.",
    caps: ["Prize money optimization", "Market size estimation", "Sponsor theme matching"],
    avatar: <TriFace color="#f59e0b" />,
    status: "ACTIVE — Analyzing 3 themes",
  },
  {
    id: "innov",
    name: "INNOV_AGENT",
    color: "#a855f7",
    role: "Uniqueness Scanner",
    desc: "Scans recent hackathon winners, GitHub trends, and research papers to find genuinely novel angles.",
    caps: ["Novelty scoring", "Competitor analysis", "First-mover detection"],
    avatar: <Crystal color="#a855f7" />,
    status: "ACTIVE — Crawling 1.2k repos",
  },
  {
    id: "build",
    name: "BUILD_AGENT",
    color: "var(--accent-green)",
    role: "Feasibility Checker",
    desc: "Runs your team's stack against the idea's technical requirements. Knows what's possible in 24, 36, 48hrs.",
    caps: ["Stack compatibility", "MVP scope estimation", "Risk flagging"],
    avatar: <HexGrid color="#10b981" />,
    status: "ACTIVE — Estimating MVP",
  },
  {
    id: "judge",
    name: "JUDGE_AGENT",
    color: "var(--accent-blue)",
    role: "Final Arbiter ♛",
    desc: "Receives all agent scores, runs weighted consensus algorithm, and delivers a definitive ranked verdict with confidence score.",
    caps: ["Weighted scoring (0-100)", "Confidence intervals", "Tie-breaking logic"],
    avatar: <Scales color="#4A9EFF" />,
    highlight: true,
    verdict: "88.3",
  },
];

const ticker = [
  "BIZ_AGENT → Fintech track: prize_weight=0.4, recommend",
  "INNOV_AGENT → No prior GNN submissions found, uniqueness HIGH",
  "BUILD_AGENT → Python + FastAPI viable in 36hr window",
  "JUDGE_AGENT → Round 3 consensus 0.71, escalating",
  "BIZ_AGENT → Sponsor track AWS: weight 0.3, partial match",
  "INNOV_AGENT → Detected 12 similar hacks in 90d window",
  "BUILD_AGENT → Risk flag: ML training latency > 48hr",
  "JUDGE_AGENT → Verdict locked: composite 88.3 / 100",
];

export function Agents() {
  return (
    <section id="agents" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel>// THE TEAM</SectionLabel>
        <SectionHeading>Meet Your AI Hackathon Squad</SectionHeading>
        <SectionSub>Four specialized agents. One goal: get you to the podium.</SectionSub>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {agents.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.08 }}
              className={`glass relative flex min-h-[340px] flex-col rounded-2xl p-6 ${
                a.highlight ? "lg:scale-[1.04]" : ""
              }`}
              style={
                a.highlight
                  ? {
                      borderColor: a.color,
                      boxShadow: "var(--glow-blue)",
                    }
                  : undefined
              }
            >
              <div className="flex items-start justify-between">
                <div>{a.avatar}</div>
                <span
                  className="rounded-md border px-2 py-1 font-mono-b text-[10px] uppercase tracking-widest"
                  style={{
                    color: a.color,
                    borderColor: `${a.color}55`,
                    background: `${a.color}11`,
                  }}
                >
                  {a.role}
                </span>
              </div>
              <h3 className="mt-4 font-mono-b text-base font-bold" style={{ color: a.color }}>
                {a.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {a.desc}
              </p>
              <ul className="mt-4 space-y-1.5">
                {a.caps.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <span style={{ color: "var(--accent-blue)" }}>✓</span> {c}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-5">
                {a.verdict ? (
                  <div className="rounded-lg border border-[var(--accent-blue)]/40 bg-[var(--accent-blue)]/5 p-3 text-center">
                    <div className="font-mono-b text-[10px] uppercase tracking-widest text-[var(--text-dim)]">
                      Verdict
                    </div>
                    <div
                      className="font-display text-3xl font-extrabold"
                      style={{ color: "var(--accent-blue)" }}
                    >
                      {a.verdict}
                      <span className="text-base text-[var(--text-dim)]"> / 100</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 font-mono-b text-[10px]">
                    <span
                      className="h-1.5 w-1.5 rounded-full pulse-dot"
                      style={{ background: a.color }}
                    />
                    <span style={{ color: a.color }}>{a.status}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 overflow-hidden rounded-xl border border-[var(--border-line)] bg-[var(--bg-secondary)]/60 py-3">
          <div className="ticker flex gap-12 whitespace-nowrap font-mono-b text-xs text-[var(--text-secondary)]">
            {[...ticker, ...ticker].map((t, i) => (
              <span key={i} className="flex items-center gap-2">
                <span style={{ color: "var(--accent-blue)" }}>●</span> {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
