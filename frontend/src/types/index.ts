export interface Empresa {
    id: number;
    nombre: string;
    descripcion: string;
    color_principal: string;
    total_rutas?: number;
  }
  
  export interface Paradero {
    id: number;
    nombre: string;
    latitud: number;
    longitud: number;
    es_popular: boolean;
    descripcion: string;
    orden?: number;
    distancia_metros?: number;
  }
  
  export interface Ruta {
    id: number;
    codigo: string;
    nombre: string;
    sentido: 'IDA' | 'VUELTA';
    empresa: number;
    empresa_nombre?: string;
    color_linea: string;
    grosor_linea: number;
    coordenadas: [number, number][];
    archivo_kml: string;
  }
  
  export interface RutaDetalle extends Ruta {
    paraderos: Paradero[];
  }
  
  export interface RutaJSON {
    codigo: string;
    nombre: string;
    sentido: string;
    empresa: string;
    color_linea: string;
    grosor_linea: number;
    coordenadas: [number, number][];
    paraderos: Paradero[];
  }