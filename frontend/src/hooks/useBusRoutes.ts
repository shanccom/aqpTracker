// src/hooks/useBusRoutes.ts
import { useState, useCallback } from 'react';
import type { BusRoute, RouteStop, RouteInfo, RouteResults, RouteSegment } from '../types/routes.types';
import { routesService } from '../services/routesService';
import { calculateDistanceBetweenStops, calculateTravelTime } from '../utils/routeCalculations';

// Datos de rutas (podrían venir de una API)
const routesData: { [key: string]: BusRoute } = {
  'ruta1': {
    id: 'ruta1',
    name: 'Ruta A - Centro Histórico',
    color: '#e74c3c',
    stops: [
      { id: 's1', name: 'Terminal Terrestre', lat: -16.4200, lng: -71.5500 },
      { id: 's2', name: 'Mercado San Camilo', lat: -16.4015, lng: -71.5380 },
      { id: 's3', name: 'Plaza de Armas', lat: -16.3989, lng: -71.5369 },
      { id: 's4', name: 'Monasterio Santa Catalina', lat: -16.3970, lng: -71.5365 },
      { id: 's5', name: 'Hospital Goyeneche', lat: -16.3950, lng: -71.5390 },
      { id: 's6', name: 'UNSA', lat: -16.4058, lng: -71.5350 },
      { id: 's7', name: 'Parque Selva Alegre', lat: -16.3900, lng: -71.5300 }
    ]
  },
  'ruta2': {
    id: 'ruta2',
    name: 'Ruta B - Zona Norte',
    color: '#3498db',
    stops: [
      { id: 's8', name: 'Cerro Colorado', lat: -16.3500, lng: -71.5100 },
      { id: 's9', name: 'Mall Aventura Plaza', lat: -16.4050, lng: -71.5200 },
      { id: 's10', name: 'UCSM', lat: -16.4080, lng: -71.5400 },
      { id: 's11', name: 'Yanahuara', lat: -16.3886, lng: -71.5408 },
      { id: 's12', name: 'Mirador', lat: -16.3860, lng: -71.5420 },
      { id: 's13', name: 'Cayma', lat: -16.3820, lng: -71.5450 }
    ]
  },
  'ruta3': {
    id: 'ruta3',
    name: 'Ruta C - Aeropuerto - Centro',
    color: '#27ae60',
    stops: [
      { id: 's14', name: 'Aeropuerto', lat: -16.3411, lng: -71.5831 },
      { id: 's15', name: 'Zona Industrial', lat: -16.3700, lng: -71.5700 },
      { id: 's16', name: 'Terminal Terrestre', lat: -16.4200, lng: -71.5500 },
      { id: 's17', name: 'Plaza de Armas', lat: -16.3989, lng: -71.5369 },
      { id: 's18', name: 'San Lázaro', lat: -16.3925, lng: -71.5400 }
    ]
  },
  'ruta4': {
    id: 'ruta4',
    name: 'Ruta D - Universitaria',
    color: '#f39c12',
    stops: [
      { id: 's19', name: 'UNSA', lat: -16.4058, lng: -71.5350 },
      { id: 's20', name: 'UCSM', lat: -16.4080, lng: -71.5400 },
      { id: 's21', name: 'Biblioteca Municipal', lat: -16.4000, lng: -71.5380 },
      { id: 's22', name: 'Parque Libertad', lat: -16.3950, lng: -71.5350 },
      { id: 's23', name: 'Complejo Deportivo', lat: -16.3900, lng: -71.5320 }
    ]
  }
};

