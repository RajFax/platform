import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchZone, updateZone, type ZoneDetail } from "../api/zones";
import { fetchParcels, type ParcelSummary } from "../api/parcels";
import { Card } from "../components/ui/card";
import { useState, useEffect } from "react";

export function ZoneEditPage() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: zone,
    isLoading,
    isError,
  } = useQuery<ZoneDetail>({
    queryKey: ["zone", zoneId],
    queryFn: () => fetchZone(zoneId!),
    enabled: !!zoneId,
  });

  const { data: parcels } = useQuery<ParcelSummary[]>({
    queryKey: ["parcels-all"],
    queryFn: () => fetchParcels(),
  });

  const [form, setForm] = useState({
    parcel_id: 0,
    name: "",
    description: "",
    surface_ha: "",
    is_active: true,
  });

  useEffect(() => {
    if (zone) {
      setForm({
        parcel_id: zone.parcel_id,
        name: zone.name,
        description: zone.description ?? "",
        surface_ha: zone.surface_ha != null ? String(zone.surface_ha) : "",
        is_active: zone.is_active,
      });
    }
  }, [zone]);

  const mutation = useMutation({
    mutationFn: () =>
      updateZone(Number(zoneId), {
        parcel_id: form.parcel_id,
        name: form.name,
        description: form.description || null,
        surface_ha: form.surface_ha ? Number(form.surface_ha) : null,
        is_active: form.is_active,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zone", zoneId] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      navigate("/zones-admin");
    },
  });

  if (!zoneId) return <div>Zone inconnue.</div>;
  if (isLoading) return <div>Chargement…</div>;
  if (isError || !zone) return <div>Erreur de chargement de la zone.</div>;

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Modifier la zone</h1>

      <Card>
        <div className="space-y-3 text-sm">
          <div className="space-y-1">
            <div className="text-xs text-slate-600">Parcelle</div>
            <select
              className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm"
              value={form.parcel_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, parcel_id: Number(e.target.value) }))
              }
            >
              <option value="">Sélectionner…</option>
              {(parcels ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.id} · {p.name} ({p.culture_type})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-600">Nom</div>
            <input
              className="w-full rounded border border-slate-200 bg-white px-2 py-1"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-600">Surface (ha)</div>
            <input
              type="number"
              step="0.01"
              className="w-full rounded border border-slate-200 bg-white px-2 py-1"
              value={form.surface_ha}
              onChange={(e) =>
                setForm((f) => ({ ...f, surface_ha: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-600">Description</div>
            <textarea
              className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-600">Active</div>
            <button
              className={
                "px-2 py-1 rounded border text-xs " +
                (form.is_active
                  ? "border-emerald-500/60 text-emerald-300"
                  : "border-slate-600 text-slate-600")
              }
              onClick={() =>
                setForm((f) => ({ ...f, is_active: !f.is_active }))
              }
            >
              {form.is_active ? "Active" : "Inactive"}
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              className="px-3 py-1.5 rounded border border-slate-200 text-xs hover:bg-slate-800"
              onClick={() => navigate(-1)}
            >
              Annuler
            </button>
            <button
              className="px-3 py-1.5 rounded bg-emerald-600 text-xs font-medium hover:bg-emerald-500 disabled:opacity-50"
              disabled={mutation.isPending || !form.name.trim()}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
