import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

interface HackathonCardProps {
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

export default function HackathonCard({
  id,
  name,
  description,
  college,
  teamSize,
  mode,
  deadline,
  daysLeft,
  isUrgent = false,
  prize,
}: HackathonCardProps) {
  const navigate = useNavigate();
  const getModeBadgeClass = (mode: string) => {
    const classes = {
      remote: 'mode-badge-remote',
      hybrid: 'mode-badge-hybrid',
      offline: 'mode-badge-offline',
    };
    return classes[mode as keyof typeof classes] || '';
  };

  const getPrizeBadgeClass = (prize: string) => {
    const isPaid = prize !== 'FREE';
    // Use the same visual theme as mode badges:
    // - Paid: use offline (gold) styling
    // - Free: use remote (mint/green) styling
    return isPaid ? 'mode-badge-offline' : 'mode-badge-remote';
  };

  const getDeadlineColor = () => {
    if (isUrgent) return 'text-coral';
    return 'text-mint';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  return (
    <div className="hackathon-card-bg overflow-hidden bg-paper border border-grid/20 p-5 card-hover min-h-60 flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-2 py-1 ${getModeBadgeClass(mode)} font-mono text-[10px] tracking-widest border`}>{mode.toUpperCase()}</span>
        <span className={`px-2 py-1 ${getPrizeBadgeClass(prize)} font-mono text-[10px] tracking-widest border ml-1.5`}>{prize === 'FREE' ? 'FREE' : prize}</span>
        <span className={`ml-auto font-mono text-[8px] ${getDeadlineColor()} tracking-wider`}>
          {daysLeft} DAYS LEFT
        </span>
      </div>

      <h3 className="font-display text-lg font-bold text-forest mb-2 leading-tight">{name}</h3>
      <p className="text-sm text-grid/80 mb-4 line-clamp-3">{description}</p>

      <div className="w-full h-1px bg-grid/15 mb-4"></div>

      <div className="flex items-center divide-x divide-grid/20">
        <div className="pr-3 flex items-center gap-1.5">
          <Icon icon="lucide:users" className="text-[10px] text-grid/60" />
          <span className="font-mono text-[9px] text-grid/80">{teamSize} MEMBERS</span>
        </div>
        <div className="px-3 flex items-center gap-1.5">
          <Icon icon="lucide:building-2" className="text-[10px] text-grid/60" />
          <span className="font-mono text-[9px] text-grid/80 max-w-xs whitespace-normal">{college.toUpperCase()}</span>
        </div>
        <div className="pl-3 flex items-center gap-1.5">
          <Icon icon="lucide:calendar" className="text-[10px] text-grid/60" />
          <span className="font-mono text-[9px] text-grid/80">{formatDate(deadline)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate(`/hackathons/${id}`)}
        className="mt-4 w-full border border-grid/30 py-2 font-mono text-[10px] tracking-widest uppercase rounded-sm hover:bg-[var(--forest)] hover:text-white transition-all"
      >
        View
      </button>
    </div>
  );
}