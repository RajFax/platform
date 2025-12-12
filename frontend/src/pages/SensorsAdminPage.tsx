// src/pages/SensorsAdminPage.tsx
import { useState } from "react";
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

  if (isLoading) return <div>Chargement des capteurs…</div>;
  if (isError || !data) return <div>Erreur de chargement des capteurs.</div>;

  const sensors = showOnlyActive
    ? data.filter((s) => s.is_active)
    : data;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Capteurs</h1>
        <p className="text-sm text-slate-600 max-w-xl">
          Gestion des capteurs de sol, d&apos;air, etc. Ces capteurs alimentent
          les graphiques, les stratégies d&apos;irrigation et le système
          d&apos;alertes.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[2fr,1.3fr] gap-4">
        {/* LISTE CAPTEURS */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Liste des capteurs</div>
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
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="text-left py-2 pr-2">Nom</th>
                    <th className="text-left py-2 pr-2">Type</th>
                    <th className="text-left py-2 pr-2">Unité</th>
                    <th className="text-left py-2 pr-2">Zone</th>
                    <th className="text-left py-2 pr-2">Matériel</th>
                    <th className="text-left py-2 pr-2">Statut</th>
                    <th className="text-right py-2 pl-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sensors.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-slate-200 hover:bg-white"
                    >
                      <td className="py-2 pr-2 text-slate-800">
                        {s.name}
                      </td>
                      <td className="py-2 pr-2 text-slate-700">
                        {formatSensorType(s.type)}
                      </td>
                      <td className="py-2 pr-2 text-slate-700">
                        {s.unit || "—"}
                      </td>
                      <td className="py-2 pr-2 text-slate-600">
                        {s.zone?.name ?? "—"}
                        {s.parcel?.name ? ` · ${s.parcel.name}` : ""}
                      </td>
                      <td className="py-2 pr-2 text-slate-600">
                        {s.hardware_id || "—"}
                      </td>
                      <td className="py-2 pr-2">
                        {s.is_active ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-700/40">
                            Actif
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700/20 text-slate-700 border border-slate-200">
                            Inactif
                          </span>
                        )}
                      </td>
                      <td className="py-2 pl-2 text-right space-x-2">
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded border border-slate-200 hover:bg-slate-800"
                          onClick={() => handleEdit(s)}
                        >
                          Éditer
                        </button>
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded border border-red-700 text-red-300 hover:bg-red-900/40"
                          onClick={() => handleDelete(s.id)}
                          disabled={
                            deleteMutation.isPending &&
                            idBeingDeleted === s.id
                          }
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
