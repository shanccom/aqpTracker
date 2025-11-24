import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, MapPin, Navigation, ArrowRight, Clock, Star, Users } from 'lucide-react';
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

// Interfaces (No modificadas, asumo que están en src/types en una aplicación real)
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
  // --- LÓGICA EXISTENTE NO MODIFICADA ---
  const [rutaCompleta, setRutaCompleta] = useState<RutaCompleta | null>(null);
  const [tipoActivo, setTipoActivo] = useState<'IDA' | 'VUELTA'>('IDA');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Lógica de Fetching (se mantiene)
  useEffect(() => {
    const fetchRuta = async () => { /* ... código de fetching ... */ 
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

  // Lógica de Inicialización de Leaflet (se mantiene)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const map = L.map(mapContainerRef.current).setView([-16.4090, -71.5375], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    mapRef.current = map;
    setTimeout(() => { mapRef.current?.invalidateSize(); }, 300);
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [rutaCompleta]);

  // Lógica de Dibujado de Recorrido (se mantiene)
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
      opacity: 0.8
    }).addTo(mapRef.current);

    recorrido.paraderos.forEach((paradero, index) => {
      const marker = L.marker([paradero.latitud, paradero.longitud], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: ${color}; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">${index + 1}</div>`,
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
  // --- FIN DE LA LÓGICA EXISTENTE ---


  // --- MANEJO DE ESTADOS DE CARGA/ERROR (Mejorado) ---

  if (loading) {
    // Se mantiene el loading, pero se hace más limpio
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button onClick={onBack} className="text-gray-500 hover:text-red-500 font-medium mb-6">
            <ArrowLeft size={20} className="inline mr-2" /> Volver a rutas
        </button>
        <div className="flex flex-col justify-center items-center p-20 bg-gray-50 rounded-xl shadow-sm h-96">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-lg font-medium text-gray-600">Cargando detalles de la ruta...</div>
        </div>
      </div>
    );
  }

  if (error || !rutaCompleta) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button onClick={onBack} className="text-gray-500 hover:text-red-500 font-medium mb-6">
            <ArrowLeft size={20} className="inline mr-2" /> Volver a rutas
        </button>
        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg mt-8 shadow-sm">
          <p className="text-red-800 font-semibold">Error de Carga</p>
          <p className="text-red-700 mt-1 text-sm">{error || 'No se encontró información para esta ruta.'}</p>
        </div>
      </div>
    );
  }

  // --- CÁLCULOS PARA LA UI ---
  const recorridoActual = rutaCompleta.recorridos.find(r => r.sentido === tipoActivo);
  
  // Paraderos populares: Se mantiene la lógica, se usa para la vista.
  const paraderosPopulares = recorridoActual?.paraderos
    .filter(p => p.es_popular)
    .sort((a, b) => a.orden - b.orden)
    .slice(0, 5) || [];

  // Datos para el panel de información
  const totalParaderos = recorridoActual?.paraderos.length || 0;
  const colorLinea = recorridoActual?.color_linea || (tipoActivo === 'IDA' ? '#3b82f6' : '#ef4444');
  const colorFondo = tipoActivo === 'IDA' ? 'bg-blue-600' : 'bg-red-600';


  // --- RENDERIZADO PRINCIPAL (MEJORADO) ---

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Botón volver */}
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-gray-500 hover:text-orange-600 font-medium mb-8 transition-colors duration-200 group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
        <span>Volver a Rutas</span>
      </button>

      {/* Contenedor principal */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        
        {/* Header con información de la ruta (Más limpio y clave) */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{rutaCompleta.nombre}</h1>
          <div className="flex items-center gap-4 text-gray-500 text-lg font-medium">
            <Navigation size={20} className="text-orange-500" />
            <span>Empresa: <strong className="text-gray-800">{rutaCompleta.empresa}</strong></span>
            {rutaCompleta.codigo && (
              <span className="bg-gray-200 text-gray-700 text-sm font-bold px-3 py-1 rounded-full">
                CÓDIGO: {rutaCompleta.codigo}
              </span>
            )}
          </div>
        </div>
        
        {/* Contenedor del mapa y sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Mapa (Ancho completo en pantallas pequeñas, flexible en grandes) */}
          <div className="flex-1 order-2 lg:order-1 rounded-xl overflow-hidden shadow-lg border-2 border-gray-200" style={{ minHeight: '60vh', maxHeight: '700px' }}>
            <div 
              ref={mapContainerRef} 
              className="w-full h-full"
              style={{ minHeight: '60vh', height: '100%' }}
            />
          </div>

          {/* Sidebar (Panel de Control y Detalles) */}
          <div className="w-full lg:w-96 order-1 lg:order-2 space-y-6">
            
            {/* Control de Sentido (Botones IDA/VUELTA mejorados) */}
            <div className={`p-4 rounded-xl shadow-md border ${tipoActivo === 'IDA' ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                <p className="text-lg font-semibold mb-3 text-gray-800">Seleccionar Sentido:</p>
                <div className="flex gap-3">
                    <button
                        onClick={() => setTipoActivo('IDA')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all duration-200 w-full justify-center ${
                            tipoActivo === 'IDA' 
                                ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                                : 'bg-gray-200 text-gray-700 hover:bg-blue-100'
                        }`}
                    >
                        <ArrowRight size={18} />
                        <span>RUTA IDA</span>
                    </button>
                    <button
                        onClick={() => setTipoActivo('VUELTA')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all duration-200 w-full justify-center ${
                            tipoActivo === 'VUELTA' 
                                ? 'bg-red-600 text-white shadow-lg transform scale-105' 
                                : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                        }`}
                    >
                        <ArrowLeft size={18} />
                        <span>VUELTA</span>
                    </button>
                </div>
            </div>

            {/* Información del recorrido (Panel de Métricas) */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                    <Clock size={24} className="text-orange-500 mx-auto mb-1" />
                    <p className="text-xl font-bold text-gray-800">{totalParaderos}</p>
                    <p className="text-xs text-gray-500">Paraderos totales</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                    <div className="w-6 h-6 rounded-full mx-auto mb-1" style={{ backgroundColor: colorLinea }}></div>
                    <p className="text-xl font-bold text-gray-800">{tipoActivo}</p>
                    <p className="text-xs text-gray-500">Sentido Activo</p>
                </div>
            </div>


            {/* Lista de Paraderos Populares (Timeline visual) */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4 border-b pb-3">
                <Star size={20} className="text-yellow-500 fill-yellow-500" />
                <h3 className="text-lg font-bold text-gray-800">Paraderos Clave</h3>
              </div>
              
              {paraderosPopulares.length > 0 ? (
                <ol className="relative border-l border-gray-300 ml-4">                  
                  {paraderosPopulares.map((paradero, index) => (
                    <li 
                      key={`${paradero.latitud}-${paradero.longitud}-${index}`}
                      className="mb-4 ml-6"
                    >
                      <span className="absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-4 ring-white shadow-md" style={{ backgroundColor: colorLinea }}>
                        <MapPin size={12} className="text-white"/>
                      </span>
                      <p className="font-semibold text-sm text-gray-800 leading-tight">{paradero.nombre}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {paradero.distancia_metros && `~ ${Math.round(paradero.distancia_metros)}m de distancia`}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-sm flex items-center justify-center gap-1">
                    <Users size={16} /> No hay paraderos populares definidos.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default RutaDetail;