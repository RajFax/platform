// src/pages/FarmsPage.tsx
import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  fetchFarms,
  createFarm,
  updateFarm,
  deleteFarm,
  type FarmSummary,
  type FarmPayload,
} from "../api/farms";
import { Card } from "../components/ui/Card";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function FarmsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<FarmSummary[]>({
    queryKey: ["farms"],
    queryFn: fetchFarms,
  });

  const [editingFarm, setEditingFarm] = useState<FarmSummary | null>(null);
  const [form, setForm] = useState<FarmPayload>({
    name: "",
    location: "",
    surface_ha: undefined,
    description: "",
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: FarmPayload) => createFarm(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      resetForm();
    },
    onError: () => {
      setErrorMsg("Erreur lors de la création de l'exploitation.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; payload: FarmPayload }) =>
      updateFarm(vars.id, vars.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      resetForm();
    },
    onError: () => {
      setErrorMsg("Erreur lors de la mise à jour de l'exploitation.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFarm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      if (editingFarm && editingFarm.id) {
        setEditingFarm(null);
        resetForm();
      }
    },
    onError: () => {
      setErrorMsg("Erreur lors de la suppression de l'exploitation.");
    },
  });

  function resetForm() {
    setEditingFarm(null);
    setForm({
      name: "",
      location: "",
      surface_ha: undefined,
      description: "",
    });
    setErrorMsg(null);
  }

  function handleEditClick(farm: FarmSummary) {
    setEditingFarm(farm);
    setForm({
      name: farm.name,
      location: farm.location ?? "",
      surface_ha: farm.surface_ha ?? undefined,
      description: farm.description ?? "",
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const payload: FarmPayload = {
      name: form.name.trim(),
      location: form.location ?? "",
      surface_ha:
        form.surface_ha === undefined || form.surface_ha === null
          ? undefined
          : Number(form.surface_ha),
      description: form.description ?? "",
    };

    if (!payload.name) {
      setErrorMsg("Le nom de l'exploitation est obligatoire.");
      return;
    }

    if (payload.surface_ha !== undefined && payload.surface_ha < 0) {
      setErrorMsg("La surface doit être positive ou nulle.");
      return;
    }

    if (editingFarm) {
      updateMutation.mutate({ id: editingFarm.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete(id: number) {
    if (!confirm("Supprimer cette exploitation ?")) return;
    deleteMutation.mutate(id);
  }

  if (isLoading) return <div>Chargement des exploitations…</div>;
  if (isError || !data) return <div>Erreur de chargement des exploitations.</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Exploitations</h1>
        <p className="text-sm text-slate-500 max-w-xl">
          Gestion des exploitations agricoles (nom, localisation, surface, description). Cliquez sur une ligne pour accéder au détail.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[2fr,1.3fr] gap-4">
        {/* LISTE DES FARMS */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-slate-800">Liste des exploitations</div>
            <Button variant="primary" size="xs" type="button" onClick={resetForm}>
              + Nouvelle exploitation
            </Button>
          </div>

          {data.length === 0 ? (
            <div className="text-xs text-slate-500">Aucune exploitation pour le moment.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                    <th className="text-left py-2 pr-2">Nom</th>
                    <th className="text-left py-2 pr-2">Localisation</th>
                    <th className="text-left py-2 pr-2">Surface (ha)</th>
                    <th className="text-left py-2 pr-2">Parcelles</th>
                    <th className="text-right py-2 pl-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((farm) => (
                    <tr
                      key={farm.id}
                      className="border-b border-slate-200 hover:bg-slate-50 text-slate-800"
                    >
                      <td className="py-2 pr-2">
                        <Link
                          to={`/farms/${farm.id}`}
                          className="text-emerald-700 hover:underline"
                        >
                          {farm.name}
                        </Link>
                      </td>
                      <td className="py-2 pr-2 text-slate-700">
                        {farm.location ?? "—"}
                      </td>
                      <td className="py-2 pr-2 text-slate-700">
                        {farm.surface_ha ?? "—"}
                      </td>
                      <td className="py-2 pr-2 text-slate-600">
                        {farm.parcels_count ?? "—"}
                      </td>
                      <td className="py-2 pl-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="xs"
                            variant="secondary"
                            type="button"
                            onClick={() => handleEditClick(farm)}
                          >
                            Éditer
                          </Button>
                          <Button
                            size="xs"
                            variant="danger"
                            type="button"
                            onClick={() => handleDelete(farm.id)}
                            disabled={deleteMutation.isPending}
                          >
                            Supprimer
                          </Button>
                        </div>
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
          <div className="text-sm font-semibold mb-3 text-slate-800">
            {editingFarm
              ? `Modifier l'exploitation : ${editingFarm.name}`
              : "Nouvelle exploitation"}
          </div>

          {errorMsg && (
            <div className="mb-3 text-xs text-red-600">{errorMsg}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 mb-1">
                Nom de l&apos;exploitation *
              </label>
              <input
                type="text"
                className="w-full"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">
                Localisation
              </label>
              <input
                type="text"
                className="w-full"
                value={form.location ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Surface (ha)</label>
              <input
                type="number"
                className="w-full"
                min="0"
                step="0.01"
                value={form.surface_ha ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, surface_ha: Number(e.target.value) }))
                }
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Description</label>
              <textarea
                className="w-full"
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              {editingFarm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={resetForm}
                >
                  Annuler
                </Button>
              )}
              <Button
                variant="primary"
                size="xs"
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingFarm ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
