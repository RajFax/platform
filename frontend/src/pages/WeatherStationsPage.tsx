// src/pages/WeatherStationsPage.tsx
import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchWeatherStations,
  createWeatherStation,
  updateWeatherStation,
  deleteWeatherStation,
  type WeatherStationSummary,
  type WeatherStationPayload,
} from "../api/weatherStations";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";

export function WeatherStationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<WeatherStationSummary[]>({
    queryKey: ["weather-stations"],
    queryFn: () => fetchWeatherStations(),
  });

  const [editing, setEditing] = useState<WeatherStationSummary | null>(null);
  const [form, setForm] = useState<WeatherStationPayload>({
    name: "",
    location_type: "",
    status: "OFFLINE",
    farm_id: undefined,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [idBeingDeleted, setIdBeingDeleted] = useState<number | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: WeatherStationPayload) =>
      createWeatherStation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weather-stations"] });
      resetForm();
    },
    onError: () => {
      setErrorMsg("Erreur lors de la création de la station météo.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; payload: WeatherStationPayload }) =>
      updateWeatherStation(vars.id, vars.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weather-stations"] });
      resetForm();
    },
    onError: () => {
      setErrorMsg("Erreur lors de la mise à jour de la station.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteWeatherStation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weather-stations"] });
      if (editing && editing.id === idBeingDeleted) {
        resetForm();
      }
    },
    onError: () => {
      setErrorMsg("Erreur lors de la suppression de la station.");
    },
  });

  function resetForm() {
    setEditing(null);
    setForm({
      name: "",
      location_type: "",
      status: "OFFLINE",
      farm_id: undefined,
    });
    setErrorMsg(null);
    setIdBeingDeleted(null);
  }

  function handleEdit(station: WeatherStationSummary) {
    setEditing(station);
    setForm({
      name: station.name,
      location_type: station.location_type ?? "",
      status: station.status,
      farm_id: station.farm?.id ?? undefined,
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Supprimer cette station météo ?")) return;
    setIdBeingDeleted(id);
    deleteMutation.mutate(id);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const payload: WeatherStationPayload = {
      name: form.name.trim(),
      location_type: form.location_type ?? "",
      status: form.status ?? "OFFLINE",
      farm_id: form.farm_id ?? undefined,
    };

    if (!payload.name) {
      setErrorMsg("Le nom de la station est obligatoire.");
      return;
    }

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  if (isLoading) return <div>Chargement des stations météo…</div>;
  if (isError || !data) return <div>Erreur de chargement des stations.</div>;

  const stations = data;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Stations météo</h1>
        <p className="text-sm text-slate-600 max-w-xl">
          Gestion des stations météo de l&apos;exploitation (rattachement à une
          ferme, statut, type d&apos;implantation).
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[2fr,1.3fr] gap-4">
        {/* LISTE */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Liste des stations</div>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={resetForm}
            >
              + Nouvelle station
            </button>
          </div>

          {stations.length === 0 ? (
            <div className="text-xs text-slate-500">
              Aucune station configurée.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="text-left py-2 pr-2">Nom</th>
                    <th className="text-left py-2 pr-2">Exploitation</th>
                    <th className="text-left py-2 pr-2">Type</th>
                    <th className="text-left py-2 pr-2">Statut</th>
                    <th className="text-right py-2 pl-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-slate-200 hover:bg-white"
                    >
                      <td className="py-2 pr-2 text-slate-800">
                        <Link
                          to={`/weather-stations/${s.id}`}
                          className="underline hover:text-slate-700"
                        >
                          {s.name}
                        </Link>
                      </td>
                      <td className="py-2 pr-2 text-slate-600">
                        {s.farm?.name ?? "—"}
                      </td>
                      <td className="py-2 pr-2 text-slate-700">
                        {s.location_type ?? "—"}
                      </td>
                      <td className="py-2 pr-2">
                        <span className="text-[11px] px-2 py-0.5 rounded-full border">
                          {s.status}
                        </span>
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
            {editing
              ? `Modifier la station : ${editing.name}`
              : "Nouvelle station"}
          </div>

          {errorMsg && (
            <div className="mb-3 text-xs text-red-400">{errorMsg}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 mb-1">
                Nom de la station *
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
              <label className="block text-slate-600 mb-1">
                ID exploitation (optionnel)
              </label>
              <input
                type="number"
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-slate-800 text-xs"
                value={form.farm_id ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    farm_id:
                      e.target.value === "" ? undefined : Number(e.target.value),
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">
                Type de localisation
              </label>
              <input
                type="text"
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-slate-800 text-xs"
                value={form.location_type ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location_type: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Statut</label>
              <select
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-slate-800 text-xs"
                value={form.status ?? "OFFLINE"}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
              >
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {editing && (
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
                {editing ? "Mettre à jour" : "Créer"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
