"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LenisProvider from "@/components/LenisProvider";
import BeaconCanvas from "@/components/three/BeaconCanvas";

gsap.registerPlugin(ScrollTrigger);

const BeaconCanvasComponent = dynamic(() => import("@/components/three/BeaconCanvas"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-transparent" />,
});

// ─── Feature Card ───────────────────────────────────────────
const features = [
  {
    step: "01",
    title: "Discover Hackathons",
    desc: "Browse a curated feed of live & upcoming hackathons scraped from across the web — filtered by theme, prize pool, and tech stack.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
    color: "#7c3aed",
    glow: "rgba(124, 58, 237, 0.2)",
  },
  {
    step: "02",
    title: "AI Agent Debate",
    desc: "Our multi-agent system — Strategy, Design, Tech, and Business — analyzes problem statements and debates the strongest ideas for you.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    color: "#3b82f6",
    glow: "rgba(59, 130, 246, 0.2)",
  },
  {
    step: "03",
    title: "Instant PPT Generation",
    desc: "Pick a winning idea and watch our agents build a polished, presentation-ready deck — pulling your chosen template and filling it with your vision.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10,9 9,9 8,9" />
      </svg>
    ),
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.2)",
  },
  {
    step: "04",
    title: "Refine & Perfect",
    desc: "Iterate with the agents in real-time. Drop ideas that don't land, push others further, and build something you're genuinely proud to present.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    color: "#ec4899",
    glow: "rgba(236, 72, 153, 0.2)",
  },
];

// ─── Agent Visual ────────────────────────────────────────────
const agents = [
  { name: "Strategist", color: "#3b82f6", symbol: "♟", desc: "Maps competitive landscape" },
  { name: "Designer", color: "#ec4899", symbol: "◈", desc: "Shapes user experience" },
  { name: "Engineer", color: "#10b981", symbol: "⚙", desc: "Validates technical scope" },
  { name: "Business", color: "#f59e0b", symbol: "◆", desc: "Judges market viability" },
];

// ─── Stats ──────────────────────────────────────────────────
const stats = [
  { value: "2,400+", label: "Hackathons Indexed" },
  { value: "94%", label: "Idea Acceptance Rate" },
  { value: "< 3 min", label: "Avg. PPT Generation" },
  { value: "4 AI", label: "Debating Agents" },
];

// ─── Testimonials ───────────────────────────────────────────
const testimonials = [
  {
    quote: "Beacon turned my vague hackathon anxiety into a concrete pitch in 20 minutes. The agent debate felt like having a seasoned startup advisor.",
    name: "Priya Nair",
    role: "MLH Finalist 2025",
    handle: "@priya_builds",
  },
  {
    quote: "The WebGL hero alone convinced my team to sign up. And then the actual product blew us away. This is the future of idea management.",
    name: "Rahul Mehta",
    role: "HackMIT Winner",
    handle: "@rahulm",
  },
  {
    quote: "I dropped three ideas before finding the one that actually won. The refine loop saved me from a mediocre submission.",
    name: "Anya Kowalski",
    role: "TreeHacks 2025",
    handle: "@anya_codes",
  },
];

