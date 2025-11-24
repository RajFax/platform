export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-slate-800 rounded-lg p-3 bg-slate-900/60">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
