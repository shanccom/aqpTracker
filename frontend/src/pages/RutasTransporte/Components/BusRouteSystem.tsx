// src/pages/RutasTransporte/components/BusRouteSystem.tsx
import React, { useState, useCallback } from 'react';
import MapComponent from '../../../components/common/Map/MapComponent';

import RouteSelector from './RouteSelector';
import RouteInfo from './RouteInfo';
import StopsList from './StopsList';
import DistanceResults from './DistanceResults';
import { useBusRoutes } from '../../../hooks/useBusRoutes';
import './BusRouteSystem.css';

const BusRouteSystem: React.FC = () => {
  const {
    currentRoute,
    selectedStartStop,
    selectedEndStop,
    routeInfo,
    results,
    isLoading,
    loadRoute,
    selectStartStop,
    selectEndStop,
    calculateDistance,
    calculateSimpleDistance,
    clearRoute
  } = useBusRoutes();

  const [showRealRoute, setShowRealRoute] = useState<boolean>(true);

  const handleCalculateDistance = useCallback(async () => {
    if (showRealRoute) {
      await calculateDistance();
    } else {
      calculateSimpleDistance();
    }
  }, [showRealRoute, calculateDistance, calculateSimpleDistance]);

  return (
    <div className="bus-route-system">
      <div className="system-content">
        <div className="control-panel">
          <RouteSelector
            currentRoute={currentRoute}
            selectedStartStop={selectedStartStop}
            selectedEndStop={selectedEndStop}
            onRouteChange={loadRoute}
            onStartStopChange={selectStartStop}
            onEndStopChange={selectEndStop}
            onCalculateDistance={handleCalculateDistance}
            onCalculateSimpleDistance={calculateSimpleDistance}
            onClearRoute={clearRoute}
            isLoading={isLoading}
            showRealRoute={showRealRoute}
            onShowRealRouteChange={setShowRealRoute}
          />

          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Calculando ruta por calles...</p>
            </div>
          )}

          {routeInfo && <RouteInfo routeInfo={routeInfo} />}

          {currentRoute && (
            <StopsList 
              stops={currentRoute.stops} 
              selectedStartStop={selectedStartStop}
              selectedEndStop={selectedEndStop}
            />
          )}

          {results && <DistanceResults results={results} />}
        </div>

        <div className="map-panel">
          <MapComponent 
            currentRoute={currentRoute}
            selectedStartStop={selectedStartStop}
            selectedEndStop={selectedEndStop}
            results={results}
          />
        </div>
      </div>
    </div>
  );
};

export default BusRouteSystem;