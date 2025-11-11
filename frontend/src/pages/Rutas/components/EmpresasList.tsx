import { useEffect, useState } from "react";
import type { Empresa } from "../../../types";


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
        <div className="flex justify-center items-center p-8">
          <div className="text-lg">Cargando empresas...</div>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      );
    }
  
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Empresas de Transporte</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {empresas.map((empresa) => (
            <button
              key={empresa.id}
              onClick={() => onEmpresaClick(empresa.id)}
              className="bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg p-6 text-left transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-gray-800">
                {empresa.nombre}
              </h3>
              <h2>
                {empresa.descripcion}
              </h2>
            </button>
          ))}
        </div>
        {empresas.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No se encontraron empresas
          </div>
        )}
      </div>
    );
  };
  
  export default EmpresasList;