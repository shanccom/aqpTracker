import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Receipt } from "lucide-react";

const Topbar = () => {
  const ubicacion = useLocation();

  const links = [
    { path: "/", label: "Home", icon: LayoutDashboard },
    { path: "/Rutas", label: "Rutas", icon: Receipt },
  ];

  return (
    <header className="w-full bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo minimalista */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center">
              <span className="text-white font-semibold text-sm">AT</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">AQP Tracker</h1>
          </div>

          {/* Navegación minimalista */}
          <nav className="flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = ubicacion.pathname === link.path;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
                    ${
                      isActive
                        ? "text-emerald-600"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  <Icon size={18} />
                  <span>{link.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Topbar;