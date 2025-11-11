import { useEffect, useState } from 'react';

interface Ruta {
  id: number;
  nombre: string;
  codigo?: string;
  // Agrega aquí otros campos que tenga tu ruta
}

interface RutasListProps {
  empresaId: number;
  empresaNombre?: string;
  onBack: () => void;
  onRutaClick: (rutaId: number) => void;
}

const API_BASE_URL = 'http://localhost:8000'; // Ajusta según tu configuración

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
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Cargando rutas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Volver a empresas
        </button>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        ← Volver a empresas
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-2">
          Rutas de {empresaNombre || 'la Empresa'}
        </h2>
        <p className="text-gray-600 mb-6">
          Total de rutas: {rutas.length}
        </p>

        {rutas.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No se encontraron rutas para esta empresa
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rutas.map((ruta) => (
              <div
                key={ruta.id}
                onClick={() => {
                  console.log('Ruta clickeada:', ruta.id);
                  onRutaClick(ruta.id);
                }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5 hover:shadow-lg hover:border-blue-400 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {ruta.nombre}
                  </h3>
                  {ruta.codigo && (
                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                      {ruta.codigo}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  ID: {ruta.id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RutasList;