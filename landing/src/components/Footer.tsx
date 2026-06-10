export function Footer() {
  return (
    <footer className="py-7 border-t border-grid/20 bg-transparent">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-none">
              <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <span className="typography-technical-sm text-forest font-semibold">Beacon</span>
          </div>
          <div className="typography-technical-sm text-grid">© 2026. All systems operational.</div>
        </div>
      </div>
    </footer>
  )
}