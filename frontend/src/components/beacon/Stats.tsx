import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface S {
  v: number;
  prefix?: string;
  suffix?: string;
  label: string;
  decimals?: number;
  text?: string;
}

const stats: S[] = [
  { v: 200, suffix: "+", label: "Hackathons Indexed" },
  { v: 500, suffix: "+", label: "Ideas Generated" },
  { v: 88.3, decimals: 1, label: "Avg. Debate Score" },
  { v: 0, text: "< 5m", label: "Time To First Idea" },
];

function Counter({ s }: { s: S }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView || s.text) return;
    const start = performance.now();
    const dur = 1500;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(s.v * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, s.v, s.text]);

  return (
    <div ref={ref} className="text-center">
      <div
        className="font-display font-extrabold leading-none"
        style={{
          color: "var(--accent-cyan)",
          fontSize: "clamp(2.5rem, 6vw, 5rem)",
          textShadow: "0 0 30px rgba(0,212,255,0.4)",
        }}
      >
        {s.text ?? `${s.prefix ?? ""}${val.toFixed(s.decimals ?? 0)}${s.suffix ?? ""}`}
      </div>
      <div className="mt-3 text-sm text-[var(--text-secondary)]">{s.label}</div>
    </div>
  );
}

export function Stats() {
  return (
    <section className="relative py-24">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0,212,255,0.06) 50%, transparent)",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <Counter s={s} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
