// src/services/routesService.ts
// src/services/routesService.ts
import type { BusRoute, RouteStop } from '../types/routes.types';

// Datos de ejemplo - en producción vendrían de tu API
export const routesData: { [key: string]: BusRoute } = {
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
  // ... otras rutas
};

export const routesService = {
  // Obtener todas las rutas
  getRoutes: async (): Promise<BusRoute[]> => {
    // Simular llamada a API
    return Object.values(routesData);
  },

  // Obtener una ruta específica
  getRoute: async (routeId: string): Promise<BusRoute | null> => {
    return routesData[routeId] || null;
  },

  // Calcular ruta real entre dos puntos
  calculateRealRoute: async (startStop: RouteStop, endStop: RouteStop) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${startStop.lng},${startStop.lat};${endStop.lng},${endStop.lat}?overview=full&geometries=geojson`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          distance: route.distance / 1000,
          duration: route.duration / 60,
          geometry: route.geometry
        };
      }
    } catch (error) {
      console.error('Error con OSRM:', error);
    }
    
    return null;
  }
};