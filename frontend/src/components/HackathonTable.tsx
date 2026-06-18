import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  description?: string;  // plain-text preview — HTML stripped & truncated by backend
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

interface HackathonListQueryResult {
  hackathons: Hackathon[];
  totalCount: number;
  hasMore: boolean;
}

type FeeFilter = 'all' | 'free' | 'paid';
type ModeFilter = 'all' | 'remote' | 'offline';

const itemsPerPage = 12;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

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

function stripHtml(value: string): string {
  if (typeof window === 'undefined') {
    return value.replace(/<[^>]*>/g, ' ');
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(value, 'text/html');
  return document.body.textContent ?? '';
}

function buildDescriptionPreview(value: string): string {
  const plainText = stripHtml(value)
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainText) {
    return 'No description available.';
  }

  return plainText.length > 180 ? `${plainText.slice(0, 180).trimEnd()}…` : plainText;
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
  const descriptionSource = item.description ?? 'No description available.';

  return {
    id: String(navigationId),
    name: item.title ?? 'Untitled Hackathon',
    description: buildDescriptionPreview(descriptionSource),
    college: item.college_name ?? 'Unknown College',
    teamSize: parseTeamSize(item.team_size),
    mode: normalizeMode(item.mode),
    deadline: formatDeadline(item.deadline),
    daysLeft,
    isUrgent,
    prize: parsePrize(item.prizes),
  };
}

function getTeammateOptionsFromSize(teamSize: string): number[] {
  const normalized = teamSize.trim().toUpperCase();
  if (!normalized || normalized === 'TBD') {
    return [];
  }

  const matches = teamSize.match(/\d+/g);
  if (!matches || matches.length === 0) {
    return [];
  }

  const numbers = matches
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  if (numbers.length === 0) {
    return [];
  }

  if (numbers.length >= 2 && /-|to/i.test(teamSize)) {
    const min = numbers[0];
    const max = numbers[numbers.length - 1];
    const span = max - min;

    // Guardrail for malformed ranges like 1-1000.
    if (span > 20) {
      return [min, max];
    }

    return Array.from({ length: span + 1 }, (_, idx) => min + idx);
  }

  return Array.from(new Set(numbers));
}

