'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Icon } from '@iconify/react';

gsap.registerPlugin(ScrollTrigger);

interface ProblemItem {
  id: number;
  icon: string;
  title: string;
  description: string;
  tags: string[];
  accentColor: 'amber' | 'red' | 'orange';
  extra?: React.ReactNode;
}

const PROBLEMS: ProblemItem[] = [
  {
    id: 1,
    icon: 'lucide:search',
    title: 'Endless Hackathon Hunting',
    description: 'The "Discovery Fatigue." Scrolling through Devfolio, Unstop, and Devpost for hours, comparing prizes instead of problems. You haven\'t even started, and you\'re already exhausted.',
    tags: ['#DiscoveryDebt', '#LeadLoss'],
    accentColor: 'amber',
  },
  {
    id: 2,
    icon: 'lucide:puzzle',
    title: 'Analysis Paralysis',
    description: 'Five tracks, four team members, zero decisions. You spend the first night debating tech stacks and niche problem statements while other teams are already pushing their first commit.',
    tags: ['#DecisionDebt'],
    accentColor: 'red',
    extra: <div className="h-1 w-full overflow-hidden rounded-full bg-red-500/10"><div className="h-full w-3/4 animate-pulse rounded-full bg-red-500" /></div>,
  },
  {
    id: 3,
    icon: 'lucide:target',
    title: 'The Alignment Gap',
    description: "You build a technical masterpiece that completely misses the judge's criteria. High-quality code for the wrong problem statement is still a losing project.",
    tags: ['#AlignmentGap'],
    accentColor: 'orange',
    extra: <div className="flex items-center gap-4 font-mono text-xs text-orange-500"><Icon icon="lucide:alert-triangle" width={13} /> JUDGE FEEDBACK: "Interesting tech, but why this problem?"</div>,
  },
  {
    id: 4,
    icon: 'lucide:presentation',
    title: 'PPT Panic Attack',
    description: "Submission is in 30 minutes. You're still screen-recording your buggy demo and wrestling with Canva. The presentation shouldn't be the hardest part of the hack.",
    tags: ['#PresentationDebt'],
    accentColor: 'amber',
    extra: <div className="inline-block rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-2"><p className="text-sm text-amber-200">Average time for slide decks: <span className="font-bold">4.2 Hours</span></p></div>,
  },
  {
    id: 5,
    icon: 'lucide:clock',
    title: 'Time Hemorrhage',
    description: "The clock is your enemy, not the code. Most teams lose because they mismanage the most finite resource: 36 hours. You lost before you even typed `npm install`.",
    tags: ['#TimeDebt'],
    accentColor: 'red',
    extra: <div className="mt-4 flex h-2 gap-1"><div className="w-1/12 bg-red-500" /><div className="w-1/12 bg-red-500 opacity-80" /><div className="w-1/12 bg-red-500 opacity-60" /><div className="w-1/12 bg-red-500 opacity-40" /><div className="w-1/12 bg-red-500 opacity-20" /><div className="flex-1 bg-zinc-800" /></div>,
  },
];

const accentColorMap = {
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500', hoverBorder: 'group-hover:border-amber-500/30' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-500', hoverBorder: 'group-hover:border-red-500/30' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-500', hoverBorder: 'group-hover:border-orange-500/30' },
};

export default function Problem() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];

    cards.forEach((card, index) => {
      // Fade in from below when entering
      gsap.fromTo(card,
        { opacity: 0, y: 80, filter: 'blur(4px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            end: 'top 50%',
            scrub: 1,
          },
        }
      );

      // Fade out going up
      gsap.fromTo(card,
        { opacity: 1, y: 0 },
        {
          opacity: 0,
          y: -80,
          filter: 'blur(4px)',
          duration: 0.8,
          ease: 'power3.in',
          scrollTrigger: {
            trigger: card,
            start: 'bottom 50%',
            end: 'bottom 15%',
            scrub: 1,
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const getColorClasses = (color: 'amber' | 'red' | 'orange') => accentColorMap[color];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Space+Grotesk:wght@300..700&display=swap');

        :root {
          --bg-primary: #07091A;
          --bg-secondary: #111F40;
          --bg-card: #1A2E54;
          --accent-blue: #4A9EFF;
          --accent-amber: #FFD04A;
          --accent-green: #2ECC71;
          --text-primary: #E8F4FF;
          --text-secondary: #8BAFD4;
          --text-dim: #4A6A8A;
          --border-line: #253D6E;
        }

        body {
          background-color: #050505;
          color: #E8F4FF;
          font-family: 'DM Sans', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .font-display {
          font-family: 'Space Grotesk', sans-serif;
        }

        .font-mono {
          font-family: 'JetBrains Mono', monospace;
        }

        .glass {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .card-active {
          border-color: rgba(249, 115, 22, 0.4) !important;
          background: rgba(249, 115, 22, 0.03) !important;
        }

        .glow-dot {
          box-shadow: 0 0 15px currentColor;
        }

        .problem-card {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .problem-card:hover .glass {
          border-color: rgba(255, 255, 255, 0.1);
        }
      `}</style>

      <section ref={sectionRef} className="relative min-h-screen bg-[#050505]">
        {/* Ambient Background Glows */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full opacity-20">
          <div className="absolute left-[5%] top-[10%] h-[400px] w-[400px] rounded-full bg-orange-500/20 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[5%] h-[500px] w-[500px] rounded-full bg-red-500/10 blur-[150px]" />
        </div>

        <main className="relative mx-auto max-w-[1440px] px-8 py-32 lg:px-16">
          {/* Single centered column for problem cards */}
          <div className="mx-auto max-w-4xl space-y-12 pb-32">
            {PROBLEMS.map((problem, index) => {
              const colors = getColorClasses(problem.accentColor);
              const isBgGradient = problem.id === 5;

              return (
                <div
                  key={problem.id}
                  ref={(el) => { cardRefs.current[index] = el; }}
                  className="problem-card group relative"
                >
                  <div className={`glass p-10 rounded-[2.5rem] ${isBgGradient ? 'bg-gradient-to-br from-red-500/5 to-transparent border-red-500/20 group-hover:border-red-500/50' : `border-white/5 ${colors.hoverBorder}`} transition-all`}>
                    <div className="flex flex-col gap-10 md:flex-row">
                      <div className="shrink-0">
                        <div className={`w-24 h-24 rounded-3xl ${colors.bg} border ${colors.border} flex items-center justify-center ${colors.text} relative`}>
                          <Icon icon={problem.icon} width={40} />
                          <div className={`absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${problem.accentColor === 'red' ? 'text-white' : 'text-black'} ${problem.accentColor === 'amber' ? 'bg-amber-500' : problem.accentColor === 'red' ? 'bg-red-500' : 'bg-orange-500'}`}>
                            {String(index + 1).padStart(2, '0')}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-display text-3xl font-bold text-white">{problem.title}</h3>
                        <p className="text-lg leading-relaxed text-zinc-400">{problem.description}</p>
                        <div className="flex flex-wrap gap-3 pt-4">
                          {problem.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-zinc-900 px-3 py-1 font-mono text-xs uppercase text-zinc-500">
                              {tag}
                            </span>
                          ))}
                        </div>
                        {problem.extra && <div className="pt-2">{problem.extra}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-4 text-zinc-500">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Scroll to explore solution</span>
          <div className="h-12 w-px bg-gradient-to-b from-orange-500 to-transparent" />
        </div>
      </section>
    </>
  );
}
