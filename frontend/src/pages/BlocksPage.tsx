import { useMemo, useState } from "react";
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

  const resolvedBlocks = blocks ?? [];
  const resolvedFarms = farms ?? [];

  const blocksByFarm = useMemo(() => {
    const map = new Map<number, BlockDTO[]>();
    resolvedBlocks.forEach((block) => {
      if (!map.has(block.farm_id)) {
        map.set(block.farm_id, []);
      }
      map.get(block.farm_id)?.push(block);
    });
    return map;
  }, [resolvedBlocks]);

  const orphanBlocks = useMemo(
    () =>
      resolvedBlocks.filter(
        (block) => !resolvedFarms.some((farm) => farm.id === block.farm_id)
      ),
    [resolvedBlocks, resolvedFarms]
  );

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
              Blocs par exploitation
            </div>
            <Button size="xs" variant="primary" type="button" onClick={resetForm}>
              + Nouveau bloc
            </Button>
          </div>

          <div className="space-y-3">
            {farms?.map((farm) => {
              const farmBlocks = blocksByFarm.get(farm.id) ?? [];

              return (
                <Card key={farm.id} className="border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {farm.name}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {farm.location || "Emplacement non renseigné"}
                      </div>
                    </div>
                    <Link
                      to={`/farms/${farm.id}`}
                      className="text-[11px] text-emerald-700 hover:underline"
                    >
                      Voir l&apos;exploitation
                    </Link>
                  </div>

                  {farmBlocks.length === 0 ? (
                    <div className="text-xs text-slate-500">
                      Aucun bloc pour cette exploitation.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {farmBlocks.map((block) => (
                        <div
                          key={block.id}
                          className="rounded border border-slate-200 bg-white p-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {block.name}
                              </div>
                              <div className="text-[11px] text-slate-600">
                                Parcelles : {block.parcels_count ?? "—"}
                              </div>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                              {block.type === "greenhouse" ? "Serre" : "Plein champ"}
                            </span>
                          </div>

                          <div className="mt-3 flex justify-end gap-2">
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
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}

            {orphanBlocks.length > 0 && (
              <Card className="border border-amber-200 bg-amber-50">
                <div className="text-sm font-semibold text-amber-800 mb-2">
                  Blocs sans exploitation connue
                </div>
                <div className="space-y-2">
                  {orphanBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="rounded border border-amber-200 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-900">
                          {block.name}
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                          {block.type === "greenhouse" ? "Serre" : "Plein champ"}
                        </span>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
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
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
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
