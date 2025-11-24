import { useEffect, useState } from "react";
import { Building2, MapPin, Bus, Star } from "lucide-react";

// --- ÁREA DE RECURSOS VISUALES ---
// NOTA: La ruta se corrigió a "../../../assets/..."
import imagenBus1 from "../../../assets/ImagenesRutaBuses/Cotum/logo.png"; 
import imagenBus2 from "../../../assets/ImagenesRutaBuses/TransCayma/logo.png"; 
import imagenBus3 from "../../../assets/ImagenesRutaBuses/BusCharacato/logo.png"; 
import imagenBus4 from "../../../assets/ImagenesRutaBuses/UnionAqp/logo.png";

const BUS_IMAGES = [
    imagenBus1, 
    imagenBus2, 
    imagenBus3, 
    imagenBus4,
];
const getRandomImage = (id: number) => BUS_IMAGES[id % BUS_IMAGES.length];
// -----------------------------------------------------

interface Empresa {
    id: number;
    nombre: string;
    descripcion: string;
}

// ⚠️ MODIFICACIÓN CLAVE: El handler ahora acepta el nombre (string)
interface EmpresasListProps {
    onEmpresaClick: (empresaId: number, empresaNombre: string) => void;
}

const EmpresasList = ({ onEmpresaClick }: EmpresasListProps) => {
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:8000/api/rutas/empresas/`);
                if (!response.ok) throw new Error('Error al cargar empresas');
                const data = await response.json();
                setEmpresas(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setLoading(false);
            }
        };
        fetchEmpresas();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-96">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                        <Bus className="text-orange-600 animate-pulse" size={24} />
                    </div>
                </div>
                <p className="mt-4 text-gray-500 font-medium animate-pulse">Buscando empresas de transporte...</p>
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-red-500 p-10">{error}</div>; // Simplificado para brevedad
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header Visual*/}
            <div className="mb-10 text-center relative">
                <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 mb-4">
                    Empresas de Transporte
                </h2>
                <div className="h-1 w-24 bg-orange-500 mx-auto rounded-full mb-4"></div>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                    Selecciona tu operador de confianza para ver rutas, horarios y paraderos en tiempo real.
                </p>
            </div>

            {/* Grid de Cards Premium */}
            {empresas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {empresas.map((empresa) => (
                        <button
                            key={empresa.id}
                            // ⚠️ CAMBIO: Pasamos el ID y el NOMBRE
                            onClick={() => onEmpresaClick(empresa.id, empresa.nombre)}
                            className="group relative flex flex-col h-full bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden text-left border border-gray-100 hover:-translate-y-2"
                        >
                            {/* 1. Imagen Hero con Overlay */}
                            <div className="relative h-56 w-full overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 opacity-90 transition-opacity duration-300" />
                                <img 
                                    src={getRandomImage(empresa.id)} 
                                    alt={empresa.nombre}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                />
                                
                                {/* Badge flotante (Fondo Gris Oscuro Corregido) */}
                                <div className="absolute top-4 right-4 z-20 bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                    Oficial
                                </div>
                            </div>

                            {/* 2. Contenido de la Tarjeta */}
                            <div className="relative p-6 flex-1 flex flex-col z-20 -mt-10">
                                {/* Icono de la empresa flotando */}
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4 transform group-hover:rotate-6 transition-transform duration-300">
                                    <Bus size={32} className="text-orange-600" strokeWidth={1.5} />
                                </div>

                                <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">
                                    {empresa.nombre}
                                </h3>
                                
                                <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
                                    {empresa.descripcion}
                                </p>

                                {/* Footer de la card */}
                                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                                    <span className="text-gray-400 font-medium flex items-center gap-1">
                                        <MapPin size={14} /> Arequipa
                                    </span>
                                    <span className="text-orange-600 font-bold group-hover:underline">
                                        Ver rutas →
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <Building2 size={64} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-xl">No hay empresas disponibles</p>
                </div>
            )}
        </div>
    );
};

export default EmpresasList;