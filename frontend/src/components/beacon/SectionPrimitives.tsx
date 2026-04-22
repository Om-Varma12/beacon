import { motion } from "framer-motion";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className="font-mono-b text-xs uppercase tracking-[0.25em] text-[var(--text-dim)]"
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`mt-3 font-display font-bold leading-[1.05] text-[var(--text-primary)] ${className}`}
      style={{ fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)" }}
    >
      {children}
    </motion.h2>
  );
}

export function SectionSub({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2 }}
      className="mt-3 max-w-2xl text-base text-[var(--text-secondary)]"
    >
      {children}
    </motion.p>
  );
}