// ─── FAQ ────────────────────────────────────────────────────
const faqs = [
  {
    q: "How does Beacon scrape hackathons?",
    a: "We use a distributed crawling system that monitors 80+ hackathon listing sites, DevPost, Major League Hacking, and direct hackathon organizer feeds — updating every 6 hours.",
  },
  {
    q: "How do the AI agents work?",
    a: "Each agent is a specialized LLM agent with a distinct persona (Strategist, Designer, Engineer, Business). They independently score ideas across their domain, then enter a structured debate round before reaching consensus.",
  },
  {
    q: "Can I upload my own PPTX template?",
    a: "Yes! Upload any .pptx template during setup and our agents will populate it with your idea's narrative, data, and branding — preserving all your custom layouts and fonts.",
  },
  {
    q: "Is my idea data private?",
    a: "Absolutely. Ideas are processed in isolated sandboxes, never shared across users, and auto-deleted 48 hours after your hackathon ends unless you export them.",
  },
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const faqRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // ── Hero entrance animations ──────────────────────────
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".hero-badge", { y: 30, opacity: 0, duration: 0.8 }, 0.2)
        .from(".hero-title-line", { y: 60, opacity: 0, stagger: 0.12, duration: 1 }, 0.5)
        .from(".hero-sub", { y: 30, opacity: 0, duration: 0.8 }, 1)
        .from(".hero-cta", { y: 30, opacity: 0, scale: 0.95, duration: 0.7 }, 1.3)
        .from(".hero-stats", { y: 20, opacity: 0, duration: 0.8 }, 1.5)
        .from(".scroll-hint", { opacity: 0, duration: 0.6 }, 2);

      // ── Feature cards ────────────────────────────────────
      featureRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
          y: 60,
          opacity: 0,
          scale: 0.96,
          duration: 0.7,
          delay: i * 0.1,
          ease: "power3.out",
        });
      });

      // ── Generic sections ────────────────────────────────
      sectionRefs.current.forEach((el) => {
        if (!el) return;
        const children = el.querySelectorAll("[data-animate]");
        gsap.from(children, {
          scrollTrigger: {
            trigger: el,
            start: "top 78%",
            toggleActions: "play none none reverse",
          },
          y: 50,
          opacity: 0,
          stagger: 0.12,
          duration: 0.8,
          ease: "power3.out",
        });
      });

      // ── FAQ accordion ────────────────────────────────────
      faqRefs.current.forEach((el) => {
        if (!el) return;
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          y: 30,
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
        });
      });

      // ── Stats counter animation ──────────────────────────
      ScrollTrigger.create({
        trigger: ".stats-section",
        start: "top 80%",
        onEnter: () => {
          document.querySelectorAll(".stat-value").forEach((el) => {
            const text = el.textContent || "";
            const numMatch = text.match(/[\d,.]+/);
            if (!numMatch) return;
            const target = parseFloat(numMatch[0].replace(",", ""));
            const suffix = text.replace(numMatch[0], "");
            const isFloat = numMatch[0].includes(".");
            gsap.from(
              { val: 0 },
              {
                val: target,
                duration: 2,
                ease: "power2.out",
                onUpdate: function () {
                  el.textContent = (isFloat ? this.targets()[0].val.toFixed(1) : Math.round(this.targets()[0].val).toLocaleString()) + suffix;
                },
              }
            );
          });
        },
        once: true,
      });

      // ── Agent cards stagger ──────────────────────────────
      gsap.from(".agent-card", {
        scrollTrigger: {
          trigger: ".agents-section",
          start: "top 75%",
        },
        y: 40,
        opacity: 0,
        stagger: 0.15,
        duration: 0.7,
        ease: "back.out(1.4)",
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <LenisProvider>
      <div className="relative w-full overflow-hidden">

        {/* ─── HERO ─────────────────────────────────────────── */}
        <section ref={heroRef} className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
          {/* Three.js Canvas */}
          <div className="absolute inset-0 z-0">
            <BeaconCanvasComponent />
          </div>

          {/* Radial gradient overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, #030712 75%)",
            }}
          />

          {/* Top nav */}
          <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 lg:px-16">
            <div className="flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="12" stroke="#7c3aed" strokeWidth="1.5" />
                <circle cx="14" cy="14" r="5" fill="#7c3aed" opacity="0.6" />
                <circle cx="14" cy="14" r="2" fill="#a78bfa" />
                <line x1="14" y1="2" x2="14" y2="6" stroke="#7c3aed" strokeWidth="1.5" />
                <line x1="14" y1="22" x2="14" y2="26" stroke="#7c3aed" strokeWidth="1.5" />
                <line x1="2" y1="14" x2="6" y2="14" stroke="#7c3aed" strokeWidth="1.5" />
                <line x1="22" y1="14" x2="26" y2="14" stroke="#7c3aed" strokeWidth="1.5" />
              </svg>
              <span className="font-display font-bold text-xl tracking-tight text-white">Beacon</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
              <a href="#agents" className="hover:text-white transition-colors">AI Agents</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Sign in</button>
              <button className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                  boxShadow: "0 0 20px rgba(124, 58, 237, 0.4)",
                }}>
                Get Early Access
              </button>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="relative z-20 text-center max-w-4xl px-6 pt-20">
            {/* Badge */}
            <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-sm font-medium"
              style={{
                background: "rgba(124, 58, 237, 0.15)",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                color: "#a78bfa",
              }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live · 2,400+ Hackathons Indexed
            </div>

            {/* Title */}
            <h1 className="font-display font-bold leading-[1.05] tracking-tight mb-6">
              {["From Hackathon", "To Winning", "Pitch — Powered", "By AI Agents"].map((line, i) => (
                <span key={i} className="hero-title-line block text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
                  style={{ color: i === 1 ? "transparent" : "#f8fafc" }}>
                  <span className={i === 1 ? "text-gradient" : ""}>{line}</span>
                </span>
              ))}
            </h1>

            {/* Subtitle */}
            <p className="hero-sub text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Beacon scrapes live hackathons, spawns 4 AI agents to debate the perfect idea,
              and generates a presentation-ready deck — so you ship smarter, not harder.
            </p>

            {/* CTAs */}
            <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button className="group relative px-8 py-4 rounded-full font-semibold text-base transition-all hover:scale-105 active:scale-95 overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  boxShadow: "0 0 40px rgba(124, 58, 237, 0.5)",
                }}>
                <span className="relative z-10 flex items-center gap-2 text-white">
                  Start Building Free
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </button>

              <button className="group px-8 py-4 rounded-full font-semibold text-base text-zinc-300 glass-card transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                Watch Demo
              </button>
            </div>

            {/* Stats row */}
            <div className="hero-stats flex flex-wrap items-center justify-center gap-8 md:gap-14">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="font-display font-bold text-2xl md:text-3xl text-white">{s.value}</div>
                  <div className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll hint */}
          <div className="scroll-hint absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-500">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <div className="w-5 h-8 rounded-full border border-zinc-700 flex justify-center pt-1.5">
              <div className="w-1 h-2 rounded-full bg-zinc-500 animate-bounce" />
            </div>
          </div>
        </section>

        {/* ─── FEATURES ─────────────────────────────────────── */}
        <section id="features" className="relative py-32 px-6 lg:px-16">
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)",
            }}
          />

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
                style={{
                  background: "rgba(124, 58, 237, 0.1)",
                  border: "1px solid rgba(124, 58, 237, 0.2)",
                  color: "#a78bfa",
                }}>
                Features
              </div>
              <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-tight" data-animate>
                Everything you need to<br />
                <span className="text-gradient">win the hackathon</span>
              </h2>
              <p className="text-zinc-400 mt-5 max-w-xl mx-auto text-lg" data-animate>
                From discovery to delivery — Beacon handles the entire ideation pipeline
                so you can focus on building.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((f, i) => (
                <div
                  key={f.step}
                  ref={(el) => { featureRefs.current[i] = el; }}
                  className="glass-card rounded-2xl p-7 transition-all duration-500 group cursor-pointer"
                  style={{ "--glow": f.glow } as React.CSSProperties}
                >
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                      style={{ background: `${f.color}22`, color: f.color }}>
                      {f.icon}
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold mb-1" style={{ color: f.color }}>{f.step}</div>
                      <h3 className="font-display font-bold text-xl text-white mb-2">{f.title}</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─────────────────────────────────── */}
        <section id="how-it-works" className="relative py-32 px-6 lg:px-16 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, transparent, rgba(124,58,237,0.03) 50%, transparent)",
            }}
          />

          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
                style={{
                  background: "rgba(124, 58, 237, 0.1)",
                  border: "1px solid rgba(124, 58, 237, 0.2)",
                  color: "#a78bfa",
                }}>
                Pipeline
              </div>
              <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-tight" data-animate>
                From idea to pitch<br />
                <span className="text-gradient">in four steps</span>
              </h2>
            </div>

            {/* Steps with connecting lines */}
            <div className="relative">
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-zinc-800 via-zinc-700/50 to-zinc-800 hidden md:block" />

              {[
                {
                  n: "1",
                  color: "#7c3aed",
                  title: "Find Your Hackathon",
                  desc: "Search through live, upcoming, and past hackathons. Filter by tech stack, themes, prize pool, or location. Save the ones that resonate.",
                  detail: "MLH, DevPost, HackClub, Major League Hacking, and 80+ direct feeds",
                },
                {
                  n: "2",
                  color: "#3b82f6",
                  title: "Our Agents Scrape & Analyze",
                  desc: "Once you bookmark a hackathon, we deep-dive its site. Our agents extract themes, problem statements, and prize categories.",
                  detail: "4 specialist agents read every page and extract key signals",
                },
                {
                  n: "3",
                  color: "#10b981",
                  title: "AI Debate & Idea Selection",
                  desc: "Four agents — Strategist, Designer, Engineer, Business — independently score ideas, then debate head-to-head to rank the best pitches.",
                  detail: "Scores across feasibility, originality, impact, and market fit",
                },
                {
                  n: "4",
                  color: "#ec4899",
                  title: "PPT Generated Instantly",
                  desc: "Pick the winning idea. We pull your linked PPTX template and fill every slide — title, problem, solution, tech stack, timeline — fully generated.",
                  detail: "Editable output in Google Slides, PowerPoint, or PDF",
                },
              ].map((step, i) => (
                <div key={step.n} ref={(el) => { sectionRefs.current[i] = el; }} className="relative flex md:items-center gap-8 mb-16 last:mb-0">
                  {/* Dot */}
                  <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm ml-[calc(2rem-20px)] md:ml-0"
                    style={{
                      background: step.color,
                      boxShadow: `0 0 20px ${step.color}66`,
                      color: "#fff",
                    }}>
                    {step.n}
                  </div>

                  {/* Content */}
                  <div className="flex-1 md:grid md:grid-cols-2 md:gap-12 items-center"
                    style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <div className={i % 2 === 1 ? "md:order-2" : ""}>
                      <h3 className="font-display font-bold text-2xl text-white mb-3" data-animate>{step.title}</h3>
                      <p className="text-zinc-400 mb-3" data-animate>{step.desc}</p>
                      <p className="text-xs font-mono px-3 py-1.5 rounded-full inline-block"
                        style={{
                          background: `${step.color}15`,
                          border: `1px solid ${step.color}33`,
                          color: step.color,
                        }}
                        data-animate>
                        {step.detail}
                      </p>
                    </div>
                    <div className={i % 2 === 1 ? "md:order-1" : ""} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── AI AGENTS SECTION ────────────────────────────── */}
        <section className="agents-section relative py-32 px-6 lg:px-16 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(124,58,237,0.05) 0%, transparent 70%)" }} />

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
                style={{
                  background: "rgba(124, 58, 237, 0.1)",
                  border: "1px solid rgba(124, 58, 237, 0.2)",
                  color: "#a78bfa",
                }}>
                AI Agents
              </div>
              <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
                Four minds.<br />
                <span className="text-gradient">One winning idea.</span>
              </h2>
              <p className="text-zinc-400 mt-5 max-w-xl mx-auto text-lg">
                Each agent is a specialized AI with a distinct perspective. They argue, challenge, and
                score — eliminating weak ideas before they waste your time.
              </p>
            </div>

            {/* Agent grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
              {agents.map((a) => (
                <div key={a.name} className="agent-card glass-card rounded-2xl p-6 text-center transition-all duration-300 group cursor-default">
                  <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                    style={{ filter: `drop-shadow(0 0 12px ${a.color})` }}>
                    {a.symbol}
                  </div>
                  <div className="font-display font-bold text-lg text-white mb-1">{a.name}</div>
                  <div className="text-xs font-mono mt-2 px-2 py-0.5 rounded-full inline-block"
                    style={{
                      background: `${a.color}20`,
                      border: `1px solid ${a.color}40`,
                      color: a.color,
                    }}>
                    {a.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* Debate visualization */}
            <div className="relative glass-card rounded-3xl p-8 lg:p-12 overflow-hidden" data-animate>
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(124,58,237,0.08), transparent)" }} />

              {/* Central idea */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-20 h-20 rounded-full flex items-center justify-center font-display font-bold text-2xl text-white"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                    boxShadow: "0 0 40px rgba(124, 58, 237, 0.5)",
                  }}>
                  💡
                </div>
                <div className="font-display font-bold text-xl text-white text-center">Your Hackathon Problem</div>
                <div className="text-zinc-400 text-sm text-center max-w-xs">
                  The agent debate centers on extracting this hackathon&apos;s core challenge and ranking ideas against it.
                </div>
              </div>

              {/* Agent debate arrows */}
              <div className="grid grid-cols-4 gap-4 mt-10 relative z-10">
                {agents.map((a, i) => (
                  <div key={a.name} className="text-center">
                    <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-2xl mb-2 transition-transform duration-500 hover:scale-110 hover:rotate-12"
                      style={{
                        background: `${a.color}25`,
                        border: `2px solid ${a.color}`,
                        boxShadow: `0 0 15px ${a.color}44`,
                      }}>
                      {a.symbol}
                    </div>
                    <div className="text-xs font-bold text-white">{a.name}</div>
                    <div className="mt-2 h-1 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.1)" }}>
                      <div className="h-full rounded-full"
                        style={{
                          width: `${60 + i * 8}%`,
                          background: `linear-gradient(90deg, ${a.color}, transparent)`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-6 text-xs font-mono text-zinc-500">
                Score breakdown across Feasibility · Originality · Impact · Viability
              </div>
            </div>
          </div>
        </section>

        {/* ─── SOCIAL PROOF / TESTIMONIALS ──────────────────── */}
        <section className="relative py-32 px-6 lg:px-16 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
                style={{
                  background: "rgba(124, 58, 237, 0.1)",
                  border: "1px solid rgba(124, 58, 237, 0.2)",
                  color: "#a78bfa",
                }}>
                Voices
              </div>
              <h2 className="font-display font-bold text-4xl md:text-5xl text-white" data-animate>
                Hackers who shipped <span className="text-gradient">faster</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={t.handle} ref={(el) => { if (el) sectionRefs.current[10 + i] = el; }}
                  className="glass-card rounded-2xl p-7 flex flex-col gap-4 transition-all duration-300"
                  style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="flex gap-1 text-lg" style={{ color: "#7c3aed" }}>★★★★★</div>
                  <p className="text-zinc-300 text-sm leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-auto pt-4 border-t border-zinc-800/50">
                    <div className="font-display font-bold text-white text-sm">{t.name}</div>
                    <div className="text-zinc-500 text-xs">{t.role} · {t.handle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA SECTION ───────────────────────────────────── */}
        <section className="relative py-40 px-6 lg:px-16 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 80% 70% at 50% 60%, rgba(124,58,237,0.12) 0%, transparent 65%)",
            }}
          />
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="font-display font-bold text-5xl md:text-6xl lg:text-7xl text-white leading-tight mb-6" data-animate>
              Ready to build<br />
              <span className="text-gradient">something that wins?</span>
            </h2>
            <p className="text-zinc-400 text-lg md:text-xl mb-12 max-w-xl mx-auto" data-animate>
              Join 3,200+ hackers who skipped the blank-page paralysis and went straight to building with Beacon.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4" data-animate>
              <button className="group relative px-10 py-4 rounded-full font-bold text-base transition-all hover:scale-105 active:scale-95 overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9, #7c3aed)",
                  backgroundSize: "200% 200%",
                  animation: "gradient-shift 3s ease infinite",
                  boxShadow: "0 0 60px rgba(124, 58, 237, 0.5)",
                }}>
                <span className="relative z-10 flex items-center gap-2 text-white">
                  Get Early Access — It&apos;s Free
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
              <button className="px-10 py-4 rounded-full font-semibold text-base text-zinc-300 glass-card transition-all hover:scale-105 active:scale-95">
                Schedule a Demo
              </button>
            </div>
            <p className="text-zinc-600 text-xs mt-6" data-animate>
              No credit card required · 5-minute setup · Cancel anytime
            </p>
          </div>
        </section>

        {/* ─── FAQ ───────────────────────────────────────────── */}
        <section id="faq" className="relative py-32 px-6 lg:px-16">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
                style={{
                  background: "rgba(124, 58, 237, 0.1)",
                  border: "1px solid rgba(124, 58, 237, 0.2)",
                  color: "#a78bfa",
                }}>
                FAQ
              </div>
              <h2 className="font-display font-bold text-4xl md:text-5xl text-white" data-animate>
                Questions we get <span className="text-gradient">all the time</span>
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              {faqs.map((faq, i) => (
                <div key={faq.q} ref={(el) => { faqRefs.current[i] = el; }}
                  className="glass-card rounded-xl overflow-hidden transition-all duration-300 hover:border-zinc-700/50">
                  <div className="px-7 py-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                        style={{ background: "#7c3aed", boxShadow: "0 0 8px #7c3aed" }} />
                      <div>
                        <h3 className="font-display font-semibold text-white text-base leading-snug">{faq.q}</h3>
                        <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{faq.a}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FOOTER ───────────────────────────────────────── */}
        <footer className="relative border-t border-zinc-800/50 py-16 px-6 lg:px-16">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="12" stroke="#7c3aed" strokeWidth="1.5" />
                    <circle cx="14" cy="14" r="5" fill="#7c3aed" opacity="0.6" />
                    <circle cx="14" cy="14" r="2" fill="#a78bfa" />
                    <line x1="14" y1="2" x2="14" y2="6" stroke="#7c3aed" strokeWidth="1.5" />
                    <line x1="14" y1="22" x2="14" y2="26" stroke="#7c3aed" strokeWidth="1.5" />
                    <line x1="2" y1="14" x2="6" y2="14" stroke="#7c3aed" strokeWidth="1.5" />
                    <line x1="22" y1="14" x2="26" y2="14" stroke="#7c3aed" strokeWidth="1.5" />
                  </svg>
                  <span className="font-display font-bold text-lg text-white">Beacon</span>
                </div>
                <p className="text-zinc-500 text-sm max-w-xs">
                  AI-powered hackathon idea generation.<br />Built for hackers, by hackers.
                </p>
              </div>
              <div className="flex flex-wrap gap-8 text-sm text-zinc-500">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Twitter</a>
                <a href="#" className="hover:text-white transition-colors">GitHub</a>
                <a href="#" className="hover:text-white transition-colors">Discord</a>
              </div>
            </div>
            <div className="mt-10 pt-8 border-t border-zinc-800/50 text-center">
              <p className="text-zinc-600 text-xs">© 2026 Beacon. All rights reserved. — Built with 💜 by hackers, for hackers.</p>
            </div>
          </div>
        </footer>

      </div>
    </LenisProvider>
  );
}
