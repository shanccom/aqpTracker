import React from 'react';
import { Search, Filter } from 'lucide-react';
import type { Empresa } from '../types';

interface FiltrosRutasProps {
  busqueda: string;
  setBusqueda: (valor: string) => void;
  empresaFiltro: number | null;
  setEmpresaFiltro: (id: number | null) => void;
  empresas: Empresa[];
}

const FiltrosRutas: React.FC<FiltrosRutasProps> = ({
  busqueda,
  setBusqueda,
  empresaFiltro,
  setEmpresaFiltro,
  empresas
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código, nombre o empresa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <select
            value={empresaFiltro || ''}
            onChange={(e) => setEmpresaFiltro(e.target.value ? Number(e.target.value) : null)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          >
            <option value="">Todas las empresas</option>
            {empresas.map(empresa => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.nombre} ({empresa.total_rutas} rutas)
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FiltrosRutas;
