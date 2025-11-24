// src/api/weatherStations.ts
import { api } from "./client";

export interface WeatherStationSummary {
  id: number;
  name: string;
  location_type: string | null;
  status: string;
  position?: Record<string, unknown> | null;
  farm?: { id: number; name: string } | null;
}

export interface WeatherMeasurement {
  id: number;
  measured_at: string;
  air_temperature: number | null;
  relative_humidity: number | null;
  solar_radiation: number | null;
  rainfall: number | null;
  et0: number | null;
}

export interface WeatherStation {
  id: number;
  name: string;
  location_type: string | null;
  status: string;
  position?: Record<string, unknown> | null;
  farm?: { id: number; name: string } | null;
}

export interface WeatherStationDetailResponse {
  station: WeatherStation;
  measurements: WeatherMeasurement[];
}

export interface WeatherStationPayload {
  farm_id?: number | null;
  name: string;
  location_type?: string | null;
  status?: string | null;
  position?: Record<string, unknown> | null;
}

// LISTE
export async function fetchWeatherStations(): Promise<WeatherStationSummary[]> {
  const { data } = await api.get<WeatherStationSummary[]>("/weather-stations");
  return data;
}

// DÉTAIL
export async function fetchWeatherStation(
  id: string | number
): Promise<WeatherStationDetailResponse> {
  const { data } = await api.get<WeatherStationDetailResponse>(
    `/weather-stations/${id}`
  );
  return data;
}

// CRÉATION
export async function createWeatherStation(
  payload: WeatherStationPayload
): Promise<WeatherStation> {
  const { data } = await api.post<WeatherStation>("/weather-stations", payload);
  return data;
}

// MISE À JOUR
export async function updateWeatherStation(
  id: number,
  payload: WeatherStationPayload
): Promise<WeatherStation> {
  const { data } = await api.put<WeatherStation>(
    `/weather-stations/${id}`,
    payload
  );
  return data;
}

// SUPPRESSION
export async function deleteWeatherStation(id: number): Promise<void> {
  await api.delete(`/weather-stations/${id}`);
}
