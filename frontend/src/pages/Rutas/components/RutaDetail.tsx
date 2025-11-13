import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, MapPin, Star, Navigation, ArrowRight, Info } from 'lucide-react';

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

      const popularBadge = paradero.es_popular ? '<span style="color: #f59e0b;">★</span>' : '';
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium mb-6 transition-colors duration-200 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
          <span>Volver a rutas</span>
        </button>
        <div className="flex flex-col justify-center items-center p-12">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-lg font-medium text-gray-600">Cargando ruta...</div>
        </div>
      </div>
    );
  }

  if (error || !rutaCompleta) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium mb-6 transition-colors duration-200 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
          <span>Volver a rutas</span>
        </button>
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-red-50 border-l-4 border-red-500 px-6 py-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Error al cargar la ruta</p>
                <p className="text-sm text-red-700 mt-1">{error || 'No se encontró la ruta'}</p>
              </div>
            </div>
          </div>
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
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Botón volver */}
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium mb-6 transition-colors duration-200 group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
        <span>Volver a rutas</span>
      </button>

      {/* Contenedor principal */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        {/* Header con información de la ruta */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-400 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <Navigation size={28} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-1">{rutaCompleta.nombre}</h2>
              <div className="flex items-center gap-3">
                {rutaCompleta.codigo && (
                  <span className="bg-gradient-to-r from-red-500 to-orange-400 text-white text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                    {rutaCompleta.empresa}
                  </span>
                )}

              </div>
            </div>
          </div>
          
          {/* Botones IDA/VUELTA */}
          <div className="flex gap-3">
            <button
              onClick={() => setTipoActivo('IDA')}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm ${
                tipoActivo === 'IDA' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ArrowRight size={18} />
              <span>IDA</span>
            </button>
            <button
              onClick={() => setTipoActivo('VUELTA')}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm ${
                tipoActivo === 'VUELTA' 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ArrowLeft size={18} />
              <span>VUELTA</span>
            </button>
          </div>
        </div>

        {/* Contenedor del mapa y sidebar */}
        <div className="flex gap-6">
          {/* Mapa */}
          <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ minHeight: '600px' }}>
            <div 
              ref={mapContainerRef} 
              className="w-full h-full"
              style={{ minHeight: '600px', height: '600px' }}
            />
          </div>

          {/* Sidebar */}
          <div className="w-80 space-y-4">
            {/* Paraderos Populares */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border border-orange-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-bold text-gray-800">Paraderos Populares</h3>
              </div>
              
              {paraderosPopulares.length > 0 ? (
                <div className="space-y-3">
                  {paraderosPopulares.map((paradero, index) => (
                    <div
                      key={`${paradero.latitud}-${paradero.longitud}-${index}`}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-orange-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 text-white text-sm font-bold rounded-full flex items-center justify-center shadow-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800 leading-tight">{paradero.nombre}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {paradero.distancia_metros && ` • ${Math.round(paradero.distancia_metros)}m lejos de la ruta`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MapPin size={28} className="text-orange-400" />
                  </div>
                  <p className="text-gray-600 text-sm">No hay datos de popularidad disponibles</p>
                </div>
              )}
            </div>

            {/* Información del recorrido */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-bold text-gray-800">Información del recorrido</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Tipo:</span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    tipoActivo === 'IDA' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {tipoActivo}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RutaDetail;