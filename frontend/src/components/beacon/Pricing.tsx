import { motion } from "framer-motion";
import { useState } from "react";
import { SectionHeading, SectionLabel } from "./SectionPrimitives";

interface Plan {
  name: string;
  monthly: number;
  annual: number;
  popular?: boolean;
  cta: string;
  ctaPrimary?: boolean;
  features: { t: string; ok: boolean }[];
}

const plans: Plan[] = [
  {
    name: "STARTER",
    monthly: 0,
    annual: 0,
    cta: "Start Free",
    features: [
      { t: "5 hackathon discoveries / month", ok: true },
      { t: "1 AI debate session / month", ok: true },
      { t: "Basic submission outline", ok: true },
      { t: "Full asset generation", ok: false },
      { t: "Team collaboration", ok: false },
    ],
  },
  {
    name: "PRO",
    monthly: 499,
    annual: 299,
    popular: true,
    cta: "Start Pro",
    ctaPrimary: true,
    features: [
      { t: "Unlimited hackathon discovery", ok: true },
      { t: "20 AI debate sessions / month", ok: true },
      { t: "Full submission asset generation", ok: true },
      { t: "Pitch deck + architecture docs", ok: true },
      { t: "Priority processing", ok: true },
      { t: "Team seats", ok: false },
    ],
  },
  {
    name: "TEAM",
    monthly: 1499,
    annual: 899,
    cta: "Start Team",
    ctaPrimary: true,
    features: [
      { t: "Everything in Pro", ok: true },
      { t: "Up to 8 team seats", ok: true },
      { t: "Shared debate history", ok: true },
      { t: "Team idea voting", ok: true },
      { t: "White-label exports", ok: true },
      { t: "API access", ok: true },
    ],
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);
  return (
    <section id="pricing" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel>// PRICING</SectionLabel>
        <SectionHeading>Start Free. Scale When You Win.</SectionHeading>

        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[var(--border-line)] bg-[var(--bg-secondary)] p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`rounded-full px-4 py-1.5 font-mono-b text-xs ${
              !annual ? "bg-[var(--accent-blue)] text-[var(--bg-primary)]" : "text-[var(--text-secondary)]"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 font-mono-b text-xs ${
              annual ? "bg-[var(--accent-blue)] text-[var(--bg-primary)]" : "text-[var(--text-secondary)]"
            }`}
          >
            Annual
            <span className="rounded bg-[var(--accent-amber)]/20 px-1.5 py-0.5 text-[10px] text-[var(--accent-amber)]">
              -40%
            </span>
          </button>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((p, i) => {
            const price = annual ? p.annual : p.monthly;
            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass relative rounded-2xl p-7"
                style={
                  p.popular
                    ? {
                        borderColor: "var(--accent-blue)",
                        boxShadow: "var(--glow-blue)",
                        transform: "translateY(-8px)",
                      }
                    : undefined
                }
              >
                {p.popular && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 font-mono-b text-[10px] uppercase tracking-widest"
                    style={{ background: "var(--accent-amber)", color: "var(--bg-primary)" }}
                  >
                    MOST POPULAR
                  </span>
                )}
                <div className="font-mono-b text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                  {p.name}
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-extrabold text-[var(--text-primary)]">
                    ₹{price}
                  </span>
                  <span className="text-sm text-[var(--text-dim)]">/ month</span>
                </div>
                {annual && p.monthly > 0 && (
                  <div className="mt-1 font-mono-b text-xs text-[var(--text-dim)]">
                    <span className="line-through">₹{p.monthly}</span> · billed annually
                  </div>
                )}

                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li
                      key={f.t}
                      className={`flex items-start gap-2 text-sm ${
                        f.ok ? "text-[var(--text-secondary)]" : "text-[var(--text-dim)] line-through"
                      }`}
                    >
                      <span className={f.ok ? "text-emerald-400" : "text-red-400/60"}>
                        {f.ok ? "✓" : "✗"}
                      </span>
                      {f.t}
                    </li>
                  ))}
                </ul>

                <button
                  className="mt-7 w-full rounded-lg px-5 py-3 font-bold transition hover:scale-[1.02]"
                  style={
                    p.ctaPrimary
                      ? {
                          background: "var(--accent-blue)",
                          color: "var(--bg-primary)",
                          boxShadow: p.popular ? "var(--glow-blue)" : undefined,
                        }
                      : {
                          background: "transparent",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-line)",
                        }
                  }
                >
                  {p.cta}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
