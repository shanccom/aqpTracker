export interface Empresa {
  id: number;
  nombre: string;
  descripcion?: string;
  color_principal?: string;
}

export interface Ruta {
  id: number;
  nombre: string;
  codigo: string;
  empresa: number;
}

export interface Paradero {
  nombre: string;
  latitud: number;
  longitud: number;
  es_popular: boolean;
  orden: number;
  distancia_metros: number;
}

export interface Recorrido {
  id: number;
  sentido: 'IDA' | 'VUELTA';
  color_linea: string;
  grosor_linea: number;
  coordenadas: [number, number][]; // array de [lat, lng]
  paraderos: Paradero[];
}

export interface RutaCompleta {
  codigo: string;
  nombre: string;
  empresa: string;
  recorridos: Recorrido[];
}
