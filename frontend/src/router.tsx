import { createBrowserRouter } from "react-router-dom";

import { DashboardPage } from "./pages/DashboardPage";
import { FarmsPage } from "./pages/FarmsPage";
import { FarmPage } from "./pages/FarmPage";
import { BlocksPage } from "./pages/BlocksPage";
import { ZonePage } from "./pages/ZonePage";
import { ZonesAdminPage } from "./pages/ZonesAdminPage";
import { SensorsAdminPage } from "./pages/SensorsAdminPage";

import { ControllersPage } from "./pages/ControllersPage";
import { AlertsPage } from "./pages/AlertsPage";
import { StrategiesPage } from "./pages/StrategiesPage";
import { WeatherStationsPage } from "./pages/WeatherStationsPage";
import { WeatherStationPage } from "./pages/WeatherStationPage";

export const router = createBrowserRouter([
  { path: "/", element: <DashboardPage /> },

  // Farms
  { path: "/farms", element: <FarmsPage /> },
  { path: "/farms/:farmId", element: <FarmPage /> },

  // Blocks
  { path: "/blocks", element: <BlocksPage /> },

  // Zones
  { path: "/zones/:zoneId", element: <ZonePage /> },
  { path: "/zones-admin", element: <ZonesAdminPage /> },

  // Sensors
  { path: "/sensors-admin", element: <SensorsAdminPage /> },

  // Controllers
  { path: "/controllers", element: <ControllersPage /> },

  // Alerts
  { path: "/alerts", element: <AlertsPage /> },

  // Strategies overview
  { path: "/strategies", element: <StrategiesPage /> },

  // Weather
  { path: "/weather-stations", element: <WeatherStationsPage /> },
  { path: "/weather-stations/:stationId", element: <WeatherStationPage /> },
]);
