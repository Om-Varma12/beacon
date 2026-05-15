import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { useNavbar } from "../context/NavbarContext";

interface ProblemStatement {
  id?: number;
  title?: string | null;
  description?: string | null;
  type?: string | null;
}

interface ResourceItem {
  type: "ppt" | "doc" | "pdf" | "link";
  name: string;
  url: string;
  content?: string;
}

interface Prize {
  rank: string;
  amount: string;
  currency: string;
  includes?: string;
}

interface RewardItem {
  rank: string;
  currency: string;
  label: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface HackathonViewModel {
  id: string;
  title: string;
  organizer: string;
  deadline: string;
  unstopLink: string;
  mode: "remote" | "hybrid" | "offline";
  teamSize: string;
  fee: string;
  description: string;
  themes: string[];
  problemStatements: Array<{
    id: number;
    title: string;
    description: string;
  }>;
  rules: string[];
  judgingCriteria: string[];
  submissionRequirements: string[];
  prizes: Prize[];
  rewardItems: RewardItem[];
  resources: ResourceItem[];
}

interface BackendHackathon {
  id: number | string;
  external_id?: number | string | null;
  title?: string | null;
  description?: string | null;
  college_name?: string | null;
  team_size?: unknown;
  mode?: string | null;
  is_paid?: boolean | null;
  url?: string | null;
  start_date?: string | null;
  deadline?: string | null;
  prizes?: Array<{
    rank?: string | null;
    cash?: number | null;
    currencyCode?: string | null;
    others?: string | null;
  }> | null;
  created_at?: string | null;
  updated_at?: string | null;
  resources?: Array<{
    id?: number | string | null;
    resource_type?: string | null;
    title?: string | null;
    url?: string | null;
  }> | null;
  problem_statements?: ProblemStatement[];
}

interface HackathonResponse {
  success: boolean;
  data: BackendHackathon | null;
  error?: string;
}

interface FinalIdea {
  title: string;
  problemStatement: string;
  solutionDescription: string;
  keyFeatures: string[];
  targetUsers: string;
  whyThisWins: string;
  evaluation: {
    innovation: number;
    feasibility: number;
    impact: number;
    execution: number;
  };
  alternatives: Array<{
    title: string;
    score: number;
    summary: string;
  }>;
}

interface AgentCard {
  name: string;
  ideaTitle: string;
  description: string;
  pros: string[];
  cons: string[];
  score: number;
  reasoning: string;
}

interface Round {
  id: number;
  name: string;
  agents: AgentCard[];
  judgeFeedback: string;
  penalties: string[];
  ranking: number[];
}

interface HackathonQueryResult {
  hackathon: BackendHackathon;
}

type TabType = "overview" | "analysis" | "final-idea" | "assets" | "chat";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function formatDate(value?: string | null): string {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getDaysUntil(value?: string | null): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const diffInMs = date.getTime() - new Date().getTime();
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
}

function normalizeMode(value?: string | null): "remote" | "hybrid" | "offline" {
  const normalized = (value ?? "").trim().toLowerCase();

  if (
    normalized === "remote" ||
    normalized === "hybrid" ||
    normalized === "offline"
  ) {
    return normalized;
  }

  return "remote";
}

function normalizeTeamSize(value: unknown): string {
  if (value == null || value === "") return "TBD";

  if (typeof value === "string") {
    try {
      return normalizeTeamSize(JSON.parse(value) as unknown);
    } catch {
      return value;
    }
  }

  if (Array.isArray(value)) {
    if (value.length === 2) {
      return `${value[0]}-${value[1]}`;
    }

    return value.map((item) => String(item)).join(", ");
  }

  if (typeof value === "object") {
    const maybeRange = value as {
      min?: unknown;
      max?: unknown;
      size?: unknown;
    };

    if (maybeRange.min != null && maybeRange.max != null) {
      return `${maybeRange.min}-${maybeRange.max}`;
    }

    if (maybeRange.size != null) {
      return String(maybeRange.size);
    }
  }

  return String(value);
}

function modeBadgeClass(mode: "remote" | "hybrid" | "offline"): string {
  return {
    remote: "mode-badge-remote",
    hybrid: "mode-badge-hybrid",
    offline: "mode-badge-offline",
  }[mode];
}

function formatPrizeAmount(
  cash?: number | null,
  currencyCode?: string | null,
  others?: string | null,
): string {
  if (cash != null) {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode ?? "USD",
        maximumFractionDigits: 0,
      }).format(cash);
    } catch {
      return `${currencyCode ?? ""} ${cash}`.trim();
    }
  }

  return others ?? "Included";
}

function mapResourceType(
  resourceType?: string | null,
  url?: string | null,
): ResourceItem["type"] {
  const normalized = (resourceType ?? "").toLowerCase();

  if (normalized.includes("pdf")) return "pdf";
  if (normalized.includes("ppt") || normalized.includes("presentation"))
    return "ppt";
  if (normalized.includes("doc") || normalized.includes("word")) return "doc";
  if ((url ?? "").startsWith("http")) return "link";

  return "link";
}

