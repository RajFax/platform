import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type {ZoneDetailResponse } from "../api/zones";
import { fetchZone } from "../api/zones";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";


export function ZonePage() {
  const { zoneId } = useParams<{ zoneId: string }>();

  const { data, isLoading, isError } = useQuery<ZoneDetailResponse>({
    queryKey: ["zone", zoneId],
    queryFn: () => fetchZone(zoneId!),
    enabled: !!zoneId,
  });

  if (!zoneId) return <div>Zone manquante.</div>;
  if (isLoading) return <div>Chargement…</div>;
  if (isError || !data) return <div>Erreur lors du chargement de la zone.</div>;

  const { zone, summary } = data;

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{summary.zone.name}</h1>
          <div className="text-sm text-slate-600">
            {summary.farm && (
              <>
                Exploitation :{" "}
                <Link
                  to={`/farms/${summary.farm.id}`}
                  className="underline hover:text-slate-700"
                >
                  {summary.farm.name}
                </Link>
              </>
            )}
          </div>
          {summary.parcel && (
            <div className="text-xs text-slate-600 mt-1">
              Parcelle : {summary.parcel.name} · Culture :{" "}
              {summary.parcel.culture_type}
              {summary.parcel.variety ? ` (${summary.parcel.variety})` : ""} ·
              Stade : {summary.parcel.crop_stage}
            </div>
          )}
        </div>

        <div className="text-right text-xs text-slate-600 space-y-1">
          <div>
            Statut :{" "}
            <span
              className={
                summary.zone.is_active ? "text-emerald-300" : "text-slate-500"
              }
            >
              {summary.zone.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <div>Capteurs : {summary.sensors_count}</div>
          {summary.controller && (
            <div>
              Mode : <span>{summary.controller.mode}</span>
            </div>
          )}
        </div>
      </header>

      {/* Layout 2 colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Colonne gauche : capteurs */}
<section className="md:col-span-2 space-y-3">
  <ZoneSoilMoistureChart zone={zone} />
  <ZoneSensorsPanel zone={zone} summary={summary} />
</section>


        {/* Colonne droite : contrôleur + stratégie + actions */}
<section className="space-y-3">
  <ZoneControllerPanel summary={summary} />
  <ZoneStrategyPanel summary={summary} />
  <ZoneAlertsPanel zone={zone} />
  <ZoneActionsPanel zone={zone} />
</section>

      </div>
    </div>
  );
}
function ZoneAlertsPanel({ zone }: { zone: ZoneDetailResponse["zone"] }) {
  const alerts = zone.alerts ?? [];

  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-white text-xs space-y-1">
      <div className="text-sm font-semibold mb-1">Alertes de la zone</div>
      {alerts.length === 0 ? (
        <div className="text-slate-500">Aucune alerte pour cette zone.</div>
      ) : (
        <div className="space-y-1 max-h-40 overflow-auto">
          {alerts.map((a: any) => {
            const severityClass =
              a.severity === "CRITICAL"
                ? "text-red-400"
                : a.severity === "WARNING"
                ? "text-amber-300"
                : "text-slate-700";

            const statusClass =
              a.status === "OPEN"
                ? "text-amber-300"
                : a.status === "CLOSED"
                ? "text-slate-500"
                : "text-slate-700";

            return (
              <div
                key={a.id}
                className="border border-slate-200 rounded px-2 py-1 bg-white"
              >
                <div className="flex justify-between">
                  <span className={`font-medium ${severityClass}`}>
                    {a.type}
                  </span>
                  <span className={statusClass}>{a.status}</span>
                </div>
                <div className="text-slate-700 mt-0.5">{a.message}</div>
                <div className="text-slate-500 mt-0.5">
                  {new Date(a.raised_at).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ZoneSoilMoistureChart({
  zone,
}: {
  zone: ZoneDetailResponse["zone"];
}) {
  const sensors = zone.sensors ?? [];

  if (sensors.length === 0) {
    return (
      <div className="border border-slate-200 rounded-lg p-3 bg-white text-xs text-slate-500">
        Aucun capteur, donc aucun graphe d&apos;humidité à afficher.
      </div>
    );
  }

  // On construit une série temporelle commune
  const pointsMap = new Map<string, any>();

  sensors.forEach((s) => {
    (s.measurements ?? []).forEach((m) => {
      const key = m.measured_at;
      if (!pointsMap.has(key)) {
        pointsMap.set(key, { timestamp: key });
      }
      const existing = pointsMap.get(key);
      existing[`sensor_${s.id}`] = m.value;
      existing[`label_${s.id}`] = s.name;
    });
  });

  const data = Array.from(pointsMap.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const sensorIds = sensors.map((s) => s.id);

  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">
          Évolution de l&apos;humidité du sol
        </div>
        <div className="text-xs text-slate-500">
          Données basées sur les dernières mesures capteurs
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-xs text-slate-500">
          Aucune mesure récente disponible.
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) =>
                  new Date(value).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
                tick={{ fontSize: 10, fill: "#9ca3af" }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={{ stroke: "#4b5563" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  borderColor: "#1f2937",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                labelFormatter={(value) =>
                  new Date(value).toLocaleString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })
                }
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#e5e7eb" }}
              />

              {sensorIds.map((id, index) => (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={`sensor_${id}`}
                  name={
                    sensors.find((s) => s.id === id)?.name ?? `Capteur ${id}`
                  }
                  dot={false}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}


function ZoneSensorsPanel({
  zone,
  summary,
}: {
  zone: ZoneDetailResponse["zone"];
  summary: ZoneDetailResponse["summary"];
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Capteurs de la zone</div>
        {summary.parcel && (
          <div className="text-xs text-slate-600">
            Cible sol :{" "}
            {summary.parcel.targets.soil_moisture_min ?? "?"}–{" "}
            {summary.parcel.targets.soil_moisture_max ?? "?"} %
          </div>
        )}
      </div>

      {zone.sensors.length === 0 ? (
        <div className="text-xs text-slate-500">Aucun capteur déclaré.</div>
      ) : (
        <div className="space-y-2">
          {zone.sensors.map((s) => (
            <div
              key={s.id}
              className="border border-slate-200 rounded p-2 text-xs bg-white"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{s.name}</div>
                <div className="text-slate-600">
                  {s.type} {s.unit ? `(${s.unit})` : ""}
                </div>
              </div>
              {s.measurements && s.measurements.length > 0 ? (
                <div className="mt-1 text-slate-700">
                  Dernière valeur :{" "}
                  {s.measurements[0].value.toFixed(1)}{" "}
                  {s.unit ?? ""}
                  <span className="text-slate-500">
                    {" "}
                    · {new Date(s.measurements[0].measured_at).toLocaleTimeString()}
                  </span>
                </div>
              ) : (
                <div className="mt-1 text-slate-500">
                  Aucune mesure récente.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ZoneControllerPanel({
  summary,
}: {
  summary: ZoneDetailResponse["summary"];
}) {
  const ctrl = summary.controller;
  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-white text-xs space-y-1">
      <div className="text-sm font-semibold mb-1">Contrôleur</div>
      {!ctrl ? (
        <div className="text-slate-500">Aucun contrôleur associé.</div>
      ) : (
        <>
          <div>Nom : {ctrl.name}</div>
          <div>Type : {ctrl.type}</div>
          <div>
            Mode : <span className="font-medium">{ctrl.mode}</span>
          </div>
          <div>
            Statut :{" "}
            <span
              className={
                ctrl.status === "ONLINE"
                  ? "text-emerald-300"
                  : ctrl.status === "ERROR"
                  ? "text-red-400"
                  : "text-slate-600"
              }
            >
              {ctrl.status}
            </span>
          </div>
          <div className="text-slate-500">
            Dernière comm. :{" "}
            {ctrl.last_communication_at
              ? new Date(ctrl.last_communication_at).toLocaleString()
              : "—"}
          </div>
        </>
      )}
    </div>
  );
}

function ZoneStrategyPanel({
  summary,
}: {
  summary: ZoneDetailResponse["summary"];
}) {
  const s = summary.strategy;

  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-white text-xs space-y-1">
      <div className="text-sm font-semibold mb-1">Stratégies</div>

      <div>
        Irrigation :{" "}
        <span className="font-medium">
          {s.irrigation_type ?? "Non définie"}
        </span>
      </div>
      <div>
        Fertilisation :{" "}
        <span className="font-medium">
          {s.fertilization_type ?? "Non définie"}
        </span>
      </div>

      {(s.irrigation_params || s.fertilization_params) && (
        <details className="mt-2">
          <summary className="cursor-pointer text-slate-600">
            Voir paramètres bruts
          </summary>
          <pre className="mt-1 bg-white p-2 rounded text-[10px] overflow-auto max-h-40">
            {JSON.stringify(s, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function ZoneActionsPanel({ zone }: { zone: ZoneDetailResponse["zone"] }) {
  const actions = zone.actions ?? [];
  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-white text-xs space-y-1">
      <div className="text-sm font-semibold mb-1">Dernières actions</div>
      {actions.length === 0 ? (
        <div className="text-slate-500">Aucune action enregistrée.</div>
      ) : (
        <div className="space-y-1 max-h-52 overflow-auto">
          {actions.map((a) => (
            <div
              key={a.id}
              className="border border-slate-200 rounded px-2 py-1 bg-white"
            >
              <div className="flex justify-between">
                <div className="font-medium">{a.type}</div>
                <div className="text-slate-500">
                  {new Date(a.started_at).toLocaleTimeString()}
                </div>
              </div>
              {a.message && (
                <div className="text-slate-600 mt-0.5">{a.message}</div>
              )}
              {a.result_status && (
                <div className="text-slate-500 mt-0.5">
                  Statut : {a.result_status}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
