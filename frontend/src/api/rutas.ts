export interface Coordenada {
  lat: number;
  lng: number;
}
export interface Distancias {
  total_metros: number;
  en_bus_metros: number;
  caminata_metros: number;
  caminata_desde_origen: number;
  caminata_hasta_destino: number;
}
export interface TiempoEstimado {
  total_minutos: number;
  en_bus_minutos: number;
  caminata_minutos: number;
  caminata_desde_origen: number;
  caminata_hasta_destino: number;
  tiempo_transbordo: number;
}

export interface ParaderoInfo {
  nombre: string;
  distancia_metros: number;
  orden_en_ruta: number;
  ruta?: string;
}

export interface ParaderoTransbordo {
  nombre: string;
  ruta_origen: string;
  ruta_destino: string;
  orden_en_ruta_origen?: number;
  orden_en_ruta_destino?: number;
}

export interface SegmentoRuta {
  ruta_id: number;
  ruta_nombre: string;
  empresa: string;
  color: string;
  desde: string;
  hasta: string;
  tiempo_minutos: number;
  distancia_metros: number;  // ← NUEVO
  tipo: 'bus' | 'caminata';
  orden_inicio?: number;
  orden_fin?: number;
}

export interface RutaEncontrada {
  id: number | string;
  nombre_ruta: string;
  empresa: string;
  sentido: 'IDA' | 'VUELTA' | 'COMBINADA';
  color: string;
  coordenadas: [number, number][];
  tiempo_estimado: TiempoEstimado;
  distancias: Distancias;  // ← NUEVO
  paraderos: {
    origen: ParaderoInfo;
    destino: ParaderoInfo;
    transbordo?: ParaderoTransbordo;
  };
  tipo: 'directa' | 'combinada';
  transbordos: number;
  segmentos: SegmentoRuta[];
}

export async function buscarRutasBackend(
  puntoA: Coordenada, 
  puntoB: Coordenada
): Promise<RutaEncontrada[]> {
  try {
    const response = await fetch('http://localhost:8000/api/rutas/buscar/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        punto_a: puntoA,
        punto_b: puntoB
      }),
    });
    
    if (!response.ok) {
      throw new Error('Error en la búsqueda de rutas');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error buscando rutas:', error);
    throw error;
  }
}