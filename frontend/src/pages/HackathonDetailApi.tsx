import { useMemo, useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

type Message = {
  role: "user" | "assistant";
  content: string;
};

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

interface AnalysisRound {
  round_number?: number;
  phase?: string | null;
  ideas?: Record<string, AnalysisAgentOutput> | null;
  debates?: Record<string, AnalysisDebateOutput> | null;
  judge?: AnalysisJudgeOutput | null;
}

interface AnalysisAgentOutput {
  target_users?: string[] | null;
  agent_persona?: string | null;
  core_features?: string[] | null;
  project_title?: string | null;
  overall_reasoning?: string | null;
  problem_statement?: string | null;
  solution_overview?: string | null;
}

interface AnalysisCritiqueOutput {
  critique?: string | null;
  target_agent?: string | null;
}

interface AnalysisDebateOutput {
  defense?: string | null;
  agent_persona?: string | null;
  improved_idea?: AnalysisAgentOutput | null;
  criticisms_of_competitors?: AnalysisCritiqueOutput[] | null;
}

interface AnalysisJudgeOutput {
  scores?: Record<string, number> | null;
  summary?: string | null;
  feedback?: Record<string, string | null> | string | null;
  leaderboard?: string[] | null;
}

interface AnalysisResult {
  winner?: string | null;
  leaderboard?: string[] | null;
  final_scores?: Record<string, number> | null;
  winning_idea?: {
    title?: string | null;
    description?: string | null;
    target_users?: string[] | null;
    core_features?: string[] | null;
    agent_persona?: string | null;
    project_title?: string | null;
    problem_statement?: string | null;
    solution_overview?: string | null;
    overall_reasoning?: string | null;
  } | null;
  synthesized?: {
    summary?: string | null;
    strengths?: string[] | null;
    weaknesses?: string[] | null;
    final_strategy?: string | null;
    winning_persona?: string | null;
    why_this_is_best?: string | null;
    final_target_users?: string[] | null;
    final_core_features?: string[] | null;
    final_project_title?: string | null;
    final_problem_statement?: string | null;
    final_solution_overview?: string | null;
  } | null;
  rounds?: AnalysisRound[] | null;
}

interface AnalysisPayload {
  analysis_id?: number | null;
  result?: AnalysisResult | null;
}

interface AnalysisResponse {
  success: boolean;
  data: AnalysisPayload;
  error?: string;
}

type TabType = "overview" | "analysis" | "assets" | "chat";

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

function formatAgentLabel(agent: string): string {
  return agent
    .replaceAll("_", " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getScaledScore(score?: number | null): number {
  const numericScore = Number(score ?? 0);

  if (Number.isNaN(numericScore)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numericScore * 10)));
}

function getRoundAgentOrder(round: AnalysisRound): string[] {
  const leaderboard = round.judge?.leaderboard ?? [];
  const ideaKeys = Object.keys(round.ideas ?? {});
  const debateKeys = Object.keys(round.debates ?? {});

  return Array.from(new Set([...leaderboard, ...ideaKeys, ...debateKeys]));
}

