import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Card } from "../components/ui/Card";
import { Section } from "../components/ui/Section";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface WeatherMeasurement {
  id: number;
  measured_at: string;
  air_temperature: number | null;
  relative_humidity: number | null;
  solar_radiation: number | null;
  rainfall: number | null;
  et0: number | null;
}

interface WeatherStationDetail {
  id: number;
  name: string;
  location_type: string;
  status: string;
  measurements: WeatherMeasurement[];
}

async function fetchWeatherStation(id: string): Promise<WeatherStationDetail> {
  const { data } = await api.get(`/weather-stations/${id}`);
  return data;
}

export function WeatherStationPage() {
  const { stationId } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["weather-station", stationId],
    queryFn: () => fetchWeatherStation(stationId!),
    enabled: !!stationId,
  });

  if (!stationId) {
    return <div>Station inconnue.</div>;
  }

  if (isLoading) return <div>Chargement…</div>;
  if (isError || !data) return <div>Erreur lors du chargement.</div>;

  const station = data;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* HEADER */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{station.name}</h1>

        <div className="text-sm text-slate-400">
          Type : {station.location_type}
        </div>

        <div className="text-xs text-slate-500">
          Statut :{" "}
          <span
            className={
              station.status === "ONLINE"
                ? "text-emerald-400"
                : "text-red-400"
            }
          >
            {station.status}
          </span>
        </div>
      </header>

      {/* METEO – GRAPHIQUES */}
      <Section title="Mesures récentes">
        <Card>
          {station.measurements.length === 0 ? (
            <div className="text-sm text-slate-500">Aucune mesure.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={station.measurements}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="measured_at"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    }
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      borderColor: "#334155",
                      fontSize: "12px",
                    }}
                    labelFormatter={(v) =>
                      new Date(v).toLocaleString()
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="air_temperature"
                    name="Température (°C)"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="et0"
                    name="ET0"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </Section>

      {/* TABLEAU DES MESURES */}
      <Section title="Détails des mesures">
        <Card>
          {station.measurements.length === 0 ? (
            <div className="text-sm text-slate-500">Aucune mesure.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-2">Heure</th>
                  <th>Temp (°C)</th>
                  <th>HR (%)</th>
                  <th>ET0</th>
                  <th>Rayonnement</th>
                  <th>Pluie (mm)</th>
                </tr>
              </thead>
              <tbody>
                {station.measurements.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-slate-800 hover:bg-slate-900/40"
                  >
                    <td className="py-1">
                      {new Date(m.measured_at).toLocaleString()}
                    </td>
                    <td>{m.air_temperature ?? "-"}</td>
                    <td>{m.relative_humidity ?? "-"}</td>
                    <td>{m.et0 ?? "-"}</td>
                    <td>{m.solar_radiation ?? "-"}</td>
                    <td>{m.rainfall ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </Section>
    </div>
  );
}
