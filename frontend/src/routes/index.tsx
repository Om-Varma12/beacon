import { createFileRoute } from "@tanstack/react-router";
import { Agents } from "@/components/beacon/Agents";
import { Comparison } from "@/components/beacon/Comparison";
import { Demo } from "@/components/beacon/Demo";
import { FAQ } from "@/components/beacon/FAQ";
import { Features } from "@/components/beacon/Features";
import { FinalCTA } from "@/components/beacon/FinalCTA";
import { Footer } from "@/components/beacon/Footer";
import { Hero } from "@/components/beacon/Hero";
import { HowItWorks } from "@/components/beacon/HowItWorks";
import { Navbar } from "@/components/beacon/Navbar";
import { ParticleField } from "@/components/beacon/ParticleField";
import { Pricing } from "@/components/beacon/Pricing";
import { Problem } from "@/components/beacon/Problem";
import { Solution } from "@/components/beacon/Solution";
import { Stats } from "@/components/beacon/Stats";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beacon — AI-Powered Hackathon Intelligence Platform" },
      {
        name: "description",
        content:
          "Beacon discovers hackathons, runs multi-agent AI debate on themes, and generates submission-ready pitch decks and docs — in under 5 minutes.",
      },
      { property: "og:title", content: "Beacon — AI Hackathon Intelligence" },
      {
        property: "og:description",
        content:
          "Win hackathons. Let AI fight for your ideas. 4 agents discover, debate, and ship submission assets.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg-primary)]">
      <ParticleField
        density={70}
        className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-60"
      />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Problem />
        <Solution />
        <HowItWorks />
        <Agents />
        <Demo />
        <Features />
        <Comparison />
        <Stats />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
