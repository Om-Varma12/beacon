import { Icon } from '@iconify/react';

export default function Navigation() {
  return (
    <header className="fixed top-0 left-0 right-0 h-24 bg-paper border-b border-grid/20 z-50 flex items-center px-6 lg:px-16">
      <div className="flex-1 flex items-center">
        <a href="#" className="w-9 h-9 bg-forest flex items-center justify-center rounded-none hover:scale-105 transition-transform">
          <span className="text-white font-display text-2xl">H</span>
        </a>
      </div>

      <nav className="hidden lg:flex items-center space-x-8">
        <a href="#discover" className="font-mono text-[10px] tracking-[0.1em] text-forest hover:opacity-70 transition-opacity">
          01. DISCOVER
        </a>
        <a href="#dashboard" className="font-mono text-[10px] tracking-[0.1em] text-forest font-bold border-b border-forest">
          02. DASHBOARD
        </a>
        <a href="#analyze" className="font-mono text-[10px] tracking-[0.1em] text-forest hover:opacity-70 transition-opacity">
          03. ANALYZE
        </a>
        <a href="#submit" className="font-mono text-[10px] tracking-[0.1em] text-forest hover:opacity-70 transition-opacity">
          04. SUBMIT
        </a>
      </nav>

      <div className="flex-1 flex justify-end space-x-4">
        <a href="#notifications" className="w-9 h-9 border border-grid/30 flex items-center justify-center rounded-sm hover:bg-forest hover:text-white transition-all">
          <Icon icon="lucide:bell" className="text-base" />
        </a>
        <a href="#profile" className="w-9 h-9 bg-forest text-white flex items-center justify-center rounded-sm hover:opacity-90 transition-opacity">
          <Icon icon="lucide:user" className="text-base" />
        </a>
      </div>
    </header>
  );
}