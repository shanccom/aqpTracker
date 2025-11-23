// src/api/rutas.ts
import api from './axios';

export interface Coordenada {
  lat: number;
  lng: number;
}

export interface RutaEncontrada {
  id: number;
  nombre_ruta: string;
  empresa: string;
  sentido: string;
  color: string;
  coordenadas: [number, number][];
  distancia_a_origen: number;
  distancia_a_destino: number;
}

// Nuevas interfaces para rutas combinadas
export interface RutaCombinada {
  id: string;
  tipo: 'combinada';
  rutas: RutaSegmento[];
  distancia_total: number;
  tiempo_estimado_minutos: number;
  punto_transbordo: Coordenada;
}

export interface RutaSegmento {
  ruta: RutaEncontrada;
  segmento_coordenadas: [number, number][];
  distancia: number;
}

export interface ResultadoBusqueda {
  rutas_directas: RutaEncontrada[];
  rutas_combinadas: RutaCombinada[];
}

export const buscarRutasBackend = async (puntoA: Coordenada, puntoB: Coordenada) => {
  const response = await api.post<ResultadoBusqueda>('/api/rutas/buscar-rutas/', {
    punto_a: puntoA,
    punto_b: puntoB
  });
  return response.data;
};

export const buscarRutasCombinadasBackend = async (puntoA: Coordenada, puntoB: Coordenada) => {
  const response = await api.post<RutaCombinada[]>('/api/rutas/buscar-rutas-combinadas/', {
    punto_a: puntoA,
    punto_b: puntoB
  });
  return response.data;
};