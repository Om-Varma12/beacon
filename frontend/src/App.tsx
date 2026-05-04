import { useState } from 'react';
import { Icon } from '@iconify/react';
import Navigation from './components/Navigation';
import HackathonTable from './components/HackathonTable';
import { NavbarProvider } from './context/NavbarContext';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('deadline');
  const [activeFilters, setActiveFilters] = useState<string[]>(['MODE: REMOTE', 'PRIZES: $50K+']);
  const [currentPage, setCurrentPage] = useState(1);

  const hackathons = [
    {
      id: '1',
      name: 'ETHGlobal Singapore 2025',
      description: 'Build decentralized applications using Web3 technologies and compete for blockchain innovation prizes',
      college: 'National University of Singapore',
      teamSize: '3-5',
      mode: 'remote',
      deadline: 'Jan 15, 2025',
      daysLeft: '28',
      isUrgent: false,
      prize: '$100K',
    },
    {
      id: '2',
      name: 'HackMIT 2025',
      description: "MIT's premier student-run hackathon featuring AI, robotics, and quantum computing tracks",
      college: 'Massachusetts Institute of Technology',
      teamSize: '2-4',
      mode: 'hybrid',
      deadline: 'Dec 25, 2024',
      daysLeft: '6',
      isUrgent: true,
      prize: '$75K',
    },
    {
      id: '3',
      name: 'WEB3 Hack India',
      description: "India's largest Web3 hackathon with focus on DeFi, NFTs, and Layer-2 scaling solutions",
      college: 'IIT Delhi',
      teamSize: '4-6',
      mode: 'offline',
      deadline: 'Dec 20, 2024',
      daysLeft: '1',
      isUrgent: true,
      prize: '$50K',
    },
    {
      id: '4',
      name: 'AI Challenge 2025',
      description: "Stanford's annual AI competition focusing on LLMs, computer vision, and reinforcement learning",
      college: 'Stanford University',
      teamSize: '2-3',
      mode: 'remote',
      deadline: 'Jan 5, 2025',
      daysLeft: '18',
      isUrgent: false,
      prize: '$200K',
    },
    {
      id: '5',
      name: 'HealthTech Innovation Summit',
      description: 'Build healthcare solutions using AI, IoT, and telemedicine technologies for global impact',
      college: 'Johns Hopkins University',
      teamSize: '3-4',
      mode: 'hybrid',
      deadline: 'Feb 1, 2025',
      daysLeft: '45',
      isUrgent: false,
      prize: '$85K',
    },
    {
      id: '6',
      name: 'Climate Tech Global Challenge',
      description: 'Develop sustainable solutions for carbon tracking, renewable energy optimization, and climate modeling',
      college: 'University of Cambridge',
      teamSize: '2-5',
      mode: 'remote',
      deadline: 'Jan 20, 2025',
      daysLeft: '33',
      isUrgent: false,
      prize: '$120K',
    },
    {
      id: '7',
      name: 'Fintech Revolution Hackathon',
      description: 'Create next-gen banking, payments, and investment platforms using blockchain and AI',
      college: 'UC Berkeley',
      teamSize: '3-5',
      mode: 'offline',
      deadline: 'Jan 10, 2025',
      daysLeft: '23',
      isUrgent: false,
      prize: '$90K',
    },
    {
      id: '8',
      name: 'GameDev Jam 2025',
      description: '48-hour game development sprint with Unity, Unreal Engine, and indie game publishing opportunities',
      college: 'USC School of Cinematic Arts',
      teamSize: '1-4',
      mode: 'remote',
      deadline: 'Feb 5, 2025',
      daysLeft: '49',
      isUrgent: false,
      prize: '$60K',
    },
  ];

  const getModeBadgeClass = (mode: string) => {
    const classes = {
      remote: 'mode-badge-remote',
      hybrid: 'mode-badge-hybrid',
      offline: 'mode-badge-offline',
    };
    return classes[mode as keyof typeof classes] || '';
  };

  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
  };

  const addFilter = () => {
    setActiveFilters([...activeFilters, 'NEW FILTER']);
  };

  return (
    <div className="min-h-screen mosaic-bg">
      <header className="fixed top-0 left-0 right-0 h-24 bg-[#F7F7F5] border-b border-[#3A3A38]/20 z-50 flex items-center px-6 lg:px-16">
        <div className="flex-1 flex items-center">
          <a href="#" className="w-9 h-9 bg-[#1A3C2B] flex items-center justify-center rounded-none hover:scale-105 transition-transform">
            <span className="text-white font-display text-2xl">H</span>
          </a>
        </div>

        <nav className="hidden lg:flex items-center space-x-8">
          <a href="#discover" className="font-mono text-[10px] tracking-[0.1em] text-[#1A3C2B] hover:opacity-70 transition-opacity">
            01. DISCOVER
          </a>
          <a href="#dashboard" className="font-mono text-[10px] tracking-[0.1em] text-[#1A3C2B] font-bold border-b border-[#1A3C2B]">
            02. DASHBOARD
          </a>
          <a href="#analyze" className="font-mono text-[10px] tracking-[0.1em] text-[#1A3C2B] hover:opacity-70 transition-opacity">
            03. ANALYZE
          </a>
          <a href="#submit" className="font-mono text-[10px] tracking-[0.1em] text-[#1A3C2B] hover:opacity-70 transition-opacity">
            04. SUBMIT
          </a>
        </nav>

        <div className="flex-1 flex justify-end space-x-4">
          <a href="#notifications" className="w-9 h-9 border border-[#3A3A38]/30 flex items-center justify-center rounded-sm hover:bg-[#1A3C2B] hover:text-white transition-all">
            <Icon icon="lucide:bell" className="text-base" />
          </a>
          <a href="#profile" className="w-9 h-9 bg-[#1A3C2B] text-white flex items-center justify-center rounded-sm hover:opacity-90 transition-opacity">
            <Icon icon="lucide:user" className="text-base" />
          </a>
        </div>
      </header>

      <main className="pt-32 px-6 lg:px-16 pb-16">
        <div className="mb-12">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-[1px] h-8 bg-[#1A3C2B]"></div>
            <p className="font-mono text-sm tracking-[0.1em] uppercase">INTELLIGENT DISCOVERY ENGINE</p>
          </div>
          <h1 className="font-display text-6xl text-[#1A3C2B] tracking-tight mb-4">Active Hackathons</h1>
          <p className="text-[#3A3A38]/60 text-lg">Discover and participate in top-tier competitive programming events worldwide</p>
        </div>

        <div className="mb-8 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Icon icon="lucide:search" className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3A3A38]/40 text-lg" />
              <input
                type="text"
                placeholder="Search hackathons by name, college, theme..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#3A3A38]/20 pl-12 pr-4 py-3 text-sm font-mono focus:outline-none focus:border-[#1A3C2B] transition-colors rounded-none"
              />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-[#3A3A38]/20 px-6 py-3 text-[10px] font-mono tracking-widest uppercase focus:outline-none focus:border-[#1A3C2B] transition-colors rounded-none appearance-none pr-10"
              >
                <option value="deadline">SORT BY: DEADLINE</option>
                <option value="prizes">SORT BY: PRIZES (HIGH TO LOW)</option>
                <option value="newest">SORT BY: NEWEST</option>
                <option value="teamSize">SORT BY: TEAM SIZE</option>
              </select>
              <Icon icon="lucide:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3A3A38]/60 text-sm pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#3A3A38]/60">ACTIVE FILTERS:</span>
            {activeFilters.map((filter) => (
              <div
                key={filter}
                onClick={() => removeFilter(filter)}
                className="filter-tag px-3 py-1 border border-[#3A3A38]/20 flex items-center space-x-2 rounded-sm cursor-pointer"
              >
                <span className="font-mono text-[9px] tracking-wider uppercase">{filter}</span>
                <Icon icon="lucide:x" className="text-xs" />
              </div>
            ))}
            <button
              onClick={addFilter}
              className="px-3 py-1 border border-[#1A3C2B]/30 flex items-center space-x-2 rounded-sm hover:bg-[#1A3C2B] hover:text-white transition-all"
            >
              <Icon icon="lucide:plus" className="text-xs" />
              <span className="font-mono text-[9px] tracking-wider uppercase">ADD FILTER</span>
            </button>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <p className="font-mono text-[10px] tracking-widest uppercase text-[#3A3A38]/60">
            SHOWING 1-{hackathons.length} OF {hackathons.length} HACKATHONS
          </p>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[#9EFFBF]"></div>
            <span className="font-mono text-[10px] tracking-widest uppercase">LIVE SYNC: ACTIVE</span>
          </div>
        </div>

        <div className="bg-[#F7F7F5] border-b border-[#3A3A38]/20 py-4 px-8 sticky top-24 z-40">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4">
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#3A3A38]/60">HACKATHON</span>
            </div>
            <div className="col-span-2">
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#3A3A38]/60">COLLEGE</span>
            </div>
            <div className="col-span-1">
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#3A3A38]/60">TEAM</span>
            </div>
            <div className="col-span-1">
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#3A3A38]/60">MODE</span>
            </div>
            <div className="col-span-2">
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#3A3A38]/60">DEADLINE</span>
            </div>
            <div className="col-span-1">
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#3A3A38]/60">PRIZES</span>
            </div>
            <div className="col-span-1">
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#3A3A38]/60">ACTION</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#3A3A38]/10">
          {hackathons.map((hackathon, index) => (
            <div
              key={hackathon.id}
              className={`hackathon-row ${index < hackathons.length - 1 ? 'border-b border-[#3A3A38]/20' : ''} py-5 px-8`}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-4">
                  <h3 className="font-display font-bold text-lg text-[#1A3C2B] mb-1">{hackathon.name}</h3>
                  <p className="font-mono text-[10px] text-[#3A3A38]/60 leading-relaxed">{hackathon.description}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-mono text-xs text-[#3A3A38]/60">{hackathon.college}</p>
                </div>
                <div className="col-span-1">
                  <div className="flex items-center space-x-1">
                    <Icon icon="lucide:users" className="text-[#3A3A38]/60 text-sm" />
                    <span className="font-mono text-xs text-[#1A3C2B]">{hackathon.teamSize}</span>
                  </div>
                </div>
                <div className="col-span-1">
                  <span className={`${getModeBadgeClass(hackathon.mode)} px-3 py-1 font-mono text-[10px] tracking-wider uppercase rounded-sm inline-block`}>
                    {hackathon.mode.charAt(0).toUpperCase() + hackathon.mode.slice(1)}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className={`font-mono text-xs ${hackathon.isUrgent ? 'deadline-urgent' : 'deadline-normal'}`}>{hackathon.deadline}</p>
                  <p className={`font-mono text-[9px] mt-0.5 ${hackathon.isUrgent ? 'text-[#FF8C69]' : 'text-[#3A3A38]/40'} uppercase`}>
                    {hackathon.daysLeft} DAYS LEFT {hackathon.isUrgent && '⚠'}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="font-display font-bold text-sm text-[#F4D35E]">{hackathon.prize}</p>
                </div>
                <div className="col-span-1">
                  <button className="action-btn w-full border border-[#3A3A38]/30 py-2 font-mono text-[10px] tracking-widest uppercase rounded-sm">
                    VIEW
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button className="px-6 py-2 border border-[#3A3A38]/30 font-mono text-[10px] tracking-widest uppercase rounded-sm hover:bg-[#1A3C2B] hover:text-white transition-all flex items-center space-x-2">
            <Icon icon="lucide:chevron-left" className="text-sm" />
            <span>PREVIOUS</span>
          </button>

          <div className="flex items-center space-x-2">
            <button className="w-10 h-10 border border-[#1A3C2B] bg-[#1A3C2B] text-white font-mono text-xs rounded-sm">1</button>
            <button className="w-10 h-10 border border-[#3A3A38]/30 font-mono text-xs rounded-sm hover:bg-[#1A3C2B] hover:text-white transition-all">2</button>
            <button className="w-10 h-10 border border-[#3A3A38]/30 font-mono text-xs rounded-sm hover:bg-[#1A3C2B] hover:text-white transition-all">3</button>
            <span className="font-mono text-xs text-[#3A3A38]/40">...</span>
            <button className="w-10 h-10 border border-[#3A3A38]/30 font-mono text-xs rounded-sm hover:bg-[#1A3C2B] hover:text-white transition-all">19</button>
          </div>

          <button className="px-6 py-2 border border-[#3A3A38]/30 font-mono text-[10px] tracking-widest uppercase rounded-sm hover:bg-[#1A3C2B] hover:text-white transition-all flex items-center space-x-2">
            <span>NEXT</span>
            <Icon icon="lucide:chevron-right" className="text-sm" />
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;