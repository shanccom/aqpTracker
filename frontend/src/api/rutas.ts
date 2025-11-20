export interface Coordenada {
  lat: number;
  lng: number;
}

export interface TiempoEstimado {
  total_minutos: number;
  en_bus_minutos: number;
  caminata_minutos: number;
  caminata_desde_origen: number;
  caminata_hasta_destino: number;
}

export interface ParaderoInfo {
  nombre: string;
  distancia_metros: number;
  orden_en_ruta: number;
}

export interface RutaEncontrada {
  id: number;
  nombre_ruta: string;
  empresa: string;
  sentido: 'IDA' | 'VUELTA';
  color: string;
  coordenadas: [number, number][];
  // Nuevos campos
  tiempo_estimado: TiempoEstimado;
  paraderos: {
    origen: ParaderoInfo;
    destino: ParaderoInfo;
  };
  distancia_total_metros: number;
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