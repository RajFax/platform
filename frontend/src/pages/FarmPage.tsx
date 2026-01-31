import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFarm, type FarmDetail } from "../api/farms";
import {
  createParcel,
  updateParcel,
  deleteParcel,
  type ParcelCreatePayload,
} from "../api/parcels";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { CropIcon } from "../components/ui/Icons";

export function FarmPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<FarmDetail>({
    queryKey: ["farm", farmId],
    queryFn: () => fetchFarm(farmId!),
    enabled: !!farmId,
  });

  const [newParcel, setNewParcel] = useState<ParcelCreatePayload | null>(null);
  const [editingParcelId, setEditingParcelId] = useState<number | null>(null);
  const [editParcelForm, setEditParcelForm] = useState({
    name: "",
    surface_ha: "",
    culture_type: "",
    variety: "",
    crop_stage: "",
    block_id: "",
  });

  const createParcelMutation = useMutation({
    mutationFn: createParcel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farm", farmId] });
      setNewParcel(
        newParcel && {
          ...newParcel,
          name: "",
          surface_ha: undefined,
          description: "",
          culture_type: "",
          variety: "",
          crop_stage: "",
          block_id: null,
        }
      );
    },
  });

  const updateParcelMutation = useMutation({
    mutationFn: (vars: { id: number; payload: any }) =>
      updateParcel(vars.id, vars.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farm", farmId] });
      setEditingParcelId(null);
    },
  });

  const deleteParcelMutation = useMutation({
    mutationFn: (id: number) => deleteParcel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farm", farmId] });
    },
  });

  if (!farmId) {
    return <div>Identifiant d'exploitation manquant.</div>;
  }

  if (isLoading) return <div>Chargement…</div>;
  if (isError || !data) {
    return <div>Erreur lors du chargement de l'exploitation.</div>;
  }

  const farm = data;

  // initialiser newParcel une seule fois quand la data est là
  if (!newParcel) {
    setNewParcel({
      farm_id: farm.id,
      name: "",
      surface_ha: undefined,
      description: "",
      culture_type: "",
      variety: "",
      crop_stage: "",
      block_id: null,
    });
  }

  const parcelsByBlock = groupParcelsByBlock(farm.parcels);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* HEADER */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">{farm.name}</h1>
        <div className="text-sm text-slate-500">
          {farm.location ?? "Localisation inconnue"}
        </div>
        <div className="text-xs text-slate-500">
          Surface : {farm.surface_ha ? `${farm.surface_ha} ha` : "—"} · Parcelles :{" "}
          {farm.parcels?.length ?? 0}
        </div>
      </header>

      {/* FORMULAIRE NOUVELLE PARCELLE */}
      {newParcel && (
        <section className="border border-slate-200 bg-white rounded-lg p-4 space-y-3 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Nouvelle parcelle</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Nom *</label>
              <input
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
                value={newParcel.name}
                onChange={(e) =>
                  setNewParcel({ ...newParcel, name: e.target.value })
                }
                placeholder="Parcelle A"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Culture *</label>
              <input
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
                value={newParcel.culture_type}
                onChange={(e) =>
                  setNewParcel({ ...newParcel, culture_type: e.target.value })
                }
                placeholder="Tomate"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Surface (ha)</label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
                value={newParcel.surface_ha ?? ""}
                onChange={(e) =>
                  setNewParcel({
                    ...newParcel,
                    surface_ha: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                placeholder="1.2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Bloc</label>
              <select
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
                value={newParcel.block_id ?? ""}
                onChange={(e) =>
                  setNewParcel({
                    ...newParcel,
                    block_id: e.target.value ? Number(e.target.value) : null,
                  })
                }
              >
                <option value="">Sans bloc</option>
                {farm.blocks?.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.name} {block.type ? `(${block.type})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Variété</label>
              <input
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
                value={newParcel.variety ?? ""}
                onChange={(e) =>
                  setNewParcel({ ...newParcel, variety: e.target.value })
                }
                placeholder="Variété X"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Stade *</label>
              <input
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
                value={newParcel.crop_stage}
                onChange={(e) =>
                  setNewParcel({ ...newParcel, crop_stage: e.target.value })
                }
                placeholder="VEGETATIVE, FLOWERING..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Description</label>
              <input
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
                value={newParcel.description ?? ""}
                onChange={(e) =>
                  setNewParcel({ ...newParcel, description: e.target.value })
                }
                placeholder="Notes…"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (
                  !newParcel.name.trim() ||
                  !newParcel.culture_type.trim() ||
                  !newParcel.crop_stage.trim()
                ) {
                  return;
                }
                createParcelMutation.mutate({
                  ...newParcel,
                  name: newParcel.name.trim(),
                  culture_type: newParcel.culture_type.trim(),
                  crop_stage: newParcel.crop_stage.trim(),
                });
              }}
              disabled={createParcelMutation.isPending}
            >
              {createParcelMutation.isPending ? "Enregistrement…" : "Créer la parcelle"}
            </Button>
          </div>
        </section>
      )}

      {/* PARCELLES GROUPÉES PAR BLOC */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Parcelles par bloc</h2>
        {parcelsByBlock.length === 0 ? (
          <div className="text-sm text-slate-500">Aucune parcelle définie.</div>
        ) : (
          parcelsByBlock.map(({ blockName, parcels }) => (
            <div key={blockName} className="space-y-2">
              <div className="text-sm font-semibold text-slate-700">
                {blockName}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {parcels.map((parcel) =>
                  editingParcelId === parcel.id ? (
                    <EditableParcelCard
                      key={parcel.id}
                      parcel={parcel}
                      blocks={farm.blocks}
                      editParcelForm={editParcelForm}
                      setEditParcelForm={setEditParcelForm}
                      setEditingParcelId={setEditingParcelId}
                      updateParcelMutation={updateParcelMutation}
                    />
                  ) : (
                    <ParcelCard
                      key={parcel.id}
                      parcel={parcel}
                      blocks={farm.blocks}
                      setEditingParcelId={setEditingParcelId}
                      setEditParcelForm={setEditParcelForm}
                      deleteParcelMutation={deleteParcelMutation}
                    />
                  )
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

type ParcelForCard = FarmDetail["parcels"][number];

type GroupedParcels = {
  blockName: string;
  parcels: ParcelForCard[];
};

function groupParcelsByBlock(parcels: ParcelForCard[]): GroupedParcels[] {
  const map = new Map<string, ParcelForCard[]>();

  parcels.forEach((p) => {
    const blockName = p.block
      ? `${p.block.name}${p.block.type ? ` (${p.block.type})` : ""}`
      : "Sans bloc";
    if (!map.has(blockName)) {
      map.set(blockName, []);
    }
    map.get(blockName)!.push(p);
  });

  return Array.from(map.entries()).map(([blockName, parcels]) => ({
    blockName,
    parcels,
  }));
}

type ParcelCardProps = {
  parcel: ParcelForCard;
  setEditingParcelId: (id: number) => void;
  setEditParcelForm: (f: {
    name: string;
    surface_ha: string;
    culture_type: string;
    variety: string;
    crop_stage: string;
    block_id: string;
  }) => void;
  blocks: FarmDetail["blocks"];
  deleteParcelMutation: any;
};

function ParcelCard({
  parcel,
  blocks,
  setEditingParcelId,
  setEditParcelForm,
  deleteParcelMutation,
}: ParcelCardProps) {
  const zones = parcel.zones ?? [];
  const blockName =
    parcel.block?.name ?? blocks?.find((b) => b.id === parcel.block_id)?.name;

  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-900">{parcel.name}</div>
          <div className="text-xs text-slate-600 mt-1 inline-flex items-center gap-1 flex-wrap">
            <CropIcon className="h-3.5 w-3.5 text-emerald-500" />
            {parcel.culture_type}
            {parcel.variety ? ` · ${parcel.variety}` : ""}
          </div>
          {blockName && (
            <div className="text-xs text-slate-500 mt-1">Bloc : {blockName}</div>
          )}
          <div className="text-xs text-slate-500 mt-1">
            Stade : {parcel.crop_stage}
          </div>
        </div>
        <div className="text-xs text-slate-600 text-right">
          Surface: {parcel.surface_ha ? `${parcel.surface_ha} ha` : "—"}
        </div>
      </div>

      {/* Zones */}
      <div>
        <div className="text-xs text-slate-600 mb-1">
          Zones d'irrigation :
        </div>
        {zones.length === 0 ? (
          <div className="text-xs text-slate-500">Aucune zone.</div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {zones.map((z) => (
              <Link
                key={z.id}
                to={`/zones/${z.id}`}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  z.is_active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                {z.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 text-xs mt-1">
        <Button
          size="xs"
          onClick={() => {
            setEditingParcelId(parcel.id);
            setEditParcelForm({
              name: parcel.name,
              surface_ha: parcel.surface_ha?.toString() ?? "",
              culture_type: parcel.culture_type,
              variety: parcel.variety ?? "",
              crop_stage: parcel.crop_stage,
              block_id: parcel.block_id?.toString() ?? "",
            });
          }}
        >
          Modifier
        </Button>
        <Button
          variant="danger"
          size="xs"
          onClick={() => {
            if (confirm("Supprimer cette parcelle ?")) {
              deleteParcelMutation.mutate(parcel.id);
            }
          }}
        >
          Supprimer
        </Button>
      </div>
    </div>
  );
}

function EditableParcelCard({
  parcel,
  editParcelForm,
  setEditParcelForm,
  setEditingParcelId,
  updateParcelMutation,
  blocks,
}: {
  parcel: ParcelForCard;
  editParcelForm: {
    name: string;
    surface_ha: string;
    culture_type: string;
    variety: string;
    crop_stage: string;
    block_id: string;
  };
  setEditParcelForm: (f: {
    name: string;
    surface_ha: string;
    culture_type: string;
    variety: string;
    crop_stage: string;
    block_id: string;
  }) => void;
  setEditingParcelId: (id: number | null) => void;
  updateParcelMutation: any;
  blocks: FarmDetail["blocks"];
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm flex flex-col gap-2 text-xs">
      <div className="grid grid-cols-1 gap-2">
        <div className="space-y-1">
          <label className="text-slate-600">Nom</label>
          <input
            className="w-full rounded border border-slate-200 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={editParcelForm.name}
            onChange={(e) =>
              setEditParcelForm({ ...editParcelForm, name: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-slate-600">Culture</label>
          <input
            className="w-full rounded border border-slate-200 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={editParcelForm.culture_type}
            onChange={(e) =>
              setEditParcelForm({
                ...editParcelForm,
                culture_type: e.target.value,
              })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-slate-600">Variété</label>
          <input
            className="w-full rounded border border-slate-200 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={editParcelForm.variety}
            onChange={(e) =>
              setEditParcelForm({ ...editParcelForm, variety: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-slate-600">Stade</label>
          <input
            className="w-full rounded border border-slate-200 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={editParcelForm.crop_stage}
            onChange={(e) =>
              setEditParcelForm({
                ...editParcelForm,
                crop_stage: e.target.value,
              })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-slate-600">Surface (ha)</label>
          <input
            type="number"
            step="0.01"
            className="w-full rounded border border-slate-200 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={editParcelForm.surface_ha}
            onChange={(e) =>
              setEditParcelForm({
                ...editParcelForm,
                surface_ha: e.target.value,
              })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-slate-600">Bloc</label>
          <select
            className="w-full rounded border border-slate-200 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={editParcelForm.block_id}
            onChange={(e) =>
              setEditParcelForm({
                ...editParcelForm,
                block_id: e.target.value,
              })
            }
          >
            <option value="">Sans bloc</option>
            {blocks?.map((block) => (
              <option key={block.id} value={block.id}>
                {block.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <Button size="xs" onClick={() => setEditingParcelId(null)}>
          Annuler
        </Button>
        <Button
          variant="primary"
          size="xs"
          onClick={() =>
            updateParcelMutation.mutate({
              id: parcel.id,
              payload: {
                name: editParcelForm.name,
                culture_type: editParcelForm.culture_type,
                variety: editParcelForm.variety || null,
                crop_stage: editParcelForm.crop_stage,
                surface_ha: editParcelForm.surface_ha
                  ? Number(editParcelForm.surface_ha)
                  : null,
                block_id: editParcelForm.block_id
                  ? Number(editParcelForm.block_id)
                  : null,
              },
            })
          }
        >
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
