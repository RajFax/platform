import { api } from "./client";

export interface MeasurementDTO {
  id: number;
  sensor_id: number;
  measured_at: string;
  value: number;
  raw_value: any;
  quality_flag: string | null;
}

export interface MeasurementCreatePayload {
  sensor_id: number;
  measured_at?: string;
  value: number;
  raw_value?: any;
  quality_flag?: string;
}

export async function fetchMeasurements(params: {
  sensor_id: number;
  limit?: number;
}): Promise<MeasurementDTO[]> {
  const { data } = await api.get("/measurements", { params });
  return data;
}

export async function createMeasurement(
  payload: MeasurementCreatePayload
): Promise<MeasurementDTO> {
  const { data } = await api.post("/measurements", payload);
  return data;
}
