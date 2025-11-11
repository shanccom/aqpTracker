import React from 'react';
import { Link } from 'react-router-dom';
import type { Ruta } from '../../types';

interface RutaListProps {
  rutas: Ruta[];
  empresaColor?: string;
  loading?: boolean;
}

const RutaList: React.FC<RutaListProps> = ({ rutas, empresaColor, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (rutas.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No hay rutas registradas para esta empresa</p>
      </div>
    );
  }

  // Agrupar rutas por código base (sin IDA/VUELTA)
  const rutasAgrupadas = rutas.reduce((acc, ruta) => {
    const baseCode = ruta.codigo.split('-')[0];
    if (!acc[baseCode]) {
      acc[baseCode] = [];
    }
    acc[baseCode].push(ruta);
    return acc;
  }, {} as Record<string, Ruta[]>);

  return (
    <div className="space-y-4">
      {Object.entries(rutasAgrupadas).map(([baseCode, rutasGrupo]) => (
        <div
          key={baseCode}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div
            className="h-2"
            style={{ backgroundColor: empresaColor || '#3B82F6' }}
          ></div>
          <div className="p-5">
            <h3 className="text-lg font-bold mb-3 text-gray-800">
              {rutasGrupo[0].nombre}
            </h3>
            <div className="flex flex-wrap gap-3">
              {rutasGrupo.map((ruta) => (
                <Link
                  key={ruta.id}
                  to={`/Rutas/ruta/${ruta.id}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border-2 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: ruta.color_linea }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ruta.color_linea }}
                  ></div>
                  <span className="font-medium text-sm text-gray-700">
                    {ruta.sentido}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({ruta.codigo})
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RutaList;