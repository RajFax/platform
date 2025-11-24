// src/layout/AppLayout.tsx
import { Link, Outlet, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/farms", label: "Exploitations" },
  { to: "/parcels", label: "Parcelles" },
  { to: "/zones-admin", label: "Zones" },
  { to: "/sensors-admin", label: "Capteurs" },
  { to: "/controllers", label: "Contrôleurs" },
  { to: "/strategies", label: "Stratégies" },
  { to: "/alerts", label: "Alertes" },
  { to: "/weather-stations", label: "Stations météo" },
];

export function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-56 border-r border-slate-200 bg-white px-4 py-6 flex flex-col shadow-sm">
        <div className="text-xl font-bold mb-8 text-emerald-600">
          AGRO CONTROL
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "block px-3 py-2 rounded-md text-sm transition-colors " +
                  (isActive
                    ? "bg-emerald-50 text-emerald-700 font-medium border border-emerald-100"
                    : "text-slate-600 hover:bg-slate-100")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="text-xs text-slate-400 mt-6">
          v0.1 — Plateforme de supervision
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
}
