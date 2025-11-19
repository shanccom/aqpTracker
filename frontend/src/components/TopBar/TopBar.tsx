import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Receipt, User, LogOut, MapPin } from "lucide-react";
import { useAuth } from "../../components/auth";
import Notifications from "../Notifications/Notifications";
import logo from '../../assets/logo_recortado.png';
import Foro from "../../pages/Foro/Foro";
const Topbar = () => {
  const ubicacion = useLocation();
  const { user, openLogin, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    { path: "/", label: "Home"},
    { path: "/Rutas", label: "Rutas" },
    { path: "/Foro", label: "Foro" },
  ];

  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          
          {/* Lado izquierdo - Logo e Imagen */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center ml-4 pl-4 border-l border-gray-200">
                <img 
                  src={logo}
                  alt="" 
                  className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <h1 className="text-3xl font-bold text-gray-800 tracking-tight">aqp</h1>
                <h2 className="text-sm font-bold text-gray-700 tracking-wider uppercase">TRACKER</h2>
              </div>
            </div>

            
          </div>

          {/* Lado derecho - Navegación y sesión */}
          <div className="flex items-center gap-6">
            
            {/* Navegación - Links Home y Rutas */}
            <nav className="flex items-center gap-1">
              {links.map((link) => {
                const isActive = ubicacion.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive 
                        ? 'text-red-600 bg-red-50' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Separador */}
            <div className="h-8 w-px bg-gray-200"></div>

            {/* Sesión del usuario - 3 elementos */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  {/* 1. Notificaciones */}
                  <Notifications />
                  
                  {/* 2. Perfil */}
                  <button
                    onClick={() => navigate('/Perfil')}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors duration-200"
                    aria-label="Ir a perfil"
                  >
                    {user.foto ? (
                      <img 
                        src={user.foto} 
                        alt="Avatar" 
                        className="w-9 h-9 rounded-full object-cover border border-gray-200" 
                      />
                    ) : (
                      <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center border border-orange-200">
                        <User size={18} className="text-orange-600" />
                      </div>
                    )}
                    <span className="font-medium text-gray-900">
                      {user.first_name || user.email}
                    </span>
                  </button>

                  {/* 3. Salir */}
                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors duration-200 shadow-sm"
                    title="Cerrar sesión"
                  >
                    <LogOut size={18} />
                    <span>Salir</span>
                  </button>
                </>
              ) : (
                /* Botón entrar */
                <button
                  onClick={() => openLogin()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-500 to-orange-400 hover:from-red-600 hover:to-orange-500 transition-all duration-200 shadow-md"
                >
                  <User size={18} />
                  <span>Entrar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;