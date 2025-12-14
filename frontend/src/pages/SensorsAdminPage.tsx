// src/pages/SensorsAdminPage.tsx
import { useMemo, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchSensors,
  createSensor,
  updateSensor,
  deleteSensor,
  type SensorSummary,
  type SensorPayload,
} from "../api/sensors";
import { fetchZones, type ZoneSummary } from "../api/zones";
import { fetchParcels, type ParcelSummary } from "../api/parcels";
import { Card } from "../components/ui/Card";

const SENSOR_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "soil_moisture", label: "Humidité sol" },
  { value: "temperature_air", label: "Température air" },
  { value: "humidity_air", label: "Humidité air" },
  { value: "ec_soil", label: "EC sol" },
  { value: "ph_soil", label: "pH sol" },
  { value: "npk", label: "NPK" },
  { value: "co2", label: "CO₂" },
  { value: "light", label: "Luminosité" },
  { value: "pressure", label: "Pression" },
  { value: "rainfall", label: "Pluviométrie" },
];

const SENSOR_TYPE_ICONS: Record<string, { symbol: string; bg: string }> = {
  soil_moisture: { symbol: "💧", bg: "bg-emerald-50 text-emerald-700" },
  temperature_air: { symbol: "🌡️", bg: "bg-amber-50 text-amber-700" },
  humidity_air: { symbol: "💦", bg: "bg-blue-50 text-blue-700" },
  ec_soil: { symbol: "🧪", bg: "bg-purple-50 text-purple-700" },
  ph_soil: { symbol: "⚗️", bg: "bg-indigo-50 text-indigo-700" },
  npk: { symbol: "🧬", bg: "bg-sky-50 text-sky-700" },
  co2: { symbol: "🌿", bg: "bg-lime-50 text-lime-700" },
  light: { symbol: "☀️", bg: "bg-orange-50 text-orange-700" },
  pressure: { symbol: "📈", bg: "bg-slate-50 text-slate-700" },
  rainfall: { symbol: "🌧️", bg: "bg-cyan-50 text-cyan-700" },
};

const SENSOR_UNIT_OPTIONS = ["%", "°C", "dS/m", "pH", "ppm", "lux", "hPa", "mm"];

const SENSOR_DEFAULT_UNIT: Record<string, string> = {
  soil_moisture: "%",
  temperature_air: "°C",
  humidity_air: "%",
  ec_soil: "dS/m",
  ph_soil: "pH",
  npk: "ppm",
  co2: "ppm",
  light: "lux",
  pressure: "hPa",
  rainfall: "mm",
};

type SensorFormState = {
  name: string;
  type: string;
  unit: string;
  hardware_id: string;
  zone_id?: number;
  is_active: boolean;
};

function formatSensorType(type?: string | null) {
  if (!type) return "—";

  const match = SENSOR_TYPE_OPTIONS.find((option) => option.value === type);
  return match?.label ?? type;
}

