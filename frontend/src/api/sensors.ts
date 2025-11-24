// src/api/sensors.ts
import { api } from "./client";

export interface SensorSummary {
  id: number;
  name: string;
  type?: string | null;
  unit?: string | null;
  hardware_id?: string | null;
  zone_id?: number | null;
  is_active?: boolean;
}

export interface SensorDetail extends SensorSummary {
  // tu pourras ajouter: zone, last_measurement, etc.
}

export interface SensorPayload {
  name: string;
  type?: string | null;
  unit?: string | null;
  hardware_id?: string | null;
  zone_id?: number | null;
  is_active?: boolean;
}

// LISTE
export async function fetchSensors(): Promise<SensorSummary[]> {
  const { data } = await api.get<SensorSummary[]>("/sensors");
  return data;
}

// DÉTAIL (si tu en as besoin plus tard)
export async function fetchSensor(id: number | string): Promise<SensorDetail> {
  const { data } = await api.get<SensorDetail>(`/sensors/${id}`);
  return data;
}

// CRÉATION
export async function createSensor(payload: SensorPayload): Promise<SensorDetail> {
  const { data } = await api.post<SensorDetail>("/sensors", payload);
  return data;
}

// UPDATE
export async function updateSensor(
  id: number,
  payload: SensorPayload
): Promise<SensorDetail> {
  const { data } = await api.put<SensorDetail>(`/sensors/${id}`, payload);
  return data;
}

// DELETE
export async function deleteSensor(id: number): Promise<void> {
  await api.delete(`/sensors/${id}`);
}
