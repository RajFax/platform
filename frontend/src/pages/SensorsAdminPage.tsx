// src/pages/SensorsAdminPage.tsx
import { useState, useEffect } from "react";
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
import { SensorIcon } from "../components/ui/Icons";

const SENSOR_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "soil_moisture", label: "Humidité sol" },
  { value: "temperature_air", label: "Température air" },
  { value: "humidity_air", label: "Humidité air" },
  { value: "ec_soil", label: "EC sol" },
  { value: "ph_soil", label: "pH sol" },
  { value: "co2", label: "CO₂" },
  { value: "light", label: "Luminosité" },
  { value: "pressure", label: "Pression" },
  { value: "rainfall", label: "Pluviométrie" },
];

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
  const [form, setForm] = useState<SensorPayload>({
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

  // Préremplir l'unité à "mg/kg" si le type sélectionné est "npk"
  useEffect(() => {
    if (form.type === "npk") {
      setForm((f) => ({ ...f, unit: "mg/kg" }));
    }
  }, [form.type]);

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
      unit: sensor.unit ?? "",
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

    if (!form.zone_id) {
      setErrorMsg("La zone est obligatoire.");
      return;
    }

    const payload: SensorPayload = {
      name: form.name.trim(),
      type: form.type?.trim() || null,
      unit: form.unit?.trim() || "",
      hardware_id: form.hardware_id?.trim() || "",
      zone_id: Number(form.zone_id),
      is_active: form.is_active ?? true,
    };

    if (!payload.name) {
      setErrorMsg("Le nom du capteur est obligatoire.");
      return;
    }

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
        <h1 className="text-2xl font-semibold inline-flex items-center gap-2">
          <SensorIcon className="h-5 w-5 text-sky-500" />
          Capteurs
        </h1>
        <p className="text-sm text-slate-600 max-w-xl">
          Gestion des capteurs de sol, d'air, etc. Ces capteurs alimentent
          les graphiques, les stratégies d'irrigation et le système
          d'alertes.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[2fr,1.3fr] gap-4">
        {/* LISTE CAPTEURS */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold inline-flex items-center gap-2">
              <SensorIcon className="h-4 w-4 text-sky-500" />
              Liste des capteurs
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Type</label>
              <select
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-slate-800 text-xs"
                value={form.type ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value || "" }))
                }
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
              <label className="block text-slate-600 mb-1">Unité</label>
              <input
                type="text"
                placeholder="% , °C, kPa..."
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-slate-800 text-xs"
                value={form.unit ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unit: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Zone *</label>
              <select
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-slate-800 text-xs"
                value={form.zone_id ?? ""}
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
