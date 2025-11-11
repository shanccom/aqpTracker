import axios from 'axios';
import type { Empresa, Ruta, RutaJSON } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const empresasAPI = {
  // Obtener todas las empresas
  getAll: async (): Promise<Empresa[]> => {
    const response = await api.get('/api/rutas/empresas/');
    return response.data;
  },

  // Obtener una empresa por ID
  getById: async (id: number): Promise<Empresa> => {
    const response = await api.get(`/api/rutas/empresas/${id}/`);
    return response.data;
  },

  // Obtener rutas de una empresa
  getRutas: async (empresaId: number): Promise<Ruta[]> => {
    const response = await api.get(`/api/rutas/empresas/${empresaId}/rutas/`);
    return response.data;
  },
};

export const rutasAPI = {
  // Obtener todas las rutas
  getAll: async (): Promise<Ruta[]> => {
    const response = await api.get('/api/rutas/');
    return response.data;
  },

  // Obtener una ruta por ID
  getById: async (id: number): Promise<Ruta> => {
    const response = await api.get(`/api/rutas/${id}/`);
    return response.data;
  },

  // Obtener datos JSON completos de la ruta (con coordenadas y paraderos)
  getJSON: async (id: number): Promise<RutaJSON> => {
    const response = await api.get(`/api/rutas/ruta/${id}/json/`);
    return response.data;
  },
};

export default api;