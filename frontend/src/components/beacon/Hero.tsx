import { motion } from "framer-motion";
import videoSrc from "@/assets/video.mp4";


const stats = [
  { v: "200+", l: "Hackathons" },
  { v: "4", l: "AI Agents" },
  { v: "< 5 min", l: "Setup" },
];

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden pt-24"
    >
      {/* Video atmospheric backdrop */}
      <video
        className="pointer-events-none absolute inset-0 object-cover object-center opacity-50"
        autoPlay
        muted
        loop
        playsInline
        src={videoSrc}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(11,10,46,0.55) 0%, rgba(11,10,46,0.75) 55%, rgba(11,10,46,0.98) 100%)",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="scanlines pointer-events-none absolute inset-0" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 85% 45%, rgba(255,178,77,0.18), transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <div className="max-w-3xl">

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/10 px-3 py-1 font-mono-b text-[11px] text-[var(--accent-cyan)]"
          >
            <span>⚡</span> AI Multi-Agent System
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 font-display font-extrabold leading-[0.95] text-[var(--text-primary)]"
            style={{ fontSize: "clamp(2.75rem, 7vw, 5.5rem)" }}
          >
            Win Hackathons.
            <br />
            Let AI{" "}
            <span className="text-gradient-cy-am">Fight</span> For
            <br className="hidden md:block" /> Your Ideas.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-[var(--text-secondary)]"
          >
            Beacon discovers hackathons, analyzes themes with multi-agent AI debate,
            and generates submission-ready materials — automatically.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex items-center gap-6"
          >
            {stats.map((s, i) => (
              <div key={s.l} className="flex items-center gap-6">
                <div>
                  <div
                    className="font-mono-b text-sm font-bold"
                    style={{ color: "var(--accent-cyan)" }}
                  >
                    {s.v}
                  </div>
                  <div className="font-mono-b text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
                    {s.l}
                  </div>
                </div>
                {i < stats.length - 1 && (
                  <span className="h-8 w-px bg-[var(--border-line)]" />
                )}
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-lg px-7 py-4 font-bold"
              style={{
                background: "var(--accent-cyan)",
                color: "var(--bg-primary)",
                boxShadow: "var(--glow-cyan)",
              }}
            >
              Start Free — No Credit Card
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="rounded-lg border border-[var(--border-line)] px-7 py-4 text-[var(--text-secondary)] hover:border-[var(--accent-cyan)]/50 hover:text-[var(--text-primary)]"
            >
              ▶ Watch 90s Demo
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <span className="font-mono-b text-[10px] uppercase tracking-widest text-[var(--text-dim)]">
              Trusted by hackers from
            </span>
            {["IIT", "BITS", "VIT", "MIT", "Stanford"].map((u) => (
              <span
                key={u}
                className="rounded-full border border-[var(--border-line)] px-3 py-1 font-mono-b text-[10px] text-[var(--text-dim)]"
              >
                {u}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
