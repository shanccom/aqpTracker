import type { Ruta, Empresa, Estadisticas } from '../pages/Rutas/types';

const API_URL = 'http://localhost:8000/api';

export const rutasService = {
  // Obtener todas las rutas con filtro opcional de empresa
  async getRutas(empresaId?: number): Promise<Ruta[]> {
    const url = empresaId 
      ? `${API_URL}/rutas/?empresa=${empresaId}`
      : `${API_URL}/rutas/`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error al cargar rutas');
    }
    return response.json();
  },

  // Obtener detalle de una ruta específica
  async getRutaById(id: number): Promise<Ruta> {
    const response = await fetch(`${API_URL}/rutas/${id}/`);
    if (!response.ok) {
      throw new Error('Error al cargar detalle de ruta');
    }
    return response.json();
  },

  // Obtener todas las empresas
  async getEmpresas(): Promise<Empresa[]> {
    const response = await fetch(`${API_URL}/empresas/`);
    if (!response.ok) {
      throw new Error('Error al cargar empresas');
    }
    return response.json();
  },

  // Obtener estadísticas generales
  async getEstadisticas(): Promise<Estadisticas> {
    const response = await fetch(`${API_URL}/rutas/estadisticas/`);
    if (!response.ok) {
      throw new Error('Error al cargar estadísticas');
    }
    return response.json();
  },

  // Buscar rutas que conecten dos puntos
  async buscarConexion(
    latOrigen: number,
    lngOrigen: number,
    latDestino: number,
    lngDestino: number,
    radio: number = 0.01
  ): Promise<Ruta[]> {
    const url = `${API_URL}/rutas/buscar_conexion/?lat_origen=${latOrigen}&lng_origen=${lngOrigen}&lat_destino=${latDestino}&lng_destino=${lngDestino}&radio=${radio}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error al buscar conexiones');
    }
    return response.json();
  }
};
