import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, Trash2, Locate } from 'lucide-react';
import { buscarRutasBackend, type Coordenada, type RutaEncontrada } from '../../api/rutas';

// --- Configuración de Iconos (igual que en RutaDetail) ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Iconos personalizados para A y B
const iconoA = L.divIcon({
  className: 'custom-marker-a',
  html: `<div style="background-color: #10b981; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">A</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const iconoB = L.divIcon({
  className: 'custom-marker-b',
  html: `<div style="background-color: #ef4444; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">B</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

export default function Home() {
  // Estados
  const [puntoA, setPuntoA] = useState<Coordenada | null>(null);
  const [puntoB, setPuntoB] = useState<Coordenada | null>(null);
  const [modoSeleccion, setModoSeleccion] = useState<'A' | 'B'>('A'); // Qué punto estamos eligiendo
  
  const [rutasEncontradas, setRutasEncontradas] = useState<RutaEncontrada[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Referencias del Mapa (Leaflet manual)
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerARef = useRef<L.Marker | null>(null);
  const markerBRef = useRef<L.Marker | null>(null);
  const polylinesRef = useRef<L.Polyline[]>([]);

  // 1. Inicializar el mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([-16.409047, -71.536952], 14); // Arequipa Centro

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Evento de Click en el mapa
    map.on('click', (e: L.LeafletMouseEvent) => {
      const nuevaCoord = { lat: e.latlng.lat, lng: e.latlng.lng };
      
      // Usamos una función dentro del evento para leer el estado actualizado de 'modoSeleccion'
      // Pero como los eventos de Leaflet cierran el scope, es mejor disparar un evento custom o usar refs.
      // Truco rápido: Disparamos un evento custom al window para manejarlo en React
      window.dispatchEvent(new CustomEvent('map-click-custom', { detail: nuevaCoord }));
    });

    mapRef.current = map;

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Escuchar clicks del mapa (Puente entre Leaflet y React State)
  useEffect(() => {
    const handleMapClick = (e: any) => {
      const coord = e.detail;
      if (modoSeleccion === 'A') {
        setPuntoA(coord);
        setModoSeleccion('B'); // Auto-cambiar a B para agilizar
      } else {
        setPuntoB(coord);
      }
    };

    window.addEventListener('map-click-custom', handleMapClick);
    return () => window.removeEventListener('map-click-custom', handleMapClick);
  }, [modoSeleccion]);

  // 3. Dibujar Marcadores A y B cuando cambian
  useEffect(() => {
    if (!mapRef.current) return;

    // Marcador A
    if (puntoA) {
      if (markerARef.current) markerARef.current.setLatLng([puntoA.lat, puntoA.lng]);
      else markerARef.current = L.marker([puntoA.lat, puntoA.lng], { icon: iconoA }).addTo(mapRef.current);
    } else if (markerARef.current) {
      markerARef.current.remove();
      markerARef.current = null;
    }

    // Marcador B
    if (puntoB) {
      if (markerBRef.current) markerBRef.current.setLatLng([puntoB.lat, puntoB.lng]);
      else markerBRef.current = L.marker([puntoB.lat, puntoB.lng], { icon: iconoB }).addTo(mapRef.current);
    } else if (markerBRef.current) {
      markerBRef.current.remove();
      markerBRef.current = null;
    }
  }, [puntoA, puntoB]);

  // 4. Dibujar Rutas Encontradas
  useEffect(() => {
    if (!mapRef.current) return;

    // Limpiar líneas anteriores
    polylinesRef.current.forEach(poly => poly.remove());
    polylinesRef.current = [];

    if (rutasEncontradas.length > 0) {
      const bounds = L.latLngBounds([]); // Para ajustar el zoom

      rutasEncontradas.forEach(ruta => {
        const poly = L.polyline(ruta.coordenadas, {
          color: ruta.color || '#3388ff',
          weight: 5,
          opacity: 0.7
        }).addTo(mapRef.current!);

        poly.bindPopup(`<b>${ruta.nombre_ruta}</b><br>${ruta.empresa} (${ruta.sentido})`);
        
        polylinesRef.current.push(poly);
        
        // Agregar coordenadas a los límites para hacer zoom fit
        ruta.coordenadas.forEach(c => bounds.extend(c));
      });

      // Ajustar vista para ver todas las rutas
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [rutasEncontradas]);

  // --- Función para Geolocalización -------------------------------------------
  const handleUsarUbicacion = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que se active el click del contenedor "Input A"
    
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      return;
    }

    setLoading(true); // Reusamos el estado de carga para dar feedback visual

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        const miUbicacion = { lat, lng };

        // 1. Actualizamos el Punto A
        setPuntoA(miUbicacion);
        
        // 2. Movemos el mapa suavemente hacia el usuario
        mapRef.current?.flyTo([lat, lng], 15);

        // 3. Pasamos el turno a seleccionar el Destino
        setModoSeleccion('B');
        
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("No se pudo obtener tu ubicación. Verifica los permisos del navegador.");
        setLoading(false);
      },
      { enableHighAccuracy: true } // Pedimos la mejor precisión posible
    );
  };


  // --- Lógica de Negocio ---
  const handleBuscar = async () => {
    if (!puntoA || !puntoB) return;
    
    setLoading(true);
    setError(null);
    setRutasEncontradas([]); // Limpiar anteriores

    try {
      const resultados = await buscarRutasBackend(puntoA, puntoB);
      setRutasEncontradas(resultados);
      
      if (resultados.length === 0) {
        setError("No se encontraron rutas que pasen cerca de ambos puntos (Radio 500m).");
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const limpiarMapa = () => {
    setPuntoA(null);
    setPuntoB(null);
    setRutasEncontradas([]);
    setModoSeleccion('A');
    setError(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* PANEL LATERAL (SIDEBAR) */}
      <div className="w-96 bg-white shadow-xl z-10 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Navigation className="text-red-500" />
            AQPTracker
          </h1>
          <p className="text-sm text-gray-500 mt-1">Encuentra tu ruta ideal</p>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          
          {/* Controles de Puntos */}
          <div className="space-y-4">
            {/* Input Punto A */}
            <div 
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${modoSeleccion === 'A' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
              onClick={() => setModoSeleccion('A')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">A</div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Origen</p>
                  <p className="text-sm font-medium text-gray-700">
                    {puntoA ? `${puntoA.lat.toFixed(4)}, ${puntoA.lng.toFixed(4)}` : 'Click en el mapa...'}
                  </p>
                </div>
                {/* --- NUEVO BOTÓN GPS --- */}
                <button
                  onClick={handleUsarUbicacion}
                  className="p-2 bg-white text-gray-500 rounded-full shadow-sm border border-gray-200 hover:text-green-600 hover:border-green-500 transition-all"
                  title="Usar mi ubicación actual"
                >
                  <Locate size={18} />
                </button>
                {/* ----------------------- */}
              </div>
            </div>

            {/* Input Punto B */}
            <div 
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${modoSeleccion === 'B' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'}`}
              onClick={() => setModoSeleccion('B')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">B</div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Destino</p>
                  <p className="text-sm font-medium text-gray-700">
                    {puntoB ? `${puntoB.lat.toFixed(4)}, ${puntoB.lng.toFixed(4)}` : 'Click en el mapa...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
            <div className="flex gap-3">
              <button
                onClick={handleBuscar}
                disabled={!puntoA || !puntoB || loading}
                className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 px-4 rounded-lg font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                {loading ? (
                  <span key="loading" className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Buscando...</span>
                  </span>
                ) : (
                  <span key="idle" className="flex items-center gap-2">
                    <Search size={18} />
                    <span>Buscar Rutas</span>
                  </span>
                )}
              </button>
              
              <button
                onClick={limpiarMapa}
                className="p-3 text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 hover:text-red-500 transition-colors"
                title="Limpiar mapa"
              >
                <Trash2 size={20} />
              </button>
            </div>

          {/* Mensajes de Error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Lista de Resultados */}
          {rutasEncontradas.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-gray-800 border-b pb-2">
                {rutasEncontradas.length} Rutas encontradas
              </h3>
              {rutasEncontradas.map((ruta) => (
                <div key={ruta.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-10 rounded-full" style={{ backgroundColor: ruta.color }}></div>
                    <div>
                      <h4 className="font-bold text-gray-800">{ruta.nombre_ruta}</h4>
                      <p className="text-xs text-gray-500">{ruta.empresa}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${ruta.sentido === 'IDA' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700' }`}>
                    {ruta.sentido}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* MAPA */}
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 0 }} />
        
        {/* Instrucción flotante */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm font-medium text-gray-700 border border-gray-200 z-[1000]">
          {modoSeleccion === 'A' ? '📍 Haz click en el mapa para el punto de INICIO' : '🏁 Haz click para el punto de DESTINO'}
        </div>
      </div>
    </div>
  );
}