export default function HackathonTable() {
  const { isNavbarVisible } = useNavbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [feeFilter, setFeeFilter] = useState<FeeFilter>('all');
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all');
  const [selectedTeammates, setSelectedTeammates] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const parsedPage = Number(searchParams.get('page') || 1);
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const queryResult = useQuery<HackathonListQueryResult, Error>({
    queryKey: ['hackathons', currentPage],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const query = new URLSearchParams({
        limit: String(itemsPerPage),
        offset: String(offset),
        sort_by: 'deadline',
        order: 'asc',
      });

      const response = await fetch(`${API_BASE_URL}/hackathons?${query.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch hackathons: ${response.status}`);
      }

      const result = (await response.json()) as HackathonsResponse;
      if (!result.success) {
        throw new Error(result.error ?? 'Backend returned unsuccessful response');
      }

      const hackathons = (result.data ?? []).map(mapToFrontendHackathon);
      const totalCount = result.count ?? hackathons.length;
      // Backend currently returns page count (len(data)), not global total count.
      // Keep pagination working by treating a full page as "possibly has more".
      const hasMore = totalCount > currentPage * itemsPerPage || hackathons.length === itemsPerPage;

      return {
        hackathons,
        totalCount,
        hasMore,
      };
    },
  });

  const EMPTY_HACKATHONS: Hackathon[] = useMemo(() => [], []);
  const hackathons = queryResult.data?.hackathons ?? EMPTY_HACKATHONS;
  const totalCount = queryResult.data?.totalCount ?? 0;
  const hasMore = queryResult.data?.hasMore ?? false;
  const loading = queryResult.isPending;
  const error = queryResult.error?.message ?? null;

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const effectiveTotalPages = Math.max(totalPages, currentPage + (hasMore ? 1 : 0));

  const teammateOptions = useMemo(() => {
    const values = new Set<number>();
    hackathons.forEach((hackathon) => {
      getTeammateOptionsFromSize(hackathon.teamSize).forEach((count) => {
        values.add(count);
      });
    });

    return Array.from(values).sort((a, b) => a - b);
  }, [hackathons]);

  const displayedHackathons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return hackathons.filter((hackathon) => {
      const matchesSearch =
        query.length === 0
          ? true
          : [hackathon.name, hackathon.college, hackathon.description].some((field) =>
              field.toLowerCase().includes(query),
            );

      const isFree = hackathon.prize.trim().toUpperCase() === 'FREE';
      const matchesFee = feeFilter === 'all' ? true : feeFilter === 'free' ? isFree : !isFree;

      const matchesMode = modeFilter === 'all' ? true : hackathon.mode === modeFilter;

      const teammateCounts = getTeammateOptionsFromSize(hackathon.teamSize);
      const matchesTeammates =
        selectedTeammates.length === 0
          ? true
          : selectedTeammates.some((count) => teammateCounts.includes(count));

      return matchesSearch && matchesFee && matchesMode && matchesTeammates;
    });
  }, [hackathons, searchQuery, feeFilter, modeFilter, selectedTeammates]);

  const toggleTeammateFilter = (count: number) => {
    setSelectedTeammates((previous) => {
      if (previous.includes(count)) {
        return previous.filter((item) => item !== count);
      }

      return [...previous, count].sort((a, b) => a - b);
    });
  };

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
        <div className="flex flex-wrap items-center gap-4">
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
              value={feeFilter}
              onChange={(e) => {
                setFeeFilter(e.target.value as FeeFilter);
              }}
              className="h-12 bg-white border border-grid/20 px-6 text-[12px] font-mono tracking-widest uppercase focus:outline-none focus:border-forest transition-colors rounded-none appearance-none pr-10"
            >
              <option value="all">FEES: ALL</option>
              <option value="free">FEES: FREE</option>
              <option value="paid">FEES: PAID</option>
            </select>
            <Icon icon="lucide:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-grid/60 text-sm pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={modeFilter}
              onChange={(e) => {
                setModeFilter(e.target.value as ModeFilter);
              }}
              className="h-12 bg-white border border-grid/20 px-6 text-[12px] font-mono tracking-widest uppercase focus:outline-none focus:border-forest transition-colors rounded-none appearance-none pr-10"
            >
              <option value="all">MODE: ALL</option>
              <option value="remote">MODE: REMOTE</option>
              <option value="offline">MODE: OFFLINE</option>
            </select>
            <Icon icon="lucide:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-grid/60 text-sm pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <p className="font-mono text-[10px] tracking-widest uppercase text-grid/60">TEAMMATES:</p>
          {teammateOptions.length === 0 ? (
            <span className="font-mono text-[10px] tracking-widest uppercase text-grid/40">No teammate data on this page</span>
          ) : (
            teammateOptions.map((count) => {
              const isChecked = selectedTeammates.includes(count);

              return (
                <label
                  key={count}
                  className={`inline-flex items-center gap-2 border px-3 py-2 rounded-sm cursor-pointer transition-colors ${
                    isChecked
                      ? 'border-grid/20 bg-white text-grid/80 hover:border-forest'
                      : 'border-grid/20 bg-white text-grid/80 hover:border-forest'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleTeammateFilter(count)}
                    className="h-3.5 w-3.5 accent-forest"
                  />
                  <span className="font-mono text-[10px] tracking-widest uppercase">{count}</span>
                </label>
              );
            })
          )}

          {selectedTeammates.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTeammates([])}
              className="border border-grid/30 px-3 py-2 font-mono text-[10px] tracking-widest uppercase rounded-sm hover:bg-[var(--forest)] hover:text-white transition-all"
            >
              Clear Team Filter
            </button>
          )}
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
                : 'border-grid/30 hover:bg-[var(--forest)] hover:text-gold hover:border-forest'
            }`}
          >
            <Icon icon="lucide:layout-list" className="text-sm" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`w-8 h-8 border flex items-center justify-center rounded-sm transition-colors ${
              viewMode === 'grid'
                ? 'border-forest bg-forest text-gold'
                : 'border-grid/30 hover:bg-[var(--forest)] hover:text-gold hover:border-forest'
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

      <Pagination
        currentPage={currentPage}
        totalPages={effectiveTotalPages}
        onPageChange={handlePageChange}
        hasMore={hasMore}
      />
    </main>
  );
}
