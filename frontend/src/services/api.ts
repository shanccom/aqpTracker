import type { Empresa, Ruta, RutaCompleta, Recorrido  } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const rutasAPI = {
  // Obtener todas las empresas
  getEmpresas: async (): Promise<Empresa[]> => {
    const response = await fetch(`${API_BASE_URL}/api/rutas/empresas/`);
    if (!response.ok) throw new Error('Error al cargar empresas');
    return response.json();
  },

  // Obtener rutas de una empresa
  getRutasEmpresa: async (empresaId: number): Promise<Ruta[]> => {
    const response = await fetch(`${API_BASE_URL}/api/rutas/empresas/${empresaId}/rutas/`);
    if (!response.ok) throw new Error('Error al cargar rutas');
    return response.json();
  },

  // Obtener ruta completa (con IDA y VUELTA)
  getRutaCompleta: async (rutaId: number): Promise<RutaCompleta> => {
    const response = await fetch(`${API_BASE_URL}/api/rutas/ruta/${rutaId}/json/`);
    if (!response.ok) throw new Error('Error al cargar ruta completa');
    return response.json();
  },

  // Obtener recorrido específico (IDA o VUELTA)
  getRecorrido: async (recorridoId: number): Promise<Recorrido> => {
    const response = await fetch(`${API_BASE_URL}/api/rutas/recorrido/${recorridoId}/json/`);
    if (!response.ok) throw new Error('Error al cargar recorrido');
    return response.json();
  }
};