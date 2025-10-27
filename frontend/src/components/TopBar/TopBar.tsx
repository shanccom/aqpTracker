import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Receipt, User, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../../components/auth";
import Notifications from "../Notifications/Notifications";
import { useState, useEffect, useRef } from 'react';

const Topbar = () => {
  const ubicacion = useLocation();

  const links = [
    { path: "/", label: "Home", icon: LayoutDashboard },
    { path: "/Rutas", label: "Rutas", icon: Receipt },
  ];

  const { user, openLogin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const prevIsMobileRef = useRef<boolean>(window.innerWidth < 768);

  // close mobile panel when crossing breakpoint to desktop
  useEffect(() => {
    function onResize() {
      const isMobileNow = window.innerWidth < 768;
      if (prevIsMobileRef.current && !isMobileNow && mobileOpen) {
        setMobileOpen(false);
      }
      prevIsMobileRef.current = isMobileNow;
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mobileOpen]);

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
          <div className="flex items-center gap-4">
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = ubicacion.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
                      ${isActive ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-900'}`}
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

            {/* Mobile: hamburger + small user icon */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setMobileOpen((s) => !s)}
                className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
              >
                <Menu size={20} />
              </button>
              <button
                onClick={() => (user ? navigate('/Perfil') : openLogin())}
                className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                aria-label="Perfil / Entrar"
              >
                <User size={18} />
              </button>
            </div>

            <div className="hidden md:flex items-center gap-3">
                {user ? (
                  <>
                    <Notifications />
                    <button
                      onClick={() => navigate('/Perfil')}
                      className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded-md"
                      aria-label="Ir a perfil"
                    >
                      {user.foto ? (
                        <img src={user.foto} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <User size={18} />
                      )}
                      <span>{user.first_name}</span>
                    </button>
                    <button
                      onClick={() => logout()}
                      className="flex items-center gap-2 px-3 py-1 rounded-md text-sm text-gray-600 hover:bg-gray-100"
                    >
                      <LogOut size={16} />
                      <span>Salir</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => openLogin()}
                    className="flex items-center gap-2 px-3 py-1 rounded-md text-sm text-gray-600 hover:bg-gray-100"
                  >
                    <User size={16} />
                    <span>Entrar</span>
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>

  
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-200 ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        {/* backdrop */}
        <div
          className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />
        {/* sliding panel */}
        <aside
          className={`absolute right-0 top-0 h-full w-80 max-w-full bg-white shadow-2xl transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold text-sm">AT</span>
              </div>
              <strong>AQP Tracker</strong>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-md hover:bg-gray-100"
              aria-label="Cerrar menu"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="px-3 py-4 space-y-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-base text-gray-800 hover:bg-gray-50"
              >
                <link.icon size={18} />
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          <div className="px-3 py-4 border-t">
            {user ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setMobileOpen(false); navigate('/Perfil'); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50"
                >
                  {user.foto ? (
                    <img src={user.foto} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{user.first_name || user.email}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </button>

                <div className="flex items-center justify-between">
                  <Notifications />
                  <button
                    onClick={() => { setMobileOpen(false); logout(); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut size={16} />
                    <span>Salir</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setMobileOpen(false); openLogin(); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User size={16} />
                  <span>Entrar</span>
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </header>
  );
};

export default Topbar;