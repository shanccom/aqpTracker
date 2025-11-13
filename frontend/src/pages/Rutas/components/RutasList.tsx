import { useEffect, useState } from 'react';
import { ArrowLeft, Route, MapPin, Navigation } from 'lucide-react';

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

const API_BASE_URL = 'http://localhost:8000';

const RutasList = ({ empresaId, empresaNombre, onBack, onRutaClick }: RutasListProps) => {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRutas = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/rutas/empresas/${empresaId}/rutas/`);
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium mb-6 transition-colors duration-200"
        >
          <ArrowLeft size={20} />
          <span>Volver a empresas</span>
        </button>
        <div className="flex flex-col justify-center items-center p-12">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-lg font-medium text-gray-600">Cargando rutas...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium mb-6 transition-colors duration-200"
        >
          <ArrowLeft size={20} />
          <span>Volver a empresas</span>
        </button>
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-red-50 border-l-4 border-red-500 px-6 py-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Error al cargar rutas</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Botón volver */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium mb-6 transition-colors duration-200 group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
        <span>Volver a empresas</span>
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-400 rounded-xl flex items-center justify-center shadow-md">
            <Route size={28} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Rutas de {empresaNombre || 'la Empresa'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin size={16} />
                <span className="text-sm font-medium">{rutas.length} rutas disponibles</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Rutas */}
      {rutas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl shadow-sm">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Route size={40} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay rutas disponibles</h3>
          <p className="text-gray-500 text-center">
            Esta empresa no tiene rutas registradas en este momento
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rutas.map((ruta) => (
            <button
              key={ruta.id}
              onClick={() => {
                console.log('Ruta clickeada:', ruta.id);
                onRutaClick(ruta.id);
              }}
              className="group relative bg-white hover:bg-gradient-to-br hover:from-orange-50 hover:to-red-50 border border-gray-200 hover:border-orange-300 rounded-xl p-6 text-left transition-all duration-300 shadow-sm hover:shadow-lg transform hover:-translate-y-1"
            >
              {/* Header de la card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Navigation size={20} className="text-red-600" />
                    </div>
                    {ruta.codigo && (
                      <span className="bg-gradient-to-r from-red-500 to-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                        {ruta.codigo}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-600 transition-colors duration-300">
                    {ruta.nombre}
                  </h3>
                </div>
              </div>

              {/* Footer de la card */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-medium">ID: {ruta.id}</span>
                <div className="flex items-center gap-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xs font-medium">Ver detalles</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Decoración hover */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-400 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RutasList;