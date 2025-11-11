import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Paradero } from '../../types';

interface ParaderoMarkerProps {
  paradero: Paradero;
}

const ParaderoMarker: React.FC<ParaderoMarkerProps> = ({ paradero }) => {
  // Crear ícono personalizado según si es popular o no
  const icon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${paradero.es_popular ? '24px' : '16px'};
        height: ${paradero.es_popular ? '24px' : '16px'};
        background-color: ${paradero.es_popular ? '#EF4444' : '#3B82F6'};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${paradero.es_popular ? 'animation: pulse 2s infinite;' : ''}
      "></div>
    `,
    iconSize: [paradero.es_popular ? 24 : 16, paradero.es_popular ? 24 : 16],
    iconAnchor: [paradero.es_popular ? 12 : 8, paradero.es_popular ? 12 : 8],
  });

  return (
    <Marker position={[paradero.latitud, paradero.longitud]} icon={icon}>
      <Popup>
        <div className="p-2">
          <h4 className="font-bold text-gray-800 mb-1">
            {paradero.nombre}
            {paradero.es_popular && (
              <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded">
                Popular
              </span>
            )}
          </h4>
          {paradero.descripcion && (
            <p className="text-sm text-gray-600 mt-1">{paradero.descripcion}</p>
          )}
          {paradero.distancia_metros !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              A {paradero.distancia_metros.toFixed(0)}m de la ruta
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default ParaderoMarker;