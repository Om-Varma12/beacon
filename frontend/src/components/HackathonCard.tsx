import { Icon } from '@iconify/react';

interface HackathonCardProps {
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
  const getModeBadgeClass = (mode: string) => {
    const classes = {
      remote: 'bg-forest text-white border-forest',
      hybrid: 'border-grid/20 text-grid',
      offline: 'border-grid/20 text-grid',
    };
    return classes[mode as keyof typeof classes] || '';
  };

  const getPrizeBadgeClass = (prize: string) => {
    const isPaid = prize !== 'FREE';
    if (isPaid) {
      return 'bg-gold/10 text-gold border-gold/30';
    }
    return 'bg-mint/10 text-mint border-mint/30';
  };

  const getDeadlineColor = () => {
    if (isUrgent) return 'text-coral';
    return 'text-mint';
  };

  const getStatusDotColor = () => {
    if (isUrgent) return 'bg-coral';
    return 'bg-mint';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  return (
    <div className="bg-paper border border-grid/20 p-5 card-hover">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-1.5 h-1.5 ${getStatusDotColor()}`}></div>
        <span className={`px-2 py-1 ${getModeBadgeClass(mode)} font-mono text-[8px] tracking-widest border`}>
          {mode.toUpperCase()}
        </span>
        <span className={`px-2 py-1 ${getPrizeBadgeClass(prize)} font-mono text-[8px] tracking-widest border`}>
          {prize === 'FREE' ? 'FREE' : 'PAID'}
        </span>
        <span className={`ml-auto font-mono text-[8px] ${getDeadlineColor()} tracking-wider`}>
          {daysLeft} DAYS LEFT
        </span>
      </div>

      <h3 className="font-display text-base font-bold text-forest mb-2 leading-tight">{name}</h3>
      <p className="text-xs text-grid/80 mb-4 line-clamp-2">{description}</p>

      <div className="w-full h-[1px] bg-grid/15 mb-4"></div>

      <div className="flex items-center divide-x divide-grid/20">
        <div className="pr-3 flex items-center gap-1.5">
          <Icon icon="lucide:users" className="text-[10px] text-grid/60" />
          <span className="font-mono text-[9px] text-grid/80">{teamSize} MEMBERS</span>
        </div>
        <div className="px-3 flex items-center gap-1.5">
          <Icon icon="lucide:building-2" className="text-[10px] text-grid/60" />
          <span className="font-mono text-[9px] text-grid/80 truncate">{college.toUpperCase()}</span>
        </div>
        <div className="pl-3 flex items-center gap-1.5">
          <Icon icon="lucide:calendar" className="text-[10px] text-grid/60" />
          <span className="font-mono text-[9px] text-grid/80">{formatDate(deadline)}</span>
        </div>
      </div>
    </div>
  );
}