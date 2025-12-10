// src/api/blocks.ts
import { api } from "./client";

export type BlockType = "openfield" | "greenhouse";

export interface BlockDTO {
  id: number;
  farm_id: number;
  name: string;
  type: BlockType;
  description: string | null;
  parcels_count?: number;
}

export interface BlockPayload {
  farm_id: number;
  name: string;
  type: BlockType;
  description?: string | null;
}

export async function fetchBlocks(params?: {
  farm_id?: number;
}): Promise<BlockDTO[]> {
  const { data } = await api.get<BlockDTO[]>("/blocks", { params });
  return data;
}

export async function fetchBlock(id: number | string): Promise<BlockDTO> {
  const { data } = await api.get<BlockDTO>(`/blocks/${id}`);
  return data;
}

export async function createBlock(payload: BlockPayload): Promise<BlockDTO> {
  const { data } = await api.post<BlockDTO>("/blocks", payload);
  return data;
}

export async function updateBlock(
  id: number,
  payload: Partial<BlockPayload>
): Promise<BlockDTO> {
  const { data } = await api.put<BlockDTO>(`/blocks/${id}`, payload);
  return data;
}

export async function deleteBlock(id: number): Promise<void> {
  await api.delete(`/blocks/${id}`);
}
