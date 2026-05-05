import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavbar } from '../context/NavbarContext';

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

interface Asset {
  type: 'ppt' | 'doc' | 'pdf' | 'link';
  name: string;
  url: string;
  content?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ExecutionStep {
  day: number;
  title: string;
  tasks: string[];
  completed: boolean;
}

type TabType = 'overview' | 'analysis' | 'final-idea' | 'assets' | 'chat';

export default function Individual() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const { isNavbarVisible } = useNavbar();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m here to help you analyze this hackathon and develop your winning idea. What would you like to explore?',
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<FinalIdea | null>(null);

  const hackathonData = {
    id: '1',
    title: 'AI Innovation Challenge 2025',
    organizer: 'Tech University',
    deadline: '2025-02-15',
    mode: 'remote',
    teamSize: '3-5',
    fee: 'free',
    description: 'Join the most exciting AI hackathon of the year. Build innovative solutions using cutting-edge AI technologies to solve real-world problems.',
    themes: ['Healthcare AI', 'Sustainable Tech', 'Education Innovation', 'Smart Cities'],
    problemStatements: [
      {
        id: 1,
        title: 'AI-Powered Healthcare Diagnostics',
        description: 'Develop an AI system that can assist in early disease detection and provide personalized treatment recommendations.',
      },
      {
        id: 2,
        title: 'Smart Energy Management',
        description: 'Create an AI solution for optimizing energy consumption in smart buildings and reducing carbon footprint.',
      },
    ],
    rules: [
      'Teams must consist of 3-5 members',
      'All code must be open source',
      'Use of pre-trained models is allowed',
      'Projects must be original work',
      'Final submission includes code, documentation, and demo',
    ],
    judgingCriteria: [
      'Innovation and Creativity',
      'Technical Complexity',
      'User Experience',
      'Scalability',
      'Presentation Quality',
    ],
    submissionRequirements: [
      'Source code repository',
      'Technical documentation',
      'Demo video (3-5 minutes)',
      'Presentation slides',
      'API documentation (if applicable)',
    ],
    resources: [
      { type: 'ppt' as const, name: 'Presentation Template', url: '/templates/presentation.pptx' },
      { type: 'doc' as const, name: 'Documentation Guide', url: '/templates/docs-guide.pdf' },
      { type: 'link' as const, name: 'API Documentation', url: 'https://api.example.com/docs' },
    ],
  };

