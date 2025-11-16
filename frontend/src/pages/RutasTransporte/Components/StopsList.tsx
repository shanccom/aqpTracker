// src/pages/RutasTransporte/components/StopsList.tsx
import React from 'react';
import type { RouteStop } from '../../../types/routes.types';

interface StopsListProps {
  stops: RouteStop[];
  selectedStartStop: RouteStop | null;
  selectedEndStop: RouteStop | null;
}

const StopsList: React.FC<StopsListProps> = ({ stops, selectedStartStop, selectedEndStop }) => {
  if (!stops || stops.length === 0) return null;

  return (
    <div className="stops-list">
      <h3>🛑 Paradas de la Ruta</h3>
      {stops.map((stop, index) => {
        const isSelected = selectedStartStop?.id === stop.id || selectedEndStop?.id === stop.id;
        
        return (
          <div 
            key={stop.id}
            className={`stop-item ${isSelected ? 'selected' : ''}`}
            data-stop-id={stop.id}
          >
            <div>
              <span className="stop-number">{index + 1}</span>
              <strong>{stop.name}</strong>
            </div>
            <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
              {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StopsList;