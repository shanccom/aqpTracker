import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Interfaces
interface Paradero {
  nombre: string;
  latitud: number;
  longitud: number;
  es_popular?: boolean;
  orden: number;
  distancia_metros?: number;
}

interface Recorrido {
  id: number;
  sentido: 'IDA' | 'VUELTA';
  color_linea: string;
  grosor_linea: number;
  coordenadas: [number, number][];
  paraderos: Paradero[];
}

interface RutaCompleta {
  codigo: string;
  nombre: string;
  empresa: string;
  recorridos: Recorrido[];
}

interface RutaDetailProps {
  rutaId: number;
  onBack: () => void;
}

const API_BASE_URL = 'http://localhost:8000';

const RutaDetail = ({ rutaId, onBack }: RutaDetailProps) => {
  const [rutaCompleta, setRutaCompleta] = useState<RutaCompleta | null>(null);
  const [tipoActivo, setTipoActivo] = useState<'IDA' | 'VUELTA'>('IDA');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    const fetchRuta = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/rutas/ruta/${rutaId}/json/`);
        if (!response.ok) throw new Error('Error al cargar ruta completa');
        const data = await response.json();
        setRutaCompleta(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchRuta();
  }, [rutaId]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current).setView([-16.4090, -71.5375], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    mapRef.current = map;

    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 300);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [rutaCompleta]);

  useEffect(() => {
    if (!mapRef.current || !rutaCompleta) return;

    const recorrido = rutaCompleta.recorridos.find(r => r.sentido === tipoActivo);
    if (!recorrido) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    polylineRef.current?.remove();
    polylineRef.current = null;

    const coordinates = recorrido.coordenadas;
    const color = recorrido.color_linea || (tipoActivo === 'IDA' ? '#3b82f6' : '#ef4444');

    polylineRef.current = L.polyline(coordinates, {
      color,
      weight: recorrido.grosor_linea || 4,
      opacity: 0.7
    }).addTo(mapRef.current);

    recorrido.paraderos.forEach((paradero, index) => {
      const marker = L.marker([paradero.latitud, paradero.longitud], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: ${color}; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(mapRef.current!);

      const popularBadge = paradero.es_popular ? '⭐' : '';
      marker.bindPopup(`<b>${paradero.nombre}</b> ${popularBadge}<br>Paradero ${index + 1} (${recorrido.sentido})`);
      markersRef.current.push(marker);
    });

    if (coordinates.length > 0) {
      mapRef.current.fitBounds(polylineRef.current.getBounds(), { 
        padding: [50, 50],
        maxZoom: 16 
      });
    }
  }, [rutaCompleta, tipoActivo]);

  const decodePolyline = (encoded: string): [number, number][] => {
    const points: [number, number][] = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push([lat / 1e5, lng / 1e5]);
    }
    return points;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="text-blue-600 hover:text-blue-800 font-medium">
          ← Volver a rutas
        </button>
        <div className="flex justify-center items-center p-8 bg-white rounded-lg">
          <div className="text-lg">Cargando ruta...</div>
        </div>
      </div>
    );
  }

  if (error || !rutaCompleta) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="text-blue-600 hover:text-blue-800 font-medium">
          ← Volver a rutas
        </button>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error || 'No se encontró la ruta'}
        </div>
      </div>
    );
  }

  const recorridoActual = rutaCompleta.recorridos.find(r => r.sentido === tipoActivo);
  const paraderosPopulares = recorridoActual?.paraderos
    .filter(p => p.es_popular)
    .sort((a, b) => a.orden - b.orden)
    .slice(0, 5) || [];

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-blue-600 hover:text-blue-800 font-medium">
        ← Volver a rutas
      </button>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{rutaCompleta.nombre}</h2>
            {rutaCompleta.codigo && <span className="text-sm text-gray-600">Código: {rutaCompleta.codigo}</span>}
            {rutaCompleta.empresa && <span className="text-sm text-gray-500 block">Empresa: {rutaCompleta.empresa}</span>}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setTipoActivo('IDA')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                tipoActivo === 'IDA' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              IDA
            </button>
            <button
              onClick={() => setTipoActivo('VUELTA')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                tipoActivo === 'VUELTA' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              VUELTA
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 bg-gray-200 rounded-lg" style={{ minHeight: '600px' }}>
            <div 
              ref={mapContainerRef} 
              className="w-full h-full rounded-lg border-2 border-gray-300 bg-gray-100"
              style={{ minHeight: '600px', height: '600px' }}
            />
          </div>

          <div className="w-80">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                Paraderos Populares
              </h3>
              {paraderosPopulares.length > 0 ? (
                <div className="space-y-2">
                  {paraderosPopulares.map((paradero, index) => (
                    <div
                      key={`${paradero.latitud}-${paradero.longitud}-${index}`}
                      className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-2">
                        <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-800">{paradero.nombre}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Orden: {paradero.orden} {paradero.distancia_metros && `• ${Math.round(paradero.distancia_metros)}m`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No hay datos de popularidad disponibles</p>
              )}
            </div>

            <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-bold mb-2">Información del recorrido</h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">Tipo:</span> {tipoActivo}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Paraderos:</span> {recorridoActual?.paraderos.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RutaDetail;
