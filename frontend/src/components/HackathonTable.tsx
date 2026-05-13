import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useNavbar } from '../context/NavbarContext';
import HackathonRow from './HackathonRow';
import HackathonCard from './HackathonCard';
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

interface BackendHackathon {
  id?: number | string;
  external_id?: number | string | null;
  title?: string;
  description?: string;
  college_name?: string;
  team_size?: unknown;
  mode?: string;
  deadline?: string;
  prizes?: unknown;
}

interface HackathonsResponse {
  success: boolean;
  data: BackendHackathon[];
  count: number;
  error?: string;
}

const itemsPerPage = 12;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const sortParamMap: Record<string, { sort_by: string; order: 'asc' | 'desc' }> = {
  deadline: { sort_by: 'deadline', order: 'asc' },
  prizes: { sort_by: 'id', order: 'desc' },
  newest: { sort_by: 'id', order: 'desc' },
  teamSize: { sort_by: 'start_date', order: 'asc' },
};

function parseTeamSize(value: unknown): string {
  if (!value) return 'TBD';

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parseTeamSize(parsed);
    } catch {
      return value;
    }
  }

  if (Array.isArray(value)) {
    if (value.length === 2 && value.every((item) => typeof item === 'number' || typeof item === 'string')) {
      return `${value[0]}-${value[1]}`;
    }
    return value.join(', ');
  }

  if (typeof value === 'object') {
    const maybeRange = value as { min?: number | string; max?: number | string };
    if (maybeRange.min && maybeRange.max) {
      return `${maybeRange.min}-${maybeRange.max}`;
    }
  }

  return String(value);
}

function parsePrize(value: unknown): string {
  if (value == null) return 'FREE';

  if (typeof value === 'number') {
    return `$${value.toLocaleString()}`;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 'FREE';
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return parsePrize(parsed);
    } catch {
      return trimmed;
    }
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return 'FREE';
    const first = value[0];
    if (typeof first === 'number') {
      return `$${first.toLocaleString()}`;
    }
    if (typeof first === 'string') {
      return first;
    }
    return 'PAID';
  }

  if (typeof value === 'object') {
    const maybeObj = value as { amount?: number; currency?: string; total?: number };
    if (typeof maybeObj.amount === 'number') {
      const currency = maybeObj.currency ?? '$';
      return `${currency}${maybeObj.amount.toLocaleString()}`;
    }
    if (typeof maybeObj.total === 'number') {
      return `$${maybeObj.total.toLocaleString()}`;
    }
    return 'PAID';
  }

  return String(value);
}

function formatDeadline(deadline: string | undefined): string {
  if (!deadline) return 'TBD';
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return 'TBD';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function getDaysLeft(deadline: string | undefined): { daysLeft: string; isUrgent: boolean } {
  if (!deadline) return { daysLeft: 'TBD', isUrgent: false };
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return { daysLeft: 'TBD', isUrgent: false };

  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) {
    return { daysLeft: '0', isUrgent: false };
  }

  return {
    daysLeft: String(diffInDays),
    isUrgent: diffInDays <= 7,
  };
}

function normalizeMode(mode: string | undefined): 'remote' | 'hybrid' | 'offline' {
  const normalized = (mode ?? '').toLowerCase();
  if (normalized === 'remote' || normalized === 'hybrid' || normalized === 'offline') {
    return normalized;
  }
  return 'remote';
}

function mapToFrontendHackathon(item: BackendHackathon): Hackathon {
  const { daysLeft, isUrgent } = getDaysLeft(item.deadline);
  const navigationId = item.external_id ?? item.id ?? crypto.randomUUID();

  return {
    id: String(navigationId),
    name: item.title ?? 'Untitled Hackathon',
    description: item.description ?? 'No description available.',
    college: item.college_name ?? 'Unknown College',
    teamSize: parseTeamSize(item.team_size),
    mode: normalizeMode(item.mode),
    deadline: formatDeadline(item.deadline),
    daysLeft,
    isUrgent,
    prize: parsePrize(item.prizes),
  };
}