  const aiAnalysis = {
    recommendedTheme: {
      name: 'Healthcare AI Diagnostics',
      confidence: 87,
      lastAnalyzed: new Date(),
    },
    rounds: [
      {
        id: 1,
        name: 'Round 1',
        agents: [
          {
            name: 'Business Agent',
            ideaTitle: 'AI Health Assistant',
            description: 'Personal health monitoring and recommendations',
            pros: ['High market demand', 'Clear monetization path', 'Scalable solution'],
            cons: ['Regulatory challenges', 'Data privacy concerns', 'High development cost'],
            score: 78,
            reasoning: 'Strong business potential but significant regulatory hurdles to overcome.',
          },
          {
            name: 'Innovation Agent',
            ideaTitle: 'Predictive Health Analytics',
            description: 'ML-based disease prediction system',
            pros: ['Cutting-edge technology', 'High impact potential', 'Novel approach'],
            cons: ['Complex implementation', 'Data requirements', 'Validation challenges'],
            score: 85,
            reasoning: 'Innovative approach with strong technical foundation.',
          },
          {
            name: 'Practical Agent',
            ideaTitle: 'Symptom Checker App',
            description: 'User-friendly symptom analysis tool',
            pros: ['Quick to develop', 'User-friendly', 'Low barrier to entry'],
            cons: ['Limited innovation', 'Competition', 'Simpler solution'],
            score: 72,
            reasoning: 'Practical but lacks the innovation factor for winning.',
          },
        ],
        judgeFeedback: 'Round 1 shows strong potential in healthcare AI. The Predictive Health Analytics idea stands out for its innovation.',
        penalties: [],
        ranking: [2, 1, 3],
      },
      {
        id: 2,
        name: 'Round 2',
        agents: [
          {
            name: 'Business Agent',
            ideaTitle: 'AI Health Assistant',
            description: 'Enhanced with telemedicine integration',
            pros: ['Market fit', 'Revenue potential', 'User adoption'],
            cons: ['Regulatory complexity', 'Integration costs'],
            score: 82,
            reasoning: 'Improved business case with telemedicine features.',
          },
          {
            name: 'Innovation Agent',
            ideaTitle: 'Predictive Health Analytics',
            description: 'With real-time monitoring capabilities',
            pros: ['Technical excellence', 'Real-time insights', 'High accuracy'],
            cons: ['Infrastructure needs', 'Data pipeline complexity'],
            score: 88,
            reasoning: 'Strong technical foundation with real-time capabilities.',
          },
          {
            name: 'Practical Agent',
            ideaTitle: 'Symptom Checker Pro',
            description: 'Enhanced with AI recommendations',
            pros: ['Improved UX', 'Better accuracy', 'Faster development'],
            cons: ['Still limited scope', 'Market saturation'],
            score: 75,
            reasoning: 'Better but still not competitive enough.',
          },
        ],
        judgeFeedback: 'Round 2 refinement shows clear leaders emerging. Predictive Health Analytics maintains its lead.',
        penalties: [],
        ranking: [2, 1, 3],
      },
    ],
    finalIdea: {
      title: 'Predictive Health Analytics Platform',
      problemStatement: 'Early disease detection is critical for effective treatment, but current methods are reactive rather than proactive.',
      solutionDescription: 'An AI-powered platform that analyzes patient data to predict potential health issues before they become critical, enabling preventive care.',
      keyFeatures: [
        'Real-time health monitoring',
        'ML-based risk prediction',
        'Personalized health insights',
        'Doctor recommendation system',
        'Secure data management',
      ],
      targetUsers: 'Healthcare providers, hospitals, and health-conscious individuals',
      whyThisWins: 'Combines cutting-edge AI technology with practical healthcare applications, addressing a critical market need.',
      evaluation: {
        innovation: 92,
        feasibility: 85,
        impact: 95,
        execution: 88,
      },
      alternatives: [
        {
          title: 'AI Health Assistant',
          score: 82,
          summary: 'Strong business case but less innovative',
        },
        {
          title: 'Symptom Checker Pro',
          score: 75,
          summary: 'Practical but lacks competitive edge',
        },
      ],
    },
  };

  const executionPlan: ExecutionStep[] = [
    {
      day: 1,
      title: 'Research & Planning',
      tasks: ['Market research', 'Competitor analysis', 'Tech stack selection', 'Team roles assignment'],
      completed: false,
    },
    {
      day: 2,
      title: 'Architecture Design',
      tasks: ['System architecture', 'Database design', 'API design', 'UI/UX wireframes'],
      completed: false,
    },
    {
      day: 3,
      title: 'Core Development',
      tasks: ['ML model development', 'Backend API implementation', 'Frontend development', 'Integration testing'],
      completed: false,
    },
    {
      day: 4,
      title: 'Refinement & Testing',
      tasks: ['Performance optimization', 'Security testing', 'User testing', 'Bug fixes'],
      completed: false,
    },
    {
      day: 5,
      title: 'Final Preparation',
      tasks: ['Documentation completion', 'Demo preparation', 'Presentation slides', 'Final submission'],
      completed: false,
    },
  ];