function buildViewModel(
  data: BackendHackathon | null,
): HackathonViewModel | null {
  if (!data) return null;

  const teamSize = normalizeTeamSize(data.team_size);
  const problemStatements = (data.problem_statements ?? []).map(
    (problem, index) => ({
      id: problem.id ?? index + 1,
      title: problem.title ?? `Problem ${index + 1}`,
      description: problem.description ?? "No description available.",
    }),
  );

  const themes =
    problemStatements.length > 0
      ? problemStatements.map((problem) => problem.title)
      : [data.college_name ?? "General Innovation"];

  const prizes: Prize[] = (data.prizes ?? [])
    .filter((prize) => prize.cash != null)
    .map((prize) => ({
      rank: prize.rank ?? "Prize",
      amount: formatPrizeAmount(prize.cash, prize.currencyCode, prize.others),
      currency: prize.currencyCode ?? "INR",
      includes: prize.others ?? undefined,
    }));

  const rewardItems: RewardItem[] = (data.prizes ?? [])
    .filter((prize) => prize.cash == null)
    .map((prize) => ({
      rank: prize.rank ?? "Reward",
      currency: prize.currencyCode ?? "INR",
      label: prize.others ?? "Included",
    }));

  const resources: ResourceItem[] = (data.resources ?? []).map((resource) => ({
    type: mapResourceType(resource.resource_type, resource.url),
    name: resource.title ?? "Resource",
    url: resource.url ?? "#",
  }));

  return {
    id: String(data.id),
    title: data.title ?? "Untitled Hackathon",
    organizer: data.college_name ?? "Unknown organizer",
    deadline: data.deadline ?? "",
    unstopLink: data.url ?? "",
    mode: normalizeMode(data.mode),
    teamSize,
    fee: data.is_paid ? "paid" : "free",
    description: data.description ?? "No description available.",
    themes,
    problemStatements,
    rules: [
      "Teams must follow the published team size limit",
      "Projects should be original work",
      "Final submission should include source code and documentation",
      "Use of third-party libraries is allowed if properly attributed",
      "Follow the hackathon rules published on the source listing",
    ],
    judgingCriteria: [
      "Innovation and Creativity",
      "Technical Complexity",
      "User Experience",
      "Scalability",
      "Presentation Quality",
    ],
    submissionRequirements: [
      "Source code repository",
      "Technical documentation",
      "Demo video or presentation",
      "README with setup instructions",
      "Any requested attachments from the source listing",
    ],
    prizes,
    rewardItems,
    resources,
  };
}

