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
  coordenadas: [number, number][]; // Lista de pares [lat, lng]
}

export const buscarRutasBackend = async (puntoA: Coordenada, puntoB: Coordenada) => {
  // Se hace envío de los datos
  const response = await api.post<RutaEncontrada[]>('/api/rutas/buscar-rutas/', {
    punto_a: puntoA,
    punto_b: puntoB
  });
  return response.data;
};