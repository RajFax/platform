export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-semibold mt-1 text-slate-800">{value}</div>
    </div>
  );
}
