// src/api/parcels.ts
import { api } from "./client";
import { type BlockType } from "./blocks";

export interface ParcelDTO {
  id: number;
  farm_id: number;
  block_id: number | null;
  block?: { id: number; name: string; farm_id: number; type?: BlockType } | null;
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
}

export interface ParcelCreatePayload {
  farm_id: number;
  block_id?: number | null;
  name: string;
  surface_ha?: number | null;
  description?: string | null;
  culture_type: string;
  variety?: string | null;
  crop_stage: string;

  planting_date?: string | null;
  target_soil_moisture_min?: number | null;
  target_soil_moisture_max?: number | null;
  target_temp_min?: number | null;
  target_temp_max?: number | null;
}

export interface ParcelUpdatePayload {
  name?: string;
  surface_ha?: number | null;
  description?: string | null;
  culture_type?: string;
  variety?: string | null;
  crop_stage?: string;

  planting_date?: string | null;
  target_soil_moisture_min?: number | null;
  target_soil_moisture_max?: number | null;
  target_temp_min?: number | null;
  target_temp_max?: number | null;

  block_id?: number | null;
}

export async function createParcel(
  payload: ParcelCreatePayload
): Promise<ParcelDTO> {
  const { data } = await api.post("/parcels", payload);
  return data;
}

export async function updateParcel(
  id: number,
  payload: ParcelUpdatePayload
): Promise<ParcelDTO> {
  const { data } = await api.put(`/parcels/${id}`, payload);
  return data;
}

export async function deleteParcel(id: number): Promise<void> {
  await api.delete(`/parcels/${id}`);
}

// Résumé pour la liste
export interface ParcelSummary {
  id: number;
  farm_id: number;
  block_id: number | null;
  block?: { id: number; name: string; farm_id: number } | null;
  name: string;
  surface_ha: number | null;
  culture_type: string;
}

// Liste simple des parcelles (optionnellement filtrées)
export async function fetchParcels(params?: {
  farm_id?: number;
}): Promise<ParcelSummary[]> {
  const { data } = await api.get("/parcels", { params });
  return data;
}