export default function HackathonDetailApi() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isNavbarVisible } = useNavbar();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm here to help you analyze this hackathon and develop your winning idea. What would you like to explore?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [expandedCard, setExpandedCard] = useState<{ roundIndex: number; agent: string } | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
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

  const analysisQuery = useQuery<AnalysisResponse, Error>({
    queryKey: ["hackathon-analysis", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/hackathon/${id}/analysis`);

      if (response.status === 404) {
        throw new Error("Analysis not found.");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch analysis: ${response.status}`);
      }

      const result = (await response.json()) as AnalysisResponse;

      if (!result.success) {
        throw new Error(result.error ?? "Backend returned no analysis data");
      }

      return result;
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

  const hackathon = hackathonQuery.data?.hackathon ?? null;
  const loading = hackathonQuery.isPending;
  const error = hackathonQuery.error?.message ?? null;

  const viewModel = useMemo(() => buildViewModel(hackathon), [hackathon]);
  const daysLeft = useMemo(
    () => getDaysUntil(viewModel?.deadline),
    [viewModel?.deadline],
  );

  const analysisData = analysisQuery.data?.data ?? null;
  const analysisResult = analysisData?.result ?? null;
  const hasAnalysis = Boolean(analysisData?.analysis_id);
  const analysisLeaderboard = analysisResult?.leaderboard ?? [];
  const analysisFinalScores = analysisResult?.final_scores ?? {};
  const analysisRounds = analysisResult?.rounds ?? [];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    // Log analysis payload for debugging when nothing appears in the UI
    // eslint-disable-next-line no-console
    console.log("DEBUG: analysisData ->", analysisData);
  }, [analysisData]);

  const tabs = [
    { id: "overview" as TabType, label: "Overview" },
    { id: "analysis" as TabType, label: "AI Analysis" },
    { id: "assets" as TabType, label: "Assets" },
    { id: "chat" as TabType, label: "Chat" },
  ];

  const suggestions = [
    "Explain this idea",
    "Improve this idea",
    "Give MVP plan",
    "Suggest tech stack",
  ];

  const handleSendMessage = async (messageOverride?: string) => {
    const message = (messageOverride ?? chatInput).trim();

    if (!message || chatLoading || !id) {
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: message,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatError(null);
    setChatLoading(true);

    try {
      const apiResponse = await fetch(`${API_BASE_URL}/hackathon/${id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const payload = (await apiResponse.json()) as {
        success?: boolean;
        data?: {
          agent?: string;
          response?: string;
          data?: {
            response?: string;
          };
        };
        error?: string;
      };

      const assistantResponse =
        payload?.data?.data?.response ?? payload?.data?.response;

      if (!apiResponse.ok || !payload?.success || !assistantResponse) {
        throw new Error(
          payload?.error ?? "The assistant could not respond right now.",
        );
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantResponse,
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong.";

      setChatError(errorMessage);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I couldn't reach the assistant just now. Please try again in a moment.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (chatLoading) return;
    setChatInput(suggestion);
    setChatError(null);
  };

  const handleRunAnalysis = () => {
    // If analysis already exists, do not trigger another run here.
    if (hasAnalysis) return;

    // Delegate to callAnalyze which performs the backend request.
    callAnalyze();
  };

  const queryClient = useQueryClient();

  async function callAnalyze() {
    if (!id) return;
    try {
      setIsAnalysisRunning(true);

      const resp = await fetch(`${API_BASE_URL}/hackathon/${id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!resp.ok) {
        // keep UI responsive; log error
        // eslint-disable-next-line no-console
        console.error("Failed to run analysis", resp.status);
        setIsAnalysisRunning(false);
        return;
      }

      const result = (await resp.json()) as AnalysisResponse;

      // Update react-query cache for analysis so the UI reflects the new data
      queryClient.setQueryData(["hackathon-analysis", id], result);
      // Optionally refetch the query
      queryClient.invalidateQueries({ queryKey: ["hackathon-analysis", id] } as any);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error running analysis", err);
    } finally {
      setIsAnalysisRunning(false);
    }
  }

  const handleCardExpand = (roundIndex: number, agent: string) => {
    if (expandedCard?.roundIndex === roundIndex && expandedCard?.agent === agent) {
      setExpandedCard(null);
    } else {
      setExpandedCard({ roundIndex, agent });
    }
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
              <div className="bg-white border border-grid/20 p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <Icon icon="lucide:brain-circuit" className="text-forest" />
                  <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">
                    AI Recommended Theme
                  </span>
                </div>
                <h3 className="font-display text-xl text-forest mb-2">
                  {analysisResult?.winning_idea?.project_title ?? analysisResult?.synthesized?.final_project_title ?? aiAnalysis.recommendedTheme.name}
                </h3>
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
                  <button
                    onClick={handleRunAnalysis}
                    disabled={isAnalysisRunning || hasAnalysis}
                    className={`flex-1 border border-forest bg-white py-2 px-4 font-mono text-[10px] tracking-widest uppercase text-forest transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-(--forest) hover:text-(--paper) hover:border-(--forest)`}
                  >
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
              activeTab === "analysis" && !isChatExpanded
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
                          <div className="w-10 h-10 bg-white border border-grid/20 flex items-center justify-center">
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
                          <div className="w-10 h-10 bg-white border border-grid/20 flex items-center justify-center">
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
                {analysisQuery.isPending && (
                  <div className="bg-white border border-grid/20 p-6 text-center font-mono text-xs tracking-widest uppercase text-grid/60">
                    Loading AI analysis...
                  </div>
                )}

                {!analysisQuery.isPending && analysisQuery.error && (
                  <div className="bg-white border border-grid/20 p-6 text-center">
                    <p className="font-mono text-xs tracking-widest uppercase text-coral">
                      Unable to load AI analysis
                    </p>
                    <p className="mt-3 text-sm text-grid/70">
                      {analysisQuery.error.message}
                    </p>
                  </div>
                )}

                {!analysisQuery.isPending && !analysisQuery.error && !hasAnalysis && (
                  <div className="bg-white border border-grid/20 p-10 text-center">
                    <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-grid/40 mb-3">
                      AI Analysis
                    </p>
                    <h2 className="font-display text-3xl text-forest mb-3">
                      No AI analysis available yet
                    </h2>
                    <p className="mx-auto max-w-xl text-sm leading-relaxed text-grid/70">
                      Run the analysis pipeline to generate a winner, rankings, score breakdowns, and debate rounds for this hackathon.
                    </p>
                  </div>
                )}

                {!analysisQuery.isPending && !analysisQuery.error && hasAnalysis && analysisResult && (
                  <>
                    {analysisRounds.length === 0 && (
                      <div className="bg-white border border-grid/20 p-6">
                        <p className="font-mono text-[10px] tracking-widest uppercase text-grid/40 mb-3">AI Analysis (raw payload)</p>
                        <pre className="max-h-96 overflow-auto text-xs p-2 bg-white border border-grid/10">
                          {JSON.stringify(analysisData, null, 2)}
                        </pre>
                      </div>
                    )}
                    <div className="w-full bg-white border border-grid/20 border-t-[3px] border-t-mint flex flex-col items-center py-10 px-6 text-center">
                      <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-forest">
                        Winner
                      </p>
                      <h1 className="mb-3 font-display text-4xl font-bold tracking-tight text-forest md:text-5xl">
                        {(analysisResult.winner ?? "Winner not available").toString().toUpperCase()}
                      </h1>
                      {analysisResult.winning_idea?.title && (
                        <p className="max-w-lg font-mono text-[10px] uppercase tracking-[0.2em] text-grid/50">
                          Winning idea: {analysisResult.winning_idea.title}
                        </p>
                      )}
                    </div>

                    {analysisLeaderboard.length > 0 && (
                      <div className="flex flex-col items-end justify-center gap-4 md:flex-row">
                        <div className="order-2 w-full flex-1 bg-white border border-grid/20 p-5 premium-card relative md:order-1 md:w-auto">
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gold" />
                          <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-grid/60">
                            2nd Place
                          </p>
                          <h3 className="mb-3 font-display text-base font-bold text-forest capitalize">
                            {analysisLeaderboard[1] ?? "TBD"}
                          </h3>
                          <div className="flex items-end justify-between">
                            <span className="font-display text-2xl font-bold text-gold">
                              {analysisLeaderboard[1] ? "2.0" : "-"}
                            </span>
                            <Icon
                              icon="lucide:award"
                              className="text-xl text-gold/40"
                            />
                          </div>
                        </div>

                        <div className="order-1 w-full flex-1 bg-white border border-grid/20 p-6 premium-card relative md:order-2 md:w-auto md:-translate-y-2 md:pb-8">
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-mint" />
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-forest px-2 py-0.5">
                            <p className="font-mono text-[8px] font-bold uppercase tracking-widest text-white">
                              Champion
                            </p>
                          </div>
                          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-grid/60">
                            1st Place
                          </p>
                          <h3 className="mb-4 font-display text-lg font-bold text-forest capitalize">
                            {analysisLeaderboard[0] ?? "TBD"}
                          </h3>
                          <div className="flex items-end justify-between">
                            <span className="font-display text-3xl font-bold text-mint">
                              {analysisLeaderboard[0] ? "1.0" : "-"}
                            </span>
                            <Icon
                              icon="lucide:trophy"
                              className="text-3xl text-mint"
                            />
                          </div>
                        </div>

                        <div className="order-3 w-full flex-1 bg-white border border-grid/20 p-5 premium-card relative md:w-auto">
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-coral" />
                          <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-grid/60">
                            3rd Place
                          </p>
                          <h3 className="mb-3 font-display text-base font-bold text-forest capitalize">
                            {analysisLeaderboard[2] ?? "TBD"}
                          </h3>
                          <div className="flex items-end justify-between">
                            <span className="font-display text-2xl font-bold text-coral">
                              {analysisLeaderboard[2] ? "3.0" : "-"}
                            </span>
                            <Icon
                              icon="lucide:award"
                              className="text-xl text-coral/40"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {Object.keys(analysisFinalScores).length > 0 && (
                      <div className="w-full bg-white border border-grid/20 border-t-2 border-t-forest p-8">
                        <h2 className="mb-6 font-display text-lg font-bold text-forest">
                          Final Scores
                        </h2>

                        <div className="space-y-6">
                          {Object.entries(analysisFinalScores)
                            .sort(([, leftScore], [, rightScore]) => rightScore - leftScore)
                            .map(([name, score], index) => {
                              const colors = ["bg-mint", "bg-gold", "bg-coral"];

                              // Scores from backend are expected in 0-10 range.
                              // Scale to 0-100 for display and progress width.
                              const raw = Number(score) || 0;
                              const scaled = Math.round(raw * 10);

                              return (
                                <div
                                  key={name}
                                  className="flex flex-col justify-between gap-3 md:flex-row md:items-center"
                                >
                                  <div className="w-36">
                                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-forest">
                                      {name}
                                    </p>
                                  </div>
                                  <div className="relative h-2.5 flex-1 score-bar-bg">
                                    <div
                                      className={`absolute inset-y-0 left-0 ${colors[index] ?? "bg-forest"}`}
                                      style={{ width: `${scaled}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-end space-x-2 md:w-36">
                                    <span className="font-display text-base font-bold text-forest">
                                      {scaled}%
                                    </span>
                                    <span className="font-mono text-[10px] text-grid/50">
                                      ({raw.toFixed(1)}/10)
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="bg-white border border-grid/20 p-6">
                        <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-grid/60">
                          Winning Idea
                        </p>
                        <h2 className="mb-3 font-display text-2xl font-bold tracking-tight text-forest">
                          {analysisResult.synthesized?.final_project_title ?? analysisResult.winning_idea?.title ?? "No winning idea title"}
                        </h2>
                        <p className="font-sans text-sm leading-[1.6] text-grid/80">
                          {analysisResult.synthesized?.final_solution_overview ?? analysisResult.winning_idea?.description ?? "No winning idea description available."}
                        </p>
                      </div>

                      <div className="bg-white border border-grid/20 p-6">
                        <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-grid/60">
                          Synthesized Analysis
                        </p>
                        <p className="font-sans text-sm leading-[1.6] text-grid/80">
                          {analysisResult.synthesized?.why_this_is_best ?? analysisResult.synthesized?.summary ?? "No synthesized summary available."}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="bg-white border border-grid/20 p-6">
                        <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-grid/60">
                          Target Users
                        </p>
                        <ul className="space-y-2">
                          {(analysisResult.synthesized?.final_target_users ?? analysisResult.winning_idea?.target_users ?? []).map((user, index) => (
                            <li key={`${user}-${index}`} className="text-sm text-forest">
                              {user}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-white border border-grid/20 p-6">
                        <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-grid/60">
                          Core Features
                        </p>
                        <ul className="space-y-3">
                          {(analysisResult.synthesized?.final_core_features ?? analysisResult.winning_idea?.core_features ?? []).map((feature, index) => (
                            <li key={`${feature}-${index}`} className="flex items-start space-x-2">
                              <div className="bullet-point bg-mint mt-1" />
                              <span className="font-sans text-sm text-forest">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="w-full mt-20">
                      <div className=" border-grid/20 pb-8">
                        <div className="flex justify-between items-baseline mb-4">
                          <h1 className="font-display text-5xl lg:text-6xl text-forest leading-[0.85]">
                            DEBATE<br />LOGS
                          </h1>
                        </div>
                      </div>

                      <div className="space-y-10">
                        {analysisRounds.map((round, roundIndex) => {
                          const roundNumber = round.round_number ?? roundIndex + 1;
                          const roundOrder = getRoundAgentOrder(round);
                          const roundScores = round.judge?.scores ?? {};
                          const roundFeedback = round.judge?.feedback;

                          const phaseLabels = [
                            "Generation & Scoping",
                            "Debate & Critique",
                            "Final Evaluation",
                          ];
                          const phaseLabel = phaseLabels[roundIndex] ?? `Phase ${roundNumber}`;

                          return (
                            <section key={`${round.round_number ?? roundIndex}`} className="w-full">

                              <div className="flex justify-between items-center mb-8">
                                <div>
                                  <span className="font-mono text-[10px] text-white bg-forest px-2 py-0.5 uppercase mb-2 inline-block">
                                    Phase {String(roundNumber).padStart(2, "0")}
                                  </span>
                                  <h2 className="font-display text-4xl">{phaseLabel}</h2>
                                </div>
                                <span className="font-mono text-[10px] uppercase text-grid/40">
                                  {roundOrder.length} Records Collected
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-4 items-start">
                                {roundOrder.map((agent) => {
                                  const idea = round.ideas?.[agent];
                                  const debate = round.debates?.[agent];
                                  const agentScore = roundScores[agent];
                                  const agentFeedback =
                                    typeof roundFeedback === "string"
                                      ? roundFeedback
                                      : (typeof roundFeedback === "object" ? roundFeedback?.[agent] : null);
                                  const agentCritiques = debate?.criticisms_of_competitors ?? [];

                                  const agentType = agent.toLowerCase().includes("innovation")
                                    ? "innovation"
                                    : agent.toLowerCase().includes("practical")
                                      ? "practical"
                                      : agent.toLowerCase().includes("business")
                                        ? "business"
                                        : "other";
                                  const agentBorderColor =
                                    agentType === "innovation" ? "border-mint" : agentType === "practical" ? "border-coral" : "border-gold";
                                  const agentTextColor = agentType === "innovation" ? "text-mint" : agentType === "practical" ? "text-coral" : "text-gold";
                                  const winnerBg = "bg-white";
                                  const isExpanded = expandedCard?.roundIndex === roundIndex && expandedCard?.agent === agent;

                                  const title = idea?.project_title ?? debate?.improved_idea?.project_title ?? formatAgentLabel(agent);
                                  const description = idea?.solution_overview ?? debate?.improved_idea?.solution_overview ?? "No description available.";

                                  return (
                                    <div
                                      key={agent}
                                      className={`agent-card ${winnerBg} border border-grid/10 p-6 relative rounded-sm cursor-pointer border-l-4 ${agentBorderColor} transition-all duration-400 ${
                                        isExpanded ? "w-full max-h-300 z-10" : "w-[calc(33.333%-11px)] max-h-40 overflow-hidden"
                                      }`}
                                      onClick={() => handleCardExpand(roundIndex, agent)}
                                    >
                                      <button
                                        className="close-btn absolute top-6 right-6 font-mono text-xl text-grid/60 hover:text-forest"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCardExpand(roundIndex, agent);
                                        }}
                                      >
                                        ×
                                      </button>

                                      <div className="compact-view">
                                        <div className="flex justify-between items-start mb-3">
                                          <span className={`font-mono text-[10px] uppercase tracking-widest font-bold ${agentTextColor}`}>
                                            {agentType} / {formatAgentLabel(agent)}
                                          </span>
                                          <span className="font-mono text-[16px] font-bold">
                                            {agentScore != null ? `${getScaledScore(agentScore)}` : "N/A"}
                                          </span>
                                        </div>
                                        <h3 className="font-display text-xl mb-2">{title}</h3>
                                        <p className="text-[13px] text-grid opacity-70 truncate">{description}</p>
                                        {!isExpanded && (
                                          <div className="mt-4 flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-grid/40">
                                          </div>
                                        )}
                                      </div>

                                      <div className="expanded-content">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                          <div className="space-y-6">
                                            {idea?.problem_statement || debate?.improved_idea?.problem_statement ? (
                                              <div>
                                                <label className="font-mono text-[10px] uppercase text-grid/60">
                                                  Problem Statement
                                                </label>
                                                <p className="text-[13px] mt-2 leading-relaxed">
                                                  {idea?.problem_statement ?? debate?.improved_idea?.problem_statement}
                                                </p>
                                              </div>
                                            ) : null}

                                            {(idea?.problem_statement || debate?.improved_idea?.problem_statement) && (idea?.solution_overview || debate?.improved_idea?.solution_overview) ? (
                                              <div className="h-px bg-grid/15" />
                                            ) : null}

                                            {idea?.solution_overview || debate?.improved_idea?.solution_overview ? (
                                              <div>
                                                <label className="font-mono text-[10px] uppercase text-grid/60">
                                                  Solution Overview
                                                </label>
                                                <p className="text-[13px] mt-2 leading-relaxed">
                                                  {idea?.solution_overview ?? debate?.improved_idea?.solution_overview}
                                                </p>
                                              </div>
                                            ) : null}
                                          </div>

                                          <div className="space-y-6">
                                            {(idea?.core_features?.length ?? 0) > 0 || (debate?.improved_idea?.core_features?.length ?? 0) > 0 ? (
                                              <div>
                                                <label className="font-mono text-[10px] uppercase text-grid/60">
                                                  Core Features
                                                </label>
                                                <ul className="text-[13px] mt-2 space-y-2">
                                                  {(idea?.core_features ?? debate?.improved_idea?.core_features ?? []).map((feature) => (
                                                    <li key={feature} className="flex items-center gap-2">
                                                      <span className="w-1.5 h-1.5 bg-forest" />
                                                      {feature}
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            ) : null}
                                          </div>
                                        </div>

                                        {debate && (debate.defense || agentCritiques.length > 0) && (
                                          <div className="mt-8 space-y-8">
                                            {debate.defense && (
                                              <div>
                                                <label className="font-mono text-[10px] uppercase text-grid/60 mb-2 block">
                                                  Defense Statement
                                                </label>
                                                <p className="text-[13px] leading-relaxed">{debate.defense}</p>
                                              </div>
                                            )}

                                            {agentCritiques.length > 0 && (
                                              <>
                                                <div className="h-px bg-grid/15" />
                                                <div>
                                                  <label className="font-mono text-[10px] uppercase text-grid/60 mb-4 block">
                                                    Criticisms Directed at Others
                                                  </label>
                                                  <div className="space-y-4">
                                                    {agentCritiques.map((critique, critiqueIndex) => (
                                                      <div
                                                        key={`${agent}-critique-${critiqueIndex}`}
                                                        className="p-4 bg-white/50 border border-grid/10"
                                                      >
                                                        <span className="font-mono text-[9px] uppercase text-forest font-bold">
                                                          {critique.target_agent
                                                            ? `Target: ${formatAgentLabel(critique.target_agent)}`
                                                            : "Critique"}
                                                        </span>
                                                        <p className="text-[12px] mt-1">{critique.critique ?? "No critique text available."}</p>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        )}

                                        {agentFeedback && (
                                          <div className="mt-8">
                                            <div className="h-px bg-grid/15" />
                                            <div className="mt-8">
                                              <label className="font-mono text-[10px] uppercase text-grid/60 mb-2 block">
                                                Judge Feedback
                                              </label>
                                              <p className="text-[13px] leading-relaxed">{agentFeedback}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </section>
                          );
                        })}
                      </div>
                    </div>

                  </>
                )}
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
                      <div key={index} className="bg-white border border-grid/20 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white border border-grid/20 flex items-center justify-center">
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
                          <div className="bg-white p-4 max-h-64 overflow-y-auto">
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
              <div className="bg-white border border-grid/20 overflow-hidden flex min-h-[72vh] flex-col">
                <div className="border-b border-grid/20 p-6">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div>
                      <h2 className="font-display text-2xl text-forest">
                        AI Assistant
                      </h2>
                      <p className="mt-1 text-[11px] font-mono tracking-widest uppercase text-grid/50">
                        Persistent hackathon thread powered by the backend
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase ${chatLoading ? "text-grid/60" : "text-forest"}`}>
                      <span className={`h-2 w-2 rounded-full ${chatLoading ? "bg-grid/40 animate-pulse" : "bg-mint"}`} />
                      {chatLoading ? "Sending" : "Live"}
                    </span>
                  </div>
                  <p className="text-sm text-grid/70 leading-relaxed max-w-3xl">
                    Ask about the hackathon, the winning idea, or the next step.
                    Messages are sent to the FastAPI backend and the assistant response is appended when it returns.
                  </p>
                </div>

                {chatError && (
                  <div className="border-b border-coral/30 bg-coral/10 px-6 py-3">
                    <p className="font-mono text-[10px] tracking-widest uppercase text-coral">
                      {chatError}
                    </p>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatMessages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-none border px-4 py-3 shadow-sm ${
                          message.role === "user"
                            ? "border-grid/20 bg-white text-forest"
                            : "border-grid/20 bg-white text-forest"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="font-mono text-[9px] tracking-widest uppercase opacity-70">
                            {message.role === "user" ? "You" : "Assistant"}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] border border-grid/20 bg-white px-4 py-3 text-forest shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-mint" />
                          <span className="font-mono text-[10px] tracking-widest uppercase text-grid/50">
                            Thinking
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                <div className="border-t border-grid/20 bg-white p-5">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={chatLoading}
                        className="border border-grid/20 px-3 py-2 font-mono text-[10px] tracking-widest uppercase text-grid/70 transition-all hover:border-forest hover:bg-forest hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-end gap-3">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask about the idea, analysis, or next steps..."
                      rows={2}
                      disabled={chatLoading}
                      className="min-h-14 flex-1 resize-none border border-grid/20 px-4 py-3 text-sm font-mono text-forest placeholder:text-grid/40 focus:border-forest focus:outline-none disabled:cursor-not-allowed disabled:bg-grid/5"
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={chatLoading || !chatInput.trim()}
                      className="inline-flex min-h-14 items-center gap-2 border border-forest bg-forest px-4 py-3 font-mono text-[10px] tracking-widest uppercase text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {chatLoading ? (
                        <>
                          <Icon icon="lucide:loader-2" className="animate-spin" />
                          <span>Sending</span>
                        </>
                      ) : (
                        <>
                          <Icon icon="lucide:send" />
                          <span>Send</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {activeTab === "analysis" && !isChatExpanded && (
              <div className="w-[30%]">
                <div className="bg-white border border-grid/20 p-4 sticky top-32">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-mono text-xs tracking-widest uppercase text-forest">
                      AI Assistant
                    </h3>
                    <button
                      onClick={() => setIsChatExpanded(true)}
                      className="p-1 hover:bg-white transition-colors"
                    >
                      <Icon icon="lucide:expand" className="text-grid/60" />
                    </button>
                  </div>

                  {chatError && (
                    <div className="mb-3 border border-coral/30 bg-coral/10 px-3 py-2">
                      <p className="font-mono text-[9px] tracking-widest uppercase text-coral">
                        {chatError}
                      </p>
                    </div>
                  )}

                  <div className="h-96 overflow-y-auto mb-4 space-y-3 pr-1">
                    {chatMessages.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[90%] border p-3 text-sm ${
                            message.role === "user"
                              ? "border-forest bg-forest text-white"
                              : "border-grid/20 bg-white text-forest"
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}

                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="max-w-[90%] border border-grid/20 bg-white p-3 text-forest">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-mint" />
                            <span className="font-mono text-[9px] tracking-widest uppercase text-grid/50">
                              Thinking
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={chatBottomRef} />
                  </div>

                  <div className="space-y-2 mb-3">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={chatLoading}
                        className="w-full text-left px-3 py-2 border border-grid/20 font-mono text-[10px] tracking-wider uppercase hover:bg-forest hover:text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask about the idea..."
                      disabled={chatLoading}
                      className="flex-1 border border-grid/20 px-3 py-2 text-sm font-mono focus:outline-none focus:border-forest transition-colors disabled:cursor-not-allowed disabled:bg-grid/5"
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={chatLoading || !chatInput.trim()}
                      className="px-3 py-2 bg-forest text-white hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {chatLoading ? (
                        <Icon icon="lucide:loader-2" className="animate-spin" />
                      ) : (
                        <Icon icon="lucide:send" />
                      )}
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
            {hasAnalysis && (
              <span className="flex items-center space-x-1 text-mint">
                <Icon icon="lucide:check-circle" className="text-xs" />
                <span className="font-mono text-[9px] uppercase">
                  Analysis Ready
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
