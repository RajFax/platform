// src/api/zones.ts
import { api } from "./client";

export interface ZoneSummary {
  id: number;
  name: string;
  description?: string | null;
  parcel_id?: number | null;
  parcel?: { id: number; name: string } | null;
  farm?: { id: number; name: string } | null;
  surface_ha?: number | null;
  is_active?: boolean;
}

export interface ZoneDetail extends ZoneSummary {
  // tu pourras ajouter ici: parcel, sensors, controllers...
}

export interface ZonePayload {
  name: string;
  description?: string | null;
  parcel_id?: number | null;
  surface_ha?: number | null;
  is_active?: boolean;
}

// LISTE des zones (avec filtres éventuels)
export async function fetchZones(params?: {
  parcel_id?: number;
  farm_id?: number;
  is_active?: boolean;
}): Promise<ZoneSummary[]> {
  const { data } = await api.get<ZoneSummary[]>("/zones", {
    params,
  });
  return data;
}

// DÉTAIL d'une zone (si tu veux pour ZonePage)
export async function fetchZone(id: number | string): Promise<ZoneDetail> {
  const { data } = await api.get<ZoneDetail>(`/zones/${id}`);
  return data;
}

// CRÉATION
export async function createZone(payload: ZonePayload): Promise<ZoneDetail> {
  const { data } = await api.post<ZoneDetail>("/zones", payload);
  return data;
}

// MISE À JOUR
export async function updateZone(
  id: number,
  payload: ZonePayload
): Promise<ZoneDetail> {
  const { data } = await api.put<ZoneDetail>(`/zones/${id}`, payload);
  return data;
}

// SUPPRESSION
export async function deleteZone(id: number): Promise<void> {
  await api.delete(`/zones/${id}`);
}
