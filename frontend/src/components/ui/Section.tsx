export function Section({ title, children }: any) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-700">{title}</h2>
      {children}
    </section>
  );
}
