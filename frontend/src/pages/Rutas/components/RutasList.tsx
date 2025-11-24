import { useEffect, useState } from 'react';
import { ArrowLeft, Route, Clock, Navigation } from 'lucide-react';

// ⚠️ IMPORTACIONES DE IMÁGENES DE EMPRESA ⚠️
// Nota: Las rutas deben ser correctas (subir tres niveles: ../../../)
import logoBusCharacato from '../../../assets/ImagenesRutaBuses/BusCharacato/logo.png';
import logoCotum from '../../../assets/ImagenesRutaBuses/Cotum/logo.png';
import logoTransCayma from '../../../assets/ImagenesRutaBuses/TransCayma/logo.png';
import logoUnionAqp from '../../../assets/ImagenesRutaBuses/UnionAqp/logo.png';

// --- MAPA DE RECURSOS (RESOURCE MAP) ---
// CLAVES ESTANDARIZADAS: MINÚSCULAS Y SIN ESPACIOS.
const EMPRESA_IMAGES_MAP: { [key: string]: string } = {
    "cotum": logoCotum,
    "transcayma": logoTransCayma,
    "buscharacato": logoBusCharacato,
    "unionaqp": logoUnionAqp,
};

// Función para simplificar y obtener la imagen por nombre de empresa
const getEmpresaRouteImage = (empresaNombre?: string) => {
    const defaultImage = EMPRESA_IMAGES_MAP["cotum"]; 

    if (empresaNombre) {
        // 1. Estandariza el nombre de la empresa para la búsqueda
        const claveEstandarizada = empresaNombre.toLowerCase().replace(/\s/g, ''); 
        
        // 2. Busca la imagen con la clave estandarizada
        if (EMPRESA_IMAGES_MAP[claveEstandarizada]) {
            return EMPRESA_IMAGES_MAP[claveEstandarizada];
        }
    }

    return defaultImage;
};

interface Ruta {
    id: number;
    nombre: string;
    codigo?: string;
}

interface RutasListProps {
    empresaId: number;
    empresaNombre?: string;
    onBack: () => void;
    onRutaClick: (rutaId: number) => void;
}

const RutasList = ({ empresaId, empresaNombre, onBack, onRutaClick }: RutasListProps) => {
    // --- LÓGICA DE ESTADO Y FETCHING ---
    const [rutas, setRutas] = useState<Ruta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRutas = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:8000/api/rutas/empresas/${empresaId}/rutas/`);
                if (!response.ok) throw new Error('Error al cargar rutas');
                const data = await response.json();
                setRutas(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setLoading(false);
            }
        };
        fetchRutas();
    }, [empresaId]);
    // --- FIN DE LA LÓGICA ---

    if (loading) {
        return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
    }
    if (error) {
        return <div className="p-10 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Navbar Minimalista para volver */}
            <button
                onClick={onBack}
                className="mb-8 flex items-center gap-2 text-gray-500 hover:text-orange-600 transition-colors font-medium px-4 py-2 hover:bg-orange-50 rounded-full w-fit"
            >
                <ArrowLeft size={20} />
                <span>Volver al catálogo</span>
            </button>

            {/* Header de la Empresa */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 mb-10 text-white shadow-xl flex items-center justify-between relative overflow-hidden">
                {/* Decoración de fondo */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold mb-2">
                        {empresaNombre || 'Rutas Disponibles'}
                    </h2>
                    <div className="flex items-center gap-2 text-gray-300">
                        <Route size={18} />
                        <span>Explora los recorridos y paraderos</span>
                    </div>
                </div>
                
                <div className="hidden md:flex flex-col items-end relative z-10">
                    <span className="text-4xl font-bold text-orange-500">{rutas.length}</span>
                    <span className="text-sm text-gray-400 uppercase tracking-wider">Rutas Activas</span>
                </div>
            </div>

            {/* Grid de Rutas */}
            {rutas.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500">No hay rutas registradas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rutas.map((ruta) => (
                        <button
                            key={ruta.id}
                            onClick={() => onRutaClick(ruta.id)}
                            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden text-left transition-all duration-300 flex flex-col h-full hover:-translate-y-1"
                        >
                            {/* 1. Imagen Superior Corta (Cuerpo del Bus) */}
                            <div className="h-32 w-full relative overflow-hidden">
                                <div className="absolute inset-0 bg-gray-900/40 group-hover:bg-gray-900/20 transition-colors z-10"></div>
                                <img 
                                    src={getEmpresaRouteImage(empresaNombre)} 
                                    alt={`Ruta de ${empresaNombre}`} 
                                    className="w-full h-full object-cover"
                                />
                                {/* EL CÓDIGO DE RUTA FUE MOVIDO ABAJO para no solapar el nombre */}
                            </div>

                            {/* 2. Contenido de la Tarjeta (Nombre y Badge de Código) */}
                            <div className="p-6 flex-1 flex flex-col">
                                
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-bold text-gray-800 leading-tight group-hover:text-orange-600 transition-colors">
                                        {ruta.nombre}
                                    </h3>
                                    
                                    {/* ✅ CÓDIGO DE RUTA COMO BADGE (Ahora visible) */}
                                    {ruta.codigo && (
                                        <span className="bg-orange-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-md transform group-hover:scale-105 transition-transform duration-200">
                                            {ruta.codigo}
                                        </span>
                                    )}
                                </div>
                                
                                {/* Footer de la tarjeta */}
                                <div className="mt-auto pt-4 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
                                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                                        <Clock size={12} />
                                        <span>Frecuente</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-orange-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                        Ver detalle <Navigation size={12} />
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RutasList;