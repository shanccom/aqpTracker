import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ParaderoMarker from '../Paradero/ParaderoMarker';
import type { RutaJSON } from '../../types';

interface RutaMapProps {
  ruta: RutaJSON;
  height?: string;
}

// Componente auxiliar para ajustar el mapa a los bounds
const FitBounds: React.FC<{ bounds: L.LatLngBounds }> = ({ bounds }) => {
  const map = useMap();
  
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, bounds]);
  
  return null;
};

const RutaMap: React.FC<RutaMapProps> = ({ ruta, height = '600px' }) => {
  // Calcular el centro y bounds del mapa
  const bounds = L.latLngBounds(ruta.coordenadas);
  const center = bounds.getCenter();

  return (
    <div className="rounded-lg overflow-hidden shadow-lg" style={{ height }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds bounds={bounds} />
        
        {/* Línea de la ruta */}
        <Polyline
          positions={ruta.coordenadas}
          color={ruta.color_linea}
          weight={ruta.grosor_linea}
          opacity={0.7}
        />
        
        {/* Marcadores de paraderos */}
        {ruta.paraderos.map((paradero, index) => (
          <ParaderoMarker key={`${paradero.id}-${index}`} paradero={paradero} />
        ))}
      </MapContainer>
    </div>
  );
};

export default RutaMap;