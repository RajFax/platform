export function Topbar() {
  return (
    <header className="h-12 border-b border-slate-200 flex items-center justify-between px-4 bg-white/80">
      <div className="text-sm text-slate-300">
        Plateforme de supervision agricole
      </div>
      <div className="text-xs text-slate-500">
        Backend: Laravel • Front: React+TS
      </div>
    </header>
  );
}
