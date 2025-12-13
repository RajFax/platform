// src/pages/ZonesAdminPage.tsx
import { useMemo, useState } from "react";
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
import { fetchParcels, type ParcelSummary } from "../api/parcels";
import { fetchFarms, type FarmBlockLight, type FarmSummary } from "../api/farms";
import { Card } from "../components/ui/Card";

export function ZonesAdminPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<ZoneSummary[]>({
    queryKey: ["zones"],
    queryFn: () => fetchZones(),
  });

  const { data: parcels } = useQuery<ParcelSummary[]>({
    queryKey: ["parcels", "for-zones"],
    queryFn: () => fetchParcels(),
  });

  const { data: farms } = useQuery<FarmSummary[]>({
    queryKey: ["farms"],
    queryFn: fetchFarms,
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

    if (!form.parcel_id) {
      setErrorMsg("La parcelle est obligatoire.");
      return;
    }

    const payload: ZonePayload = {
      name: form.name.trim(),
      description: form.description ?? "",
      parcel_id: Number(form.parcel_id),
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

  const parcelsByFarm = useMemo(() => {
    const map = new Map<number, ParcelSummary[]>();
    parcels?.forEach((parcel) => {
      if (!map.has(parcel.farm_id)) {
        map.set(parcel.farm_id, []);
      }
      map.get(parcel.farm_id)?.push(parcel);
    });
    return map;
  }, [parcels]);

  const zonesByParcel = useMemo(() => {
    const map = new Map<number, ZoneSummary[]>();
    zones.forEach((zone) => {
      if (!zone.parcel_id) return;
      if (!map.has(zone.parcel_id)) {
        map.set(zone.parcel_id, []);
      }
      map.get(zone.parcel_id)?.push(zone);
    });
    return map;
  }, [zones]);

  const getBlocksForFarm = (farmId: number): FarmBlockLight[] => {
    const farmBlocks = farms?.find((farm) => farm.id === farmId)?.blocks ?? [];
    const farmParcels = parcelsByFarm.get(farmId) ?? [];

    const missingBlocks = farmParcels.reduce<FarmBlockLight[]>((acc, parcel) => {
      const alreadyKnown =
        farmBlocks.some((b) => b.id === parcel.block_id) ||
        acc.some((b) => b.id === parcel.block_id);
      if (!alreadyKnown) {
        acc.push({
          id: parcel.block_id,
          farm_id: farmId,
          name: parcel.block?.name ?? `Bloc #${parcel.block_id}`,
        });
      }
      return acc;
    }, []);

    return [...farmBlocks, ...missingBlocks];
  };

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
            <div className="text-sm font-semibold">Zones par exploitation</div>
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

          <div className="space-y-3">
            {farms?.map((farm) => {
              const farmBlocks = getBlocksForFarm(farm.id);
              const farmParcels = parcelsByFarm.get(farm.id) ?? [];

              return (
                <Card key={farm.id} className="border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{farm.name}</div>
                      <div className="text-[11px] text-slate-600">
                        {farm.location || "Emplacement non renseigné"}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {farmBlocks.length} bloc(s)
                    </span>
                  </div>

                  {farmBlocks.length === 0 ? (
                    <div className="text-xs text-slate-500">Aucun bloc associé.</div>
                  ) : (
                    <div className="space-y-2">
                      {farmBlocks.map((block) => {
                        const blockParcels = farmParcels.filter(
                          (parcel) => parcel.block_id === block.id
                        );

                        return (
                          <div
                            key={block.id}
                            className="rounded border border-slate-200 bg-white p-3 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">
                                  {block.name}
                                </div>
                                <div className="text-[11px] text-slate-600">
                                  {blockParcels.length} parcelle(s)
                                </div>
                              </div>
                              {block.type && (
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                                  {block.type === "greenhouse" ? "Serre" : "Plein champ"}
                                </span>
                              )}
                            </div>

                            {blockParcels.length === 0 ? (
                              <div className="mt-2 text-[11px] text-slate-500">
                                Aucune parcelle dans ce bloc.
                              </div>
                            ) : (
                              <div className="mt-3 space-y-2">
                                {blockParcels.map((parcel) => {
                                  const parcelZones = zonesByParcel.get(parcel.id) ?? [];

                                  return (
                                    <Card
                                      key={parcel.id}
                                      className="border border-slate-100 bg-slate-50"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="text-sm font-semibold text-emerald-700">
                                            {parcel.name}
                                          </div>
                                          <div className="text-[11px] text-slate-600">
                                            {parcelZones.length} zone(s)
                                          </div>
                                        </div>
                                      </div>

                                      {parcelZones.length === 0 ? (
                                        <div className="mt-2 text-[11px] text-slate-500">
                                          Aucune zone définie pour cette parcelle.
                                        </div>
                                      ) : (
                                        <ul className="mt-3 space-y-2">
                                          {parcelZones.map((zone) => (
                                            <li
                                              key={zone.id}
                                              className="rounded border border-slate-200 bg-white p-2"
                                            >
                                              <div className="flex items-center justify-between">
                                                <div>
                                                  <div className="text-sm font-semibold text-slate-900">
                                                    {zone.name}
                                                  </div>
                                                  <div className="text-[11px] text-slate-600">
                                                    Surface : {zone.surface_ha ?? "—"} ha
                                                  </div>
                                                  <div className="text-[11px] text-slate-600">
                                                    Statut : {" "}
                                                    <span
                                                      className={`px-2 py-[2px] rounded-full text-[11px] font-semibold ${
                                                        zone.is_active
                                                          ? "bg-emerald-100 text-emerald-700"
                                                          : "bg-slate-100 text-slate-600"
                                                      }`}
                                                    >
                                                      {zone.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                  </div>
                                                </div>
                                                <div className="flex gap-1">
                                                  <button
                                                    type="button"
                                                    className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                                                    onClick={() => handleEdit(zone)}
                                                  >
                                                    Éditer
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="text-xs px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700"
                                                    onClick={() => handleDelete(zone.id)}
                                                    disabled={
                                                      deleteMutation.isPending &&
                                                      idBeingDeleted === zone.id
                                                    }
                                                  >
                                                    Supprimer
                                                  </button>
                                                </div>
                                              </div>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </Card>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
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
              <label className="block text-slate-600 mb-1">Parcelle *</label>
              <select
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
              >
                <option value="">Sélectionner une parcelle</option>
                {parcels?.map((parcel) => (
                  <option key={parcel.id} value={parcel.id}>
                    {parcel.name}
                    {parcel.block?.name ? ` · Bloc ${parcel.block.name}` : ""}
                    {` (Farm #${parcel.farm_id})`}
                  </option>
                ))}
              </select>
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
