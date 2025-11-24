import { api } from "./client";

export interface StrategyZoneRef {
  id: number;
  name: string;
  parcel: { id: number; name: string } | null;
  farm: { id: number; name: string } | null;
}

export interface StrategyItem {
  type: string;
  zones_count: number;
  example_zones: StrategyZoneRef[];
}

export interface StrategiesOverview {
  irrigation: StrategyItem[];
  fertilization: StrategyItem[];
}

export async function fetchStrategies(): Promise<StrategiesOverview> {
  const { data } = await api.get("/strategies");
  return data;
}
