// src/pages/RutasTransporte/components/RouteSelector.tsx
import React from 'react';
import type { BusRoute, RouteStop } from '../../../types/routes.types';

interface RouteSelectorProps {
  currentRoute: BusRoute | null;
  selectedStartStop: RouteStop | null;
  selectedEndStop: RouteStop | null;
  onRouteChange: (routeId: string) => void;
  onStartStopChange: (stopId: string) => void;
  onEndStopChange: (stopId: string) => void;
  onCalculateDistance: () => void;
  onCalculateSimpleDistance: () => void;
  onClearRoute: () => void;
  isLoading: boolean;
  showRealRoute: boolean;
  onShowRealRouteChange: (show: boolean) => void;
}

const RouteSelector: React.FC<RouteSelectorProps> = ({
  currentRoute,
  selectedStartStop,
  selectedEndStop,
  onRouteChange,
  onStartStopChange,
  onEndStopChange,
  onCalculateDistance,
  onCalculateSimpleDistance,
  onClearRoute,
  isLoading,
  showRealRoute,
  onShowRealRouteChange
}) => {
  const routes = {
    'ruta1': 'Ruta A - Centro Histórico',
    'ruta2': 'Ruta B - Zona Norte',
    'ruta3': 'Ruta C - Aeropuerto - Centro',
    'ruta4': 'Ruta D - Universitaria'
  };

  return (
    <div className="route-selector">
      <div className="input-group">
        <label htmlFor="routeSelect">Seleccionar Ruta de Bus:</label>
        <select 
          id="routeSelect" 
          onChange={(e) => onRouteChange(e.target.value)}
          value={currentRoute?.id || ''}
        >
          <option value="">-- Selecciona una ruta --</option>
          {Object.entries(routes).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>

      <div className="route-options">
        <h4>⚙️ Opciones de Ruta</h4>
        <div className="option-group">
          <label>
            <input 
              type="radio" 
              name="routeType" 
              checked={showRealRoute}
              onChange={() => onShowRealRouteChange(true)}
            />
            🚗 Ruta por Calles
          </label>
          <label>
            <input 
              type="radio" 
              name="routeType" 
              checked={!showRealRoute}
              onChange={() => onShowRealRouteChange(false)}
            />
            📐 Línea Recta
          </label>
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="startStop">Parada de Inicio:</label>
        <select 
          id="startStop" 
          disabled={!currentRoute}
          value={selectedStartStop?.id || ''}
          onChange={(e) => onStartStopChange(e.target.value)}
        >
          <option value="">-- Selecciona parada inicial --</option>
          {currentRoute?.stops.map((stop, index) => (
            <option key={stop.id} value={stop.id}>
              {index + 1}. {stop.name}
            </option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label htmlFor="endStop">Parada de Destino:</label>
        <select 
          id="endStop" 
          disabled={!currentRoute}
          value={selectedEndStop?.id || ''}
          onChange={(e) => onEndStopChange(e.target.value)}
        >
          <option value="">-- Selecciona parada final --</option>
          {currentRoute?.stops.map((stop, index) => (
            <option key={stop.id} value={stop.id}>
              {index + 1}. {stop.name}
            </option>
          ))}
        </select>
      </div>

      <button 
        className="btn btn-success" 
        onClick={onCalculateDistance}
        disabled={!selectedStartStop || !selectedEndStop || isLoading}
      >
        {showRealRoute ? '📏 Calcular Distancia Real' : '📐 Calcular Distancia Simple'}
      </button>

      <button 
        className="btn btn-warning" 
        onClick={onClearRoute}
      >
        🗑️ Limpiar Ruta
      </button>
    </div>
  );
};

export default RouteSelector;