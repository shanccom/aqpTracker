export interface Empresa {
    id: number;
    nombre: string;
    color: string;
    telefono: string;
    total_rutas: number;
  }
  
  export interface Parada {
    id: number;
    nombre: string;
    latitud: number;
    longitud: number;
    direccion: string;
    referencia: string;
    es_terminal: boolean;
  }
  
  export interface RutaParada {
    id: number;
    orden: number;
    tiempo_estimado_desde_inicio: number;
    parada: Parada;
  }
  
  export interface Ruta {
    id: number;
    codigo: string;
    nombre: string;
    empresa_nombre?: string;
    empresa_color?: string;
    precio: number;
    frecuencia_minutos: number;
    total_paradas: number;
    activa: boolean;
    empresa?: Empresa;
    paradas?: RutaParada[];
    horario_inicio?: string;
    horario_fin?: string;
    distancia_km?: number;
    tiempo_total_estimado?: number;
  }
  
  export interface Estadisticas {
    total_rutas: number;
    total_empresas: number;
    total_paradas: number;
    precio_promedio: number;
  }