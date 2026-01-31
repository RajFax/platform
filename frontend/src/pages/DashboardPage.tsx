// src/pages/DashboardPage.tsx
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Card } from "../components/ui/Card";
import { fetchZones } from "../api/zones";
import type { ZoneSummary } from "../api/zones";
import { fetchSensors } from "../api/sensors";
import type { SensorSummary } from "../api/sensors";
import { fetchControllers } from "../api/controllers";
import type { ControllerItem } from "../api/controllers";
import { fetchAlerts } from "../api/alerts";
import type { AlertItem } from "../api/alerts";
import { useMemo } from "react";

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
  // Charge la synthèse générale
  const { data, isLoading, isError } = useQuery<OverviewResponse>({
    queryKey: ["overview"],
    queryFn: fetchOverview,
  });

  // Charge la liste des zones (avec ferme/parcelle)
  const {
    data: zonesData,
    isLoading: zonesLoading,
    isError: zonesError,
  } = useQuery<ZoneSummary[]>({
    queryKey: ["zones"],
    queryFn: () => fetchZones(),
  });

  // Charge les capteurs
  const {
    data: sensorsData,
    isLoading: sensorsLoading,
    isError: sensorsError,
  } = useQuery<SensorSummary[]>({
    queryKey: ["sensorsAll"],
    queryFn: fetchSensors,
  });

  // Charge les contrôleurs
  const {
    data: controllersData,
    isLoading: controllersLoading,
    isError: controllersError,
  } = useQuery<ControllerItem[]>({
    queryKey: ["controllersAll"],
    queryFn: fetchControllers,
  });

  // Charge les alertes
  const {
    data: alertsData,
    isLoading: alertsLoading,
    isError: alertsError,
  } = useQuery<AlertItem[]>({
    queryKey: ["alertsAll"],
    queryFn: fetchAlerts,
  });

  // Regroupe les zones par ferme puis par parcelle et calcule les KPI de chaque zone
  const zonesByFarmParcel = useMemo(() => {
    if (!zonesData || !sensorsData || !controllersData || !alertsData) {
      return {} as Record<number, Record<number, any[]>>;
    }

    const sensorsByZone: Record<number, SensorSummary[]> = {};
    sensorsData.forEach((s) => {
      if (s.zone_id != null) {
        if (!sensorsByZone[s.zone_id]) sensorsByZone[s.zone_id] = [];
        sensorsByZone[s.zone_id].push(s);
      }
    });

    const controllersByZone: Record<number, ControllerItem[]> = {};
    controllersData.forEach((c) => {
      const zoneId = c.zone?.id;
      if (zoneId != null) {
        if (!controllersByZone[zoneId]) controllersByZone[zoneId] = [];
        controllersByZone[zoneId].push(c);
      }
    });

    const alertsByZone: Record<number, AlertItem[]> = {};
    alertsData.forEach((a) => {
      const zoneId = a.zone?.id;
      if (zoneId != null) {
        if (!alertsByZone[zoneId]) alertsByZone[zoneId] = [];
        alertsByZone[zoneId].push(a);
      }
    });

    const result: Record<number, Record<number, any[]>> = {};
    zonesData.forEach((z) => {
      const farmId = z.farm?.id ?? -1;
      const parcelId = z.parcel?.id ?? -1;
      const zoneMetrics = {
        id: z.id,
        name: z.name,
        parcel: z.parcel,
        farm: z.farm,
        is_active: z.is_active,
        sensors_count: sensorsByZone[z.id]?.length ?? 0,
        controllers_count: controllersByZone[z.id]?.length ?? 0,
        controllers_online:
          controllersByZone[z.id]?.filter((c) => c.status === "ONLINE")
            .length ?? 0,
        controllers_error:
          controllersByZone[z.id]?.filter((c) => c.status === "ERROR")
            .length ?? 0,
        alerts_open:
          alertsByZone[z.id]?.filter((a) => a.status === "OPEN").length ?? 0,
      };
      if (!result[farmId]) result[farmId] = {};
      if (!result[farmId][parcelId]) result[farmId][parcelId] = [];
      result[farmId][parcelId].push(zoneMetrics);
    });
    return result;
  }, [zonesData, sensorsData, controllersData, alertsData]);

  // Gestion des états de chargement/erreur
  if (
    isLoading ||
    zonesLoading ||
    sensorsLoading ||
    controllersLoading ||
    alertsLoading
  )
    return <div>Chargement…</div>;
  if (
    isError ||
    zonesError ||
    sensorsError ||
    controllersError ||
    alertsError ||
    !data
  )
    return <div>Erreur de chargement du dashboard.</div>;

  const s = data.stats;

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900">Vue d&apos;ensemble</h1>
        <p className="text-sm text-slate-500 max-w-xl">
          Synthèse des exploitations, parcelles, zones, capteurs,
          contrôleurs et alertes.
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

      {/* Exploitations / Parcelles / Zones + Alertes récentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl">
        <Card>
          <div className="text-sm font-semibold mb-3 text-slate-800">
            Exploitations, parcelles et zones
          </div>
          {data.farms.length === 0 ? (
            <div className="text-xs text-slate-500">
              Aucune exploitation enregistrée.
            </div>
          ) : (
            <div className="space-y-4">
              {data.farms.map((farm) => {
                const farmZones = zonesByFarmParcel[farm.id] || {};
                const parcelIds = Object.keys(farmZones);
                if (parcelIds.length === 0) {
                  return (
                    <div
                      key={farm.id}
                      className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm text-xs"
                    >
                      <div className="font-medium text-slate-800">
                        {farm.name}
                      </div>
                      <div className="text-slate-500">Aucune zone</div>
                    </div>
                  );
                }
                return (
                  <div
                    key={farm.id}
                    className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm"
                  >
                    <div className="font-medium text-slate-800 mb-2">
                      {farm.name}
                    </div>
                    <div className="space-y-3 text-xs">
                      {parcelIds.map((parcelId) => {
                        const zoneList: any[] = farmZones[parcelId];
                        if (!zoneList || zoneList.length === 0) return null;
                        const parcelName =
                          zoneList[0].parcel?.name ?? `Parcelle ${parcelId}`;
                        return (
                          <div key={parcelId}>
                            <div className="font-medium text-slate-700 mb-1">
                              {parcelName}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {zoneList.map((zone) => (
                                <div
                                  key={zone.id}
                                  className="border border-slate-200 rounded-lg p-3 bg-gray-50"
                                >
                                  <div className="font-medium text-slate-800 text-sm">
                                    {zone.name}
                                  </div>
                                  <div className="mt-1 text-[11px] text-slate-600">
                                    Capteurs : {zone.sensors_count}
                                  </div>
                                  <div className="text-[11px] text-slate-600">
                                    Contrôleurs : {zone.controllers_count}
                                  </div>
                                  <div className="text-[11px] text-slate-600">
                                    Contrôleurs en ligne : {zone.controllers_online}
                                  </div>
                                  <div className="text-[11px] text-slate-600">
                                    Contrôleurs en erreur : {zone.controllers_error}
                                  </div>
                                  <div className="text-[11px] text-slate-600">
                                    Alertes ouvertes : {zone.alerts_open}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

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
