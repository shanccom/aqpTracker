// src/pages/RutasTransporte/components/RouteInfo.tsx
import React from 'react';
import type { RouteInfo as RouteInfoType } from '../../../types/routes.types';

interface RouteInfoProps {
  routeInfo: RouteInfoType | null;
}

const RouteInfo: React.FC<RouteInfoProps> = ({ routeInfo }) => {
  if (!routeInfo) return null;

  return (
    <div className="route-info">
      <h3>📊 Información de la Ruta</h3>
      <div className="info-item">
        <span>Total de paradas:</span>
        <span>{routeInfo.totalStops}</span>
      </div>
      <div className="info-item">
        <span>Distancia total:</span>
        <span>{routeInfo.totalDistance} km</span>
      </div>
      <div className="info-item">
        <span>Tiempo estimado:</span>
        <span>{routeInfo.totalTime} min</span>
      </div>
    </div>
  );
};

export default RouteInfo;