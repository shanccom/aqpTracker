// src/pages/Rutas/components/DetalleRuta.tsx

import React from 'react';
import { Bus, DollarSign, Clock, MapPin } from 'lucide-react';
import type { Ruta } from '../types';
import MapaRuta from './MapaRuta';

interface DetalleRutaProps {
  ruta: Ruta;
}

const DetalleRuta: React.FC<DetalleRutaProps> = ({ ruta }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header del detalle */}
      <div
        className="px-8 py-6 text-white"
        style={{ backgroundColor: ruta.empresa?.color || '#3B82F6' }}
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <Bus className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">{ruta.codigo}</h2>
            <p className="text-lg opacity-90">{ruta.nombre}</p>
          </div>
        </div>
        <p className="text-lg opacity-90">{ruta.empresa?.nombre}</p>
      </div>

      {/* Información general */}
      <div className="p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">S/ {ruta.precio}</p>
            <p className="text-sm text-gray-600">Tarifa</p>
          </div>
          <div className="text-center">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{ruta.frecuencia_minutos} min</p>
            <p className="text-sm text-gray-600">Frecuencia</p>
          </div>
          <div className="text-center">
            <MapPin className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{ruta.total_paradas}</p>
            <p className="text-sm text-gray-600">Paradas</p>
          </div>
          <div className="text-center">
            <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{ruta.tiempo_total_estimado} min</p>
            <p className="text-sm text-gray-600">Duración</p>
          </div>
        </div>

        {/* Horarios */}
        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-gray-900 mb-2">Horarios de Operación</h3>
          <p className="text-gray-700">
            {ruta.horario_inicio} - {ruta.horario_fin}
          </p>
        </div>

        <MapaRuta ruta={ruta} />

        {/* Recorrido de paradas */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recorrido</h3>
          <div className="relative">
            {ruta.paradas?.map((rutaParada, index) => (
              <div key={rutaParada.id} className="flex mb-6">
                <div className="flex flex-col items-center mr-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    rutaParada.parada.es_terminal ? 'bg-red-600' : 'bg-blue-600'
                  }`}>
                    {rutaParada.orden}
                  </div>
                  {index < (ruta.paradas?.length || 0) - 1 && (
                    <div className="w-1 h-full bg-gray-300 my-1"></div>
                  )}
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        {rutaParada.parada.nombre}
                        {rutaParada.parada.es_terminal && (
                          <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            Terminal
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{rutaParada.parada.direccion}</p>
                      {rutaParada.parada.referencia && (
                        <p className="text-xs text-gray-500 mt-1">📍 {rutaParada.parada.referencia}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-blue-600">
                        {rutaParada.tiempo_estimado_desde_inicio} min
                      </p>
                      <p className="text-xs text-gray-500">desde inicio</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleRuta;