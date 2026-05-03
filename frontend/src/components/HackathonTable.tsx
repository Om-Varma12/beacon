import { useState } from 'react';
import { Icon } from '@iconify/react';
import HackathonRow from './HackathonRow';
import Pagination from './Pagination';

interface Hackathon {
  id: string;
  name: string;
  description: string;
  college: string;
  teamSize: string;
  mode: 'remote' | 'hybrid' | 'offline';
  deadline: string;
  daysLeft: string;
  isUrgent?: boolean;
  prize: string;
}

const mockHackathons: Hackathon[] = [
  {
    id: '1',
    name: 'ETHGlobal Singapore 2025',
    description: 'Build decentralized applications using Web3 technologies and compete for blockchain innovation prizes',
    college: 'National University of Singapore',
    teamSize: '3-5',
    mode: 'remote',
    deadline: 'Jan 15, 2025',
    daysLeft: '28',
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
    prize: '$60K',
  },
];

export default function HackathonTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('deadline');
  const [activeFilters, setActiveFilters] = useState<string[]>(['MODE: REMOTE', 'PRIZES: $50K+']);

  const itemsPerPage = 8;
  const totalPages = Math.ceil(mockHackathons.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
  };

  const addFilter = () => {
    setActiveFilters([...activeFilters, 'NEW FILTER']);
  };

  return (
    <main className="pt-32 px-6 lg:px-16 pb-16">
      <div className="mb-12">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-[1px] h-8 bg-forest"></div>
          <p className="font-mono text-sm tracking-[0.1em] uppercase">INTELLIGENT DISCOVERY ENGINE</p>
        </div>
        <h1 className="font-display text-6xl text-forest tracking-tight mb-4">Active Hackathons</h1>
        <p className="text-grid/60 text-lg">Discover and participate in top-tier competitive programming events worldwide</p>
      </div>

      <div className="mb-8 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Icon icon="lucide:search" className="absolute left-4 top-1/2 -translate-y-1/2 text-grid/40 text-lg" />
            <input
              type="text"
              placeholder="Search hackathons by name, college, theme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-grid/20 pl-12 pr-4 py-3 text-sm font-mono focus:outline-none focus:border-forest transition-colors rounded-none"
            />
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-grid/20 px-6 py-3 text-[10px] font-mono tracking-widest uppercase focus:outline-none focus:border-forest transition-colors rounded-none appearance-none pr-10"
            >
              <option value="deadline">SORT BY: DEADLINE</option>
              <option value="prizes">SORT BY: PRIZES (HIGH TO LOW)</option>
              <option value="newest">SORT BY: NEWEST</option>
              <option value="teamSize">SORT BY: TEAM SIZE</option>
            </select>
            <Icon icon="lucide:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-grid/60 text-sm pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">ACTIVE FILTERS:</span>
          {activeFilters.map((filter) => (
            <div
              key={filter}
              onClick={() => removeFilter(filter)}
              className="filter-tag px-3 py-1 border border-grid/20 flex items-center space-x-2 rounded-sm cursor-pointer"
            >
              <span className="font-mono text-[9px] tracking-wider uppercase">{filter}</span>
              <Icon icon="lucide:x" className="text-xs" />
            </div>
          ))}
          <button
            onClick={addFilter}
            className="px-3 py-1 border border-forest/30 flex items-center space-x-2 rounded-sm hover:bg-forest hover:text-white transition-all"
          >
            <Icon icon="lucide:plus" className="text-xs" />
            <span className="font-mono text-[9px] tracking-wider uppercase">ADD FILTER</span>
          </button>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-widest uppercase text-grid/60">
          SHOWING 1-{Math.min(itemsPerPage, mockHackathons.length)} OF {mockHackathons.length} HACKATHONS
        </p>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-mint"></div>
          <span className="font-mono text-[10px] tracking-widest uppercase">LIVE SYNC: ACTIVE</span>
        </div>
      </div>

      <div className="bg-paper border-b border-grid/20 py-4 px-8 sticky top-24 z-40">
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-4">
            <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">HACKATHON</span>
          </div>
          <div className="col-span-2">
            <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">COLLEGE</span>
          </div>
          <div className="col-span-1">
            <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">TEAM</span>
          </div>
          <div className="col-span-1">
            <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">MODE</span>
          </div>
          <div className="col-span-2">
            <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">DEADLINE</span>
          </div>
          <div className="col-span-1">
            <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">PRIZES</span>
          </div>
          <div className="col-span-1">
            <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">ACTION</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-grid/10">
        {mockHackathons.map((hackathon) => (
          <HackathonRow key={hackathon.id} {...hackathon} />
        ))}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </main>
  );
}