import { useEffect, useState } from "react";

const links = [
  { href: "#how", label: "How It Works" },
  { href: "#agents", label: "Agents" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-16 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--bg-secondary)]/90 backdrop-blur-xl border-b border-[var(--border-line)]"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2">
          <span className="font-display text-lg font-bold tracking-tight" style={{ color: "var(--accent-blue)" }}>
            BEACON
          </span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="story-link font-mono-b text-xs uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <button className="hidden rounded-md px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] sm:inline-block">
            Sign In
          </button>
          <button
            className="rounded-md px-4 py-2 text-sm font-bold transition-transform hover:scale-105"
            style={{
              background: "var(--accent-blue)",
              color: "var(--bg-primary)",
              boxShadow: "var(--glow-blue)",
            }}
          >
            Start Free
          </button>
        </div>
      </nav>
    </header>
  );
}
