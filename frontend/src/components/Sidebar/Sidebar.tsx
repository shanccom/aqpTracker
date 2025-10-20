import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, Receipt} from 'lucide-react';

const Sidebar = () => {
    const ubicacion = useLocation();

    const links = [
        { path: "/", label: "Home", icon: LayoutDashboard },
        { path: "/Rutas", label: "Rutas", icon: Receipt },
    ];

    return (
        <aside className="w-64 bg-white flex flex-col h-screen shadow-2xl border-r border-gray-200">


            <nav className="flex-1 py-6 px-3 overflow-y-auto">
                <ul className="space-y-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = ubicacion.pathname === link.path;
                        
                        return (
                            <li key={link.path}>
                                <Link
                                    to={link.path}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                                        isActive
                                            ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-200'
                                            : 'text-gray-600 hover:bg-gray-50 hover:translate-x-1'
                                    }`}
                                >
                                    <Icon 
                                        size={20} 
                                        className={`${
                                            isActive ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600'
                                        }`}
                                    />
                                    <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>
                                        {link.label}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            
        </aside>
    );

};

export default Sidebar;
