import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
  type BlockDTO,
  type BlockPayload,
} from "../api/blocks";
import { fetchFarms, type FarmSummary } from "../api/farms";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Link } from "react-router-dom";

export function BlocksPage() {
  const queryClient = useQueryClient();
  const { data: blocks, isLoading, isError } = useQuery<BlockDTO[]>({
    queryKey: ["blocks"],
    queryFn: () => fetchBlocks(),
  });

  const { data: farms } = useQuery<FarmSummary[]>({
    queryKey: ["farms"],
    queryFn: fetchFarms,
  });

  const [editingBlock, setEditingBlock] = useState<BlockDTO | null>(null);
  const [form, setForm] = useState<BlockPayload>({
    farm_id: 0,
    name: "",
    type: "openfield",
    description: "",
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: BlockPayload) => createBlock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
      resetForm();
    },
    onError: () => setErrorMsg("Erreur lors de la création du bloc."),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; payload: Partial<BlockPayload> }) =>
      updateBlock(vars.id, vars.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
      resetForm();
    },
    onError: () => setErrorMsg("Erreur lors de la mise à jour du bloc."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBlock(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
      if (editingBlock && editingBlock.id === id) {
        resetForm();
      }
    },
    onError: () => setErrorMsg("Erreur lors de la suppression du bloc."),
  });

  function resetForm() {
    setEditingBlock(null);
    setForm({
      farm_id: 0,
      name: "",
      type: "openfield",
      description: "",
    });
    setErrorMsg(null);
  }

  function handleEdit(block: BlockDTO) {
    setEditingBlock(block);
    setForm({
      farm_id: block.farm_id,
      name: block.name,
      type: block.type,
      description: block.description ?? "",
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.farm_id) {
      setErrorMsg("L'exploitation est obligatoire.");
      return;
    }

    if (!form.name.trim()) {
      setErrorMsg("Le nom du bloc est obligatoire.");
      return;
    }

    const payload: BlockPayload = {
      farm_id: form.farm_id,
      name: form.name.trim(),
      type: form.type,
      description: form.description?.trim() ?? "",
    };

    if (editingBlock) {
      updateMutation.mutate({ id: editingBlock.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete(id: number) {
    if (!confirm("Supprimer ce bloc ?")) return;
    deleteMutation.mutate(id);
  }

  if (isLoading) return <div>Chargement des blocs…</div>;
  if (isError || !blocks) return <div>Erreur lors du chargement des blocs.</div>;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Blocs</h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Gestion des blocs au sein des exploitations. Chaque bloc peut être un
          plein champ (openfield) ou une serre (greenhouse) et regroupe une ou
          plusieurs parcelles.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[2fr,1.2fr] gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-slate-800">
              Liste des blocs
            </div>
            <Button size="xs" variant="primary" type="button" onClick={resetForm}>
              + Nouveau bloc
            </Button>
          </div>

          {blocks.length === 0 ? (
            <div className="text-xs text-slate-500">Aucun bloc enregistré.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                    <th className="text-left py-2 pr-2">Nom</th>
                    <th className="text-left py-2 pr-2">Type</th>
                    <th className="text-left py-2 pr-2">Exploitation</th>
                    <th className="text-left py-2 pr-2">Parcelles</th>
                    <th className="text-right py-2 pl-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((block) => (
                    <tr
                      key={block.id}
                      className="border-b border-slate-200 hover:bg-slate-50 text-slate-800"
                    >
                      <td className="py-2 pr-2">{block.name}</td>
                      <td className="py-2 pr-2 text-slate-700">
                        {block.type === "greenhouse" ? "Serre" : "Plein champ"}
                      </td>
                      <td className="py-2 pr-2 text-slate-700">
                        {farms?.find((f) => f.id === block.farm_id) ? (
                          <Link
                            to={`/farms/${block.farm_id}`}
                            className="text-emerald-700 hover:underline"
                          >
                            {farms.find((f) => f.id === block.farm_id)?.name}
                          </Link>
                        ) : (
                          `Farm #${block.farm_id}`
                        )}
                      </td>
                      <td className="py-2 pr-2 text-slate-600">
                        {block.parcels_count ?? "—"}
                      </td>
                      <td className="py-2 pl-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="xs"
                            variant="secondary"
                            type="button"
                            onClick={() => handleEdit(block)}
                          >
                            Éditer
                          </Button>
                          <Button
                            size="xs"
                            variant="danger"
                            type="button"
                            onClick={() => handleDelete(block.id)}
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

        <Card>
          <div className="text-sm font-semibold mb-3 text-slate-800">
            {editingBlock
              ? `Modifier le bloc : ${editingBlock.name}`
              : "Nouveau bloc"}
          </div>

          {errorMsg && <div className="mb-3 text-xs text-red-600">{errorMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 mb-1">Exploitation *</label>
              <select
                className="w-full rounded border border-slate-200 px-2 py-1"
                required
                value={form.farm_id || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, farm_id: Number(e.target.value) }))
                }
              >
                <option value="">Sélectionner une exploitation</option>
                {farms?.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Nom du bloc *</label>
              <input
                className="w-full rounded border border-slate-200 px-2 py-1"
                required
                value={form.name}
                maxLength={255}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Type *</label>
              <select
                className="w-full rounded border border-slate-200 px-2 py-1"
                value={form.type}
                required
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as BlockPayload["type"],
                  }))
                }
              >
                <option value="openfield">Plein champ</option>
                <option value="greenhouse">Serre</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Description</label>
              <textarea
                rows={3}
                className="w-full rounded border border-slate-200 px-2 py-1"
                value={form.description ?? ""}
                maxLength={255}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {editingBlock && (
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
                {editingBlock ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