export const useBusRoutes = () => {
  const [currentRoute, setCurrentRoute] = useState<BusRoute | null>(null);
  const [selectedStartStop, setSelectedStartStop] = useState<RouteStop | null>(null);
  const [selectedEndStop, setSelectedEndStop] = useState<RouteStop | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [results, setResults] = useState<RouteResults | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar una ruta específica
  const loadRoute = useCallback((routeId: string) => {
    setError(null);
    
    if (!routeId) {
      setCurrentRoute(null);
      setRouteInfo(null);
      setResults(null);
      setSelectedStartStop(null);
      setSelectedEndStop(null);
      return;
    }

    const route = routesData[routeId];
    
    if (!route) {
      setError(`Ruta con ID ${routeId} no encontrada`);
      return;
    }

    setCurrentRoute(route);

    // Calcular información de la ruta
    const totalDistance = calculateTotalRouteDistance(route.stops);
    const totalTime = calculateTotalRouteTime(totalDistance);

    setRouteInfo({
      totalStops: route.stops.length,
      totalDistance: totalDistance.toFixed(2),
      totalTime: Math.round(totalTime)
    });

    setResults(null);
    setSelectedStartStop(null);
    setSelectedEndStop(null);
  }, []);

  // Seleccionar parada de inicio
  const selectStartStop = useCallback((stopId: string) => {
    if (!currentRoute) return;
    
    const stop = currentRoute.stops.find(s => s.id === stopId);
    setSelectedStartStop(stop || null);
    
    // Limpiar resultados si se cambia la selección
    if (results) {
      setResults(null);
    }
  }, [currentRoute, results]);

  // Seleccionar parada de destino
  const selectEndStop = useCallback((stopId: string) => {
    if (!currentRoute) return;
    
    const stop = currentRoute.stops.find(s => s.id === stopId);
    setSelectedEndStop(stop || null);
    
    // Limpiar resultados si se cambia la selección
    if (results) {
      setResults(null);
    }
  }, [currentRoute, results]);

  // Calcular distancia usando rutas reales (OSRM)
  const calculateDistance = useCallback(async () => {
    if (!selectedStartStop || !selectedEndStop || !currentRoute) {
      setError('Selecciona paradas de inicio y destino');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const startIndex = currentRoute.stops.findIndex(stop => stop.id === selectedStartStop.id);
      const endIndex = currentRoute.stops.findIndex(stop => stop.id === selectedEndStop.id);

      if (startIndex === -1 || endIndex === -1) {
        setError('Paradas no encontradas en la ruta');
        return;
      }

      // Determinar dirección del recorrido
      const direction = startIndex <= endIndex ? 1 : -1;
      const start = direction === 1 ? startIndex : endIndex;
      const end = direction === 1 ? endIndex : startIndex;

      let totalDistance = 0;
      let totalTime = 0;
      const segments: RouteSegment[] = [];

      // Calcular cada segmento de la ruta
      for (let i = start; i < end; i++) {
        const stop1 = currentRoute.stops[i];
        const stop2 = currentRoute.stops[i + 1];
        
        // Intentar calcular ruta real con OSRM
        const routeData = await routesService.calculateRealRoute(stop1, stop2);
        
        if (routeData) {
          // Usar datos de ruta real
          totalDistance += routeData.distance;
          totalTime += routeData.duration;
          segments.push({
            from: stop1.name,
            to: stop2.name,
            distance: routeData.distance,
            time: routeData.duration,
            geometry: routeData.geometry
          });
        } else {
          // Fallback a cálculo simple
          const simpleDistance = calculateDistanceBetweenStops(stop1, stop2);
          const simpleTime = calculateTravelTime(simpleDistance);
          totalDistance += simpleDistance;
          totalTime += simpleTime;
          segments.push({
            from: stop1.name,
            to: stop2.name,
            distance: simpleDistance,
            time: simpleTime,
            geometry: null
          });
        }
      }

      // Actualizar resultados
      setResults({
        totalDistance,
        totalTime,
        segmentCount: segments.length,
        segments,
        isRealRoute: true
      });

    } catch (error) {
      console.error('Error calculando ruta:', error);
      setError('Error al calcular la ruta. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [currentRoute, selectedStartStop, selectedEndStop]);

  // Calcular distancia simple (línea recta)
  const calculateSimpleDistance = useCallback(() => {
    if (!selectedStartStop || !selectedEndStop || !currentRoute) {
      setError('Selecciona paradas de inicio y destino');
      return;
    }

    setError(null);

    const startIndex = currentRoute.stops.findIndex(stop => stop.id === selectedStartStop.id);
    const endIndex = currentRoute.stops.findIndex(stop => stop.id === selectedEndStop.id);

    if (startIndex === -1 || endIndex === -1) {
      setError('Paradas no encontradas en la ruta');
      return;
    }

    const direction = startIndex <= endIndex ? 1 : -1;
    const start = direction === 1 ? startIndex : endIndex;
    const end = direction === 1 ? endIndex : startIndex;

    let totalDistance = 0;
    const segments: RouteSegment[] = [];

    // Calcular cada segmento en línea recta
    for (let i = start; i < end; i++) {
      const segmentDistance = calculateDistanceBetweenStops(
        currentRoute.stops[i],
        currentRoute.stops[i + 1]
      );
      totalDistance += segmentDistance;
      segments.push({
        from: currentRoute.stops[i].name,
        to: currentRoute.stops[i + 1].name,
        distance: segmentDistance,
        time: calculateTravelTime(segmentDistance)
      });
    }

    const totalTime = calculateTravelTime(totalDistance);

    setResults({
      totalDistance,
      totalTime,
      segmentCount: segments.length,
      segments,
      isRealRoute: false
    });
  }, [currentRoute, selectedStartStop, selectedEndStop]);

  // Limpiar toda la selección
  const clearRoute = useCallback(() => {
    setCurrentRoute(null);
    setRouteInfo(null);
    setResults(null);
    setSelectedStartStop(null);
    setSelectedEndStop(null);
    setError(null);
  }, []);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estado
    currentRoute,
    selectedStartStop,
    selectedEndStop,
    routeInfo,
    results,
    isLoading,
    error,
    
    // Acciones
    loadRoute,
    selectStartStop,
    selectEndStop,
    calculateDistance,
    calculateSimpleDistance,
    clearRoute,
    clearError
  };
};

// Funciones auxiliares
const calculateTotalRouteDistance = (stops: RouteStop[]): number => {
  if (stops.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    totalDistance += calculateDistanceBetweenStops(stops[i], stops[i + 1]);
  }
  return totalDistance;
};

const calculateTotalRouteTime = (distance: number): number => {
  // Velocidad promedio de bus urbano: 20 km/h considerando paradas
  return (distance / 20) * 60; // tiempo en minutos
};