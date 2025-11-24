// src/pages/DashboardPage.tsx
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Card } from "../components/ui/Card";

interface FarmApi {
  id: number;
  name: string;
  parcels_count?: number;
  parcels?: { id: number }[];
}

interface ZoneApi {
  id: number;
  name: string;
  is_active?: boolean;
}

interface SensorApi {
  id: number;
}

interface ControllerApi {
  id: number;
  status?: string;
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

interface OverviewResponse {
  stats: {
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
  };
  farms: {
    id: number;
    name: string;
    parcels_count: number;
  }[];
  recent_alerts: OverviewAlert[];
}

async function fetchOverview(): Promise<OverviewResponse> {
  const [farmsRes, zonesRes, sensorsRes, controllersRes, alertsRes] =
    await Promise.all([
      api.get<FarmApi[]>("/farms"),
      api.get<ZoneApi[]>("/zones"),
      api.get<SensorApi[]>("/sensors"),
      api.get<ControllerApi[]>("/controllers"),
      api.get<OverviewAlert[]>("/alerts"),
    ]);

  const farms = farmsRes.data;
  const zones = zonesRes.data;
  const sensors = sensorsRes.data;
  const controllers = controllersRes.data;
  const alerts = alertsRes.data;

  const parcelsTotal = farms.reduce((sum, f) => {
    const count =
      f.parcels_count ??
      (Array.isArray(f.parcels) ? f.parcels.length : 0);
    return sum + count;
  }, 0);

  const activeZones = zones.filter((z) => z.is_active).length;
  const inactiveZones = zones.length - activeZones;

  const controllersOnline = controllers.filter(
    (c) => c.status === "ONLINE"
  ).length;
  const controllersError = controllers.filter(
    (c) => c.status === "ERROR"
  ).length;

  const alertsOpen = alerts.filter(
    (a) => a.status === "OPEN"
  ).length;

  return {
    stats: {
      farms: farms.length,
      parcels: parcelsTotal,
      zones: zones.length,
      active_zones: activeZones,
      inactive_zones: inactiveZones,
      sensors: sensors.length,
      controllers: controllers.length,
      controllers_online: controllersOnline,
      controllers_error: controllersError,
      alerts_open: alertsOpen,
    },
    farms: farms.map((f) => ({
      id: f.id,
      name: f.name,
      parcels_count:
        f.parcels_count ??
        (Array.isArray(f.parcels) ? f.parcels.length : 0),
    })),
    recent_alerts: alerts.slice(0, 5),
  };
}

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery<OverviewResponse>({
    queryKey: ["overview"],
    queryFn: fetchOverview,
  });

  if (isLoading) return <div>Chargement…</div>;
  if (isError || !data) return <div>Erreur de chargement du dashboard.</div>;

  const s = data.stats;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900">
          Vue d&apos;ensemble
        </h1>
        <p className="text-sm text-slate-500 max-w-xl">
          Synthèse des exploitations, parcelles, zones, capteurs,
          contrôleurs et alertes.
        </p>
      </header>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl">
        <StatCard label="Exploitations" value={s.farms} />
        <StatCard label="Parcelles" value={s.parcels} />
        <StatCard label="Zones" value={s.zones} />
        <StatCard label="Zones actives" value={s.active_zones} />
        <StatCard label="Zones inactives" value={s.inactive_zones} />
        <StatCard label="Capteurs" value={s.sensors} />
        <StatCard label="Contrôleurs" value={s.controllers} />
        <StatCard
          label="Contrôleurs en ligne"
          value={s.controllers_online}
        />
        <StatCard
          label="Contrôleurs en erreur"
          value={s.controllers_error}
        />
        <StatCard label="Alertes ouvertes" value={s.alerts_open} />
      </div>

      {/* BLOC EXPLOITATIONS + ALERTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl">
        {/* Exploitations récentes */}
        <Card>
          <div className="text-sm font-semibold mb-3 text-slate-800">
            Exploitations
          </div>
          {data.farms.length === 0 ? (
            <div className="text-xs text-slate-500">
              Aucune exploitation enregistrée.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {data.farms.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between border border-slate-200 rounded-lg p-3 bg-white shadow-sm"
                >
                  <div>
                    <div className="text-slate-800 font-medium">
                      {f.name}
                    </div>
                    <div className="text-slate-500 text-xs">
                      Parcelles : {f.parcels_count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Alertes récentes */}
        <Card>
          <div className="text-sm font-semibold mb-3 text-slate-700">
            Alertes récentes
          </div>
          <RecentAlertsList alerts={data.recent_alerts} />
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-semibold mt-1 text-slate-800">
        {value}
      </div>
    </div>
  );
}

function RecentAlertsList({ alerts }: { alerts: OverviewAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="text-xs text-slate-500">
        Aucune alerte récente.
      </div>
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
                {new Date(a.raised_at).toLocaleTimeString()}
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
// src/pages/DashboardPage.tsx