// src/router.ts
import React from "react";
import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "./layout/AppLayout";

import { DashboardPage } from "./pages/DashboardPage";
import { FarmsPage } from "./pages/FarmsPage";
import { FarmPage } from "./pages/FarmPage";

import { ParcelsPage } from "./pages/ParcelsPage";
import { ParcelPage } from "./pages/ParcelPage";

import { ZonesAdminPage } from "./pages/ZonesAdminPage";
import { ZonePage } from "./pages/ZonePage";
import { ZoneEditPage } from "./pages/ZoneEditPage";

import { SensorsAdminPage } from "./pages/SensorsAdminPage";

import { ControllersPage } from "./pages/ControllersPage";
import { AlertsPage } from "./pages/AlertsPage";
import { StrategiesPage } from "./pages/StrategiesPage";

import { WeatherStationsPage } from "./pages/WeatherStationsPage";
import { WeatherStationPage } from "./pages/WeatherStationPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: React.createElement(AppLayout),
    children: [
      // Dashboard
      { index: true, element: React.createElement(DashboardPage) },

      // Farms
      { path: "farms", element: React.createElement(FarmsPage) },
      { path: "farms/:farmId", element: React.createElement(FarmPage) },

      // Parcels (NOUVEAU CRUD)
      { path: "parcels", element: React.createElement(ParcelsPage) },
      { path: "parcels/:parcelId", element: React.createElement(ParcelPage) },

      // Zones
      { path: "zones/:zoneId", element: React.createElement(ZonePage) },
      { path: "zones/:zoneId/edit", element: React.createElement(ZoneEditPage) },
      { path: "zones-admin", element: React.createElement(ZonesAdminPage) },

      // Sensors
      { path: "sensors-admin", element: React.createElement(SensorsAdminPage) },

      // Controllers
      { path: "controllers", element: React.createElement(ControllersPage) },

      // Alerts
      { path: "alerts", element: React.createElement(AlertsPage) },

      // Strategies
      { path: "strategies", element: React.createElement(StrategiesPage) },

      // Weather Stations
      { path: "weather-stations", element: React.createElement(WeatherStationsPage) },
      {
        path: "weather-stations/:stationId",
        element: React.createElement(WeatherStationPage),
      },
    ],
  },
]);
