import { useMemo, useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { parse } from "marked";
import DOMPurify from "dompurify";
import { useAnalysisSSE } from "../hooks/useAnalysisSSE";
import { fetchEventSource } from "@microsoft/fetch-event-source";

function normalizeMarkdownSpacing(input?: string) {
  if (!input) return "";
  let s = input.replace(/\r\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

import { useNavbar } from "../context/NavbarContext";
import { SignupPopup } from "../components/SignupPopup";

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
  prizeDataMissing: boolean;
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
  status?: string | null;
  status_message?: string | null;
}

interface AnalysisResponse {
  success: boolean;
  data: AnalysisPayload;
  error?: string;
}

export interface DocContent {
  title: string;
  problem_statement: string;
  solution_overview: string;
  core_features: string[];
  target_users: string[];
  why_this_is_best: string;
  recommended_tech_stack: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    ml_ai?: string[];
    devops?: string[];
    apis_services?: string[];
  };
  implementation_phases: { phase: string; tasks: string[] }[];
  team_structure: string[];
  unique_selling_points: string[];
  risks_and_mitigations: { risk: string; mitigation: string }[];
  judging_criteria_alignment: string[];
}

export interface PPTSlide {
  slide_number: number;
  title: string;
  bullets: string[];
  speaker_notes: string;
}

export interface PPTContent {
  title: string;
  organizer: string;
  slides: PPTSlide[];
}

export interface AssetsPayload {
  generated: boolean;
  doc_content: DocContent | null;
  ppt_content: PPTContent | null;
}

export interface AssetsResponse {
  success: boolean;
  data: AssetsPayload;
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

function convertDocToMarkdown(doc: DocContent): string {
  let md = `# ${doc.title}\n\n`;
  
  md += `## 1. Problem Statement\n${doc.problem_statement}\n\n`;
  md += `## 2. Solution Overview\n${doc.solution_overview}\n\n`;
  
  if (doc.target_users && doc.target_users.length > 0) {
    md += `## 3. Target Users\n`;
    doc.target_users.forEach(u => {
      md += `- ${u}\n`;
    });
    md += `\n`;
  }
  
  if (doc.core_features && doc.core_features.length > 0) {
    md += `## 4. Core Features\n`;
    doc.core_features.forEach(f => {
      md += `- ${f}\n`;
    });
    md += `\n`;
  }
  
  md += `## 5. Recommended Tech Stack\n`;
  const tech = doc.recommended_tech_stack;
  if (tech) {
    if (tech.frontend && tech.frontend.length > 0) {
      md += `### Frontend\n` + tech.frontend.map(item => `- ${item}`).join('\n') + `\n\n`;
    }
    if (tech.backend && tech.backend.length > 0) {
      md += `### Backend\n` + tech.backend.map(item => `- ${item}`).join('\n') + `\n\n`;
    }
    if (tech.database && tech.database.length > 0) {
      md += `### Database\n` + tech.database.map(item => `- ${item}`).join('\n') + `\n\n`;
    }
    if (tech.ml_ai && tech.ml_ai.length > 0) {
      md += `### ML & AI\n` + tech.ml_ai.map(item => `- ${item}`).join('\n') + `\n\n`;
    }
    if (tech.devops && tech.devops.length > 0) {
      md += `### DevOps\n` + tech.devops.map(item => `- ${item}`).join('\n') + `\n\n`;
    }
    if (tech.apis_services && tech.apis_services.length > 0) {
      md += `### APIs & Third-party Services\n` + tech.apis_services.map(item => `- ${item}`).join('\n') + `\n\n`;
    }
  }
  
  if (doc.implementation_phases && doc.implementation_phases.length > 0) {
    md += `## 6. Implementation Roadmap\n`;
    doc.implementation_phases.forEach(phase => {
      md += `### ${phase.phase}\n`;
      phase.tasks.forEach(t => {
        md += `- ${t}\n`;
      });
      md += `\n`;
    });
  }
  
  if (doc.team_structure && doc.team_structure.length > 0) {
    md += `## 7. Team Structure & Roles\n`;
    doc.team_structure.forEach(role => {
      md += `- ${role}\n`;
    });
    md += `\n`;
  }
  
  if (doc.unique_selling_points && doc.unique_selling_points.length > 0) {
    md += `## 8. Unique Selling Points (USPs)\n`;
    doc.unique_selling_points.forEach(usp => {
      md += `- ${usp}\n`;
    });
    md += `\n`;
  }
  
  if (doc.risks_and_mitigations && doc.risks_and_mitigations.length > 0) {
    md += `## 9. Risks and Mitigations\n`;
    md += `| Risk | Mitigation |\n|---|---|\n`;
    doc.risks_and_mitigations.forEach(rm => {
      md += `| ${rm.risk} | ${rm.mitigation} |\n`;
    });
    md += `\n`;
  }
  
  if (doc.judging_criteria_alignment && doc.judging_criteria_alignment.length > 0) {
    md += `## 10. Hackathon Judging Criteria Alignment\n`;
    doc.judging_criteria_alignment.forEach(align => {
      md += `- ${align}\n`;
    });
    md += `\n`;
  }
  
  if (doc.why_this_is_best) {
    md += `## 11. Strategic Value (Why this is the winning idea)\n${doc.why_this_is_best}\n\n`;
  }
  
  return md;
}

function convertPptToMarkdown(ppt: PPTContent): string {
  let md = `# ${ppt.title}\n`;
  md += `*Presentation Slides Outline*\n`;
  md += `*Organized by: ${ppt.organizer}*\n\n`;
  md += `---\n\n`;
  
  if (ppt.slides) {
    ppt.slides.forEach(slide => {
      md += `## Slide ${slide.slide_number}: ${slide.title}\n\n`;
      if (slide.bullets) {
        slide.bullets.forEach(bullet => {
          md += `- ${bullet}\n`;
        });
      }
      md += `\n`;
      md += `> **Speaker Notes:**\n`;
      md += `> ${slide.speaker_notes}\n\n`;
      md += `---\n\n`;
    });
  }
  
  return md;
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
    prizeDataMissing: data.prizes == null,
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

interface UnauthenticatedStateProps {
  onSignIn: () => void;
}

const UnauthenticatedState = ({ onSignIn }: UnauthenticatedStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center border border-grid/20 bg-white p-12 text-center shadow-sm min-h-[50vh] relative overflow-hidden">
      {/* Background soft glowing orb */}
      <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-mint/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-forest/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md mx-auto space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-forest/5 border border-forest/10 mb-2 mx-auto">
          <Icon icon="lucide:lock" className="w-6 h-6 text-forest" />
        </div>
        
        <h3 className="space-grotesk text-2xl font-bold text-forest">
          Unlock AI-Powered Insights
        </h3>
        
        <p className="typography-body-md text-grid/80 leading-relaxed">
          Sign in to generate full agent-debate analyses, access downloadable pitch decks & technical proposals, and chat directly with our AI agent about this hackathon.
        </p>

        <button
          onClick={onSignIn}
          className="inline-flex items-center gap-2 border border-forest bg-forest hover:bg-transparent text-white hover:text-forest px-8 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all shadow-sm cursor-pointer hover:shadow-md mx-auto"
        >
          <Icon icon="lucide:log-in" className="w-4 h-4" />
          Sign In to Access
        </button>
      </div>
    </div>
  );
};

export default function HackathonDetailApi() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isNavbarVisible } = useNavbar();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; idToken?: string } | null>(null);
  const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false);

  useEffect(() => {
    const checkUser = () => {
      try {
        const stored = localStorage.getItem("beacon_user");
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      }
    };
    checkUser();
    window.addEventListener("storage", checkUser);
    const interval = setInterval(checkUser, 1000);
    return () => {
      window.removeEventListener("storage", checkUser);
      clearInterval(interval);
    };
  }, []);

  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm here to help you analyze this hackathon and develop your winning idea. What would you like to explore?",
    },
  ]);

  const hasUserSent = useMemo(() => chatMessages.some((m) => m.role === "user"), [chatMessages]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [expandedCard, setExpandedCard] = useState<{ roundIndex: number; agent: string } | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log("Copied to clipboard!");
    }).catch(err => console.error("Copy failed", err));
  };

  const handleDownloadAsset = async (format: "docx" | "pptx") => {
    try {
      const token = user?.idToken;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/hackathons/${id}/assets/download/${format}`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `proposal.${format}`;
      if (contentDisposition) {
        const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      } else {
        const safeTitle = viewModel?.title ? viewModel.title.toLowerCase().replace(/[^a-z0-9]+/g, "_") : "project";
        filename = `${safeTitle}_${format === "docx" ? "technical_proposal.docx" : "pitch_deck.pptx"}`;
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Error downloading ${format} asset:`, err);
      alert(`Failed to download ${format.toUpperCase()} file. Please try again.`);
    }
  };

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
    queryKey: ["hackathon-analysis", id, user?.idToken],
    enabled: Boolean(id) && Boolean(user?.idToken),
    refetchInterval: (query) => {
      const data = query.state.data as AnalysisResponse | undefined;
      const status = data?.data?.status;
      // Fallback to polling if SSE is not enabled or status is running
      if (status === "PENDING" || status === "RUNNING") {
        return 3000;
      }
      return false;
    },
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (user?.idToken) {
        headers["Authorization"] = `Bearer ${user.idToken}`;
      }
      const response = await fetch(`${API_BASE_URL}/hackathons/${id}/analysis`, {
        headers
      });

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

  // Use SSE for real-time updates when analysis is running
  const analysisStatus = analysisQuery.data?.data?.status;
  const [sseEnabled, setSseEnabled] = useState(true);
  useAnalysisSSE({
    hackathonId: id || "",
    token: user?.idToken || null,
    enabled: sseEnabled && Boolean(id) && Boolean(user?.idToken) && (analysisStatus === "PENDING" || analysisStatus === "RUNNING"),
    onError: (error) => {
      console.error("SSE error, disabling SSE and falling back to polling:", error);
      setSseEnabled(false);
      // Polling fallback is handled by refetchInterval above
    },
  });

  // Assets-related states
  const [activeAssetView, setActiveAssetView] = useState<"doc" | "ppt">("doc");
  const [assetsGenerating, setAssetsGenerating] = useState(false);
  const [assetsGeneratingText, setAssetsGeneratingText] = useState("Generating AI Blueprints & Pitch Slides...");
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [collapsedSpeakerNotes, setCollapsedSpeakerNotes] = useState<Record<number, boolean>>({});

  const assetsQuery = useQuery<AssetsResponse, Error>({
    queryKey: ["hackathon-assets", id, user?.idToken],
    enabled: Boolean(id) && Boolean(user?.idToken),
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (user?.idToken) {
        headers["Authorization"] = `Bearer ${user.idToken}`;
      }
      const response = await fetch(`${API_BASE_URL}/hackathons/${id}/assets`, {
        headers
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.status}`);
      }
      const result = (await response.json()) as AssetsResponse;
      if (!result.success) {
        throw new Error(result.error ?? "Backend returned no assets data");
      }
      return result;
    },
  });

  const assetsPayload = assetsQuery.data?.data;
  const pptContent = assetsPayload?.ppt_content;

  const handleGenerateAssets = async () => {
    setAssetsGenerating(true);
    setAssetsError(null);
    try {
      // If we don't have analysis, trigger it!
      if (!hasAnalysis) {
        setAssetsGeneratingText("Triggering AI Agent Debate to select winning idea...");
        const analyzeResp = await fetch(`${API_BASE_URL}/hackathons/${id}/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(user?.idToken ? { Authorization: `Bearer ${user.idToken}` } : {}),
          },
        });
        if (!analyzeResp.ok) {
          throw new Error("Failed to run AI Analysis prior to asset generation.");
        }
        const analyzeResult = await analyzeResp.json();
        // Update query client cache for analysis
        queryClient.setQueryData(["hackathon-analysis", id, user?.idToken], analyzeResult);
        queryClient.invalidateQueries({ queryKey: ["hackathon-analysis", id, user?.idToken] });
      }

      // Wait for analysis completion using SSE
      const waitForAnalysisCompletion = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          if (!user?.idToken) {
            reject(new Error("User not authenticated"));
            return;
          }

          const url = `${API_BASE_URL}/hackathons/${id}/analysis/stream?token=${encodeURIComponent(user.idToken)}`;
          const timeout = 10 * 60 * 1000; // 10 minutes timeout
          let timeoutId: number;

          const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
          };

          timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error("AI Analysis timed out. Please try again."));
          }, timeout);

          fetchEventSource(url, {
            method: 'GET',
            headers: {
              'Accept': 'text/event-stream',
            },

            onmessage: (event) => {
              try {
                const data = JSON.parse(event.data);
                const currentStatus = data.status;
                const currentMsg = data.status_message || "Analyzing...";

                // Update progress text
                setAssetsGeneratingText(`[AI Debate] ${currentMsg}`);

                // Update cache
                queryClient.setQueryData(
                  ["hackathon-analysis", id, user?.idToken],
                  (oldData: any) => ({
                    ...oldData,
                    data: {
                      ...oldData?.data,
                      status: currentStatus,
                      status_message: currentMsg,
                    }
                  })
                );

                // Check if completed
                if (currentStatus === "COMPLETED") {
                  cleanup();
                  queryClient.invalidateQueries({ queryKey: ["hackathon-analysis", id, user?.idToken] });
                  resolve();
                } else if (currentStatus === "FAILED") {
                  cleanup();
                  reject(new Error(currentMsg || "AI Analysis failed prior to asset generation."));
                }
              } catch (error) {
                console.error("Error parsing SSE message:", error);
              }
            },

            onerror: (error) => {
              cleanup();
              console.error("SSE error in asset generation, falling back to polling:", error);
              // Fallback to polling if SSE fails
              reject(error);
            },

            onclose: () => {
              cleanup();
            },
          });
        });
      };

      try {
        await waitForAnalysisCompletion();
      } catch (sseError) {
        // Fallback to polling if SSE fails
        console.log("SSE failed, falling back to polling for asset generation");
        let analysisFinished = false;
        const maxRetries = 150;
        for (let i = 0; i < maxRetries; i++) {
          const headers: Record<string, string> = {};
          if (user?.idToken) {
            headers["Authorization"] = `Bearer ${user.idToken}`;
          }
          const statusResp = await fetch(`${API_BASE_URL}/hackathons/${id}/analysis`, { headers });
          if (!statusResp.ok) {
            throw new Error("Failed to check AI analysis status prior to asset generation.");
          }
          const statusData = await statusResp.json();
          const currentStatus = statusData?.data?.status;
          const currentMsg = statusData?.data?.status_message || "Analyzing...";

          setAssetsGeneratingText(`[AI Debate] ${currentMsg}`);

          if (currentStatus === "COMPLETED" || (!currentStatus && statusData?.data?.analysis_id)) {
            queryClient.setQueryData(["hackathon-analysis", id, user?.idToken], statusData);
            queryClient.invalidateQueries({ queryKey: ["hackathon-analysis", id, user?.idToken] });
            analysisFinished = true;
            break;
          }

          if (currentStatus === "FAILED") {
            throw new Error(currentMsg || "AI Analysis failed prior to asset generation.");
          }

          await new Promise((resolve) => setTimeout(resolve, 4000));
        }

        if (!analysisFinished) {
          throw new Error("AI Analysis timed out. Please try again.");
        }
      }

      setAssetsGeneratingText("Structuring Solution Blueprint & Slide Deck...");
      const response = await fetch(`${API_BASE_URL}/hackathons/${id}/assets/generate`, {
        method: "POST",
        headers: {
          ...(user?.idToken ? { Authorization: `Bearer ${user.idToken}` } : {}),
        },
      });
      if (!response.ok) {
        const errResult = await response.json().catch(() => ({}));
        throw new Error(errResult.detail ?? `Failed to generate assets: ${response.status}`);
      }
      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to generate assets.");
      }
      queryClient.setQueryData(["hackathon-assets", id, user?.idToken], result);
      queryClient.invalidateQueries({ queryKey: ["hackathon-assets", id, user?.idToken] });
      setActiveAssetView("doc");
    } catch (err) {
      setAssetsError(err instanceof Error ? err.message : "An error occurred during generation.");
    } finally {
      setAssetsGenerating(false);
      setAssetsGeneratingText("Generating AI Blueprints & Pitch Slides...");
    }
  };

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
  const isBackendAnalysisRunning = analysisData?.status === "PENDING" || analysisData?.status === "RUNNING";
  const isRunning = isAnalysisRunning || isBackendAnalysisRunning;
  const analysisLeaderboard = analysisResult?.leaderboard ?? [];
  const analysisFinalScores = analysisResult?.final_scores ?? {};
  const analysisRounds = analysisResult?.rounds ?? [];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    // Log analysis payload for debugging when nothing appears in the UI
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
      content: normalizeMarkdownSpacing(message),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatError(null);
    setChatLoading(true);

    try {
      const apiResponse = await fetch(`${API_BASE_URL}/hackathons/${id}/chat`, {
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

      const assistantResponseRaw =
        payload?.data?.data?.response ?? payload?.data?.response;
      const assistantResponse = normalizeMarkdownSpacing(assistantResponseRaw);

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
          content: normalizeMarkdownSpacing(
            "I couldn't reach the assistant just now. Please try again in a moment.",
          ),
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
    if (isAnalysisRunning) return;

    // Delegate to callAnalyze which performs the backend request.
    callAnalyze();
  };

  const queryClient = useQueryClient();

  async function callAnalyze() {
    if (!id) return;
    try {
      setIsAnalysisRunning(true);

      const resp = await fetch(`${API_BASE_URL}/hackathons/${id}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user?.idToken ? { Authorization: `Bearer ${user.idToken}` } : {}),
        },
      });

      if (!resp.ok) {
        // keep UI responsive; log error
        console.error("Failed to run analysis", resp.status);
        setIsAnalysisRunning(false);
        return;
      }

      const result = (await resp.json()) as AnalysisResponse;

      // Update react-query cache for analysis so the UI reflects the new data
      queryClient.setQueryData(["hackathon-analysis", id, user?.idToken], result);
      // Optionally refetch the query
      queryClient.invalidateQueries({ queryKey: ["hackathon-analysis", id, user?.idToken] });
    } catch (err) {
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
                    disabled={isRunning || (hasAnalysis && analysisData?.status !== "FAILED")}
                    className="flex-1 border border-forest text-forest enabled:hover:bg-[var(--forest)] enabled:hover:text-white py-2 px-4 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRunning ? (
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
                    disabled={isRunning || !hasAnalysis}
                    className="flex-1 border border-forest bg-white py-2 px-4 font-mono text-[10px] tracking-widest uppercase text-forest transition-all enabled:hover:bg-(--forest) enabled:hover:text-(--paper) enabled:hover:border-(--forest) disabled:opacity-50 disabled:cursor-not-allowed"
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
                className={`px-6 py-4 font-mono text-[10px] tracking-widest uppercase transition-all relative flex items-center gap-2 border-b-2 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-(--forest) text-(--paper) border-(--forest)"
                    : "text-grid/60 border-transparent hover:text-forest hover:border-forest/40"
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="inline sm:hidden">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--forest)]" />
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

                  {viewModel?.prizeDataMissing ? (
                    <p className="border border-grid/20 p-4 font-mono text-[10px] tracking-widest uppercase text-grid/60">
                      No prizes data found
                    </p>
                  ) : null}

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
                          className="px-3 py-1 border border-grid/30 font-mono text-[10px] tracking-wider uppercase hover:bg-[var(--forest)] hover:text-white transition-all"
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
                            className="px-3 py-1 border border-grid/30 font-mono text-[10px] tracking-wider uppercase hover:bg-[var(--forest)] hover:text-white transition-all"
                          >
                            Open
                          </a>
                        ) : (
                          <button className="px-3 py-1 border border-grid/30 font-mono text-[10px] tracking-wider uppercase hover:bg-[var(--forest)] hover:text-white transition-all">
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
              !user?.idToken ? (
                <UnauthenticatedState onSignIn={() => setIsAuthPopupOpen(true)} />
              ) : (
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
                    <p className="mx-auto max-w-xl mt-3 text-xs leading-relaxed text-grid/50 italic">
                      Note: This pipeline takes about 5-10 minutes to complete as multiple AI agents research, draft powerful ideas, score them, run debates, and finalize the execution details.
                    </p>
                  </div>
                )}

                {!analysisQuery.isPending && !analysisQuery.error && hasAnalysis && (analysisData?.status === "PENDING" || analysisData?.status === "RUNNING") && (
                  <div className="bg-white border border-grid/20 p-10 text-center flex flex-col items-center justify-center min-h-[350px]">
                    <Icon icon="lucide:loader-2" className="animate-spin text-forest text-5xl mb-6" />
                    <h3 className="font-display text-2xl text-forest mb-2">AI Analysis in Progress</h3>
                    <p className="font-mono text-xs text-forest uppercase tracking-widest bg-forest/10 px-3 py-1 mb-6 rounded">
                      {analysisData?.status_message || "Initializing debate pipeline..."}
                    </p>
                    <div className="w-64 bg-grid/10 h-1 rounded-full overflow-hidden mb-6 relative">
                      <div className="bg-forest h-full animate-pulse w-2/3"></div>
                    </div>
                    <p className="max-w-md text-xs text-grid/50 leading-relaxed">
                      This process takes about 5-10 minutes. You can safely close this page or check other hackathons; the AI agents will complete their debate in the background and save the results when finished.
                    </p>
                  </div>
                )}

                {!analysisQuery.isPending && !analysisQuery.error && hasAnalysis && analysisData?.status === "FAILED" && (
                  <div className="bg-white border border-grid/20 p-10 text-center flex flex-col items-center justify-center min-h-[350px]">
                    <Icon icon="lucide:alert-triangle" className="text-coral text-5xl mb-6" />
                    <h3 className="font-display text-2xl text-forest mb-2">AI Analysis Failed</h3>
                    <p className="font-mono text-xs text-coral uppercase tracking-widest bg-coral/10 px-3 py-1 mb-6 rounded font-bold">
                      {analysisData?.status_message || "An error occurred during the analysis."}
                    </p>
                    <button
                      onClick={handleRunAnalysis}
                      className="border border-forest text-forest hover:bg-[var(--forest)] hover:text-white py-2 px-6 font-mono text-[10px] tracking-widest uppercase transition-all cursor-pointer"
                    >
                      Retry AI Analysis
                    </button>
                  </div>
                )}

                {!analysisQuery.isPending && !analysisQuery.error && hasAnalysis && (!analysisData?.status || analysisData?.status === "COMPLETED") && analysisResult && (
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

                      {/* Winner Box Actions */}
                      {assetsQuery.data?.data?.generated ? (
                        <div className="flex flex-wrap justify-center gap-2.5 mt-5">
                          <button
                            onClick={() => handleDownloadAsset("docx")}
                            className="px-3.5 py-1.5 border border-forest text-forest font-mono text-[9px] tracking-wider uppercase hover:bg-[var(--forest)] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Icon icon="lucide:file-text" /> Doc (.docx)
                          </button>
                          <button
                            onClick={() => handleDownloadAsset("pptx")}
                            className="px-3.5 py-1.5 border border-forest text-forest font-mono text-[9px] tracking-wider uppercase hover:bg-[var(--forest)] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Icon icon="lucide:presentation" /> Slides (.pptx)
                          </button>
                          <button
                            onClick={() => setActiveTab("assets")}
                            className="px-3.5 py-1.5 border border-grid/30 text-grid/80 font-mono text-[9px] tracking-wider uppercase hover:bg-[var(--forest)] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            View Blueprint <Icon icon="lucide:arrow-right" className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleGenerateAssets}
                          disabled={assetsGenerating}
                          className="mt-5 px-5 py-2.5 border border-forest text-forest hover:bg-[var(--forest)] hover:text-white font-mono text-[9px] tracking-widest uppercase transition-all cursor-pointer flex items-center gap-2"
                        >
                          {assetsGenerating ? (
                            <>
                              <Icon icon="lucide:loader-2" className="animate-spin" />
                              <span>Generating blueprint...</span>
                            </>
                          ) : (
                            <>
                              <Icon icon="lucide:wand-2" />
                              <span>Generate Solution Blueprint</span>
                            </>
                          )}
                        </button>
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
                              {analysisLeaderboard[1] ? "2" : "-"}
                            </span>
                            <Icon
                              icon="lucide:award"
                              className="text-xl text-gold/40"
                            />
                          </div>
                        </div>

                        <div className="order-1 w-full flex-1 bg-white border border-grid/20 p-6 premium-card relative md:order-2 md:w-auto md:-translate-y-2 md:pb-8">
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-mint" />
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--forest)] px-2 py-0.5">
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
                              {analysisLeaderboard[0] ? "1" : "-"}
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
                              {analysisLeaderboard[2] ? "3" : "-"}
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
                              const colors = ["bg-(--mint)", "bg-(--gold)", "bg-(--coral)"];

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
                                  <div className="relative h-2.5 w-full md:w-auto md:flex-1 score-bar-bg">
                                    <div
                                      className={`absolute inset-y-0 left-0 ${colors[index] ?? "bg-(--forest)"}`}
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

                    {/* Solution Blueprint & Slide Deck Action Banner */}
                    <div className="mt-8 bg-paper border border-grid/20 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden premium-card">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--forest)]" />
                      <div className="space-y-2">
                        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-forest bg-forest/5 border border-forest/10 px-2 py-0.5">
                          Action Center
                        </span>
                        <h3 className="font-display text-xl text-forest mt-2">
                          Generate Solution Blueprint & Slides
                        </h3>
                        <p className="text-xs text-grid/70 max-w-2xl leading-relaxed">
                          Compile this winning concept into a comprehensive 5-phase Technical Solution Blueprint (Word Document & Markdown) and a 10-slide Pitch Presentation Deck (PowerPoint & Markdown) in one click.
                        </p>
                        {assetsError && (
                          <div className="mt-2 text-xs text-coral font-mono flex items-center gap-1.5">
                            <Icon icon="lucide:alert-circle" /> {assetsError}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch md:items-center shrink-0">
                        {assetsQuery.data?.data?.generated ? (
                          <>
                            <button
                              onClick={() => handleDownloadAsset("docx")}
                              className="px-4 py-2 border border-forest text-forest font-mono text-[10px] tracking-wider uppercase hover:bg-[var(--forest)] hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Icon icon="lucide:download" /> Docx Proposal
                            </button>
                            <button
                              onClick={() => handleDownloadAsset("pptx")}
                              className="px-4 py-2 border border-forest text-forest font-mono text-[10px] tracking-wider uppercase hover:bg-[var(--forest)] hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Icon icon="lucide:presentation" /> PPTX Slides
                            </button>
                            <button
                              onClick={() => setActiveTab("assets")}
                              className="px-4 py-2 border border-grid/30 text-grid/80 font-mono text-[10px] tracking-wider uppercase hover:bg-[var(--forest)] hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              View Blueprint <Icon icon="lucide:arrow-right" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={handleGenerateAssets}
                            disabled={assetsGenerating}
                            className="px-5 py-3 border border-forest text-forest hover:bg-[var(--forest)] hover:text-white font-mono text-[10px] tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            {assetsGenerating ? (
                              <>
                                <Icon icon="lucide:loader-2" className="animate-spin" />
                                <span>{assetsGeneratingText.includes("Debate") ? "Debating..." : "Generating..."}</span>
                              </>
                            ) : (
                              <>
                                <Icon icon="lucide:wand-2" />
                                <span>Generate Blueprint & Slides</span>
                              </>
                            )}
                          </button>
                        )}
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
                                  <span className="font-mono text-[10px] text-white bg-[var(--forest)] px-2 py-0.5 uppercase mb-2 inline-block">
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
                                        className="close-btn absolute top-6 right-6 font-mono text-xl text-grid/60 hover:text-white"
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
                                                      <span className="w-1.5 h-1.5 bg-[var(--forest)]" />
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
            ))}

            {!loading && !error && activeTab === "assets" && (
              !user?.idToken ? (
                <UnauthenticatedState onSignIn={() => setIsAuthPopupOpen(true)} />
              ) : (
                <div className="space-y-6 relative">
                {assetsGenerating && (
                  <div className="absolute inset-0 bg-paper/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-16 h-16 border-4 border-forest border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-mono text-xs text-forest animate-pulse">
                      {assetsGeneratingText}
                    </p>
                  </div>
                )}

                {assetsQuery.isPending && (
                  <div className="bg-white border border-grid/20 p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
                    <div className="w-10 h-10 border-4 border-forest border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-mono text-xs text-forest animate-pulse">
                      Loading Solution Blueprint & Slide Deck...
                    </p>
                  </div>
                )}

                {assetsQuery.error && (
                  <div className="bg-white border border-coral p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
                    <div className="w-12 h-12 bg-coral/5 border border-coral/10 flex items-center justify-center mb-4">
                      <Icon icon="lucide:alert-triangle" className="text-coral text-2xl" />
                    </div>
                    <p className="font-mono text-xs text-coral font-bold uppercase tracking-wider">
                      Unable to load AI assets
                    </p>
                    <p className="mt-3 text-sm text-grid/70 max-w-md mx-auto">
                      {assetsQuery.error.message}
                    </p>
                  </div>
                )}

                {!assetsQuery.isPending && !assetsQuery.error && (
                  <>
                    {/* Main Header / Actions */}
                    <div className="bg-white border border-grid/20 p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                          <h2 className="font-display text-2xl text-forest">
                            Solution Blueprint & Pitch Slides
                          </h2>
                          <p className="font-mono text-[10px] text-grid/60 uppercase tracking-wider mt-1">
                            AI-Generated Solution Blueprint and Slide Outline based on the Winning Idea
                          </p>
                        </div>

                    {assetsQuery.data?.data?.generated && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleDownloadAsset("docx")}
                          className="px-3 py-1.5 border border-forest text-forest font-mono text-[10px] tracking-wider uppercase hover:bg-[var(--forest)] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Icon icon="lucide:file-text" /> Doc (.docx)
                        </button>
                        <button
                          onClick={() => handleDownloadAsset("pptx")}
                          className="px-3 py-1.5 border border-forest text-forest font-mono text-[10px] tracking-wider uppercase hover:bg-[var(--forest)] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Icon icon="lucide:presentation" /> Slides (.pptx)
                        </button>
                        <button
                          onClick={() => {
                            const doc = assetsQuery.data.data.doc_content;
                            if (doc) {
                              const md = convertDocToMarkdown(doc);
                              const blob = new Blob([md], { type: "text/markdown" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `${doc.title.replace(/\s+/g, "_")}_technical_proposal.md`;
                              a.click();
                            }
                          }}
                          className="px-3 py-1.5 border border-grid/30 font-mono text-[10px] tracking-wider uppercase hover:bg-[var(--forest)] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer text-grid/80"
                        >
                          <Icon icon="lucide:download" /> Proposal (.md)
                        </button>
                        <button
                          onClick={() => {
                            const ppt = assetsQuery.data.data.ppt_content;
                            if (ppt) {
                              const md = convertPptToMarkdown(ppt);
                              const blob = new Blob([md], { type: "text/markdown" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `${ppt.title.replace(/\s+/g, "_")}_pitch_deck.md`;
                              a.click();
                            }
                          }}
                          className="px-3 py-1.5 border border-grid/30 font-mono text-[10px] tracking-wider uppercase hover:bg-[var(--forest)] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer text-grid/80"
                        >
                          <Icon icon="lucide:download" /> Slides (.md)
                        </button>
                        <button
                          onClick={handleGenerateAssets}
                          disabled={assetsGenerating}
                          className="px-3 py-1.5 border border-grid/30 font-mono text-[10px] tracking-wider uppercase hover:bg-[var(--forest)] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer text-grid/70"
                        >
                          <Icon icon="lucide:refresh-cw" className={assetsGenerating ? "animate-spin" : ""} /> Regenerate
                        </button>
                      </div>
                    )}
                  </div>

                  {assetsError && (
                    <div className="mb-6 p-4 border border-coral bg-coral/10 text-forest font-mono text-xs flex items-center gap-2">
                      <Icon icon="lucide:alert-circle" className="text-coral flex-shrink-0" />
                      <span>{assetsError}</span>
                    </div>
                  )}

                  {/* NOT GENERATED STATE */}
                  {assetsQuery.data?.data?.generated === false && (
                    <div className="py-12 flex flex-col items-center justify-center text-center max-w-xl mx-auto">
                      <div className="w-16 h-16 bg-forest/5 border border-forest/10 flex items-center justify-center mb-6">
                        <Icon icon="lucide:files" className="text-forest text-2xl" />
                      </div>
                      <h3 className="font-display text-xl text-forest mb-2">
                        No Assets Generated Yet
                      </h3>
                      <p className="text-sm text-grid/70 mb-8 leading-relaxed">
                        Create a fully detailed technical architecture proposal (Markdown document) and a complete slide outline (presentation outline with speaker notes) based on the winning hackathon idea.
                      </p>

                      <button
                        onClick={handleGenerateAssets}
                        disabled={assetsGenerating}
                        className="px-6 py-3 border border-forest text-forest hover:bg-[var(--forest)] hover:text-white font-mono text-xs tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto"
                      >
                        {assetsGenerating ? (
                          <>
                            <Icon icon="lucide:loader-2" className="animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : hasAnalysis ? (
                          "Generate Solution Blueprint"
                        ) : (
                          "Run AI Analysis & Generate Blueprint"
                        )}
                      </button>
                      {!hasAnalysis && (
                        <p className="font-mono text-[9px] text-coral uppercase tracking-wider mt-3">
                          * Runs a multi-agent debate (10s) then generates slides & proposal
                        </p>
                      )}
                    </div>
                  )}

                  {/* GENERATED CONTENT */}
                  {assetsQuery.data?.data?.generated === true && (
                    <div className="space-y-6">
                      {/* View Switcher */}
                      <div className="flex border-b border-grid/20 pb-4">
                        <button
                          onClick={() => setActiveAssetView("doc")}
                          className={`px-4 py-2 font-mono text-xs tracking-wider uppercase border-b-2 transition-all mr-2 cursor-pointer ${
                            activeAssetView === "doc"
                              ? "border-forest text-forest font-bold"
                              : "border-transparent text-grid/40 hover:text-forest hover:border-forest/40"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Icon icon="lucide:file-text" /> Solution Blueprint (Doc)
                          </span>
                        </button>
                        <button
                          onClick={() => setActiveAssetView("ppt")}
                          className={`px-4 py-2 font-mono text-xs tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                            activeAssetView === "ppt"
                              ? "border-forest text-forest font-bold"
                              : "border-transparent text-grid/40 hover:text-forest hover:border-forest/40"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Icon icon="lucide:presentation" /> Pitch Slides (PPT)
                          </span>
                        </button>
                      </div>

                      {/* DOCUMENT VIEW */}
                      {activeAssetView === "doc" && assetsQuery.data.data.doc_content && (
                        <div className="flex flex-col lg:flex-row gap-8">
                          {/* Left Navigation Column */}
                          <div className="w-full lg:w-1/4 lg:sticky lg:top-4 h-fit space-y-1">
                            <p className="font-mono text-[10px] text-grid/40 uppercase tracking-widest px-3 mb-2 font-bold">
                              Document Sections
                            </p>
                            {[
                              { label: "Overview", targetId: "doc-overview" },
                              { label: "Problem & Solution", targetId: "doc-prob-sol" },
                              { label: "Core Features", targetId: "doc-features" },
                              { label: "Recommended Tech Stack", targetId: "doc-tech" },
                              { label: "Roadmap", targetId: "doc-roadmap" },
                              { label: "Team Structure", targetId: "doc-team" },
                              { label: "USPs", targetId: "doc-usps" },
                              { label: "Risks & Mitigations", targetId: "doc-risks" },
                              { label: "Judging Alignment", targetId: "doc-judging" }
                            ].map((sec, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  document.getElementById(sec.targetId)?.scrollIntoView({ behavior: "smooth" });
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-mono border border-transparent hover:border-grid/20 hover:bg-paper/50 transition-all text-forest flex items-center justify-between cursor-pointer"
                              >
                                <span>{sec.label}</span>
                                <Icon icon="lucide:chevron-right" className="text-grid/30" />
                              </button>
                            ))}
                          </div>

                          {/* Right Content Column */}
                          <div className="w-full lg:w-3/4 space-y-8">
                            {/* Title & Overview Card */}
                            <div id="doc-overview" className="bg-white border border-grid/20 p-6 scroll-mt-6 relative group">
                              <button
                                onClick={() => {
                                  const doc = assetsQuery.data.data.doc_content;
                                  if (doc) {
                                    handleCopyToClipboard(`# ${doc.title}\n\n${doc.why_this_is_best}`);
                                  }
                                }}
                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 border border-grid/20 hover:bg-[var(--forest)] hover:text-white cursor-pointer"
                                title="Copy section markdown"
                              >
                                <Icon icon="lucide:copy" className="w-3.5 h-3.5" />
                              </button>
                              <h3 className="font-display text-2xl text-forest mb-2">
                                {assetsQuery.data.data.doc_content.title}
                              </h3>
                              <div className="w-12 h-1 bg-[var(--forest)] mb-6"></div>
                              <p className="text-sm leading-relaxed text-grid/80 italic">
                                {assetsQuery.data.data.doc_content.why_this_is_best}
                              </p>
                            </div>

                            {/* Problem & Solution Card */}
                            <div id="doc-prob-sol" className="bg-white border border-grid/20 p-6 scroll-mt-6 relative group">
                              <button
                                onClick={() => {
                                  const doc = assetsQuery.data.data.doc_content;
                                  if (doc) {
                                    handleCopyToClipboard(`## Problem Statement\n${doc.problem_statement}\n\n## Solution Overview\n${doc.solution_overview}`);
                                  }
                                }}
                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 border border-grid/20 hover:bg-[var(--forest)] hover:text-white cursor-pointer"
                                title="Copy section markdown"
                              >
                                <Icon icon="lucide:copy" className="w-3.5 h-3.5" />
                              </button>
                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  <h4 className="font-mono text-xs text-coral font-bold uppercase tracking-wider">
                                    Problem Statement
                                  </h4>
                                  <p className="text-xs leading-relaxed text-grid/80">
                                    {assetsQuery.data.data.doc_content.problem_statement}
                                  </p>
                                </div>
                                <div className="space-y-3 border-t md:border-t-0 md:border-l border-grid/10 pt-6 md:pt-0 md:pl-6">
                                  <h4 className="font-mono text-xs text-forest font-bold uppercase tracking-wider">
                                    Proposed Solution
                                  </h4>
                                  <p className="text-xs leading-relaxed text-grid/80">
                                    {assetsQuery.data.data.doc_content.solution_overview}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Core Features & Target Users */}
                            <div id="doc-features" className="bg-white border border-grid/20 p-6 scroll-mt-6 relative group">
                              <button
                                onClick={() => {
                                  const doc = assetsQuery.data.data.doc_content;
                                  if (doc) {
                                    handleCopyToClipboard(`## Key Features\n${doc.core_features.map(f => `- ${f}`).join('\n')}\n\n## Target Users\n${doc.target_users.map(u => `- ${u}`).join('\n')}`);
                                  }
                                }}
                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 border border-grid/20 hover:bg-[var(--forest)] hover:text-white cursor-pointer"
                                title="Copy section markdown"
                              >
                                <Icon icon="lucide:copy" className="w-3.5 h-3.5" />
                              </button>
                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <h4 className="font-mono text-xs text-forest font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <Icon icon="lucide:zap" /> Core Features
                                  </h4>
                                  <ul className="space-y-3">
                                    {(assetsQuery.data.data.doc_content.core_features ?? []).map((feat, idx) => (
                                      <li key={idx} className="flex gap-2 text-xs text-grid/80 items-start">
                                        <div className="w-1.5 h-1.5 bg-[var(--forest)] rounded-full mt-1.5 flex-shrink-0" />
                                        <span>{feat}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="space-y-4 border-t md:border-t-0 md:border-l border-grid/10 pt-6 md:pt-0 md:pl-6">
                                  <h4 className="font-mono text-xs text-forest font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <Icon icon="lucide:users" /> Target Users
                                  </h4>
                                  <ul className="space-y-3">
                                    {(assetsQuery.data.data.doc_content.target_users ?? []).map((user, idx) => (
                                      <li key={idx} className="flex gap-2 text-xs text-grid/80 items-start">
                                        <div className="w-1.5 h-1.5 bg-coral rounded-full mt-1.5 flex-shrink-0" />
                                        <span>{user}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>

                            {/* Tech Stack Card */}
                            <div id="doc-tech" className="bg-white border border-grid/20 p-6 scroll-mt-6 relative group">
                              <button
                                onClick={() => {
                                  const doc = assetsQuery.data.data.doc_content;
                                  if (doc) {
                                    let stackStr = `## Recommended Tech Stack\n`;
                                    Object.entries(doc.recommended_tech_stack).forEach(([key, val]) => {
                                      if (val && val.length > 0) {
                                        stackStr += `### ${key.toUpperCase()}\n${val.map(v => `- ${v}`).join('\n')}\n\n`;
                                      }
                                    });
                                    handleCopyToClipboard(stackStr);
                                  }
                                }}
                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 border border-grid/20 hover:bg-[var(--forest)] hover:text-white cursor-pointer"
                                title="Copy section markdown"
                              >
                                <Icon icon="lucide:copy" className="w-3.5 h-3.5" />
                              </button>
                              <h4 className="font-mono text-xs text-forest font-bold uppercase tracking-wider mb-6 flex items-center gap-1.5">
                                <Icon icon="lucide:layers" /> Recommended Tech Stack
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(assetsQuery.data.data.doc_content.recommended_tech_stack ?? {}).map(([category, items], idx) => {
                                  if (!items || items.length === 0) return null;
                                  const cleanCatName = category.replace("_", " ").toUpperCase();
                                  return (
                                    <div key={idx} className="border border-grid/10 p-4 bg-paper/20">
                                      <p className="font-mono text-[9px] text-grid/40 uppercase tracking-widest font-bold mb-2">
                                        {cleanCatName}
                                      </p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {items.map((techItem, tIdx) => (
                                          <span
                                            key={tIdx}
                                            className="px-2 py-0.5 border border-grid/20 bg-white text-[10px] font-mono text-forest"
                                          >
                                            {techItem}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Implementation Roadmap Card */}
                            <div id="doc-roadmap" className="bg-white border border-grid/20 p-6 scroll-mt-6 relative group">
                              <button
                                onClick={() => {
                                  const doc = assetsQuery.data.data.doc_content;
                                  if (doc) {
                                    let roadmapStr = `## Implementation Roadmap\n`;
                                    doc.implementation_phases.forEach(phase => {
                                      roadmapStr += `### ${phase.phase}\n${phase.tasks.map(t => `- ${t}`).join('\n')}\n\n`;
                                    });
                                    handleCopyToClipboard(roadmapStr);
                                  }
                                }}
                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 border border-grid/20 hover:bg-[var(--forest)] hover:text-white cursor-pointer"
                                title="Copy section markdown"
                              >
                                <Icon icon="lucide:copy" className="w-3.5 h-3.5" />
                              </button>
                              <h4 className="font-mono text-xs text-forest font-bold uppercase tracking-wider mb-6 flex items-center gap-1.5">
                                <Icon icon="lucide:calendar-range" /> Implementation Roadmap
                              </h4>
                              <div className="space-y-6">
                                {(assetsQuery.data.data.doc_content.implementation_phases ?? []).map((phase, pIdx) => (
                                  <div key={pIdx} className="relative pl-6 border-l-2 border-forest/15 last:border-l-0 pb-2">
                                    <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-[var(--forest)] border-2 border-white" />
                                    <h5 className="font-display text-sm text-forest font-bold mb-3">
                                      {phase.phase}
                                    </h5>
                                    <div className="grid md:grid-cols-2 gap-2">
                                      {phase.tasks.map((task, tIdx) => (
                                        <div key={tIdx} className="flex gap-2 items-start text-xs border border-grid/5 bg-paper/10 p-2.5">
                                          <Icon icon="lucide:check-square" className="text-forest/40 flex-shrink-0 mt-0.5" />
                                          <span className="text-grid/80">{task}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Team Structure Card */}
                            <div id="doc-team" className="bg-white border border-grid/20 p-6 scroll-mt-6 relative group">
                              <button
                                onClick={() => {
                                  const doc = assetsQuery.data.data.doc_content;
                                  if (doc) {
                                    handleCopyToClipboard(`## Team Structure\n${doc.team_structure.map(r => `- ${r}`).join('\n')}`);
                                  }
                                }}
                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 border border-grid/20 hover:bg-[var(--forest)] hover:text-white cursor-pointer"
                                title="Copy section markdown"
                              >
                                <Icon icon="lucide:copy" className="w-3.5 h-3.5" />
                              </button>
                              <h4 className="font-mono text-xs text-forest font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                <Icon icon="lucide:users-round" /> Team Structure & Roles
                              </h4>
                              <div className="grid sm:grid-cols-2 gap-3">
                                {(assetsQuery.data.data.doc_content.team_structure ?? []).map((role, idx) => (
                                  <div key={idx} className="border border-grid/10 p-3 bg-white flex items-start gap-2.5">
                                    <div className="w-8 h-8 rounded bg-forest/5 flex items-center justify-center flex-shrink-0">
                                      <Icon icon="lucide:user" className="text-forest text-sm" />
                                    </div>
                                    <span className="text-xs text-grid/80 font-mono leading-relaxed">
                                      {role}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* USPs & Value Card */}
                            <div id="doc-usps" className="bg-white border border-grid/20 p-6 scroll-mt-6 relative group">
                              <button
                                onClick={() => {
                                  const doc = assetsQuery.data.data.doc_content;
                                  if (doc) {
                                    handleCopyToClipboard(`## Unique Selling Points\n${doc.unique_selling_points.map(u => `- ${u}`).join('\n')}`);
                                  }
                                }}
                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 border border-grid/20 hover:bg-[var(--forest)] hover:text-white cursor-pointer"
                                title="Copy section markdown"
                              >
                                <Icon icon="lucide:copy" className="w-3.5 h-3.5" />
                              </button>
                              <h4 className="font-mono text-xs text-forest font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                <Icon icon="lucide:sparkles" /> Unique Selling Points (USPs)
                              </h4>
                              <div className="space-y-2.5">
                                {(assetsQuery.data.data.doc_content.unique_selling_points ?? []).map((usp, idx) => (
                                  <div key={idx} className="flex items-start gap-2.5 border border-forest/15 bg-mint/5 p-3.5">
                                    <Icon icon="lucide:check-circle-2" className="text-forest text-sm flex-shrink-0 mt-0.5" />
                                    <span className="text-xs text-grid/80 font-mono leading-relaxed">
                                      {usp}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Risks & Mitigations Table */}
                            <div id="doc-risks" className="bg-white border border-grid/20 p-6 scroll-mt-6 relative group">
                              <button
                                onClick={() => {
                                  const doc = assetsQuery.data.data.doc_content;
                                  if (doc) {
                                    let riskStr = `## Risks and Mitigations\n| Risk | Mitigation |\n|---|---|\n`;
                                    doc.risks_and_mitigations.forEach(r => {
                                      riskStr += `| ${r.risk} | ${r.mitigation} |\n`;
                                    });
                                    handleCopyToClipboard(riskStr);
                                  }
                                }}
                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 border border-grid/20 hover:bg-[var(--forest)] hover:text-white cursor-pointer"
                                title="Copy section markdown"
                              >
                                <Icon icon="lucide:copy" className="w-3.5 h-3.5" />
                              </button>
                              <h4 className="font-mono text-xs text-forest font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                <Icon icon="lucide:shield-alert" /> Risks & Mitigations
                              </h4>
                              <div className="overflow-x-auto border border-grid/10">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-paper border-b border-grid/10">
                                      <th className="p-3 font-mono font-bold uppercase text-coral">Risk</th>
                                      <th className="p-3 font-mono font-bold uppercase text-forest">Mitigation</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-grid/10">
                                    {(assetsQuery.data.data.doc_content.risks_and_mitigations ?? []).map((rm, idx) => (
                                      <tr key={idx}>
                                        <td className="p-3 font-medium text-grid/90 w-1/2 align-top">{rm.risk}</td>
                                        <td className="p-3 text-grid/70 w-1/2 align-top bg-mint/5">{rm.mitigation}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Judging Criteria Alignment Card */}
                            <div id="doc-judging" className="bg-white border border-grid/20 p-6 scroll-mt-6 relative group">
                              <button
                                onClick={() => {
                                  const doc = assetsQuery.data.data.doc_content;
                                  if (doc) {
                                    handleCopyToClipboard(`## Judging Criteria Alignment\n${doc.judging_criteria_alignment.map(j => `- ${j}`).join('\n')}`);
                                  }
                                }}
                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 border border-grid/20 hover:bg-[var(--forest)] hover:text-white cursor-pointer"
                                title="Copy section markdown"
                              >
                                <Icon icon="lucide:copy" className="w-3.5 h-3.5" />
                              </button>
                              <h4 className="font-mono text-xs text-forest font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                <Icon icon="lucide:award" /> Hackathon Judging Alignment
                              </h4>
                              <div className="space-y-3">
                                {(assetsQuery.data.data.doc_content.judging_criteria_alignment ?? []).map((align, idx) => (
                                  <div key={idx} className="flex gap-3 text-xs text-grid/80 items-start border border-grid/10 p-3.5 bg-paper/30">
                                    <div className="w-5 h-5 border border-forest flex items-center justify-center text-[10px] font-mono font-bold text-forest bg-white flex-shrink-0 mt-0.5">
                                      {idx + 1}
                                    </div>
                                    <span>{align}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* PRESENTATION VIEW */}
                      {activeAssetView === "ppt" && pptContent && (
                        <div className="flex flex-col lg:flex-row gap-8">
                          {/* Left Slide Selector */}
                          <div className="w-full lg:w-1/4 space-y-2 max-h-[500px] overflow-y-auto pr-2">
                            <p className="font-mono text-[10px] text-grid/40 uppercase tracking-widest px-3 mb-2 font-bold">
                              Slides Outline
                            </p>
                            {(pptContent.slides ?? []).map((slide, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedSlideIndex(idx)}
                                className={`w-full text-left px-4 py-3 border font-mono transition-all text-xs flex items-center gap-3 cursor-pointer ${
                                  selectedSlideIndex === idx
                                    ? "bg-[var(--forest)] text-white border-[var(--forest)]"
                                    : "bg-white text-forest border-grid/20 hover:border-forest/50"
                                }`}
                              >
                                <div className={`w-5 h-5 flex items-center justify-center font-bold text-[10px] border ${
                                  selectedSlideIndex === idx
                                    ? "border-white/30 bg-white/10"
                                    : "border-forest/20 bg-forest/5"
                                }`}>
                                  {slide.slide_number}
                                </div>
                                <span className="truncate flex-1 font-medium">{slide.title}</span>
                              </button>
                            ))}
                          </div>

                          {/* Center/Right Active Slide Render */}
                          {pptContent.slides?.[selectedSlideIndex] && (
                            <div className="w-full lg:w-3/4 space-y-6">
                              {/* 16:9 Aspect Ratio Box Mock Slide */}
                              <div className="border-4 border-grid bg-white shadow-lg relative overflow-hidden aspect-video flex flex-col justify-between p-8 md:p-12">
                                {/* Slide Background watermark / lines */}
                                <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                                  <div className="w-full h-full bg-grid repeat bg-[size:20px_20px]" style={{ backgroundImage: "radial-gradient(var(--grid) 1px, transparent 1px)" }} />
                                </div>

                                {/* Slide Header */}
                                <div className="flex justify-between items-start border-b border-grid/10 pb-4 relative z-10">
                                  <div>
                                    <p className="font-mono text-[8px] text-grid/40 uppercase tracking-widest">
                                      PITCH DECK OUTLINE
                                    </p>
                                    <h4 className="font-display text-lg md:text-2xl text-forest font-bold mt-1">
                                      {pptContent.slides[selectedSlideIndex].title}
                                    </h4>
                                  </div>
                                  <div className="font-mono text-[10px] font-bold text-white bg-[var(--forest)] px-2 py-1 select-none">
                                    SLIDE {pptContent.slides[selectedSlideIndex].slide_number}
                                  </div>
                                </div>

                                {/* Slide Content Bullets */}
                                <div className="flex-1 py-6 flex flex-col justify-center relative z-10">
                                  <ul className="space-y-3.5 max-w-2xl">
                                    {(pptContent.slides[selectedSlideIndex].bullets ?? []).map((bullet, bIdx) => (
                                      <li key={bIdx} className="flex gap-3 text-xs md:text-sm text-grid/80 items-start">
                                        <div className="w-2 h-2 bg-coral rounded-full mt-2 flex-shrink-0" />
                                        <span className="leading-relaxed font-mono">{bullet}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Slide Footer */}
                                <div className="flex justify-between items-center text-[8px] font-mono text-grid/40 pt-4 border-t border-grid/10 relative z-10">
                                  <span>{pptContent.title.toUpperCase()}</span>
                                  <span>{pptContent.organizer?.toUpperCase()}</span>
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="flex justify-between items-center">
                                <button
                                  onClick={() => setSelectedSlideIndex(prev => Math.max(0, prev - 1))}
                                  disabled={selectedSlideIndex === 0}
                                  className="px-3 py-1.5 border border-grid/30 font-mono text-[10px] tracking-wider uppercase hover:bg-[var(--forest)] hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white flex items-center gap-1 cursor-pointer"
                                >
                                  <Icon icon="lucide:arrow-left" /> Previous
                                </button>
                                <span className="font-mono text-[10px] text-grid/60">
                                  Slide {selectedSlideIndex + 1} of {pptContent.slides.length}
                                </span>
                                <button
                                  onClick={() => setSelectedSlideIndex(prev => Math.min((pptContent?.slides?.length ?? 1) - 1, prev + 1))}
                                  disabled={selectedSlideIndex === (pptContent?.slides?.length ?? 1) - 1}
                                  className="px-3 py-1.5 border border-grid/30 font-mono text-[10px] tracking-wider uppercase hover:bg-[var(--forest)] hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white flex items-center gap-1 cursor-pointer"
                                >
                                  Next <Icon icon="lucide:arrow-right" />
                                </button>
                              </div>

                              {/* Speaker Notes */}
                              <div className="bg-paper/40 border border-grid/20 p-5 font-mono">
                                <div
                                  onClick={() => setCollapsedSpeakerNotes(prev => ({
                                    ...prev,
                                    [selectedSlideIndex]: !prev[selectedSlideIndex]
                                  }))}
                                  className="flex items-center justify-between cursor-pointer border-b border-grid/10 pb-2 mb-3"
                                >
                                  <h5 className="text-[10px] uppercase font-bold tracking-widest text-forest flex items-center gap-1.5">
                                    <Icon icon="lucide:mic" /> Speaker Notes & Talking Points
                                  </h5>
                                  <Icon
                                    icon={collapsedSpeakerNotes[selectedSlideIndex] ? "lucide:chevron-down" : "lucide:chevron-up"}
                                    className="text-grid/40 text-sm"
                                  />
                                </div>
                                {!collapsedSpeakerNotes[selectedSlideIndex] && (
                                  <p className="text-xs leading-relaxed text-grid/80 whitespace-pre-wrap">
                                    {pptContent.slides[selectedSlideIndex].speaker_notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}

            {!loading && !error && activeTab === "chat" && (
              !user?.idToken ? (
                <UnauthenticatedState onSignIn={() => setIsAuthPopupOpen(true)} />
              ) : (
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
                        <div
                          className="text-sm leading-relaxed whitespace-pre-wrap markdown-body"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(parse(normalizeMarkdownSpacing(message.content))),
                          }}
                        />
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
                  {!hasUserSent && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          disabled={chatLoading}
                          className="border border-grid/20 px-3 py-2 font-mono text-[10px] tracking-widest uppercase text-grid/70 transition-all hover:border-forest hover:bg-[var(--forest)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

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
                      className="inline-flex min-h-14 items-center gap-2 border border-forest hover:bg-[var(--forest)] px-4 py-3 font-mono text-[10px] tracking-widest uppercase text-forest transition-all hover:text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
            ))}
          </div>

          {user?.idToken && activeTab === "analysis" && !isChatExpanded && (
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
                              ? "border-[var(--forest)] bg-[var(--forest)] text-white"
                              : "border-grid/20 bg-white text-forest"
                          }`}
                        >
                          <div
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(parse(normalizeMarkdownSpacing(message.content))),
                            }}
                          />
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

                  {!hasUserSent && (
                    <div className="space-y-2 mb-3">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => handleSuggestionClick(suggestion)}
                          disabled={chatLoading}
                          className="w-full text-left px-3 py-2 border border-grid/20 font-mono text-[10px] tracking-wider uppercase hover:bg-[var(--forest)] hover:text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

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
                      className="px-3 py-2 border border-forest hover:bg-[var(--forest)] text-forest hover:text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
          <button className="px-4 py-2 border border-forest hover:bg-[var(--forest)] text-forest font-mono text-[10px] tracking-widest uppercase hover:text-white transition-all">
            Save Progress
          </button>
        </div>
      </div>
      <SignupPopup
        isOpen={isAuthPopupOpen}
        onClose={() => setIsAuthPopupOpen(false)}
        initialMode="login"
        onAuthSuccess={(userData) => {
          localStorage.setItem("beacon_user", JSON.stringify(userData));
          setUser(userData);
          setIsAuthPopupOpen(false);
        }}
      />
    </div>
  );
}
