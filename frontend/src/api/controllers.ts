// src/api/controllers.ts
import { api } from "./client";

export type ControllerType = "irrigation" | "fertigation" | "climate" | "pump";
export type ControllerMode = "AUTO" | "MANUAL";
export type ControllerStatus = "ONLINE" | "OFFLINE" | "ERROR";

export interface ControllerItem {
  id: number;
  name: string;
  type: ControllerType;
  level: string | null;
  mode: ControllerMode;
  status: ControllerStatus;
  last_communication_at: string | null;
  zone: {
    id: number;
    name: string;
    is_active: boolean;
  } | null;
  parcel: {
    id: number;
    name: string;
  } | null;
  farm: {
    id: number;
    name: string;
  } | null;
}

export interface ControllerPayload {
  zone_id: number;
  name: string;
  type: ControllerType;
  level?: string | null;
  mode: ControllerMode;
  status?: ControllerStatus;
  last_communication_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

// LISTE
export async function fetchControllers(): Promise<ControllerItem[]> {
  const { data } = await api.get<ControllerItem[]>("/controllers");
  return data;
}

// CRÉATION
export async function createController(
  payload: ControllerPayload
): Promise<ControllerItem> {
  const { data } = await api.post<ControllerItem>("/controllers", payload);
  return data;
}

// MISE À JOUR
export async function updateController(
  id: number,
  payload: Partial<ControllerPayload>
): Promise<ControllerItem> {
  const { data } = await api.put<ControllerItem>(`/controllers/${id}`, payload);
  return data;
}

// SUPPRESSION
export async function deleteController(id: number): Promise<void> {
  await api.delete(`/controllers/${id}`);
}
