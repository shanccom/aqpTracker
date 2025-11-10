import React from 'react';
import { DollarSign, Clock, MapPin, ChevronRight } from 'lucide-react';
import type { Ruta } from '../types';

interface RutaCardProps {
  ruta: Ruta;
  onClick: () => void;
}

const RutaCard: React.FC<RutaCardProps> = ({ ruta, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition cursor-pointer overflow-hidden"
    >
      <div
        className="h-2"
        style={{ backgroundColor: ruta.empresa_color || '#3B82F6' }}
      />
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-2">
              {ruta.codigo}
            </span>
            <h3 className="text-lg font-bold text-gray-900">{ruta.nombre}</h3>
            <p className="text-sm text-gray-600 mt-1">{ruta.empresa_nombre}</p>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-400" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-700">
            <DollarSign className="w-4 h-4 mr-2 text-green-600" />
            <span>S/ {ruta.precio}</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Clock className="w-4 h-4 mr-2 text-blue-600" />
            <span>Cada {ruta.frecuencia_minutos} minutos</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <MapPin className="w-4 h-4 mr-2 text-red-600" />
            <span>{ruta.total_paradas} paradas</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
            ruta.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {ruta.activa ? '● Activa' : '○ Inactiva'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RutaCard;