export default function HackathonTable() {
  const { isNavbarVisible } = useNavbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('deadline');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPage = Math.max(1, Number(searchParams.get('page') || 1));

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchHackathons() {
      setLoading(true);
      setError(null);

      const offset = (currentPage - 1) * itemsPerPage;
      const sortConfig = sortParamMap[sortBy] ?? sortParamMap.deadline;
      const query = new URLSearchParams({
        limit: String(itemsPerPage),
        offset: String(offset),
        sort_by: sortConfig.sort_by,
        order: sortConfig.order,
      });

      const primaryUrl = `${API_BASE_URL}/hackathons?${query.toString()}`;
      const fallbackUrl = `${API_BASE_URL}/hackathon/?${query.toString()}`;

      try {
        let response = await fetch(primaryUrl, { signal: abortController.signal });
        if (!response.ok && response.status === 404) {
          response = await fetch(fallbackUrl, { signal: abortController.signal });
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch hackathons: ${response.status}`);
        }

        const result = (await response.json()) as HackathonsResponse;
        if (!result.success) {
          throw new Error(result.error ?? 'Backend returned unsuccessful response');
        }

        const mapped = (result.data ?? []).map(mapToFrontendHackathon);
        setHackathons(mapped);
        const returned = result.count ?? mapped.length;
        // If backend returns page-sized results, assume there may be more pages
        setHasMore(returned === itemsPerPage);
        // Construct a conservative total count (known items so far)
        setTotalCount((currentPage - 1) * itemsPerPage + returned);
      } catch (fetchError) {
        if (abortController.signal.aborted) {
          return;
        }

        const message = fetchError instanceof Error ? fetchError.message : 'Unexpected error while fetching hackathons';
        setError(message);
        setHackathons([]);
        setTotalCount(0);
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchHackathons();

    return () => abortController.abort();
  }, [currentPage, sortBy]);

  const displayedHackathons = useMemo(() => {
    if (!searchQuery.trim()) {
      return hackathons;
    }

    const query = searchQuery.trim().toLowerCase();
    return hackathons.filter((hackathon) =>
      [hackathon.name, hackathon.college, hackathon.description].some((field) => field.toLowerCase().includes(query)),
    );
  }, [hackathons, searchQuery]);

  const handlePageChange = (page: number) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (page <= 1) {
      nextParams.delete('page');
    } else {
      nextParams.set('page', String(page));
    }

    setSearchParams(nextParams, { replace: false });
  };

  const isEmpty = !loading && !error && displayedHackathons.length === 0;

  return (
    <main className="pt-24 px-6 lg:px-16 pb-16">
      <div className="mb-12">
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
              className="w-full h-12 bg-white border border-grid/20 pl-12 pr-4 text-sm font-mono focus:outline-none focus:border-forest transition-colors rounded-none"
/>
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
              }}
              className="h-12 bg-white border border-grid/20 px-6 text-[12px] font-mono tracking-widest uppercase focus:outline-none focus:border-forest transition-colors rounded-none appearance-none pr-10"
>
              <option value="deadline">SORT BY: DEADLINE</option>
              <option value="prizes">SORT BY: PRIZES (HIGH TO LOW)</option>
              <option value="newest">SORT BY: NEWEST</option>
              <option value="teamSize">SORT BY: TEAM SIZE</option>
            </select>
            <Icon icon="lucide:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-grid/60 text-sm pointer-events-none" /> 
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-widest uppercase text-grid/60">
          SHOWING {displayedHackathons.length === 0 ? 0 : 1}-{displayedHackathons.length} OF {totalCount} HACKATHONS
        </p>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`w-8 h-8 border flex items-center justify-center rounded-sm transition-colors ${
              viewMode === 'list'
                ? 'border-forest bg-forest text-gold'
                : 'border-grid/30 hover:bg-forest hover:text-gold hover:border-forest'
            }`}
          >
            <Icon icon="lucide:layout-list" className="text-sm" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`w-8 h-8 border flex items-center justify-center rounded-sm transition-colors ${
              viewMode === 'grid'
                ? 'border-forest bg-forest text-gold'
                : 'border-grid/30 hover:bg-forest hover:text-gold hover:border-forest'
            }`}
          >
            <Icon icon="lucide:layout-grid" className="text-sm" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-16 text-center font-mono text-xs tracking-widest uppercase text-grid/60">
          Loading hackathons...
        </div>
      )}

      {error && (
        <div className="py-16 text-center space-y-4">
          <p className="font-mono text-xs tracking-widest uppercase text-coral">Failed to load hackathons</p>
          <p className="text-sm text-grid/70">{error}</p>
        </div>
      )}

      {isEmpty && (
        <div className="py-16 text-center font-mono text-xs tracking-widest uppercase text-grid/60">
          No hackathons found.
        </div>
      )}

      {!loading && !error && displayedHackathons.length > 0 && (
        <>
          {viewMode === 'list' ? (
            <>
              <div className={`bg-(--paper) border-b border-(--grid) py-4 px-8 sticky z-40 transition-all duration-300 ${isNavbarVisible ? 'top-16' : 'top-0'}`}>
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
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
                  <div className="col-span-1">
                    <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">DEADLINE</span>
                  </div>
                  <div className="col-span-1">
                    <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">FEES</span>
                  </div>
                  <div className="col-span-1">
                    <span className="font-mono text-[10px] tracking-widest uppercase text-grid/60">ACTION</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-grid/10">
                {displayedHackathons.map((hackathon) => (
                  <HackathonRow key={hackathon.id} {...hackathon} />
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedHackathons.map((hackathon) => (
                <HackathonCard key={hackathon.id} {...hackathon} />
              ))}
            </div>
          )}
        </>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} hasMore={hasMore} />
    </main>
  );
}
