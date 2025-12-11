// src/pages/ParcelPage.tsx
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { Card } from "../components/ui/Card";

interface ParcelZone {
  id: number;
  name: string;
  surface_ha?: number | null;
  is_active?: boolean;
}

interface ParcelDetail {
  id: number;
  farm_id: number;
  block_id: number;
  name: string;
  surface_ha: number | null;
  description: string | null;
  culture_type: string;
  variety: string | null;
  crop_stage: string;
  planting_date: string | null;
  target_soil_moisture_min: number | null;
  target_soil_moisture_max: number | null;
  target_temp_min: number | null;
  target_temp_max: number | null;
  farm?: {
    id: number;
    name: string;
  } | null;
  block?: {
    id: number;
    name: string;
  } | null;
  zones?: ParcelZone[];
}

async function fetchParcel(id: number): Promise<ParcelDetail> {
  const { data } = await api.get<ParcelDetail>(`/parcels/${id}`);
  return data;
}

export function ParcelPage() {
  const params = useParams<{ parcelId: string }>();
  const parcelId = params.parcelId ? Number(params.parcelId) : NaN;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["parcel", parcelId],
    queryFn: () => fetchParcel(parcelId),
    enabled: Number.isFinite(parcelId),
  });

  if (!Number.isFinite(parcelId)) {
    return <div>Parcelle invalide.</div>;
  }

  if (isLoading) return <div>Chargement…</div>;
  if (isError || !data)
    return <div>Erreur lors du chargement de la parcelle.</div>;

  const parcel = data;

  const plantingDate = parcel.planting_date
    ? new Date(parcel.planting_date).toLocaleDateString()
    : "—";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* HEADER */}
      <header className="space-y-1">
        <div className="text-xs text-slate-500">
          {parcel.farm && (
            <>
              <Link
                to={`/farms/${parcel.farm.id}`}
                className="underline decoration-slate-300 hover:decoration-slate-500"
              >
                {parcel.farm.name}
              </Link>
              {" · "}
            </>
          )}
          Parcelle #{parcel.id}
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {parcel.name}
        </h1>
        <p className="text-sm text-slate-500">
          {parcel.culture_type}
          {parcel.variety ? ` · ${parcel.variety}` : ""} · Stade :{" "}
          {parcel.crop_stage}
        </p>
      </header>

      {/* INFO PRINCIPALES + CONSIGNES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-sm font-semibold text-slate-800 mb-3">
            Informations générales
          </h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-slate-500">Exploitation</dt>
              <dd className="text-slate-800">
                {parcel.farm ? (
                  <Link
                    to={`/farms/${parcel.farm.id}`}
                    className="underline decoration-slate-300 hover:decoration-slate-500"
                  >
                    {parcel.farm.name}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-slate-500">Bloc</dt>
              <dd className="text-slate-800">
                {parcel.block ? parcel.block.name : "—"}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-slate-500">Surface</dt>
              <dd className="text-slate-800">
                {parcel.surface_ha != null ? `${parcel.surface_ha} ha` : "—"}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-slate-500">Culture</dt>
              <dd className="text-slate-800">{parcel.culture_type}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-slate-500">Variété</dt>
              <dd className="text-slate-800">
                {parcel.variety ?? "—"}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-slate-500">Stade</dt>
              <dd className="text-slate-800">{parcel.crop_stage}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-slate-500">Date de plantation</dt>
              <dd className="text-slate-800">{plantingDate}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-800 mb-3">
            Consignes cibles
          </h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-slate-500">Humidité sol min (%)</dt>
              <dd className="text-slate-800">
                {parcel.target_soil_moisture_min ?? "—"}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-slate-500">Humidité sol max (%)</dt>
              <dd className="text-slate-800">
                {parcel.target_soil_moisture_max ?? "—"}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-slate-500">Température min (°C)</dt>
              <dd className="text-slate-800">
                {parcel.target_temp_min ?? "—"}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-slate-500">Température max (°C)</dt>
              <dd className="text-slate-800">
                {parcel.target_temp_max ?? "—"}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* DESCRIPTION */}
      <Card>
        <h2 className="text-sm font-semibold text-slate-800 mb-3">
          Description
        </h2>
        <div className="text-sm text-slate-700 whitespace-pre-wrap min-h-[3rem]">
          {parcel.description || (
            <span className="text-slate-400">
              Aucune description renseignée.
            </span>
          )}
        </div>
      </Card>

      {/* ZONES DE LA PARCELLE */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Zones de la parcelle
          </h2>
          <Link
            to={`/zones-admin?parcel_id=${parcel.id}`}
            className="text-xs text-emerald-600 hover:text-emerald-500"
          >
            Gérer les zones
          </Link>
        </div>

        {!parcel.zones || parcel.zones.length === 0 ? (
          <div className="text-xs text-slate-500">
            Aucune zone définie pour cette parcelle.
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="text-left px-3 py-2 w-1/3">Nom</th>
                <th className="text-left px-3 py-2 w-1/4">Surface (ha)</th>
                <th className="text-left px-3 py-2 w-1/4">Statut</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {parcel.zones!.map((z) => (
                <tr
                  key={z.id}
                  className="border-t border-slate-200 hover:bg-slate-50"
                >
                  <td className="px-3 py-2 text-slate-800">
                    <Link
                      to={`/zones/${z.id}`}
                      className="underline decoration-emerald-300 hover:decoration-emerald-500"
                    >
                      {z.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {z.surface_ha != null ? `${z.surface_ha} ha` : "—"}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {z.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px]">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200 text-[10px]">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      to={`/zones/${z.id}/edit`}
                      className="text-emerald-600 hover:text-emerald-500 text-[11px]"
                    >
                      Modifier
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
