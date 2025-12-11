import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Card } from "../components/ui/Card";
import { fetchSensors } from "../api/sensors";
import type { SensorSummary } from "../api/sensors";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";

interface Measurement {
  id: number;
  sensor_id: number;
  measured_at: string;
  value: number;
}

interface OverviewAlert {
  id: number;
  type: string;
  severity: string;
  message: string;
  status?: string;
  raised_at: string;
  zone?: { id: number; name: string } | null;
  farm?: { id: number; name: string } | null;
}

interface OverviewStats {
  farms: number;
  parcels: number;
  zones: number;
  active_zones: number;
  inactive_zones: number;
  sensors: number;
  controllers: number;
  controllers_online: number;
  controllers_error: number;
  alerts_open: number;
}

interface OverviewFarm {
  id: number;
  name: string;
  parcels_count: number;
}

interface OverviewResponse {
  stats: OverviewStats;
  farms: OverviewFarm[];
  recent_alerts: OverviewAlert[];
}

/**
 * Appel de l’API pour charger l’overview complet
 */
async function fetchOverview(): Promise<OverviewResponse> {
  const { data } = await api.get<OverviewResponse>("/dashboard/overview");
  return data;
}

/**
 * Récupère les mesures les plus récentes et les trie par date
 */
async function fetchRecentMeasurements(
  limit: number = 50
): Promise<Measurement[]> {
  const { data } = await api.get<Measurement[]>("/measurements", {
    params: { limit },
  });
  return data
    .slice()
    .sort(
      (a, b) =>
        new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
    );
}

export function DashboardPage() {
  // Overview, capteurs et mesures
  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
  } = useQuery<OverviewResponse>({
    queryKey: ["overview"],
    queryFn: fetchOverview,
  });

  const {
    data: sensors,
    isLoading: sensorsLoading,
    isError: sensorsError,
  } = useQuery<SensorSummary[]>(
    {
      queryKey: ["sensors"],
      queryFn: fetchSensors,
    }
  );

  const {
    data: measurements,
    isLoading: measurementsLoading,
    isError: measurementsError,
  } = useQuery<Measurement[]>({
    queryKey: ["recentMeasurements"],
    queryFn: () => fetchRecentMeasurements(50),
  });

  // Préparation des données de graphes
  const measurementSeries = useMemo(() => {
    if (!measurements) return [];
    return measurements.map((m) => ({
      time: new Date(m.measured_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      value: m.value,
    }));
  }, [measurements]);

  const sensorTypeDistribution = useMemo(() => {
    if (!sensors) return [];
    const counts: Record<string, number> = {};
    sensors.forEach((s) => {
      const key = s.type ?? "Inconnu";
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: count,
    }));
  }, [sensors]);

  if (overviewLoading || sensorsLoading || measurementsLoading) {
    return <div>Chargement…</div>;
  }
  if (overviewError || sensorsError || measurementsError || !overview) {
    return <div>Erreur de chargement du dashboard.</div>;
  }

  const s = overview.stats;
  const pieColors = [
    "#60a5fa",
    "#f97316",
    "#10b981",
    "#eab308",
    "#a78bfa",
    "#f43f5e",
    "#14b8a6",
    "#8b5cf6",
    "#f59e0b",
  ];

  return (
    <div className="space-y-8">
      {/* En‑tête */}
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-sm text-slate-500 max-w-xl">
          Synthèse des exploitations, parcelles, zones, capteurs, contrôleurs et alertes, avec des graphiques en temps réel.
        </p>
      </header>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl">
        <StatCard label="Exploitations" value={s.farms} />
        <StatCard label="Parcelles" value={s.parcels} />
        <StatCard label="Zones" value={s.zones} />
        <StatCard label="Zones actives" value={s.active_zones} />
        <StatCard label="Zones inactives" value={s.inactive_zones} />
        <StatCard label="Capteurs" value={s.sensors} />
        <StatCard label="Contrôleurs" value={s.controllers} />
        <StatCard label="Contrôleurs en ligne" value={s.controllers_online} />
        <StatCard label="Contrôleurs en erreur" value={s.controllers_error} />
        <StatCard label="Alertes ouvertes" value={s.alerts_open} />
      </div>

      {/* Visualisations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl">
        <Card>
          <div className="text-sm font-semibold mb-3 text-slate-800">
            Répartition des capteurs (par type)
          </div>
          {sensorTypeDistribution.length === 0 ? (
            <div className="text-xs text-slate-500">Aucun capteur.</div>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={sensorTypeDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {sensorTypeDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <div className="text-sm font-semibold mb-3 text-slate-800">
            Mesures récentes
          </div>
          {measurementSeries.length === 0 ? (
            <div className="text-xs text-slate-500">
              Aucune mesure disponible.
            </div>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={measurementSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Exploitations et alertes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl">
        <Card>
          <div className="text-sm font-semibold mb-3 text-slate-800">Exploitations</div>
          {overview.farms.length === 0 ? (
            <div className="text-xs text-slate-500">
              Aucune exploitation enregistrée.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {overview.farms.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between border border-slate-200 rounded-lg p-3 bg-white shadow-sm"
                >
                  <div>
                    <div className="text-slate-800 font-medium">{f.name}</div>
                    <div className="text-slate-500 text-xs">
                      Parcelles : {f.parcels_count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="text-sm font-semibold mb-3 text-slate-800">
            Alertes récentes
          </div>
          <RecentAlertsList alerts={overview.recent_alerts} />
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-semibold mt-1 text-slate-800">{value}</div>
    </div>
  );
}

function RecentAlertsList({ alerts }: { alerts: OverviewAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="text-xs text-slate-500">Aucune alerte récente.</div>
    );
  }
  return (
    <div className="space-y-2 text-xs max-h-48 overflow-auto">
      {alerts.map((a) => {
        const severityClass =
          a.severity === "CRITICAL"
            ? "text-red-600"
            : a.severity === "WARNING"
            ? "text-amber-600"
            : "text-slate-700";
        return (
          <div
            key={a.id}
            className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm"
          >
            <div className="flex justify-between">
              <span className={`font-semibold ${severityClass}`}>
                {a.type}
              </span>
              <span className="text-slate-500">
                {new Date(a.raised_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div
              className="text-slate-700 truncate mt-1"
              title={a.message}
            >
              {a.message}
            </div>
            {a.farm && (
              <div className="text-[11px] text-slate-500 mt-1">
                {a.farm.name} · {a.zone?.name ?? "Zone ?"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
