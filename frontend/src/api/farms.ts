// src/api/farms.ts
import { api } from "./client";
import { type BlockType } from "./blocks";

export interface FarmSummary {
  id: number;
  name: string;
  location: string | null;
  surface_ha: number | null;
  description: string | null;
  parcels_count?: number;
  blocks?: FarmBlockLight[];
}

export interface FarmBlockLight {
  id: number;
  farm_id: number;
  name: string;
  type?: BlockType;
}

export interface FarmParcelLight {
  id: number;
  name: string;
  surface_ha: number | null;
  culture_type: string;
  variety: string | null;
  crop_stage: string;
  block_id: number;
  block?: FarmBlockLight | null;
  zones?: { id: number; name: string; is_active: boolean }[];
}

export interface FarmDetail extends FarmSummary {
  parcels?: FarmParcelLight[];
}

// Type utilisé pour créer / mettre à jour une exploitation
export interface FarmPayload {
  name: string;
  location?: string | null;
  surface_ha?: number | null;
  description?: string | null;
}

// LISTE des exploitations
export async function fetchFarms(): Promise<FarmSummary[]> {
  const { data } = await api.get<FarmSummary[]>("/farms");
  return data;
}

// DÉTAIL d'une exploitation (utilisé par FarmPage)
export async function fetchFarm(id: number | string): Promise<FarmDetail> {
  const { data } = await api.get<FarmDetail>(`/farms/${id}`);
  return data;
}

// CRÉER une exploitation
export async function createFarm(payload: FarmPayload): Promise<FarmDetail> {
  const { data } = await api.post<FarmDetail>("/farms", payload);
  return data;
}

// METTRE À JOUR une exploitation
export async function updateFarm(
  id: number,
  payload: FarmPayload
): Promise<FarmDetail> {
  const { data } = await api.put<FarmDetail>(`/farms/${id}`, payload);
  return data;
}

// SUPPRIMER une exploitation
export async function deleteFarm(id: number): Promise<void> {
  await api.delete(`/farms/${id}`);
}