  const assets: Asset[] = [
    {
      type: 'ppt',
      name: 'Pitch Deck',
      url: '/assets/pitch-deck.pptx',
      content: 'Slide 1: Title\nSlide 2: Problem Statement\nSlide 3: Solution Overview\nSlide 4: Market Analysis\nSlide 5: Technical Architecture\nSlide 6: Demo\nSlide 7: Team\nSlide 8: Q&A',
    },
    {
      type: 'doc',
      name: 'Technical Documentation',
      url: '/assets/technical-docs.md',
      content: '# Predictive Health Analytics Platform\n\n## Overview\nThis platform uses machine learning to predict health risks...\n\n## Architecture\n\n### Frontend\n- React with TypeScript\n- Tailwind CSS\n\n### Backend\n- Python FastAPI\n- PostgreSQL\n- Redis for caching\n\n### ML Pipeline\n- Data preprocessing\n- Model training\n- Prediction API',
    },
    {
      type: 'pdf',
      name: 'Submission Package',
      url: '/assets/submission.pdf',
    },
  ];

  const lastSaved = new Date();

  useState(() => {
    setSelectedIdea(aiAnalysis.finalIdea);
  });

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, newMessage]);
    setChatInput('');

    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Based on the analysis, I recommend focusing on the Predictive Health Analytics idea. It has the highest potential for innovation and impact. Would you like me to elaborate on any specific aspect?',
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

  const getDaysLeft = (deadline: string): number => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysLeft(hackathonData.deadline);

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview' },
    { id: 'analysis' as TabType, label: 'AI Analysis' },
    { id: 'final-idea' as TabType, label: 'Final Idea' },
    { id: 'assets' as TabType, label: 'Assets' },
    { id: 'chat' as TabType, label: 'Chat' },
  ];

  const suggestions = [
    'Explain this idea',
    'Improve this idea',
    'Give MVP plan',
    'Suggest tech stack',
  ];

  return (
    <div className="min-h-screen bg-mosaic">
      <div className="mosaic-bg" />
      <div className="relative z-10 pt-24 px-6 lg:px-16 pb-16">
        <div className="bg-white border border-grid/20 p-8 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
            <div className="flex-1">
              <h1 className="font-display text-4xl lg:text-5xl text-forest tracking-tight mb-2">
                {hackathonData.title}
              </h1>
              <p className="text-grid/60 text-sm mb-4">Organized by {hackathonData.organizer}</p>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`px-3 py-1 font-mono text-[10px] tracking-widest uppercase border ${
                  hackathonData.mode === 'remote' ? 'mode-badge-remote' :
                  hackathonData.mode === 'hybrid' ? 'mode-badge-hybrid' :
                  'mode-badge-offline'
                }`}>
                  {hackathonData.mode.toUpperCase()}
                </span>
                <span className="px-3 py-1 font-mono text-[10px] tracking-widest uppercase border border-grid/30">
                  TEAM: {hackathonData.teamSize}
                </span>
                <span className={`px-3 py-1 font-mono text-[10px] tracking-widest uppercase border ${
                  hackathonData.fee === 'free' ? 'mode-badge-remote' : 'mode-badge-offline'
                }`}>
                  {hackathonData.fee.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Icon icon="lucide:calendar" className="text-grid/60" />
                <span className={`font-mono text-sm ${daysLeft <= 7 ? 'deadline-urgent' : 'deadline-normal'}`}>
                  {new Date(hackathonData.deadline).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                </span>
                <span className="font-mono text-[9px] text-grid/40 uppercase ml-2">
                  {daysLeft > 0 ? `${daysLeft} DAYS LEFT` : 'DEADLINE PASSED'}
                </span>
              </div>
            </div>

            <div className="lg:w-80">
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
                    <span className="font-mono text-[9px] text-grid/60">Confidence</span>
                    <span className="font-mono text-xs text-forest">{aiAnalysis.recommendedTheme.confidence}%</span>
                  </div>
                  <div className="w-full h-2 bg-grid/10 rounded-none overflow-hidden">
                    <div
                      className="h-full bg-forest transition-all duration-500"
                      style={{ width: `${aiAnalysis.recommendedTheme.confidence}%` }}
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
                      'Run AI Analysis'
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

        <div className={`bg-white border-b border-grid/20 sticky z-40 mb-6 transition-all duration-300 ${isNavbarVisible ? 'top-16' : 'top-0'}`}>
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-mono text-[10px] tracking-widest uppercase transition-all relative ${
                  activeTab === tab.id
                    ? 'text-forest'
                    : 'text-grid/60 hover:text-forest'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6">
          <div className={`transition-all duration-300 ${
            (activeTab === 'analysis' || activeTab === 'final-idea') && !isChatExpanded
              ? 'w-[70%]'
              : 'w-full'
          }`}>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <section className="bg-white border border-grid/20 p-6">
                  <h2 className="font-display text-2xl text-forest mb-4">Hackathon Info</h2>

                  <div className="mb-6">
                    <h3 className="font-mono text-xs tracking-widest uppercase text-grid/60 mb-2">Description</h3>
                    <p className="text-sm text-grid/80 leading-relaxed">{hackathonData.description}</p>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-mono text-xs tracking-widest uppercase text-grid/60 mb-3">Themes</h3>
                    <div className="flex flex-wrap gap-2">
                      {hackathonData.themes.map((theme) => (
                        <span
                          key={theme}
                          className="px-3 py-1 border border-grid/30 font-mono text-[10px] tracking-wider uppercase hover:bg-forest hover:text-white transition-all cursor-pointer"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-mono text-xs tracking-widest uppercase text-grid/60 mb-3">Problem Statements</h3>
                    <div className="space-y-3">
                      {hackathonData.problemStatements.map((ps) => (
                        <div key={ps.id} className="border border-grid/20 p-4 hover:border-forest transition-colors">
                          <h4 className="font-display text-lg text-forest mb-2">{ps.title}</h4>
                          <p className="text-sm text-grid/70">{ps.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-mono text-xs tracking-widest uppercase text-grid/60 mb-3">Rules</h3>
                    <ul className="space-y-2">
                      {hackathonData.rules.map((rule, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-grid/80">
                          <span className="text-forest mt-1">•</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-mono text-xs tracking-widest uppercase text-grid/60 mb-3">Judging Criteria</h3>
                    <div className="flex flex-wrap gap-2">
                      {hackathonData.judgingCriteria.map((criteria) => (
                        <span
                          key={criteria}
                          className="px-3 py-1 bg-paper border border-grid/20 font-mono text-[10px] tracking-wider uppercase"
                        >
                          {criteria}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-mono text-xs tracking-widest uppercase text-grid/60 mb-3">Submission Requirements</h3>
                    <ul className="space-y-2">
                      {hackathonData.submissionRequirements.map((req, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-grid/80">
                          <Icon icon="lucide:check" className="text-mint text-sm mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                <section className="bg-white border border-grid/20 p-6">
                  <h2 className="font-display text-2xl text-forest mb-4">Resources</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hackathonData.resources.map((resource, index) => (
                      <div
                        key={index}
                        className="border border-grid/20 p-4 hover:border-forest transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-paper border border-grid/20 flex items-center justify-center">
                            <Icon
                              icon={
                                resource.type === 'ppt'
                                  ? 'lucide:presentation'
                                  : resource.type === 'doc'
                                    ? 'lucide:file-text'
                                    : 'lucide:link'
                              }
                              className="text-forest"
                            />
                          </div>
                          <span className="font-mono text-xs text-forest">{resource.name}</span>
                        </div>
                        <button className="px-3 py-1 border border-grid/30 font-mono text-[10px] tracking-wider uppercase hover:bg-forest hover:text-white transition-all">
                          Open
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="space-y-6">
                <div className="bg-white border border-grid/20 p-6">
                  <h2 className="font-display text-2xl text-forest mb-6">Debate Timeline</h2>
                  <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                    {aiAnalysis.rounds.map((round, index) => (
                      <button
                        key={round.id}
                        className={`flex items-center space-x-2 px-4 py-2 border font-mono text-[10px] tracking-wider uppercase transition-all ${
                          index === 0
                            ? 'border-forest bg-forest text-white'
                            : 'border-grid/30 hover:border-forest'
                        }`}
                      >
                        <span>{round.name}</span>
                        {index < aiAnalysis.rounds.length - 1 && (
                          <Icon icon="lucide:chevron-right" className="text-xs" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {aiAnalysis.rounds.map((round) => (
                  <div key={round.id} className="space-y-4">
                    <div className="bg-white border border-grid/20 p-6">
                      <h3 className="font-display text-xl text-forest mb-4">{round.name}</h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {round.agents.map((agent) => (
                          <div
                            key={agent.name}
                            className="border border-grid/20 p-4 hover:border-forest transition-colors"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-mono text-xs tracking-widest uppercase text-forest">
                                {agent.name}
                              </h4>
                              <span className="px-2 py-1 bg-forest text-white font-mono text-[10px]">
                                {agent.score}
                              </span>
                            </div>
                            <h5 className="font-display text-lg text-forest mb-2">{agent.ideaTitle}</h5>
                            <p className="text-sm text-grid/70 mb-3">{agent.description}</p>

                            <div className="mb-3">
                              <p className="font-mono text-[9px] text-grid/60 uppercase mb-1">Pros</p>
                              <ul className="space-y-1">
                                {agent.pros.map((pro, i) => (
                                  <li key={i} className="text-xs text-grid/80 flex items-start space-x-1">
                                    <Icon icon="lucide:plus" className="text-mint text-[10px] mt-0.5" />
                                    <span>{pro}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="mb-3">
                              <p className="font-mono text-[9px] text-grid/60 uppercase mb-1">Cons</p>
                              <ul className="space-y-1">
                                {agent.cons.map((con, i) => (
                                  <li key={i} className="text-xs text-grid/80 flex items-start space-x-1">
                                    <Icon icon="lucide:minus" className="text-coral text-[10px] mt-0.5" />
                                    <span>{con}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <details className="text-xs">
                              <summary className="font-mono text-[9px] text-grid/60 uppercase cursor-pointer hover:text-forest">
                                View Reasoning
                              </summary>
                              <p className="mt-2 text-grid/70">{agent.reasoning}</p>
                            </details>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-grid/20 pt-4">
                        <h4 className="font-mono text-xs tracking-widest uppercase text-grid/60 mb-2">Judge Feedback</h4>
                        <p className="text-sm text-grid/80">{round.judgeFeedback}</p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-forest text-white p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Icon icon="lucide:trophy" className="text-gold" />
                    <h3 className="font-display text-xl">Final Result</h3>
                  </div>
                  <h4 className="font-display text-2xl mb-2">{aiAnalysis.finalIdea.title}</h4>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] text-grid/60 uppercase">Confidence</span>
                      <span className="font-mono text-lg">{aiAnalysis.recommendedTheme.confidence}%</span>
                    </div>
                    <span className="font-mono text-[9px] text-grid/40 uppercase">
                      Selected by AI Judge
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'final-idea' && selectedIdea && (
              <div className="space-y-6">
                <div className="bg-white border border-grid/20 p-6">
                  <h2 className="font-display text-3xl text-forest mb-6">{selectedIdea.title}</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-mono text-xs tracking-widest uppercase text-grid/60 mb-2">Problem Statement</h3>
                      <p className="text-sm text-grid/80">{selectedIdea.problemStatement}</p>
                    </div>

                    <div>
                      <h3 className="font-mono text-xs tracking-widest uppercase text-grid/60 mb-2">Solution Description</h3>
                      <p className="text-sm text-grid/80">{selectedIdea.solutionDescription}</p>
                    </div>

                    <div>
                      <h3 className="font-mono text-xs tracking-widest uppercase text-grid/60 mb-3">Key Features</h3>
                      <ul className="space-y-2">
                        {selectedIdea.keyFeatures.map((feature, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm text-grid/80">
                            <Icon icon="lucide:check-circle" className="text-mint text-sm mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-mono text-xs tracking-widest uppercase text-grid/60 mb-2">Target Users</h3>
                      <p className="text-sm text-grid/80">{selectedIdea.targetUsers}</p>
                    </div>

                    <div>
                      <h3 className="font-mono text-xs tracking-widest uppercase text-grid/60 mb-2">Why This Idea Wins</h3>
                      <p className="text-sm text-grid/80">{selectedIdea.whyThisWins}</p>
                    </div>

                    <div>
                      <h3 className="font-mono text-xs tracking-widest uppercase text-grid/60 mb-4">Evaluation Breakdown</h3>
                      <div className="space-y-3">
                        {Object.entries(selectedIdea.evaluation).map(([key, value]) => (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-[10px] text-grid/60 uppercase">{key}</span>
                              <span className="font-mono text-xs text-forest">{value}%</span>
                            </div>
                            <div className="w-full h-2 bg-grid/10 rounded-none overflow-hidden">
                              <div
                                className="h-full bg-forest transition-all duration-500"
                                style={{ width: `${value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-mono text-xs tracking-widest uppercase text-grid/60 mb-3">Alternative Ideas</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedIdea.alternatives.map((alt, index) => (
                          <div key={index} className="border border-grid/20 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-display text-lg text-forest">{alt.title}</h4>
                              <span className="px-2 py-1 bg-paper border border-grid/20 font-mono text-[10px]">
                                {alt.score}
                              </span>
                            </div>
                            <p className="text-sm text-grid/70">{alt.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-grid/20 p-6">
                  <h2 className="font-display text-2xl text-forest mb-4">Execution Plan</h2>
                  <div className="space-y-4">
                    {executionPlan.map((step) => (
                      <div key={step.day} className="border border-grid/20 p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-8 h-8 flex items-center justify-center font-mono text-xs ${
                            step.completed ? 'bg-forest text-white' : 'bg-paper border border-grid/20'
                          }`}>
                            {step.completed ? <Icon icon="lucide:check" /> : step.day}
                          </div>
                          <h3 className="font-display text-lg text-forest">Day {step.day}: {step.title}</h3>
                        </div>
                        <ul className="space-y-2 ml-11">
                          {step.tasks.map((task, index) => (
                            <li key={index} className="flex items-start space-x-2 text-sm text-grid/80">
                              <Icon icon="lucide:circle" className="text-[8px] mt-1.5 text-grid/40" />
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

            {activeTab === 'assets' && (
              <div className="space-y-6">
                <div className="bg-white border border-grid/20 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-2xl text-forest">Generated Assets</h2>
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
                    {assets.map((asset, index) => (
                      <div key={index} className="border border-grid/20 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-paper border border-grid/20 flex items-center justify-center">
                              <Icon
                                icon={
                                  asset.type === 'ppt'
                                    ? 'lucide:presentation'
                                    : asset.type === 'doc'
                                      ? 'lucide:file-text'
                                      : 'lucide:file'
                                }
                                className="text-forest"
                              />
                            </div>
                            <div>
                              <h4 className="font-mono text-xs text-forest">{asset.name}</h4>
                              <p className="font-mono text-[9px] text-grid/40 uppercase">{asset.type.toUpperCase()}</p>
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
                            <pre className="font-mono text-xs text-grid/80 whitespace-pre-wrap">{asset.content}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="bg-white border border-grid/20 p-6">
                <h2 className="font-display text-2xl text-forest mb-6">AI Assistant</h2>
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 ${
                          message.role === 'user'
                            ? 'bg-forest text-white'
                            : 'bg-paper border border-grid/20'
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
              </div>
            )}
          </div>

          {(activeTab === 'analysis' || activeTab === 'final-idea') && !isChatExpanded && (
            <div className="w-[30%]">
              <div className="bg-white border border-grid/20 p-4 sticky top-32">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-mono text-xs tracking-widest uppercase text-forest">AI Assistant</h3>
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
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[90%] p-3 text-sm ${
                          message.role === 'user'
                            ? 'bg-forest text-white'
                            : 'bg-paper border border-grid/20'
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
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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
                <span className="font-mono text-[9px] uppercase">Idea Selected</span>
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