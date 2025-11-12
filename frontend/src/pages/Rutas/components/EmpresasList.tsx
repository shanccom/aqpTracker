import { useEffect, useState } from "react";
import { Building2, ChevronRight, Bus } from "lucide-react";

interface Empresa {
  id: number;
  nombre: string;
  descripcion: string;
}

interface EmpresasListProps {
  onEmpresaClick: (empresaId: number) => void;
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
      <div className="flex flex-col justify-center items-center p-12">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-lg font-medium text-gray-600">Cargando empresas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border-l-4 border-red-500 px-6 py-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Error al cargar empresas</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          
          <h2 className="text-3xl font-bold text-gray-800">Empresas de Transporte</h2>
        </div>
        <p className="text-gray-600">Selecciona una empresa para ver sus rutas disponibles</p>
      </div>

      {/* Grid de Empresas */}
      {empresas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empresas.map((empresa) => (
            <button
              key={empresa.id}
              onClick={() => onEmpresaClick(empresa.id)}
              className="group relative bg-white hover:bg-gradient-to-br hover:from-orange-50 hover:to-red-50 border border-gray-200 hover:border-orange-300 rounded-xl p-6 text-left transition-all duration-300 shadow-sm hover:shadow-lg transform hover:-translate-y-1"
            >
              {/* Icono de empresa */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Bus size={24} className="text-red-600" />
                </div>
                <ChevronRight 
                  size={20} 
                  className="text-gray-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all duration-300" 
                />
              </div>

              {/* Contenido */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors duration-300">
                  {empresa.nombre}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {empresa.descripcion}
                </p>
              </div>

              {/* Decoración hover */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-400 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Building2 size={40} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay empresas disponibles</h3>
          <p className="text-gray-500 text-center">
            No se encontraron empresas de transporte en este momento
          </p>
        </div>
      )}
    </div>
  );
};

export default EmpresasList;