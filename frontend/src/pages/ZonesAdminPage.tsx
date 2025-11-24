// src/pages/ZonesAdminPage.tsx
import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchZones,
  createZone,
  updateZone,
  deleteZone,
  type ZoneSummary,
  type ZonePayload,
} from "../api/zones";
import { Card } from "../components/ui/Card";

export function ZonesAdminPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<ZoneSummary[]>({
    queryKey: ["zones"],
    queryFn: () => fetchZones(),
  });

  const [editingZone, setEditingZone] = useState<ZoneSummary | null>(null);
  const [form, setForm] = useState<ZonePayload>({
    name: "",
    description: "",
    parcel_id: undefined,
    surface_ha: undefined,
    is_active: true,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

  const createMutation = useMutation({
    mutationFn: (payload: ZonePayload) => createZone(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      resetForm();
    },
    onError: () => {
      setErrorMsg("Erreur lors de la création de la zone.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; payload: ZonePayload }) =>
      updateZone(vars.id, vars.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      resetForm();
    },
    onError: () => {
      setErrorMsg("Erreur lors de la mise à jour de la zone.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      if (editingZone && editingZone.id === idBeingDeleted) {
        setEditingZone(null);
        resetForm();
      }
    },
    onError: () => {
      setErrorMsg("Erreur lors de la suppression de la zone.");
    },
  });

  // petit hack pour savoir ce qu'on supprime
  const [idBeingDeleted, setIdBeingDeleted] = useState<number | null>(null);

  function resetForm() {
    setEditingZone(null);
    setForm({
      name: "",
      description: "",
      parcel_id: undefined,
      surface_ha: undefined,
      is_active: true,
    });
    setErrorMsg(null);
  }

  function handleEdit(zone: ZoneSummary) {
    setEditingZone(zone);
    setForm({
      name: zone.name,
      description: zone.description ?? "",
      parcel_id:
        zone.parcel_id === undefined || zone.parcel_id === null
          ? undefined
          : zone.parcel_id,
      surface_ha:
        zone.surface_ha === undefined || zone.surface_ha === null
          ? undefined
          : zone.surface_ha,
      is_active: zone.is_active ?? true,
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Supprimer cette zone ?")) return;
    setIdBeingDeleted(id);
    deleteMutation.mutate(id);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const payload: ZonePayload = {
      name: form.name.trim(),
      description: form.description ?? "",
      parcel_id:
        form.parcel_id === undefined || form.parcel_id === null
          ? undefined
          : Number(form.parcel_id),
      surface_ha:
        form.surface_ha === undefined || form.surface_ha === null
          ? undefined
          : Number(form.surface_ha),
      is_active: form.is_active ?? true,
    };

    if (!payload.name) {
      setErrorMsg("Le nom de la zone est obligatoire.");
      return;
    }

    if (editingZone) {
      updateMutation.mutate({ id: editingZone.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  if (isLoading) return <div>Chargement des zones…</div>;
  if (isError || !data) return <div>Erreur de chargement des zones.</div>;

  const zones = filterActiveOnly
    ? data.filter((z) => z.is_active)
    : data;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Zones d&apos;irrigation</h1>
        <p className="text-sm text-slate-600 max-w-xl">
          Gestion des zones d&apos;irrigation (activation, surface, rattachement
          à une parcelle). Ces zones seront utilisées dans le contrôle
          d&apos;irrigation et le dashboard.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[2fr,1.3fr] gap-4">
        {/* LISTE ZONES */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Liste des zones</div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-[11px] text-slate-600">
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={filterActiveOnly}
                  onChange={(e) => setFilterActiveOnly(e.target.checked)}
                />
                Zones actives uniquement
              </label>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={resetForm}
              >
                + Nouvelle zone
              </button>
            </div>
          </div>

          {zones.length === 0 ? (
            <div className="text-xs text-slate-500">
              Aucune zone configurée.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="text-left py-2 pr-2">Nom</th>
                    <th className="text-left py-2 pr-2">Parcelle</th>
                    <th className="text-left py-2 pr-2">Surface (ha)</th>
                    <th className="text-left py-2 pr-2">Statut</th>
                    <th className="text-right py-2 pl-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((z) => (
                    <tr
                      key={z.id}
                      className="border-b border-slate-200 hover:bg-white"
                    >
                      <td className="py-2 pr-2 text-slate-800">
                        {z.name}
                      </td>
                      <td className="py-2 pr-2 text-slate-600">
                        {z.parcel_id ?? "—"}
                      </td>
                      <td className="py-2 pr-2 text-slate-700">
                        {z.surface_ha ?? "—"}
                      </td>
                      <td className="py-2 pr-2">
                        {z.is_active ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-700/40">
                            Active
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700/20 text-slate-700 border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-2 pl-2 text-right space-x-2">
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded border border-slate-200 hover:bg-slate-800"
                          onClick={() => handleEdit(z)}
                        >
                          Éditer
                        </button>
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded border border-red-700 text-red-300 hover:bg-red-900/40"
                          onClick={() => handleDelete(z.id)}
                          disabled={deleteMutation.isPending && idBeingDeleted === z.id}
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

        {/* FORMULAIRE CREATE / EDIT */}
        <Card>
          <div className="text-sm font-semibold mb-3">
            {editingZone
              ? `Modifier la zone : ${editingZone.name}`
              : "Nouvelle zone"}
          </div>

          {errorMsg && (
            <div className="mb-3 text-xs text-red-400">{errorMsg}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 mb-1">
                Nom de la zone *
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
                ID parcelle (temporaire)
              </label>
              <input
                type="number"
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-slate-800 text-xs"
                value={form.parcel_id ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    parcel_id:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">
                Surface (ha)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-slate-800 text-xs"
                value={form.surface_ha ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    surface_ha:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-slate-800 text-xs"
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="zone-active"
                type="checkbox"
                className="h-3 w-3"
                checked={form.is_active ?? true}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_active: e.target.checked }))
                }
              />
              <label
                htmlFor="zone-active"
                className="text-[11px] text-slate-700"
              >
                Zone active
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {editingZone && (
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
                {editingZone ? "Mettre à jour" : "Créer"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
