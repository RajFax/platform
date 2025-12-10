// src/pages/ParcelsPage.tsx
import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchParcels,
  createParcel,
  updateParcel,
  deleteParcel,
  type ParcelSummary,
  type ParcelCreatePayload,
  type ParcelUpdatePayload,
} from "../api/parcels";
import { fetchFarms, type FarmSummary } from "../api/farms";
import { Card } from "../components/ui/Card";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function ParcelsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<ParcelSummary[]>({
    queryKey: ["parcels"],
    queryFn: () => fetchParcels(),
  });

  const { data: farms } = useQuery<FarmSummary[]>({
    queryKey: ["farms"],
    queryFn: fetchFarms,
  });

  const [editingParcel, setEditingParcel] = useState<ParcelSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState<{
    farm_id: string;
    name: string;
    surface_ha: string;
    culture_type: string;
    crop_stage: string;
    planting_date: string;
    target_soil_moisture_min: string;
    target_soil_moisture_max: string;
    target_temp_min: string;
    target_temp_max: string;
    block_id: string;
  }>({
    farm_id: "",
    name: "",
    surface_ha: "",
    culture_type: "",
    crop_stage: "",
    planting_date: "",
    target_soil_moisture_min: "",
    target_soil_moisture_max: "",
    target_temp_min: "",
    target_temp_max: "",
    block_id: "",
  });

  const selectedFarmId = Number(form.farm_id) || null;
  const availableBlocks =
    farms?.find((farm) => farm.id === selectedFarmId)?.blocks ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: ParcelCreatePayload) => createParcel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcels"] });
      resetForm();
    },
    onError: () => {
      setErrorMsg("Erreur lors de la création de la parcelle.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; payload: ParcelUpdatePayload }) =>
      updateParcel(vars.id, vars.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcels"] });
      resetForm();
    },
    onError: () => {
      setErrorMsg("Erreur lors de la mise à jour de la parcelle.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteParcel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["parcels"] });
      if (editingParcel && editingParcel.id === id) {
        resetForm();
      }
    },
    onError: () => {
      setErrorMsg("Erreur lors de la suppression de la parcelle.");
    },
  });

  function resetForm() {
    setEditingParcel(null);
    setForm({
      farm_id: "",
      name: "",
      surface_ha: "",
      culture_type: "",
      crop_stage: "",
      planting_date: "",
      target_soil_moisture_min: "",
      target_soil_moisture_max: "",
      target_temp_min: "",
      target_temp_max: "",
      block_id: "",
    });
    setErrorMsg(null);
  }

  function handleEditClick(parcel: ParcelSummary) {
    setEditingParcel(parcel);
    setForm((prev) => ({
      ...prev,
      farm_id: String(parcel.farm_id),
      name: parcel.name,
      surface_ha:
        parcel.surface_ha != null ? String(parcel.surface_ha) : "",
      culture_type: parcel.culture_type,
      // Les autres champs (crop_stage, planting, targets) ne sont pas dans ParcelSummary -> laisser vides
      crop_stage: "",
      planting_date: "",
      target_soil_moisture_min: "",
      target_soil_moisture_max: "",
      target_temp_min: "",
      target_temp_max: "",
      block_id: parcel.block_id != null ? String(parcel.block_id) : "",
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const farmIdNum = Number(form.farm_id);
    const blockIdNum =
      form.block_id.trim() === "" ? null : Number(form.block_id.trim());
    const surfaceNum =
      form.surface_ha.trim() === "" ? undefined : Number(form.surface_ha);

    const parseNumOr = (value: string): number | null | undefined => {
      const v = value.trim();
      if (v === "") return undefined;
      const n = Number(v);
      return Number.isNaN(n) ? undefined : n;
    };

    if (!farmIdNum || Number.isNaN(farmIdNum)) {
      setErrorMsg(
        "L'exploitation (farm_id) est obligatoire et doit être un nombre."
      );
      return;
    }

    if (form.block_id.trim() !== "" && (blockIdNum === null || isNaN(blockIdNum))) {
      setErrorMsg("Le bloc doit être un identifiant valide ou vide.");
      return;
    }

    if (!form.name.trim()) {
      setErrorMsg("Le nom de la parcelle est obligatoire.");
      return;
    }

    if (!form.culture_type.trim()) {
      setErrorMsg("Le type de culture est obligatoire.");
      return;
    }

    if (!editingParcel && !form.crop_stage.trim()) {
      setErrorMsg("Le stade de culture (crop_stage) est obligatoire à la création.");
      return;
    }

    if (editingParcel) {
      // UPDATE : tous les champs sont optionnels
      const payload: ParcelUpdatePayload = {
        name: form.name.trim(),
        culture_type: form.culture_type.trim(),
        surface_ha:
          surfaceNum === undefined ? null : surfaceNum,
        // crop_stage : on met à jour seulement si renseigné
        crop_stage: form.crop_stage.trim()
          ? form.crop_stage.trim()
          : undefined,
        planting_date: form.planting_date
          ? form.planting_date
          : null,
        target_soil_moisture_min: parseNumOr(
          form.target_soil_moisture_min
        ) ?? null,
        target_soil_moisture_max: parseNumOr(
          form.target_soil_moisture_max
        ) ?? null,
        target_temp_min: parseNumOr(form.target_temp_min) ?? null,
        target_temp_max: parseNumOr(form.target_temp_max) ?? null,
        block_id: blockIdNum,
      };

      updateMutation.mutate({
        id: editingParcel.id,
        payload,
      });
    } else {
      // CREATE : crop_stage obligatoire
      const payload: ParcelCreatePayload = {
        farm_id: farmIdNum,
        name: form.name.trim(),
        culture_type: form.culture_type.trim(),
        crop_stage: form.crop_stage.trim(),
        surface_ha: surfaceNum ?? undefined,
        block_id: blockIdNum,
        planting_date: form.planting_date || undefined,
        target_soil_moisture_min: parseNumOr(
          form.target_soil_moisture_min
        ),
        target_soil_moisture_max: parseNumOr(
          form.target_soil_moisture_max
        ),
        target_temp_min: parseNumOr(form.target_temp_min),
        target_temp_max: parseNumOr(form.target_temp_max),
      };

      createMutation.mutate(payload);
    }
  }

  function handleDelete(id: number) {
    if (!confirm("Supprimer cette parcelle ?")) return;
    deleteMutation.mutate(id);
  }

  if (isLoading) return <div>Chargement des parcelles…</div>;
  if (isError || !data) {
    return <div>Erreur lors du chargement des parcelles.</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Parcelles</h1>
        <p className="text-sm text-slate-500 max-w-xl">
          Gestion des parcelles (exploitation, nom, surface, culture, consignes).
          Cliquez sur une ligne pour accéder au détail.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[2fr,1.3fr] gap-4">
        {/* LISTE DES PARCELLES */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-slate-800">
              Liste des parcelles
            </div>
            <Button
              variant="primary"
              size="xs"
              type="button"
              onClick={resetForm}
            >
              + Nouvelle parcelle
            </Button>
          </div>

          {data.length === 0 ? (
            <div className="text-xs text-slate-500">
              Aucune parcelle pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                    <th className="text-left py-2 pr-2">Nom</th>
                    <th className="text-left py-2 pr-2">Exploitation</th>
                    <th className="text-left py-2 pr-2">Bloc</th>
                    <th className="text-left py-2 pr-2">Surface (ha)</th>
                    <th className="text-left py-2 pr-2">Culture</th>
                    <th className="text-right py-2 pl-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((parcel) => (
                    <tr
                      key={parcel.id}
                      className="border-b border-slate-200 hover:bg-slate-50 text-slate-800"
                    >
                      <td className="py-2 pr-2">
                        <Link
                          to={`/parcels/${parcel.id}`}
                          className="text-emerald-700 hover:underline"
                        >
                          {parcel.name}
                        </Link>
                      </td>
                      <td className="py-2 pr-2 text-slate-700">
                        <Link
                          to={`/farms/${parcel.farm_id}`}
                          className="underline decoration-slate-300 hover:decoration-slate-500"
                        >
                          Farm #{parcel.farm_id}
                        </Link>
                      </td>
                      <td className="py-2 pr-2 text-slate-700">
                        {parcel.block?.name || "—"}
                      </td>
                      <td className="py-2 pr-2 text-slate-700">
                        {parcel.surface_ha ?? "—"}
                      </td>
                      <td className="py-2 pr-2 text-slate-600">
                        {parcel.culture_type}
                      </td>
                      <td className="py-2 pl-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="xs"
                            variant="secondary"
                            type="button"
                            onClick={() => handleEditClick(parcel)}
                          >
                            Éditer
                          </Button>
                          <Button
                            size="xs"
                            variant="danger"
                            type="button"
                            onClick={() => handleDelete(parcel.id)}
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
            {editingParcel
              ? `Modifier la parcelle : ${editingParcel.name}`
              : "Nouvelle parcelle"}
          </div>

          {errorMsg && (
            <div className="mb-3 text-xs text-red-600">{errorMsg}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">Exploitation *</label>
                <select
                  className="w-full"
                  value={form.farm_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, farm_id: e.target.value, block_id: "" }))
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
                <label className="block text-slate-600 mb-1">Bloc (optionnel)</label>
                <select
                  className="w-full"
                  value={form.block_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, block_id: e.target.value }))
                  }
                  disabled={!selectedFarmId || availableBlocks.length === 0}
                >
                  <option value="">Sans bloc</option>
                  {availableBlocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.name} {block.type ? `(${block.type})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 mb-1">
                Nom de la parcelle *
              </label>
              <input
                type="text"
                className="w-full"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
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
                className="w-full"
                value={form.surface_ha}
                onChange={(e) =>
                  setForm((f) => ({ ...f, surface_ha: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">
                Culture *
              </label>
              <input
                type="text"
                className="w-full"
                value={form.culture_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, culture_type: e.target.value }))
                }
              />
            </div>

            {!editingParcel && (
              <div>
                <label className="block text-slate-600 mb-1">
                  Stade de culture (crop_stage) *
                </label>
                <input
                  type="text"
                  className="w-full"
                  value={form.crop_stage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, crop_stage: e.target.value }))
                  }
                  placeholder="VEGETATIVE, FLOWERING..."
                />
              </div>
            )}

            <div>
              <label className="block text-slate-600 mb-1">
                Date de plantation
              </label>
              <input
                type="date"
                className="w-full"
                value={form.planting_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, planting_date: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">
                  Humidité sol min (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full"
                  value={form.target_soil_moisture_min}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      target_soil_moisture_min: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">
                  Humidité sol max (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full"
                  value={form.target_soil_moisture_max}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      target_soil_moisture_max: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">
                  Température min (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full"
                  value={form.target_temp_min}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      target_temp_min: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">
                  Température max (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full"
                  value={form.target_temp_max}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      target_temp_max: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              {editingParcel && (
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
                {editingParcel ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