export default function HackathonDetailApi() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isNavbarVisible } = useNavbar();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm here to help you analyze this hackathon and develop your winning idea. What would you like to explore?",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const hackathonQuery = useQuery<HackathonQueryResult, Error>({
    queryKey: ["hackathon", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/hackathons/${id}`);

      if (response.status === 404) {
        throw new Error("Hackathon not found.");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch hackathon: ${response.status}`);
      }

      const result = (await response.json()) as HackathonResponse;

      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Backend returned no hackathon data");
      }

      return { hackathon: result.data };
    },
  });

  const [aiAnalysis] = useState({
    recommendedTheme: {
      name: "Opportunity Analysis",
      confidence: 87,
      lastAnalyzed: new Date(),
    },
    rounds: [
      {
        id: 1,
        name: "Round 1",
        agents: [
          {
            name: "Business Agent",
            ideaTitle: "Market-Fit Solution",
            description:
              "Commercially viable concept based on the hackathon listing",
            pros: [
              "Clear market need",
              "Easy to position",
              "Monetization potential",
            ],
            cons: ["Needs validation", "Competitive space", "Execution risk"],
            score: 78,
            reasoning:
              "Strong business angle but needs sharper differentiation.",
          },
          {
            name: "Innovation Agent",
            ideaTitle: "Novel Technical Approach",
            description:
              "A more technical solution aligned to the problem statements",
            pros: [
              "High novelty",
              "Strong technical depth",
              "Better competition fit",
            ],
            cons: ["Harder to build", "May need data", "Potential scope creep"],
            score: 85,
            reasoning: "Best balance of novelty and feasibility.",
          },
          {
            name: "Practical Agent",
            ideaTitle: "Fast MVP",
            description: "A simpler implementation that can ship quickly",
            pros: ["Fast to build", "Lower risk", "Simple demo"],
            cons: ["Less impressive", "Lower score ceiling", "Limited depth"],
            score: 72,
            reasoning:
              "Reliable, but not as competitive as the innovative option.",
          },
        ],
        judgeFeedback:
          "Round 1 narrows the field. The technical solution has the clearest upside.",
        penalties: [],
        ranking: [2, 1, 3],
      },

      {
        id: 2,
        name: "Round 2",
        agents: [
          {
            name: "Business Agent",
            ideaTitle: "Market-Fit Solution (refined)",
            description:
              "Refined after quick market validation and competitor scan",
            pros: ["Stronger positioning", "Clarified monetization"],
            cons: ["Still needs pilots", "May require partnerships"],
            score: 80,
            reasoning: "Improved differentiation after additional research.",
          },
          {
            name: "Innovation Agent",
            ideaTitle: "Novel Technical Approach (optimized)",
            description:
              "Technical approach tightened to reduce scope and risk",
            pros: ["Maintains novelty", "More implementable"],
            cons: ["Requires focused engineering effort"],
            score: 87,
            reasoning:
              "Reduced scope increases feasibility while keeping innovation.",
          },
          {
            name: "Practical Agent",
            ideaTitle: "Fast MVP (improved)",
            description:
              "MVP plan with prioritized features for demo readiness",
            pros: ["Very fast to ship", "Demo-friendly"],
            cons: ["Lower long-term differentiation"],
            score: 75,
            reasoning: "Better prioritized feature set raises competitiveness.",
          },
        ],
        judgeFeedback: "Round 2 incorporates market checks and scope trimming.",
        penalties: [],
        ranking: [2, 1, 3],
      },

      {
        id: 3,
        name: "Round 3",
        agents: [
          {
            name: "Business Agent",
            ideaTitle: "Market-Fit Solution (final)",
            description: "Final pitch with go-to-market clarity",
            pros: ["Clear roadmap", "Monetization + partners"],
            cons: ["Execution heavy"],
            score: 82,
            reasoning:
              "Convincing commercial narrative but needs execution plan.",
          },
          {
            name: "Innovation Agent",
            ideaTitle: "Novel Technical Approach (final)",
            description: "Final technical approach with risks mitigated",
            pros: ["High novelty", "Feasible with focused scope"],
            cons: ["Requires skilled engineers"],
            score: 89,
            reasoning:
              "Leads on both innovation and feasibility after optimizations.",
          },
          {
            name: "Practical Agent",
            ideaTitle: "Fast MVP (final)",
            description: "Polished MVP with clear demo and deployment plan",
            pros: ["Demo ready", "Low risk"],
            cons: ["May not win on novelty alone"],
            score: 77,
            reasoning: "Solid execution candidate for quick wins.",
          },
        ],
        judgeFeedback:
          "Round 3 finalizes scoring; Innovation Agent edges ahead.",
        penalties: [],
        ranking: [2, 1, 3],
      },
    ] as Round[],
    finalIdea: {
      title: "Hackathon Opportunity Platform",
      problemStatement:
        "The hackathon listing contains useful detail, but it is not presented as a guided action plan for participants.",
      solutionDescription:
        "A structured experience that turns the listing into a clear overview, analysis workflow, and execution plan.",
      keyFeatures: [
        "Live hackathon metadata from the backend",
        "Problem statement extraction",
        "Rules and submission checklist",
        "Execution-oriented summary view",
        "Tab-based workflow for participants",
      ],
      targetUsers: "Hackathon participants, organizers, and internal analysts",
      whyThisWins:
        "It turns the raw listing into a participant-friendly workspace without losing the source data.",
      evaluation: {
        innovation: 88,
        feasibility: 90,
        impact: 92,
        execution: 85,
      },
      alternatives: [
        {
          title: "Static Listing View",
          score: 72,
          summary:
            "Useful, but does not add enough value beyond the source page.",
        },
        {
          title: "Fully Generated AI Plan",
          score: 80,
          summary:
            "More ambitious, but less grounded in the actual hackathon data.",
        },
      ],
    } satisfies FinalIdea,
  });

  const selectedIdea = aiAnalysis.finalIdea;
  const analysisRound = aiAnalysis.rounds[0];
  const sortedAnalysisAgents = [...analysisRound.agents].sort(
    (a, b) => b.score - a.score,
  );

  const executionPlan = [
    {
      day: 1,
      title: "Research & Planning",
      tasks: [
        "Review the hackathon listing",
        "Identify requirements",
        "Map the problem statements",
        "Define team scope",
      ],
      completed: false,
    },
    {
      day: 2,
      title: "Architecture Design",
      tasks: [
        "Create page structure",
        "Design data flow",
        "Set API contracts",
        "Plan UI sections",
      ],
      completed: false,
    },
    {
      day: 3,
      title: "Core Development",
      tasks: [
        "Build detail page",
        "Wire backend data",
        "Render the problem statements",
        "Add interactions",
      ],
      completed: false,
    },
    {
      day: 4,
      title: "Refinement & Testing",
      tasks: [
        "Polish styling",
        "Validate data mapping",
        "Check missing fields",
        "Fix edge cases",
      ],
      completed: false,
    },
    {
      day: 5,
      title: "Final Preparation",
      tasks: [
        "Review UX",
        "Confirm navigation",
        "Check live endpoint",
        "Prepare handoff",
      ],
      completed: false,
    },
  ];

  const hackathon = hackathonQuery.data?.hackathon ?? null;
  const loading = hackathonQuery.isPending;
  const error = hackathonQuery.error?.message ?? null;

  const viewModel = useMemo(() => buildViewModel(hackathon), [hackathon]);
  const daysLeft = useMemo(
    () => getDaysUntil(viewModel?.deadline),
    [viewModel?.deadline],
  );

  const tabs = [
    { id: "overview" as TabType, label: "Overview" },
    { id: "analysis" as TabType, label: "AI Analysis" },
    { id: "final-idea" as TabType, label: "Final Idea" },
    { id: "assets" as TabType, label: "Assets" },
    { id: "chat" as TabType, label: "Chat" },
  ];

  const suggestions = [
    "Explain this idea",
    "Improve this idea",
    "Give MVP plan",
    "Suggest tech stack",
  ];

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, newMessage]);
    setChatInput("");

    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Based on the listing, I would center the solution on the actual problem statements and keep the scope tightly aligned to the published requirements.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setChatInput(suggestion);
  };

  const handleRunAnalysis = () => {
    setIsAnalysisRunning(true);
    setTimeout(() => {
      setIsAnalysisRunning(false);
    }, 3000);
  };

  const lastSaved = new Date();
  const sectionHeadingClass =
    "font-display text-lg lg:text-xl text-forest tracking-tight mb-3";
  const labelHeadingClass =
    "font-display text-base lg:text-lg text-forest tracking-tight mb-2";

  return (
    <div className="min-h-screen bg-mosaic">
      <div className="mosaic-bg" />
      <div className="relative z-10 pt-24 px-6 lg:px-16 pb-16">
        <div className="bg-white border border-grid/20 p-8 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div className="flex-1">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="mb-4 inline-flex items-center gap-2 border border-grid/20 bg-white px-4 py-2 font-mono text-[10px] tracking-widest uppercase text-forest transition-colors hover:border-forest"
              >
                <Icon icon="lucide:arrow-left" className="text-sm" />
                Back to listing
              </button>

              <h1 className="font-display text-4xl lg:text-5xl text-forest tracking-tight mb-2">
                {viewModel?.title ?? "Loading hackathon..."}
              </h1>
              <p className="text-grid/60 text-sm mb-4">
                Organized by {viewModel?.organizer ?? "Loading organizer..."}
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  className={`px-3 py-1 font-mono text-[10px] tracking-widest uppercase border ${viewModel ? modeBadgeClass(viewModel.mode) : "mode-badge-remote"}`}
                >
                  {(viewModel?.mode ?? "remote").toUpperCase()}
                </span>
                <span className="px-3 py-1 font-mono text-[10px] tracking-widest uppercase border border-grid/30">
                  TEAM: {viewModel?.teamSize ?? "TBD"}
                </span>
                <span
                  className={`px-3 py-1 font-mono text-[10px] tracking-widest uppercase border ${viewModel?.fee === "free" ? "mode-badge-remote" : "mode-badge-offline"}`}
                >
                  {(viewModel?.fee ?? "free").toUpperCase()}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Icon icon="lucide:calendar" className="text-grid/60" />
                <span
                  className={`font-mono text-sm ${daysLeft != null && daysLeft <= 7 ? "deadline-urgent" : "deadline-normal"}`}
                >
                  {formatDate(viewModel?.deadline)}
                </span>
                <span className="font-mono text-[9px] text-grid/40 uppercase ml-2">
                  {daysLeft == null
                    ? "TBD"
                    : daysLeft > 0
                      ? `${daysLeft} DAYS LEFT`
                      : "DEADLINE PASSED"}
                </span>
              </div>
            </div>

            <div className="lg:w-100">
              <div className="bg-paper border border-grid/20 p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <Icon icon="lucide:brain-circuit" className="text-forest" />
                  <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">
                    AI Recommended Theme
                  </span>
                </div>
                <h3 className="font-display text-xl text-forest mb-2">
                  {aiAnalysis.recommendedTheme.name}
                </h3>
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[9px] text-grid/60">
                      Confidence
                    </span>
                    <span className="font-mono text-xs text-forest">
                      {aiAnalysis.recommendedTheme.confidence}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-grid/10 rounded-none overflow-hidden">
                    <div
                      className="h-full bg-forest transition-all duration-500"
                      style={{
                        width: `${aiAnalysis.recommendedTheme.confidence}%`,
                      }}
                    />
                  </div>
                </div>
                <p className="font-mono text-[8px] text-grid/40 uppercase mb-4">
                  Based on multi-agent analysis
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleRunAnalysis}
                    disabled={isAnalysisRunning}
                    className="flex-1 bg-forest text-white py-2 px-4 font-mono text-[10px] tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isAnalysisRunning ? (
                      <span className="flex items-center justify-center space-x-2">
                        <Icon icon="lucide:loader-2" className="animate-spin" />
                        <span>Analyzing...</span>
                      </span>
                    ) : (
                      "Run AI Analysis"
                    )}
                  </button>
                  <button className="flex-1 border border-grid/30 py-2 px-4 font-mono text-[10px] tracking-widest uppercase hover:bg-forest hover:text-white transition-all">
                    Re-run
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`bg-white border-b border-grid/20 sticky z-40 mb-6 transition-all duration-300 ${isNavbarVisible ? "top-16" : "top-0"}`}
        >
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? "true" : "false"}
                className={`px-6 py-4 font-mono text-[10px] tracking-widest uppercase transition-all relative flex items-center gap-2 border-b-2 ${
                  activeTab === tab.id
                    ? "bg-(--forest) text-(--paper) border-(--forest)"
                    : "text-grid/60 border-transparent hover:text-forest hover:border-grid/40"
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="inline sm:hidden">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6">
          <div
            className={`transition-all duration-300 ${
              (activeTab === "analysis" || activeTab === "final-idea") &&
              !isChatExpanded
                ? "w-[70%]"
                : "w-full"
            }`}
          >
            {loading && (
              <div className="bg-white border border-grid/20 p-6 text-center font-mono text-xs tracking-widest uppercase text-grid/60">
                Loading hackathon...
              </div>
            )}

            {!loading && error && (
              <div className="bg-white border border-grid/20 p-6 text-center">
                <p className="font-mono text-xs tracking-widest uppercase text-coral">
                  Unable to load hackathon
                </p>
                <p className="mt-3 text-sm text-grid/70">{error}</p>
              </div>
            )}

            {!loading && !error && viewModel && activeTab === "overview" && (
              <div className="space-y-8">
                <section className="bg-white border border-grid/20 p-6">
                  <h2 className="font-display text-2xl text-forest mb-4">
                    Hackathon Info
                  </h2>

                  <div className="mb-6">
                    <h3 className={sectionHeadingClass}>Description</h3>
                    <div
                      className="text-sm text-grid/80 leading-relaxed space-y-4 [&_strong]:inline [&_strong]:font-semibold [&_strong]:text-grid/90 [&_strong]:mr-1 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:leading-relaxed [&_li>strong]:block [&_li>strong]:mb-1"
                      dangerouslySetInnerHTML={{
                        __html: viewModel.description,
                      }}
                    />
                  </div>

                  <div className="mb-6">
                    <h3 className={sectionHeadingClass}>Problem Statements</h3>
                    <div className="space-y-3">
                      {viewModel.problemStatements.map((ps) => (
                        <div
                          key={ps.id}
                          className="border border-grid/20 p-4 hover:border-forest transition-colors"
                        >
                          <h4 className={labelHeadingClass}>{ps.title}</h4>
                          <p className="text-sm text-grid/80 leading-relaxed">
                            {ps.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="bg-white border border-grid/20 p-6">
                  <h2 className="font-display text-2xl text-forest mb-4">
                    Prize Pool
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {viewModel?.prizes.map((prize) => (
                      <div
                        key={prize.rank}
                        className="border border-grid/20 p-4 hover:border-forest transition-colors"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-mono text-[10px] font-bold tracking-[0.15em] uppercase text-forest">
                            {prize.rank}
                          </span>
                          <span className="font-mono text-[9px] uppercase text-grid/60">
                            {prize.currency}
                          </span>
                        </div>

                        <div className="py-2">
                          <h3 className="font-display text-4xl font-bold text-forest tracking-tighter">
                            {prize.amount}
                          </h3>
                        </div>

                        {prize.includes && (
                          <div className="pt-3">
                            <p className="font-mono text-[9px] tracking-widest uppercase text-grid/50 mb-2">
                              INCLUDES
                            </p>
                            <p className="text-[13px] text-forest leading-relaxed">
                              {prize.includes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {viewModel?.rewardItems.length ? (
                    <div className="mt-8">
                      <h3 className={sectionHeadingClass}>Other Rewards</h3>
                      <div className="space-y-3">
                        {viewModel.rewardItems.map((reward) => (
                          <div
                            key={reward.rank}
                            className="border border-grid/20 p-5 hover:border-forest transition-colors"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-mono text-[10px] tracking-widest uppercase text-grid/60 mb-1">
                                  Included
                                </p>
                                <p className="font-display text-lg text-forest">
                                  {reward.rank}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-mono text-[10px] tracking-widest uppercase text-grid/60 mb-1">
                                  Type
                                </p>
                                <p className="font-mono text-xs text-forest">
                                  {reward.currency}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-8">
                    <p className="font-mono text-[9px] text-grid/40 tracking-widest uppercase">
                      * ALL PRIZES ARE SUBJECT TO TERMS AND CONDITIONS DEFINED
                      BY THE ORGANIZER
                    </p>
                  </div>
                </section>

                <section className="bg-white border border-grid/20 p-6">
                  <h2 className="font-display text-2xl text-forest mb-4">
                    Resources
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewModel.unstopLink && (
                      <div className="border border-grid/20 p-4 hover:border-forest transition-colors flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-paper border border-grid/20 flex items-center justify-center">
                            <Icon
                              icon="lucide:external-link"
                              className="text-forest"
                            />
                          </div>
                          <span className="font-mono text-xs text-forest">
                            Original Hackathon Link
                          </span>
                        </div>
                        <a
                          href={viewModel.unstopLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 border border-grid/30 font-mono text-[10px] tracking-wider uppercase hover:bg-forest hover:text-white transition-all"
                        >
                          Open
                        </a>
                      </div>
                    )}
                    {viewModel.resources.map((resource, index) => (
                      <div
                        key={index}
                        className="border border-grid/20 p-4 hover:border-forest transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-paper border border-grid/20 flex items-center justify-center">
                            <Icon
                              icon={
                                resource.type === "ppt"
                                  ? "lucide:presentation"
                                  : resource.type === "doc"
                                    ? "lucide:file-text"
                                    : "lucide:link"
                              }
                              className="text-forest"
                            />
                          </div>
                          <span className="font-mono text-xs text-forest">
                            {resource.name}
                          </span>
                        </div>
                        {resource.url !== "#" ? (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 border border-grid/30 font-mono text-[10px] tracking-wider uppercase hover:bg-forest hover:text-white transition-all"
                          >
                            Open
                          </a>
                        ) : (
                          <button className="px-3 py-1 border border-grid/30 font-mono text-[10px] tracking-wider uppercase hover:bg-forest hover:text-white transition-all">
                            Open
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {!loading && !error && activeTab === "analysis" && (
              <div className="space-y-4">
                <div className="w-full bg-white border border-grid/20 border-t-[3px] border-t-mint flex flex-col items-center py-10 px-6 text-center">
                  <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-forest">
                    Winner
                  </p>
                  <h1 className="mb-3 font-display text-4xl font-bold tracking-tight text-forest md:text-5xl">
                    {aiAnalysis.finalIdea.title}
                  </h1>
                  <p className="max-w-lg font-sans text-sm text-grid/70">
                    {aiAnalysis.finalIdea.solutionDescription}
                  </p>
                  <div className="mt-6 h-0.5 w-48 bg-mint" />
                </div>

                <div className="flex flex-col items-end justify-center gap-4 md:flex-row">
                  <div className="order-2 w-full flex-1 bg-white border border-grid/20 p-5 premium-card relative md:order-1 md:w-auto">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gold" />
                    <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-grid/60">
                      2nd Place
                    </p>
                    <h3 className="mb-3 font-display text-base font-bold text-forest">
                      {sortedAnalysisAgents[1].name}
                    </h3>
                    <div className="flex items-end justify-between">
                      <span className="font-display text-2xl font-bold text-gold">
                        {(sortedAnalysisAgents[1].score / 10).toFixed(1)}
                      </span>
                      <Icon icon="lucide:award" className="text-xl text-gold/40" />
                    </div>
                  </div>

                  <div className="order-1 w-full flex-1 bg-white border border-grid/20 p-6 premium-card relative md:order-2 md:w-auto md:-translate-y-2 md:pb-8">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-mint" />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-forest px-2 py-0.5">
                      <p className="font-mono text-[8px] font-bold uppercase tracking-widest text-white">
                        Champion
                      </p>
                    </div>
                    <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-grid/60">
                      1st Place
                    </p>
                    <h3 className="mb-4 font-display text-lg font-bold text-forest">
                      {sortedAnalysisAgents[0].name}
                    </h3>
                    <div className="flex items-end justify-between">
                      <span className="font-display text-3xl font-bold text-mint">
                        {(sortedAnalysisAgents[0].score / 10).toFixed(1)}
                      </span>
                      <Icon icon="lucide:trophy" className="text-3xl text-mint" />
                    </div>
                  </div>

                  <div className="order-3 w-full flex-1 bg-white border border-grid/20 p-5 premium-card relative md:w-auto">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-coral" />
                    <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-grid/60">
                      3rd Place
                    </p>
                    <h3 className="mb-3 font-display text-base font-bold text-forest">
                      {sortedAnalysisAgents[2].name}
                    </h3>
                    <div className="flex items-end justify-between">
                      <span className="font-display text-2xl font-bold text-coral">
                        {(sortedAnalysisAgents[2].score / 10).toFixed(1)}
                      </span>
                      <Icon icon="lucide:award" className="text-xl text-coral/40" />
                    </div>
                  </div>
                </div>

                <div className="w-full bg-white border border-grid/20 p-8 premium-card relative">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-mint" />
                  <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-grid/60">
                    Winning Idea
                  </p>
                  <h2 className="mb-3 font-display text-2xl font-bold tracking-tight text-forest">
                    {aiAnalysis.finalIdea.title}
                  </h2>
                  <p className="font-sans text-sm leading-[1.6] text-grid/80">
                    {aiAnalysis.finalIdea.solutionDescription}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="bg-white border border-grid/20 p-6 premium-card relative">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-coral" />
                    <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-grid/60">
                      Target Users
                    </p>
                    <p className="font-sans text-sm text-forest">
                      {aiAnalysis.finalIdea.targetUsers}
                    </p>
                  </div>

                  <div className="bg-white border border-grid/20 p-6 premium-card relative">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-mint" />
                    <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-grid/60">
                      Core Features
                    </p>
                    <ul className="space-y-3">
                      {aiAnalysis.finalIdea.keyFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="bullet-point bg-mint mt-1" />
                          <span className="font-sans text-sm text-forest">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="w-full bg-white border border-grid/20 border-t-2 border-t-forest p-8 premium-card">
                  <h2 className="mb-6 font-display text-lg font-bold text-forest">
                    Final Scores Comparison
                  </h2>

                  <div className="space-y-6">
                    {sortedAnalysisAgents.map((agent, index) => {
                      const colors = ["bg-mint", "bg-gold", "bg-coral"];

                      return (
                        <div
                          key={agent.name}
                          className="flex flex-col justify-between gap-3 md:flex-row md:items-center"
                        >
                          <div className="w-36">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-forest">
                              {agent.name}
                            </p>
                          </div>
                          <div className="relative h-2.5 flex-1 score-bar-bg">
                            <div
                              className={`absolute inset-y-0 left-0 ${colors[index]}`}
                              style={{ width: `${agent.score}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-end space-x-2 md:w-24">
                            <span className="font-display text-base font-bold text-forest">
                              {(agent.score / 10).toFixed(1)}
                            </span>
                            <span className="font-mono text-[10px] text-grid/50">
                              ({agent.score}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pb-8 pt-4 text-center">
                  <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-grid/40">
                    Generated by Agent Council Analysis v2.4.0
                  </p>
                </div>

                {aiAnalysis.rounds.map((round) => (
                  <div key={round.id} className="space-y-4">
                    <div className="bg-white border border-grid/20 p-6">
                      <h3 className="mb-4 font-display text-xl text-forest">
                        {round.name}
                      </h3>

                      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                        {round.agents.map((agent) => (
                          <div
                            key={agent.name}
                            className="border border-grid/20 p-4 transition-colors hover:border-forest"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <h4 className="font-mono text-xs uppercase tracking-widest text-forest">
                                {agent.name}
                              </h4>

                              <span className="bg-forest px-2 py-1 font-mono text-[10px] text-white">
                                {agent.score}
                              </span>
                            </div>

                            <h5 className="mb-2 font-display text-lg text-forest">
                              {agent.ideaTitle}
                            </h5>

                            <p className="mb-3 text-sm text-grid/70">
                              {agent.description}
                            </p>

                            <div className="mb-3">
                              <p className="mb-1 font-mono text-[9px] uppercase text-grid/60">
                                Pros
                              </p>

                              <ul className="space-y-1">
                                {agent.pros.map((pro, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start space-x-1 text-xs text-grid/80"
                                  >
                                    <Icon icon="lucide:plus" className="mt-0.5 text-[10px] text-mint" />
                                    <span>{pro}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="mb-3">
                              <p className="mb-1 font-mono text-[9px] uppercase text-grid/60">
                                Cons
                              </p>

                              <ul className="space-y-1">
                                {agent.cons.map((con, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start space-x-1 text-xs text-grid/80"
                                  >
                                    <Icon icon="lucide:minus" className="mt-0.5 text-[10px] text-coral" />
                                    <span>{con}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <details className="text-xs">
                              <summary className="cursor-pointer font-mono text-[9px] uppercase text-grid/60 hover:text-forest">
                                View Reasoning
                              </summary>

                              <p className="mt-2 text-grid/70">
                                {agent.reasoning}
                              </p>
                            </details>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-grid/20 pt-4">
                        <h4 className="mb-2 font-mono text-xs uppercase tracking-widest text-grid/60">
                          Judge Feedback
                        </h4>

                        <p className="text-sm text-grid/80">
                          {round.judgeFeedback}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading &&
              !error &&
              activeTab === "final-idea" &&
              selectedIdea && (
                <div className="space-y-6">
                  <div className="bg-white border border-grid/20 p-6">
                    <h2 className="font-display text-3xl text-forest mb-6">
                      {selectedIdea.title}
                    </h2>

                    <div className="space-y-6">
                      <div>
                        <h3 className={sectionHeadingClass}>
                          Problem Statement
                        </h3>
                        <p className="text-sm text-grid/80 leading-relaxed">
                          {selectedIdea.problemStatement}
                        </p>
                      </div>

                      <div>
                        <h3 className={sectionHeadingClass}>
                          Solution Description
                        </h3>
                        <p className="text-sm text-grid/80 leading-relaxed">
                          {selectedIdea.solutionDescription}
                        </p>
                      </div>

                      <div>
                        <h3 className={sectionHeadingClass}>Key Features</h3>
                        <ul className="space-y-2">
                          {selectedIdea.keyFeatures.map((feature, index) => (
                            <li
                              key={index}
                              className="flex items-start space-x-2 text-sm text-grid/80 leading-relaxed"
                            >
                              <Icon
                                icon="lucide:check-circle"
                                className="text-mint text-sm mt-0.5"
                              />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className={sectionHeadingClass}>Target Users</h3>
                        <p className="text-sm text-grid/80 leading-relaxed">
                          {selectedIdea.targetUsers}
                        </p>
                      </div>

                      <div>
                        <h3 className={sectionHeadingClass}>
                          Why This Idea Wins
                        </h3>
                        <p className="text-sm text-grid/80 leading-relaxed">
                          {selectedIdea.whyThisWins}
                        </p>
                      </div>

                      <div>
                        <h3 className={sectionHeadingClass}>
                          Evaluation Breakdown
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(selectedIdea.evaluation).map(
                            ([key, value]) => (
                              <div key={key}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-mono text-[10px] text-grid/60 uppercase">
                                    {key}
                                  </span>
                                  <span className="font-mono text-xs text-forest">
                                    {value}%
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-grid/10 rounded-none overflow-hidden">
                                  <div
                                    className="h-full bg-forest transition-all duration-500"
                                    style={{ width: `${value}%` }}
                                  />
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className={sectionHeadingClass}>
                          Alternative Ideas
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedIdea.alternatives.map((alt, index) => (
                            <div
                              key={index}
                              className="border border-grid/20 p-4"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className={labelHeadingClass}>
                                  {alt.title}
                                </h4>
                                <span className="px-2 py-1 bg-paper border border-grid/20 font-mono text-[10px]">
                                  {alt.score}
                                </span>
                              </div>
                              <p className="text-sm text-grid/80 leading-relaxed">
                                {alt.summary}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-grid/20 p-6">
                    <h2 className="font-display text-2xl text-forest mb-4">
                      Execution Plan
                    </h2>
                    <div className="space-y-4">
                      {executionPlan.map((step) => (
                        <div
                          key={step.day}
                          className="border border-grid/20 p-4"
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <div
                              className={`w-8 h-8 flex items-center justify-center font-mono text-xs ${
                                step.completed
                                  ? "bg-forest text-white"
                                  : "bg-paper border border-grid/20"
                              }`}
                            >
                              {step.completed ? (
                                <Icon icon="lucide:check" />
                              ) : (
                                step.day
                              )}
                            </div>
                            <h3 className={labelHeadingClass}>
                              Day {step.day}: {step.title}
                            </h3>
                          </div>
                          <ul className="space-y-2 ml-11">
                            {step.tasks.map((task, index) => (
                              <li
                                key={index}
                                className="flex items-start space-x-2 text-sm text-grid/80 leading-relaxed"
                              >
                                <Icon
                                  icon="lucide:circle"
                                  className="text-[8px] mt-1.5 text-grid/40"
                                />
                                <span>{task}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            {!loading && !error && activeTab === "assets" && (
              <div className="space-y-6">
                <div className="bg-white border border-grid/20 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-2xl text-forest">
                      Generated Assets
                    </h2>
                    <div className="flex space-x-2">
                      <button className="px-4 py-2 border border-grid/30 font-mono text-[10px] tracking-widest uppercase hover:bg-forest hover:text-white transition-all">
                        Generate
                      </button>
                      <button className="px-4 py-2 border border-grid/30 font-mono text-[10px] tracking-widest uppercase hover:bg-forest hover:text-white transition-all">
                        Download All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {(viewModel?.resources ?? []).map((asset, index) => (
                      <div key={index} className="border border-grid/20 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-paper border border-grid/20 flex items-center justify-center">
                              <Icon
                                icon={
                                  asset.type === "ppt"
                                    ? "lucide:presentation"
                                    : asset.type === "doc"
                                      ? "lucide:file-text"
                                      : "lucide:file"
                                }
                                className="text-forest"
                              />
                            </div>
                            <div>
                              <h4 className="font-mono text-xs text-forest">
                                {asset.name}
                              </h4>
                              <p className="font-mono text-[9px] text-grid/40 uppercase">
                                {asset.type.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="px-3 py-1 border border-grid/30 font-mono text-[10px] tracking-wider uppercase hover:bg-forest hover:text-white transition-all">
                              Copy
                            </button>
                            <button className="px-3 py-1 border border-grid/30 font-mono text-[10px] tracking-wider uppercase hover:bg-forest hover:text-white transition-all">
                              Regenerate
                            </button>
                          </div>
                        </div>
                        {asset.content && (
                          <div className="bg-paper p-4 max-h-64 overflow-y-auto">
                            <pre className="font-mono text-xs text-grid/80 whitespace-pre-wrap">
                              {asset.content}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && activeTab === "chat" && (
              <div className="bg-white border border-grid/20 p-6">
                <h2 className="font-display text-2xl text-forest mb-6">
                  AI Assistant
                </h2>
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 ${
                          message.role === "user"
                            ? "bg-forest text-white"
                            : "bg-paper border border-grid/20"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="font-mono text-[9px] mt-2 opacity-60">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-2 mb-3">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 border border-grid/20 font-mono text-[10px] tracking-wider uppercase hover:bg-forest hover:text-white transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask about the idea..."
                    className="flex-1 border border-grid/20 px-3 py-2 text-sm font-mono focus:outline-none focus:border-forest transition-colors"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-3 py-2 bg-forest text-white hover:opacity-90 transition-opacity"
                  >
                    <Icon icon="lucide:send" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {(activeTab === "analysis" || activeTab === "final-idea") &&
            !isChatExpanded && (
              <div className="w-[30%]">
                <div className="bg-white border border-grid/20 p-4 sticky top-32">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-mono text-xs tracking-widest uppercase text-forest">
                      AI Assistant
                    </h3>
                    <button
                      onClick={() => setIsChatExpanded(true)}
                      className="p-1 hover:bg-paper transition-colors"
                    >
                      <Icon icon="lucide:expand" className="text-grid/60" />
                    </button>
                  </div>

                  <div className="h-96 overflow-y-auto mb-4 space-y-3">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[90%] p-3 text-sm ${
                            message.role === "user"
                              ? "bg-forest text-white"
                              : "bg-paper border border-grid/20"
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 mb-3">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-2 border border-grid/20 font-mono text-[10px] tracking-wider uppercase hover:bg-forest hover:text-white transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder="Ask about the idea..."
                      className="flex-1 border border-grid/20 px-3 py-2 text-sm font-mono focus:outline-none focus:border-forest transition-colors"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="px-3 py-2 bg-forest text-white hover:opacity-90 transition-opacity"
                    >
                      <Icon icon="lucide:send" />
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-grid/20 pt-4">
          <div className="flex items-center space-x-4">
            <span className="font-mono text-[9px] text-grid/40 uppercase">
              Last saved: {lastSaved.toLocaleString()}
            </span>
            {selectedIdea && (
              <span className="flex items-center space-x-1 text-mint">
                <Icon icon="lucide:check-circle" className="text-xs" />
                <span className="font-mono text-[9px] uppercase">
                  Idea Selected
                </span>
              </span>
            )}
          </div>
          <button className="px-4 py-2 bg-forest text-white font-mono text-[10px] tracking-widest uppercase hover:opacity-90 transition-opacity">
            Save Progress
          </button>
        </div>
      </div>
    </div>
  );
}
