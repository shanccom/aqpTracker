import React from 'react';
import { Link } from 'react-router-dom';
import type { Empresa } from '../../types';

interface EmpresaListProps {
  empresas: Empresa[];
  loading?: boolean;
}

const EmpresaList: React.FC<EmpresaListProps> = ({ empresas, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (empresas.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No hay empresas registradas</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {empresas.map((empresa) => (
        <Link
          key={empresa.id}
          to={`/Rutas/empresa/${empresa.id}`}
          className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
        >
          <div
            className="h-3"
            style={{ backgroundColor: empresa.color_principal }}
          ></div>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-2 text-gray-800">
              {empresa.nombre}
            </h3>
            {empresa.descripcion && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {empresa.descripcion}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {empresa.total_rutas || 0} rutas
              </span>
              <span className="text-blue-600 font-medium text-sm">
                Ver rutas →
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default EmpresaList;