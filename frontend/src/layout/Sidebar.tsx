import { NavLink } from "react-router-dom";

export function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Logo, en-tête, etc. */}

      <nav className="mt-4 space-y-1 text-sm">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/farms"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
          }
        >
          Exploitations
        </NavLink>

        <NavLink
          to="/blocks"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
          }
        >
          Blocs
        </NavLink>

        <NavLink
          to="/zones-admin"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
          }
        >
          Zones
        </NavLink>

        <NavLink
          to="/sensors-admin"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
          }
        >
          Capteurs
        </NavLink>

        <NavLink
          to="/controllers"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
          }
        >
          Contrôleurs
        </NavLink>

        <NavLink
          to="/weather-stations"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
          }
        >
          Stations météo
        </NavLink>

        <NavLink
          to="/alerts"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
          }
        >
          Alertes
        </NavLink>

        <NavLink
          to="/strategies"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
          }
        >
          Stratégies
        </NavLink>
      </nav>
    </aside>
  );
}
