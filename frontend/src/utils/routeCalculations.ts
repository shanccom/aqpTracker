// src/utils/routeCalculations.ts
// src/utils/routeCalculations.ts
import type { RouteStop } from '../types/routes.types';

export const calculateDistanceBetweenStops = (stop1: RouteStop, stop2: RouteStop): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (stop2.lat - stop1.lat) * Math.PI / 180;
  const dLon = (stop2.lng - stop1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(stop1.lat * Math.PI / 180) * Math.cos(stop2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const calculateTravelTime = (distance: number): number => {
  // Velocidad promedio considerando paradas: 20 km/h
  return (distance / 20) * 60; // tiempo en minutos
};