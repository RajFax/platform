import { api } from "./client";

export interface WeatherStationItem {
  id: number;
  name: string;
  location_type: string | null;
  status: string;
  farm: {
    id: number;
    name: string;
  } | null;
}

export interface WeatherMeasurement {
  id: number;
  measured_at: string;
  air_temperature: number | null;
  relative_humidity: number | null;
  wind_speed: number | null;
  solar_radiation: number | null;
  rainfall: number | null;
  et0: number | null;
}

export interface WeatherStationDetailResponse {
  station: {
    id: number;
    name: string;
    location_type: string | null;
    status: string;
    farm: { id: number; name: string } | null;
  };
  measurements: WeatherMeasurement[];
}

export async function fetchWeatherStations(): Promise<WeatherStationItem[]> {
  const { data } = await api.get("/weather-stations");
  return data;
}

export async function fetchWeatherStation(
  id: string | number
): Promise<WeatherStationDetailResponse> {
  const { data } = await api.get(`/weather-stations/${id}`);
  return data;
}