function SensorIconBadge({ type }: { type?: string | null }) {
  const icon = type ? SENSOR_TYPE_ICONS[type] : undefined;

  return (
    <span
      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shadow-inner ${
        icon ? icon.bg : "bg-slate-100 text-slate-600"
      }`}
      aria-hidden
    >
      {icon?.symbol ?? "📟"}
    </span>
  );
}

export function SensorsAdminPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<SensorSummary[]>({
    queryKey: ["sensors"],
    queryFn: () => fetchSensors(),
  });

  const { data: zones } = useQuery<ZoneSummary[]>({
    queryKey: ["zones", "for-sensors"],
    queryFn: () => fetchZones(),
  });

  const { data: parcels } = useQuery<ParcelSummary[]>({
    queryKey: ["parcels", "for-sensors"],
    queryFn: () => fetchParcels(),
  });

  const [editingSensor, setEditingSensor] = useState<SensorSummary | null>(null);
  const [form, setForm] = useState<SensorFormState>({
    name: "",
    type: "",
    unit: "",
    hardware_id: "",
    zone_id: undefined,
    is_active: true,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [idBeingDeleted, setIdBeingDeleted] = useState<number | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: SensorPayload) => createSensor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sensors"] });
      resetForm();
    },
    onError: () => {
      setErrorMsg("Erreur lors de la création du capteur.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; payload: SensorPayload }) =>
      updateSensor(vars.id, vars.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sensors"] });
      resetForm();
    },
    onError: () => {
      setErrorMsg("Erreur lors de la mise à jour du capteur.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSensor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sensors"] });
      if (editingSensor && idBeingDeleted === editingSensor.id) {
        resetForm();
      }
    },
    onError: () => {
      setErrorMsg("Erreur lors de la suppression du capteur.");
    },
  });

  function resetForm() {
    setEditingSensor(null);
    setForm({
      name: "",
      type: "",
      unit: "",
      hardware_id: "",
      zone_id: undefined,
      is_active: true,
    });
    setErrorMsg(null);
    setIdBeingDeleted(null);
  }

  function handleEdit(sensor: SensorSummary) {
    setEditingSensor(sensor);
    setForm({
      name: sensor.name,
      type: sensor.type ?? "",
      unit: sensor.unit ?? SENSOR_DEFAULT_UNIT[sensor.type ?? ""] ?? "",
      hardware_id: sensor.hardware_id ?? "",
      zone_id:
        sensor.zone_id === undefined || sensor.zone_id === null
          ? undefined
          : sensor.zone_id,
      is_active: sensor.is_active ?? true,
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Supprimer ce capteur ?")) return;
    setIdBeingDeleted(id);
    deleteMutation.mutate(id);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = form.name.trim();

    if (!trimmedName) {
      setErrorMsg("Le nom du capteur est obligatoire.");
      return;
    }

    if (!form.type || !SENSOR_TYPE_OPTIONS.some((o) => o.value === form.type)) {
      setErrorMsg("Le type de capteur est obligatoire.");
      return;
    }

    if (!form.unit || !SENSOR_UNIT_OPTIONS.includes(form.unit)) {
      setErrorMsg("Merci de sélectionner une unité valide.");
      return;
    }

    if (!form.zone_id) {
      setErrorMsg("La zone est obligatoire.");
      return;
    }

    const payload: SensorPayload = {
      name: trimmedName,
      type: form.type,
      unit: form.unit,
      hardware_id: form.hardware_id?.trim() || null,
      zone_id: Number(form.zone_id),
      is_active: form.is_active ?? true,
    };

    if (editingSensor) {
      updateMutation.mutate({ id: editingSensor.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const sensors = useMemo(() => {
    const allSensors = data ?? [];
    return showOnlyActive
      ? allSensors.filter((s) => s.is_active)
      : allSensors;
  }, [data, showOnlyActive]);

  const parcelById = useMemo(() => {
    const map = new Map<number, ParcelSummary>();
    parcels?.forEach((parcel) => map.set(parcel.id, parcel));
    return map;
  }, [parcels]);

  const zoneById = useMemo(() => {
    const map = new Map<number, ZoneSummary>();
    zones?.forEach((zone) => map.set(zone.id, zone));
    return map;
  }, [zones]);

  const sensorsByZone = useMemo(() => {
    const map = new Map<number | "none", SensorSummary[]>();

    sensors.forEach((sensor) => {
      const key = sensor.zone_id ?? "none";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(sensor);
    });

    return Array.from(map.entries())
      .map(([key, sensorsInZone]) => {
        const zoneId = key === "none" ? null : key;
        const zone = zoneId ? zoneById.get(zoneId) : undefined;
        const parcel =
          zone && zone.parcel_id ? parcelById.get(zone.parcel_id) : undefined;

        return {
          zoneId,
          zone,
          parcel,
          sensors: sensorsInZone,
        };
      })
      .sort((a, b) => {
        const nameA = a.zone?.name ?? "Sans zone";
        const nameB = b.zone?.name ?? "Sans zone";
        return nameA.localeCompare(nameB);
      });
  }, [parcelById, sensors, zoneById]);

  function formatZonePath(
    zone?: ZoneSummary,
    parcel?: ParcelSummary
  ): string {
    const farmName = zone?.farm?.name ?? "Exploitation inconnue";
    const blockName = parcel?.block?.name
      ? `Bloc ${parcel.block.name}`
      : parcel?.block_id
      ? `Bloc #${parcel.block_id}`
      : "Bloc ?";
    const parcelName = zone?.parcel?.name ?? parcel?.name ?? "Parcelle ?";
    const zoneName = zone?.name ?? "Zone ?";

    return `${farmName} · ${blockName} · ${parcelName} · ${zoneName}`;
  }

  if (isLoading) return <div>Chargement des capteurs…</div>;
  if (isError || !data) return <div>Erreur de chargement des capteurs.</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
            🌱
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Capteurs</h1>
            <p className="text-sm text-slate-600 max-w-xl">
              Gestion visuelle des capteurs de sol, d&apos;air et de climat pour
              alimenter graphiques, alertes et automatisations.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <span className="flex items-center gap-2 font-semibold">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-inner">
              📡
            </span>
            Vue synthétique
          </span>
          <span className="text-emerald-900/80">
            Statut actif et type représentés par des icônes pour limiter le
            texte redondant.
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[2fr,1.3fr] gap-4">
        {/* LISTE CAPTEURS */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-base">
                🛰️
              </span>
              Capteurs par zone
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-[11px] text-slate-600">
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={showOnlyActive}
                  onChange={(e) => setShowOnlyActive(e.target.checked)}
                />
                Actifs uniquement
              </label>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={resetForm}
              >
                + Nouveau capteur
              </button>
            </div>
          </div>

          {sensors.length === 0 ? (
            <div className="text-xs text-slate-500">
              Aucun capteur configuré.
            </div>
          ) : (
            <div className="space-y-3">
              {sensorsByZone.map((group) => (
                <div
                  key={group.zoneId ?? "no-zone"}
                  className="rounded border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm">
                        📍
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {group.zone?.name ?? "Zone non renseignée"}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {group.zone
                            ? formatZonePath(group.zone, group.parcel)
                            : "Aucune zone associée"}
                        </div>
                      </div>
                    </div>
                    {group.zone && (
                      <span
                        className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                          group.zone.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        <span className="text-[10px]" aria-hidden>
                          {group.zone.is_active ? "✔" : "⏸"}
                        </span>
                        {group.zone.is_active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    {group.sensors.map((s) => (
                      <div
                        key={s.id}
                        className="rounded border border-slate-100 bg-gradient-to-r from-slate-50 to-white p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <SensorIconBadge type={s.type} />
                            <div>
                              <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                                {s.name}
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                                  {formatSensorType(s.type)}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                                {s.unit && (
                                  <span className="rounded-full bg-white px-2 py-0.5 shadow-sm">
                                    {s.unit}
                                  </span>
                                )}
                                <span className="rounded-full bg-white px-2 py-0.5 shadow-sm">
                                  {s.hardware_id?.trim() || "ID non renseigné"}
                                </span>
                                <span
                                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 shadow-sm ${
                                    s.is_active
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  <span aria-hidden>{s.is_active ? "●" : "○"}</span>
                                  {s.is_active ? "Actif" : "Inactif"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="text-[11px] px-2 py-1 rounded border border-slate-200 hover:bg-slate-800"
                              onClick={() => handleEdit(s)}
                            >
                              Éditer
                            </button>
                            <button
                              type="button"
                              className="text-[11px] px-2 py-1 rounded border border-red-700 text-red-300 hover:bg-red-900/40"
                              onClick={() => handleDelete(s.id)}
                              disabled={
                                deleteMutation.isPending &&
                                idBeingDeleted === s.id
                              }
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* FORMULAIRE */}
        <Card>
          <div className="text-sm font-semibold mb-3">
            {editingSensor
              ? `Modifier le capteur : ${editingSensor.name}`
              : "Nouveau capteur"}
          </div>

          {errorMsg && (
            <div className="mb-3 text-xs text-red-400">{errorMsg}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 mb-1">
                Nom du capteur *
              </label>
              <input
                type="text"
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-slate-800 text-xs"
                value={form.name}
                required
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">
                Type de capteur *
              </label>
              <select
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-slate-800 text-xs"
                value={form.type ?? ""}
                required
                onChange={(e) => {
                  const selectedType = e.target.value;
                  setForm((f) => ({
                    ...f,
                    type: selectedType,
                    unit:
                      selectedType && SENSOR_DEFAULT_UNIT[selectedType]
                        ? SENSOR_DEFAULT_UNIT[selectedType]
                        : "",
                  }));
                }}
              >
                <option value="">Sélectionner un type</option>
                {SENSOR_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Unité *</label>
              <select
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-slate-800 text-xs"
                value={form.unit ?? ""}
                required
                onChange={(e) =>
                  setForm((f) => ({ ...f, unit: e.target.value }))
                }
              >
                <option value="">Sélectionner une unité</option>
                {SENSOR_UNIT_OPTIONS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Zone *</label>
              <select
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-slate-800 text-xs"
                value={form.zone_id ?? ""}
                required
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    zone_id:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  }))
                }
              >
                <option value="">Sélectionner une zone</option>
                {zones?.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                    {zone.parcel?.name ? ` · ${zone.parcel.name}` : ""}
                    {zone.farm?.name ? ` · ${zone.farm.name}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 mb-1">
                ID matériel / hardware
              </label>
              <input
                type="text"
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-slate-800 text-xs"
                value={form.hardware_id ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hardware_id: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="sensor-active"
                type="checkbox"
                className="h-3 w-3"
                checked={form.is_active ?? true}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_active: e.target.checked }))
                }
              />
              <label
                htmlFor="sensor-active"
                className="text-[11px] text-slate-700"
              >
                Capteur actif
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {editingSensor && (
                <button
                  type="button"
                  className="text-xs px-3 py-1 rounded border border-slate-200 hover:bg-slate-800"
                  onClick={resetForm}
                >
                  Annuler
                </button>
              )}

              <button
                type="submit"
                className="text-xs px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingSensor ? "Mettre à jour" : "Créer"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
