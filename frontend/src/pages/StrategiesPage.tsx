import { useQuery } from "@tanstack/react-query";
import {  fetchStrategies} from "../api/strategies";
import type { StrategiesOverview} from "../api/strategies";
import type {StrategyItem} from "../api/strategies";
import { Link } from "react-router-dom";

export function StrategiesPage() {
  const { data, isLoading, isError } = useQuery<StrategiesOverview>({
    queryKey: ["strategies"],
    queryFn: fetchStrategies,
  });

  if (isLoading) return <div>Chargement…</div>;
  if (isError || !data) return <div>Erreur lors du chargement des stratégies.</div>;

  const { irrigation, fertilization } = data;

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="text-2xl font-semibold">Stratégies de contrôle</h1>
        <p className="text-sm text-slate-500">
          Types de stratégies d'irrigation et de fertilisation utilisées dans les zones d'irrigation.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Stratégies d'irrigation</h2>
        {irrigation.length === 0 ? (
          <div className="text-sm text-slate-500">
            Aucune stratégie d'irrigation configurée.
          </div>
        ) : (
          <StrategyTable items={irrigation} />
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Stratégies de fertilisation</h2>
        {fertilization.length === 0 ? (
          <div className="text-sm text-slate-500">
            Aucune stratégie de fertilisation configurée.
          </div>
        ) : (
          <StrategyTable items={fertilization} />
        )}
      </section>
    </div>
  );
}

function StrategyTable({ items }: { items: StrategyItem[] }) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden text-xs bg-white shadow-sm">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
          <tr>
            <th className="text-left px-3 py-2 w-1/4">Type</th>
            <th className="text-left px-3 py-2 w-1/6">Nb zones</th>
            <th className="text-left px-3 py-2">Exemples de zones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.type} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2 font-medium text-sm text-slate-800">{s.type}</td>
              <td className="px-3 py-2">{s.zones_count}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-2">
                  {s.example_zones.map((z) => (
                    <StrategyZoneBadge key={z.id} zone={z} />
                  ))}
                  {s.zones_count > s.example_zones.length && (
                    <span className="text-slate-500">
                      + {s.zones_count - s.example_zones.length} autres…
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StrategyZoneBadge({
  zone,
}: {
  zone: StrategyItem["example_zones"][number];
}) {
  return (
    <div className="border border-emerald-100 bg-emerald-50 text-emerald-800 rounded px-2 py-1">
      <div className="flex flex-col gap-0.5">
        <Link
          to={`/zones/${zone.id}`}
          className="underline decoration-emerald-300 hover:decoration-emerald-500"
        >
          {zone.name}
        </Link>
        <div className="text-[10px] text-emerald-700/80">
          {zone.parcel?.name ?? "Parcelle ?"} · {zone.farm?.name ?? "Exploitation ?"}
        </div>
      </div>
    </div>
  );
}
