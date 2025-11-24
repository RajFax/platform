import { api } from "./client";

export interface AlertItem {
  id: number;
  type: string;
  severity: "INFO" | "WARNING" | "CRITICAL" | string;
  message: string;
  status: "OPEN" | "ACK" | "CLOSED" | string;
  raised_at: string;
  cleared_at: string | null;
  zone: { id: number; name: string } | null;
  parcel: { id: number; name: string } | null;
  farm: { id: number; name: string } | null;
  sensor: { id: number; name: string } | null;
  controller: { id: number; name: string } | null;
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  const { data } = await api.get<AlertItem[]>("/alerts");
  return data;
}

export interface AlertUpdatePayload {
  status?: "OPEN" | "ACK" | "CLOSED" | string;
  message?: string;
  cleared_at?: string | null;
}

export async function updateAlert(
  id: number,
  payload: AlertUpdatePayload
): Promise<AlertItem> {
  const { data } = await api.put<AlertItem>(`/alerts/${id}`, payload);
  return data;
}

export async function deleteAlert(id: number): Promise<void> {
  await api.delete(`/alerts/${id}`);
}
