// src/pages/Rutas/components/MapaRuta.tsx

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Ruta } from '../types';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet en React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Icono personalizado para terminales (rojo)
const terminalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Icono para paradas normales (azul)
const paradaIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapaRutaProps {
  ruta: Ruta;
}

// Componente para ajustar el mapa a los bounds
const FitBounds: React.FC<{ coordinates: [number, number][] }> = ({ coordinates }) => {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);
  
  return null;
};

const MapaRuta: React.FC<MapaRutaProps> = ({ ruta }) => {
  if (!ruta.paradas || ruta.paradas.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-600">No hay paradas para mostrar en el mapa</p>
      </div>
    );
  }

  // Extraer coordenadas de las paradas
  const coordenadas: [number, number][] = ruta.paradas.map(rp => [
    rp.parada.latitud,
    rp.parada.longitud
  ]);

  // Centro del mapa (primera parada)
  const centro: [number, number] = [
    ruta.paradas[0].parada.latitud,
    ruta.paradas[0].parada.longitud
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
      <div 
        className="px-6 py-4 text-white font-semibold"
        style={{ backgroundColor: ruta.empresa?.color || '#3B82F6' }}
      >
        🗺️ Mapa del Recorrido
      </div>
      
      <div style={{ height: '500px', width: '100%' }}>
        <MapContainer
          center={centro}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          {/* Capa base del mapa */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Línea que conecta todas las paradas */}
          <Polyline
            positions={coordenadas}
            color={ruta.empresa?.color || '#3B82F6'}
            weight={4}
            opacity={0.7}
          />

          {/* Marcadores de paradas */}
          {ruta.paradas.map((rutaParada, index) => (
            <Marker
              key={rutaParada.id}
              position={[rutaParada.parada.latitud, rutaParada.parada.longitud]}
              icon={rutaParada.parada.es_terminal ? terminalIcon : paradaIcon}
            >
              <Popup>
                <div className="p-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
                      {rutaParada.orden}
                    </span>
                    <strong className="text-lg">{rutaParada.parada.nombre}</strong>
                  </div>
                  
                  {rutaParada.parada.es_terminal && (
                    <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded mb-2">
                      🚏 Terminal
                    </span>
                  )}
                  
                  <p className="text-sm text-gray-600 mb-1">
                    📍 {rutaParada.parada.direccion}
                  </p>
                  
                  {rutaParada.parada.referencia && (
                    <p className="text-xs text-gray-500 mb-2">
                      {rutaParada.parada.referencia}
                    </p>
                  )}
                  
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm font-semibold text-blue-600">
                      ⏱️ {rutaParada.tiempo_estimado_desde_inicio} min desde inicio
                    </p>
                    {index > 0 && (
                      <p className="text-xs text-gray-500">
                        +{rutaParada.tiempo_estimado_desde_inicio - 
                          ruta.paradas![index - 1].tiempo_estimado_desde_inicio} min 
                        desde parada anterior
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Ajustar el mapa automáticamente */}
          <FitBounds coordinates={coordenadas} />
        </MapContainer>
      </div>

      {/* Leyenda */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-gray-700">Terminal</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">Parada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-1 rounded" style={{ backgroundColor: ruta.empresa?.color || '#3B82F6' }}></div>
            <span className="text-gray-700">Recorrido</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapaRuta;