import { motion } from "framer-motion";
import { useState } from "react";
import { ParticleField } from "./ParticleField";

export function FinalCTA() {
  const [email, setEmail] = useState("");
  return (
    <section className="relative overflow-hidden py-32">
      <ParticleField density={140} className="absolute inset-0 h-full w-full" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(0,212,255,0.18), transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-display font-extrabold leading-none"
        style={{
          fontSize: "clamp(8rem, 22vw, 18rem)",
          color: "var(--accent-cyan)",
          opacity: 0.03,
          letterSpacing: "-0.04em",
        }}
      >
        BEACON
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-mono-b text-xs uppercase tracking-widest"
          style={{ color: "var(--accent-amber)" }}
        >
          // JOIN THE WAITLIST
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-4 font-display font-extrabold leading-[1.05]"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          Stop Wasting 8 Hours On
          <br />
          What Takes Beacon{" "}
          <span className="text-gradient-cy-am">5 Minutes</span>.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-5 text-base text-[var(--text-secondary)]"
        >
          Join 400+ hackers already on the waitlist. Early access. No credit card required.
        </motion.p>

        <motion.form
          onSubmit={(e) => e.preventDefault()}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mx-auto mt-8 flex max-w-xl flex-col gap-3 rounded-xl border border-[var(--accent-cyan)]/30 bg-[var(--bg-card)]/70 p-2 backdrop-blur-xl sm:flex-row"
          style={{ boxShadow: "var(--glow-cyan)" }}
        >
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-dim)]"
          />
          <button
            type="submit"
            className="rounded-lg px-7 py-3 font-bold transition hover:scale-[1.03]"
            style={{
              background: "var(--accent-cyan)",
              color: "var(--bg-primary)",
            }}
          >
            Get Early Access →
          </button>
        </motion.form>

        <p className="mt-5 font-mono-b text-xs text-[var(--text-dim)]">
          🔒 No spam · Cancel anytime · Free forever for students
        </p>
      </div>
    </section>
  );
}
