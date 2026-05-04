import { Icon } from '@iconify/react';

interface HackathonRowProps {
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

export default function HackathonRow({
  name,
  description,
  college,
  teamSize,
  mode,
  deadline,
  daysLeft,
  isUrgent = false,
  prize,
}: HackathonRowProps) {
  const modeBadgeClass = {
    remote: 'mode-badge-remote',
    hybrid: 'mode-badge-hybrid',
    offline: 'mode-badge-offline',
  }[mode];

  return (
    <div className="hackathon-row border-b border-grid/20 py-5 px-8">
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-4">
          <h3 className="font-display font-bold text-lg text-forest mb-1">{name}</h3>
          <p className="font-mono text-[10px] text-grid/60 leading-relaxed line-clamp-2">{description}</p>
        </div>
        <div className="col-span-2">
          <p className="font-mono text-xs text-grid/60">{college}</p>
        </div>
        <div className="col-span-1">
          <div className="flex items-center space-x-1">
            <Icon icon="lucide:users" className="text-grid/60 text-sm" />
            <span className="font-mono text-xs text-forest">{teamSize}</span>
          </div>
        </div>
        <div className="col-span-1">
          <span className={`${modeBadgeClass} px-3 py-1 font-mono text-[10px] tracking-wider uppercase rounded-sm inline-block`}>
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </span>
        </div>
        <div className="col-span-2">
          <p className={`font-mono text-xs ${isUrgent ? 'deadline-urgent' : 'deadline-normal'}`}>{deadline}</p>
          <p className={`font-mono text-[9px] mt-0.5 ${isUrgent ? 'text-coral' : 'text-grid/40'} uppercase`}>
            {daysLeft} LEFT {isUrgent && '⚠'}
          </p>
        </div>
        <div className="col-span-1">
          <p className="font-display font-bold text-sm text-gold">{prize}</p>
        </div>
        <div className="col-span-1">
          <button className="action-btn w-full border border-grid/30 py-2 font-mono text-[10px] tracking-widest uppercase rounded-sm">
            VIEW
          </button>
        </div>
      </div>
    </div>
  );
}