import { Icon } from '@iconify/react'

export function Footer() {
  return (
    <footer className="py-12 border-t border-grid/20 snap-start">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-forest flex items-center justify-center">
              <Icon icon="lucide:zap" className="text-white text-sm" />
            </div>
            <span className="jetbrains text-[10px] uppercase tracking-widest text-forest">HackFlow</span>
          </div>
          <div className="jetbrains text-[10px] text-grid">© 2024. All systems operational.</div>
        </div>
      </div>
    </footer>
  )
}