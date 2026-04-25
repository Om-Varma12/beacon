import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface AgentMsg {
  id: string;
  short: string;
  name: string;
  color: string;
  icon: string;
  message: string;
  scoreLabel: string;
  scoreValue: number;
  highlight?: boolean;
  verdict?: string;
}

const SCRIPT: AgentMsg[] = [
  {
    id: "biz",
    short: "0.3s ago",
    name: "BIZ_AGENT",
    color: "var(--accent-amber)",
    icon: "$",
    message:
      "SmartCity track has 40% prize weight on scalability. Recommend targeting IoT + dashboards.",
    scoreLabel: "Market Value",
    scoreValue: 78,
  },
  {
    id: "innov",
    short: "0.6s ago",
    name: "INNOV_AGENT",
    color: "#a855f7",
    icon: "✦",
    message:
      "No team in top 50 has attempted GNN-based failure prediction. Uniqueness delta: HIGH.",
    scoreLabel: "Uniqueness",
    scoreValue: 91,
  },
  {
    id: "build",
    short: "0.9s ago",
    name: "BUILD_AGENT",
    color: "var(--accent-green)",
    icon: "⚙",
    message:
      "Python stack viable. PyDriller + FastAPI. 48hr MVP scope confirmed.",
    scoreLabel: "Feasibility",
    scoreValue: 85,
  },
  {
    id: "judge",
    short: "1.4s ago",
    name: "JUDGE_AGENT — VERDICT",
    color: "var(--accent-blue)",
    icon: "⚖",
    message: "WINNER: Predictive Engineering Intelligence.",
    scoreLabel: "Composite",
    scoreValue: 88,
    highlight: true,
    verdict: "88.3",
  },
];

export function DebateTerminal({ compact = false }: { compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-100px" });
  const [visible, setVisible] = useState<number>(0);

  useEffect(() => {
    if (!inView) return;
    let alive = true;
    const run = async () => {
      while (alive) {
        for (let i = 1; i <= SCRIPT.length; i++) {
          if (!alive) return;
          setVisible(i);
          await new Promise((r) => setTimeout(r, 1400));
        }
        await new Promise((r) => setTimeout(r, 3500));
        if (!alive) return;
        setVisible(0);
        await new Promise((r) => setTimeout(r, 600));
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [inView]);

  return (
    <div ref={ref} className={compact ? "" : "w-full max-w-[440px]"}>
      <div className="glass overflow-hidden rounded-2xl glow-blue">
        <div className="flex items-center justify-between border-b border-[var(--border-line)] bg-[var(--bg-secondary)]/60 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="font-mono-b text-[10px] text-[var(--text-dim)]">
            beacon://debate-engine/live
          </span>
          <span className="flex items-center gap-1.5 font-mono-b text-[10px] text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" /> LIVE
          </span>
        </div>

        <div className="space-y-3 p-4">
          {SCRIPT.map((m, i) => {
            const show = i < visible;
            return (
              <div key={m.id} className="min-h-[88px]">
                {!show ? (
                  i === visible ? (
                    <div className="flex items-center gap-1.5 px-2 py-3">
                      <span className="h-1.5 w-1.5 rounded-full pulse-dot" style={{ background: m.color }} />
                      <span className="h-1.5 w-1.5 rounded-full pulse-dot" style={{ background: m.color, animationDelay: "0.2s" }} />
                      <span className="h-1.5 w-1.5 rounded-full pulse-dot" style={{ background: m.color, animationDelay: "0.4s" }} />
                    </div>
                  ) : null
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35 }}
                    className={`rounded-xl border p-3 ${m.highlight ? "border-[var(--accent-blue)]/60" : "border-[var(--border-line)]"}`}
                    style={
                      m.highlight
                        ? { background: "rgba(0,212,255,0.05)", boxShadow: "var(--glow-blue)" }
                        : { background: "rgba(10,22,40,0.6)" }
                    }
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                        style={{ background: `${m.color}22`, color: m.color, border: `1px solid ${m.color}55` }}
                      >
                        {m.icon}
                      </span>
                      <span className="font-mono-b text-[11px]" style={{ color: "var(--accent-blue)" }}>
                        {m.name}
                      </span>
                      <span className="ml-auto font-mono-b text-[10px] text-[var(--text-dim)]">
                        {m.short}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                      {m.message}
                    </p>
                    {m.verdict ? (
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-mono-b text-[10px] uppercase text-[var(--text-dim)]">
                          composite
                        </span>
                        <span
                          className="font-display text-3xl font-extrabold"
                          style={{ color: "var(--accent-blue)" }}
                        >
                          {m.verdict}
                        </span>
                        <span className="font-mono-b text-xs text-[var(--text-dim)]">/ 100</span>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <div className="mb-1 flex justify-between font-mono-b text-[10px] text-[var(--text-dim)]">
                          <span>{m.scoreLabel}</span>
                          <span>{m.scoreValue}</span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${m.scoreValue}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full"
                            style={{ background: m.color }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-center font-mono-b text-[10px] text-[var(--text-dim)]">
        Powered by LangGraph + Multi-Agent Orchestration
      </p>
    </div>
  );
}
