import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, Trash2, Locate } from 'lucide-react';
import { buscarRutasBackend, type Coordenada, type RutaEncontrada } from '../../api/rutas';

// --- Configuración de Iconos ---
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

// Tipo para estado de búsqueda
type EstadoBusqueda = 'idle' | 'buscando' | 'exito' | 'error' | 'sin_resultados';

export default function Home() {
  // Estados principales
  const [puntoA, setPuntoA] = useState<Coordenada | null>(null);
  const [puntoB, setPuntoB] = useState<Coordenada | null>(null);
  const [direccionA, setDireccionA] = useState('');
  const [direccionB, setDireccionB] = useState('');
  
  // Estados mejorados
  const [estadoBusqueda, setEstadoBusqueda] = useState<EstadoBusqueda>('idle');
  const [rutasEncontradas, setRutasEncontradas] = useState<RutaEncontrada[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Referencias
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerARef = useRef<L.Marker | null>(null);
  const markerBRef = useRef<L.Marker | null>(null);
  const polylinesRef = useRef<L.Polyline[]>([]);
  const modoSeleccionRef = useRef<'A' | 'B'>('A');

  // Función para actualizar modo (state + ref)
  const setModoSeleccion = (modo: 'A' | 'B') => {
    modoSeleccionRef.current = modo;
  };

  // 1. Inicializar el mapa (MEJORADO)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([-16.409047, -71.536952], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Evento de Click en el mapa (MEJORADO)
    map.on('click', (e: L.LeafletMouseEvent) => {
      const coord = { lat: e.latlng.lat, lng: e.latlng.lng };
      const modoActual = modoSeleccionRef.current; // ✅ Usar ref siempre actualizado
      
      if (modoActual === 'A') {
        setPuntoA(coord);
        setDireccionA(`📍 ${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}`);
        setModoSeleccion('B');
      } else {
        setPuntoB(coord);
        setDireccionB(`🏁 ${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}`);
      }
    });

    mapRef.current = map;

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Dibujar Marcadores A y B cuando cambian
  useEffect(() => {
    if (!mapRef.current) return;

    // Marcador A
    if (puntoA) {
      if (markerARef.current) {
        markerARef.current.setLatLng([puntoA.lat, puntoA.lng]);
      } else {
        markerARef.current = L.marker([puntoA.lat, puntoA.lng], { icon: iconoA })
          .addTo(mapRef.current)
          .bindPopup('<b>Punto de Partida</b><br>Origen de tu ruta');
      }
    } else if (markerARef.current) {
      markerARef.current.remove();
      markerARef.current = null;
    }

    // Marcador B
    if (puntoB) {
      if (markerBRef.current) {
        markerBRef.current.setLatLng([puntoB.lat, puntoB.lng]);
      } else {
        markerBRef.current = L.marker([puntoB.lat, puntoB.lng], { icon: iconoB })
          .addTo(mapRef.current)
          .bindPopup('<b>Punto de Destino</b><br>Destino de tu ruta');
      }
    } else if (markerBRef.current) {
      markerBRef.current.remove();
      markerBRef.current = null;
    }

    // Ajustar vista si hay ambos puntos
    if (puntoA && puntoB && mapRef.current) {
      const bounds = L.latLngBounds([puntoA, puntoB]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [puntoA, puntoB]);

  // 3. Dibujar Rutas Encontradas (OPTIMIZADO)
  useEffect(() => {
    if (!mapRef.current) return;

    // Limpiar líneas anteriores
    polylinesRef.current.forEach(poly => poly.remove());
    polylinesRef.current = [];

    if (rutasEncontradas.length > 0) {
      const bounds = L.latLngBounds([]);
      const rutasPorColor = new Map<string, L.LatLng[]>();

      // Agrupar coordenadas por color para optimizar
      rutasEncontradas.forEach(ruta => {
        const color = ruta.color || '#3388ff';
        if (!rutasPorColor.has(color)) {
          rutasPorColor.set(color, []);
        }
        rutasPorColor.get(color)?.push(...ruta.coordenadas.map(coord => L.latLng(coord[0], coord[1])));
        
        // Crear polyline individual para cada ruta (mantener interactividad)
        const poly = L.polyline(ruta.coordenadas, {
          color: color,
          weight: 6,
          opacity: 0.8,
          lineCap: 'round'
        }).addTo(mapRef.current!);

        poly.bindPopup(`
          <div class="p-2">
            <b class="text-lg">${ruta.nombre_ruta}</b><br>
            <span class="text-sm text-gray-600">${ruta.empresa}</span><br>
            <span class="text-xs ${ruta.sentido === 'IDA' ? 'text-blue-600' : 'text-orange-600'} font-bold">
              ${ruta.sentido}
            </span>
          </div>
        `);

        // Efecto hover
        poly.on('mouseover', function() {
          poly.setStyle({ weight: 8, opacity: 1 });
        });
        poly.on('mouseout', function() {
          poly.setStyle({ weight: 6, opacity: 0.8 });
        });

        polylinesRef.current.push(poly);
        ruta.coordenadas.forEach(c => bounds.extend(c));
      });

      // Ajustar vista para ver todas las rutas
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      }
    }
  }, [rutasEncontradas]);

  // --- Lógica de Negocio MEJORADA ---
  const handleBuscar = async () => {
    if (!puntoA || !puntoB) {
      setError("Por favor selecciona ambos puntos en el mapa");
      return;
    }
    
    setEstadoBusqueda('buscando');
    setError(null);
    setRutasEncontradas([]);

    try {
      const resultados = await buscarRutasBackend(puntoA, puntoB);
      
      if (resultados.length === 0) {
        setEstadoBusqueda('sin_resultados');
        setError("No se encontraron rutas directas. ¿Quieres intentar con una búsqueda más amplia?");
      } else {
        setRutasEncontradas(resultados);
        setEstadoBusqueda('exito');
      }
    } catch (err) {
      setEstadoBusqueda('error');
      setError(err instanceof Error ? err.message : "Error de conexión con el servidor");
    }
  };

  const limpiarMapa = () => {
    setPuntoA(null);
    setPuntoB(null);
    setDireccionA('');
    setDireccionB('');
    setRutasEncontradas([]);
    setModoSeleccion('A');
    setEstadoBusqueda('idle');
    setError(null);
  };

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) {
      setError("La geolocalización no es soportada por tu navegador");
      return;
    }

    setEstadoBusqueda('buscando');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coord = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setPuntoA(coord);
        setDireccionA('📍 Mi ubicación actual');
        setModoSeleccion('B');
        setEstadoBusqueda('idle');
        
        // Mover mapa a la ubicación
        if (mapRef.current) {
          mapRef.current.setView([coord.lat, coord.lng], 15);
        }
      },
      (error) => {
        setEstadoBusqueda('error');
        setError(`Error obteniendo ubicación: ${error.message}`);
      }
    );
  };

  // Función para geocodificación (placeholder para futura implementación)
  const buscarPorDireccion = async (direccion: string, tipo: 'A' | 'B') => {
    // TODO: Integrar con servicio de geocodificación
    setError("Búsqueda por dirección pronto disponible");
  };

  const getModoActual = () => modoSeleccionRef.current;

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* PANEL LATERAL MEJORADO */}
      <div className="w-96 bg-white shadow-xl z-10 flex flex-col">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Navigation className="text-red-500" />
            AQPTracker
          </h1>
          <p className="text-sm text-gray-600 mt-1">Planifica tu ruta de transporte público</p>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          
          {/* Controles de Puntos MEJORADOS */}
          <div className="space-y-4">
            {/* Punto A con geolocalización */}
            <div className="space-y-2">
              <div 
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  getModoActual() === 'A' 
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                    : 'border-gray-200 hover:border-green-300'
                }`}
                onClick={() => setModoSeleccion('A')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">A</div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-semibold uppercase">Origen</p>
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {direccionA || 'Click en el mapa...'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Botón de geolocalización solo para punto A */}
              {!puntoA && (
                <button
                  onClick={usarMiUbicacion}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  <Locate size={14} />
                  Usar mi ubicación actual
                </button>
              )}
            </div>

            {/* Punto B */}
            <div 
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                getModoActual() === 'B' 
                  ? 'border-red-500 bg-red-50 ring-2 ring-red-200' 
                  : 'border-gray-200 hover:border-red-300'
              }`}
              onClick={() => setModoSeleccion('B')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">B</div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Destino</p>
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {direccionB || 'Click en el mapa...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción MEJORADOS */}
          <div className="flex gap-3">
            <button
              onClick={handleBuscar}
              disabled={!puntoA || !puntoB || estadoBusqueda === 'buscando'}
              className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 px-4 rounded-lg font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {estadoBusqueda === 'buscando' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>Buscar Rutas</span>
                </>
              )}
            </button>
            
            <button
              onClick={limpiarMapa}
              className="p-3 text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 hover:text-red-500 transition-colors flex items-center justify-center"
              title="Limpiar mapa"
            >
              <Trash2 size={20} />
            </button>
          </div>

          {/* Mensajes de Estado MEJORADOS */}
          {error && (
            <div className={`p-4 rounded-lg border-l-4 ${
              estadoBusqueda === 'sin_resultados' 
                ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                : 'bg-red-50 border-red-500 text-red-700'
            }`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {estadoBusqueda === 'sin_resultados' ? '⚠️' : '❌'}
                </div>
                <div>
                  <p className="font-medium">{error}</p>
                  {estadoBusqueda === 'sin_resultados' && (
                    <button className="mt-2 text-sm bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded transition-colors">
                      Buscar con combinaciones
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lista de Resultados MEJORADA */}
          {estadoBusqueda === 'exito' && rutasEncontradas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-gray-800 text-lg">
                  {rutasEncontradas.length} {rutasEncontradas.length === 1 ? 'Ruta encontrada' : 'Rutas encontradas'}
                </h3>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  ✓ Listo
                </span>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {rutasEncontradas.map((ruta, index) => (
                  <div 
                    key={`${ruta.id}-${index}`} 
                    className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300 cursor-pointer"
                    onClick={() => {
                      // Zoom a la ruta específica
                      if (mapRef.current && ruta.coordenadas.length > 0) {
                        const bounds = L.latLngBounds(ruta.coordenadas);
                        mapRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-3 h-8 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: ruta.color || '#3388ff' }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 truncate">{ruta.nombre_ruta}</h4>
                        <p className="text-xs text-gray-500 truncate">{ruta.empresa}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        ruta.sentido === 'IDA' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {ruta.sentido}
                      </span>
                      <span className="text-xs text-gray-500">
                        {ruta.coordenadas.length} puntos
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estado de carga mejorado */}
          {estadoBusqueda === 'buscando' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-gray-600 font-medium">Buscando rutas óptimas...</p>
              <p className="text-sm text-gray-500 mt-1">Analizando todas las opciones</p>
            </div>
          )}
        </div>
      </div>

      {/* MAPA MEJORADO */}
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Instrucción flotante MEJORADA */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg border border-gray-200 z-[1000]">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getModoActual() === 'A' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-sm font-medium text-gray-700">
              {getModoActual() === 'A' 
                ? '📍 Haz click en el mapa para el punto de INICIO' 
                : '🏁 Haz click para el punto de DESTINO'
              }
            </span>
          </div>
        </div>

        {/* Leyenda del mapa */}
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-gray-200 z-[1000]">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">Origen (A)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">Destino (B)</span>
            </div>
            {rutasEncontradas.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Rutas encontradas</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}