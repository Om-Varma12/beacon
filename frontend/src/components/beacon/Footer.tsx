const Twitter = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" {...p}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const Github = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" {...p}>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.31-1.27-1.66-1.27-1.66-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.34.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 015.79 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.05.78 2.12v3.14c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
  </svg>
);
const Linkedin = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" {...p}>
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.56V9h3.56zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
  </svg>
);

const cols = [
  {
    title: "Product",
    items: ["How It Works", "AI Agents", "Features", "Pricing", "Changelog"],
  },
  {
    title: "Developers",
    items: ["API Docs", "GitHub", "Status", "Integrations"],
  },
  {
    title: "Company",
    items: ["About", "Blog", "Contact", "Privacy Policy", "Terms of Service"],
  },
];

export function Footer() {
  return (
    <footer
      className="relative z-10 border-t border-[var(--border-line)]"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full pulse-dot"
              style={{ background: "var(--accent-amber)" }}
            />
            <span className="font-display text-xl font-bold" style={{ color: "var(--accent-cyan)" }}>
              BEACON
            </span>
          </div>
          <p className="mt-4 text-sm text-[var(--text-dim)]">
            AI-powered hackathon intelligence for the next generation of builders.
          </p>
          <div className="mt-6 flex gap-3">
            {[Twitter, Github, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="social"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border-line)] text-[var(--text-secondary)] transition hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="font-mono-b text-xs uppercase tracking-widest text-[var(--text-secondary)]">
              {c.title}
            </h4>
            <ul className="mt-4 space-y-2">
              {c.items.map((i) => (
                <li key={i}>
                  <a href="#" className="text-sm text-[var(--text-dim)] hover:text-[var(--accent-cyan)]">
                    {i}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--border-line)]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 md:flex-row">
          <p className="font-mono-b text-xs text-[var(--text-dim)]">
            © 2025 Beacon AI. Built for hackers, by hackers.
          </p>
          <p className="font-mono-b text-xs text-[var(--text-dim)]">
            Made with ♥ in India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
