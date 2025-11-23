import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, Trash2, Locate, Eye, EyeOff, Route } from 'lucide-react';
import { 
  buscarRutasBackend, 
  buscarRutasCombinadasBackend,
  type Coordenada, 
  type RutaEncontrada,
  type RutaCombinada,
  type ResultadoBusqueda 
} from '../../api/rutas';

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

// Icono para punto de transbordo
const iconoTransbordo = L.divIcon({
  className: 'custom-marker-transbordo',
  html: `<div style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 10px;">T</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Función para formatear distancias
const formatearDistancia = (metros: number): string => {
  if (metros < 1000) {
    return `${Math.round(metros)} m`;
  } else {
    return `${(metros / 1000).toFixed(1)} km`;
  }
};

// Función para determinar el tipo de ruta según las distancias
const obtenerTipoRuta = (distanciaDestino: number): { tipo: string; color: string; badge: string } => {
  if (distanciaDestino <= 50) {
    return { 
      tipo: 'directa', 
      color: 'text-green-600', 
      badge: 'bg-green-100 text-green-800 border-green-200'
    };
  } else if (distanciaDestino <= 200) {
    return { 
      tipo: 'cercana', 
      color: 'text-yellow-600', 
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
  } else {
    return { 
      tipo: 'aproximada', 
      color: 'text-orange-600', 
      badge: 'bg-orange-100 text-orange-800 border-orange-200'
    };
  }
};

export default function Home() {
  // Estados
  const [puntoA, setPuntoA] = useState<Coordenada | null>(null);
  const [puntoB, setPuntoB] = useState<Coordenada | null>(null);
  const [modoSeleccion, setModoSeleccion] = useState<'A' | 'B'>('A');
  
  const [rutasDirectas, setRutasDirectas] = useState<RutaEncontrada[]>([]);
  const [rutasCombinadas, setRutasCombinadas] = useState<RutaCombinada[]>([]);
  const [rutasVisibles, setRutasVisibles] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [buscandoCombinadas, setBuscandoCombinadas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarCombinadas, setMostrarCombinadas] = useState(false);

  // Referencias del Mapa
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerARef = useRef<L.Marker | null>(null);
  const markerBRef = useRef<L.Marker | null>(null);
  const polylinesRef = useRef<{ [key: string]: L.Polyline }>({});
  const markersTransbordoRef = useRef<{ [key: string]: L.Marker }>({});

  // 1. Inicializar el mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([-16.409047, -71.536952], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const nuevaCoord = { lat: e.latlng.lat, lng: e.latlng.lng };
      window.dispatchEvent(new CustomEvent('map-click-custom', { detail: nuevaCoord }));
    });

    mapRef.current = map;

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Escuchar clicks del mapa
  useEffect(() => {
    const handleMapClick = (e: any) => {
      const coord = e.detail;
      if (modoSeleccion === 'A') {
        setPuntoA(coord);
        setModoSeleccion('B');
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

  // 4. Dibujar Rutas Encontradas (VERSIÓN CORREGIDA)
  useEffect(() => {
    if (!mapRef.current) return;

    console.log('Actualizando mapa - Rutas visibles:', rutasVisibles);

    // Limpiar todas las líneas anteriores
    Object.values(polylinesRef.current).forEach(poly => {
      if (poly && mapRef.current) {
        mapRef.current.removeLayer(poly);
      }
    });
    polylinesRef.current = {};

    // Limpiar TODOS los marcadores de transbordo anteriores
    Object.values(markersTransbordoRef.current).forEach(marker => {
      if (marker && mapRef.current) {
        mapRef.current.removeLayer(marker);
      }
    });
    markersTransbordoRef.current = {};

    const bounds = L.latLngBounds([]);
    let hasVisibleRoutes = false;

    // Dibujar rutas directas
    rutasDirectas.forEach(ruta => {
      if (rutasVisibles[`directa-${ruta.id}`] !== false) {
        const poly = L.polyline(ruta.coordenadas, {
          color: ruta.color || '#3388ff',
          weight: 6,
          opacity: 0.8
        }).addTo(mapRef.current!);

        poly.bindPopup(`
          <b>${ruta.nombre_ruta}</b><br>
          ${ruta.empresa} (${ruta.sentido})<br>
          <small>🚗 Ruta directa</small><br>
          <small>Distancia al destino: ${formatearDistancia(ruta.distancia_a_destino)}</small>
        `);
        
        polylinesRef.current[`directa-${ruta.id}`] = poly;
        ruta.coordenadas.forEach(c => bounds.extend(c));
        hasVisibleRoutes = true;
      }
    });

    // Dibujar rutas combinadas
    if (mostrarCombinadas) {
      rutasCombinadas.forEach(combinada => {
        const rutaKey = `combinada-${combinada.id}`;
        
        if (rutasVisibles[rutaKey] !== false) {
          // Dibujar cada segmento de la ruta combinada
          combinada.rutas.forEach((segmento, index) => {
            const color = index === 0 ? '#8b5cf6' : '#ec4899';
            const poly = L.polyline(segmento.segmento_coordenadas, {
              color: color,
              weight: 5,
              opacity: 0.7,
              dashArray: index === 0 ? null : '5, 5'
            }).addTo(mapRef.current!);

            poly.bindPopup(`
              <b>${segmento.ruta.nombre_ruta}</b><br>
              ${segmento.ruta.empresa} (${segmento.ruta.sentido})<br>
              <small>🔄 Segmento ${index + 1} de ruta combinada</small><br>
              <small>Distancia: ${formatearDistancia(segmento.distancia)}</small>
            `);
            
            polylinesRef.current[`${rutaKey}-segmento-${index}`] = poly;
            segmento.segmento_coordenadas.forEach(c => bounds.extend(c));
          });

          // Agregar marcador de transbordo SOLO si la ruta está visible
          const transbordoMarker = L.marker(
            [combinada.punto_transbordo.lat, combinada.punto_transbordo.lng], 
            { icon: iconoTransbordo }
          ).addTo(mapRef.current!);
          
          transbordoMarker.bindPopup(`
            <b>📍 Punto de Transbordo</b><br>
            <small>Cambio de combi aquí</small><br>
            <small>Distancia: ${formatearDistancia(combinada.distancia_transbordo || 0)}</small>
          `);
          
          markersTransbordoRef.current[rutaKey] = transbordoMarker;
          bounds.extend([combinada.punto_transbordo.lat, combinada.punto_transbordo.lng]);
          hasVisibleRoutes = true;
          
          console.log(`Marcador de transbordo agregado para: ${rutaKey}`);
        } else {
          console.log(`Ruta combinada ${rutaKey} está oculta, no dibujar`);
        }
      });
    }

    // Ajustar vista si hay rutas visibles
    if (hasVisibleRoutes && bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // Si no hay rutas visibles, centrar en Arequipa
      mapRef.current.setView([-16.409047, -71.536952], 14);
    }
  }, [rutasDirectas, rutasCombinadas, rutasVisibles, mostrarCombinadas]);

  // 5. Efecto para limpiar TODO cuando se limpia el mapa
  useEffect(() => {
    if (!mapRef.current) return;

    // Si no hay puntos A y B, limpiar todo
    if (!puntoA && !puntoB) {
      console.log('Limpiando mapa - sin puntos A y B');
      
      // Limpiar polylines
      Object.values(polylinesRef.current).forEach(poly => {
        if (poly && mapRef.current) {
          mapRef.current.removeLayer(poly);
        }
      });
      polylinesRef.current = {};

      // Limpiar marcadores de transbordo
      Object.values(markersTransbordoRef.current).forEach(marker => {
        if (marker && mapRef.current) {
          mapRef.current.removeLayer(marker);
        }
      });
      markersTransbordoRef.current = {};

      // Resetear estado de combinadas
      setMostrarCombinadas(false);
    }
  }, [puntoA, puntoB]);

  // --- Función para Geolocalización ---
  const handleUsarUbicacion = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        const miUbicacion = { lat, lng };

        setPuntoA(miUbicacion);
        mapRef.current?.flyTo([lat, lng], 15);
        setModoSeleccion('B');
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("No se pudo obtener tu ubicación. Verifica los permisos del navegador.");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // --- Funciones de Visibilidad ---
  const toggleVisibilidadRuta = (rutaId: string) => {
    console.log(`Alternando visibilidad de: ${rutaId}`);
    
    setRutasVisibles(prev => {
      const nuevoEstado = {
        ...prev,
        [rutaId]: !prev[rutaId]
      };
      
      console.log('Nuevo estado de visibilidad:', nuevoEstado);
      return nuevoEstado;
    });
  };

  const mostrarTodasLasRutas = () => {
    const nuevasVisibilidades: { [key: string]: boolean } = {};
    
    rutasDirectas.forEach(ruta => {
      nuevasVisibilidades[`directa-${ruta.id}`] = true;
    });
    
    rutasCombinadas.forEach(combinada => {
      nuevasVisibilidades[`combinada-${combinada.id}`] = true;
    });
    
    setRutasVisibles(nuevasVisibilidades);
  };

  const ocultarTodasLasRutas = () => {
    const nuevasVisibilidades: { [key: string]: boolean } = {};
    
    rutasDirectas.forEach(ruta => {
      nuevasVisibilidades[`directa-${ruta.id}`] = false;
    });
    
    rutasCombinadas.forEach(combinada => {
      nuevasVisibilidades[`combinada-${combinada.id}`] = false;
    });
    
    setRutasVisibles(nuevasVisibilidades);
  };

  // --- Lógica de Búsqueda ---
  const buscarRutasCombinadas = async () => {
    if (!puntoA || !puntoB) return;
    
    console.log('Iniciando búsqueda de rutas combinadas...');
    setBuscandoCombinadas(true);
    setError(null);

    try {
      // Limpiar rutas combinadas anteriores y sus marcadores
      setRutasCombinadas([]);
      setMostrarCombinadas(false);
      
      // Pequeño delay para asegurar la limpieza
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const resultados = await buscarRutasCombinadasBackend(puntoA, puntoB);
      console.log('Rutas combinadas encontradas:', resultados.length);
      
      if (resultados && resultados.length > 0) {
        setRutasCombinadas(resultados);
        setMostrarCombinadas(true);
        
        // Hacer visibles todas las rutas combinadas por defecto
        const nuevasVisibilidades = { ...rutasVisibles };
        resultados.forEach((combinada: RutaCombinada) => {
          nuevasVisibilidades[`combinada-${combinada.id}`] = true;
        });
        setRutasVisibles(nuevasVisibilidades);
        
        console.log('Rutas combinadas configuradas como visibles');
      } else {
        setError("No se encontraron rutas combinadas posibles. Intenta con puntos diferentes.");
      }
    } catch (err: any) {
      console.error('Error al buscar rutas combinadas:', err);
      
      if (err.response?.data?.error) {
        setError(`Error del servidor: ${err.response.data.error}`);
      } else if (err.code === 'ECONNABORTED') {
        setError("La búsqueda está tomando demasiado tiempo. Intenta con puntos más cercanos.");
      } else {
        setError("Error al conectar con el servidor. Verifica tu conexión.");
      }
    } finally {
      setBuscandoCombinadas(false);
    }
  };

  const handleBuscar = async () => {
    if (!puntoA || !puntoB) return;
    
    console.log('Iniciando búsqueda directa...', { puntoA, puntoB });
    setLoading(true);
    setError(null);
    setRutasDirectas([]);
    setRutasCombinadas([]);
    setRutasVisibles({});
    setMostrarCombinadas(false);

    try {
      console.log('Llamando a buscarRutasBackend...');
      const resultados: ResultadoBusqueda = await buscarRutasBackend(puntoA, puntoB);
      console.log('Respuesta recibida:', resultados);
      
      setRutasDirectas(resultados.rutas_directas);
      
      // Hacer visibles todas las rutas directas por defecto
      const nuevasVisibilidades: { [key: string]: boolean } = {};
      resultados.rutas_directas.forEach(ruta => {
        nuevasVisibilidades[`directa-${ruta.id}`] = true;
      });
      setRutasVisibles(nuevasVisibilidades);

      console.log(`Encontradas ${resultados.rutas_directas.length} rutas directas`);

      if (resultados.rutas_directas.length === 0) {
        setError("No se encontraron rutas directas. Presiona 'Buscar Combinadas' para ver opciones con transbordo.");
      }
    } catch (err: any) {
      console.error('Error en handleBuscar:', err);
      
      if (err.response?.data?.error) {
        setError(`Error del servidor: ${err.response.data.error}`);
      } else if (err.code === 'ECONNABORTED') {
        setError("La búsqueda está tomando demasiado tiempo.");
      } else {
        setError("Error al conectar con el servidor. Verifica tu conexión.");
      }
      
      // Forzar reset de estados en caso de error
      setRutasDirectas([]);
      setRutasCombinadas([]);
    } finally {
      setLoading(false);
      console.log('Búsqueda finalizada');
    }
  };

  const limpiarMapa = () => {
    console.log('Limpiando mapa completamente');
    
    // Limpiar estados
    setPuntoA(null);
    setPuntoB(null);
    setRutasDirectas([]);
    setRutasCombinadas([]);
    setRutasVisibles({});
    setModoSeleccion('A');
    setError(null);
    setMostrarCombinadas(false);
    
    // Limpiar referencias del mapa
    if (mapRef.current) {
      // Centrar mapa en Arequipa
      mapRef.current.setView([-16.409047, -71.536952], 14);
    }
  };

  // Contadores por tipo de ruta
  const rutasDirectasCount = rutasDirectas.filter(r => r.distancia_a_destino <= 50).length;
  const rutasCercanasCount = rutasDirectas.filter(r => r.distancia_a_destino > 50 && r.distancia_a_destino <= 200).length;
  const rutasAproximadasCount = rutasDirectas.filter(r => r.distancia_a_destino > 200).length;

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
                <button
                  onClick={handleUsarUbicacion}
                  className="p-2 bg-white text-gray-500 rounded-full shadow-sm border border-gray-200 hover:text-green-600 hover:border-green-500 transition-all"
                  title="Usar mi ubicación actual"
                >
                  <Locate size={18} />
                </button>
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
          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                onClick={handleBuscar}
                disabled={!puntoA || !puntoB || loading}
                className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 px-4 rounded-lg font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Buscando...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
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

            {/* Botón para buscar rutas combinadas */}
            {rutasDirectas.length === 0 && !mostrarCombinadas && (
              <button
                onClick={buscarRutasCombinadas}
                disabled={!puntoA || !puntoB || buscandoCombinadas}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                {buscandoCombinadas ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Buscando Combinadas...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Route size={18} />
                    <span>Buscar Rutas Combinadas</span>
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Mensajes de Error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Lista de Resultados - Rutas Directas */}
          {rutasDirectas.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <h3 className="font-bold text-gray-800">
                    {rutasDirectas.length} Rutas directas
                  </h3>
                  <div className="flex gap-2 mt-1">
                    {rutasDirectasCount > 0 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {rutasDirectasCount} directas
                      </span>
                    )}
                    {rutasCercanasCount > 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        {rutasCercanasCount} cercanas
                      </span>
                    )}
                    {rutasAproximadasCount > 0 && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                        {rutasAproximadasCount} aproximadas
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={mostrarTodasLasRutas}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                    title="Mostrar todas las rutas"
                  >
                    Todas
                  </button>
                  <button
                    onClick={ocultarTodasLasRutas}
                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                    title="Ocultar todas las rutas"
                  >
                    Ninguna
                  </button>
                </div>
              </div>
              {rutasDirectas.map((ruta) => {
                const tipoInfo = obtenerTipoRuta(ruta.distancia_a_destino);
                return (
                  <div 
                    key={`directa-${ruta.id}`} 
                    className={`bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all ${
                      rutasVisibles[`directa-${ruta.id}`] === false ? 'opacity-50 bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1">
                        <div 
                          className="w-2 h-10 rounded-full" 
                          style={{ backgroundColor: ruta.color }}
                        ></div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800">{ruta.nombre_ruta}</h4>
                          <p className="text-xs text-gray-500">{ruta.empresa}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleVisibilidadRuta(`directa-${ruta.id}`)}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        title={rutasVisibles[`directa-${ruta.id}`] === false ? "Mostrar ruta" : "Ocultar ruta"}
                      >
                        {rutasVisibles[`directa-${ruta.id}`] === false ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        ruta.sentido === 'IDA' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {ruta.sentido}
                      </span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full border ${tipoInfo.badge}`}>
                        {tipoInfo.tipo === 'directa' ? '🚗 Directa' : 
                         tipoInfo.tipo === 'cercana' ? '🚶 Cercana' : '📍 Aproximada'}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Distancia al origen:</span>
                        <span className="font-medium">{formatearDistancia(ruta.distancia_a_origen)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Distancia al destino:</span>
                        <span className={`font-medium ${tipoInfo.color}`}>
                          {formatearDistancia(ruta.distancia_a_destino)}
                        </span>
                      </div>
                    </div>

                    {rutasVisibles[`directa-${ruta.id}`] === false && (
                      <p className="text-xs text-gray-400 mt-2">Ruta oculta en el mapa</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Lista de Resultados - Rutas Combinadas */}
          {mostrarCombinadas && rutasCombinadas.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <h3 className="font-bold text-gray-800">
                    {rutasCombinadas.length} Rutas combinadas
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Con transbordo - Tiempo estimado incluido
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={mostrarTodasLasRutas}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                    title="Mostrar todas las rutas"
                  >
                    Todas
                  </button>
                  <button
                    onClick={ocultarTodasLasRutas}
                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                    title="Ocultar todas las rutas"
                  >
                    Ninguna
                  </button>
                  <button
                    onClick={() => setMostrarCombinadas(false)}
                    className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                    title="Ocultar rutas combinadas"
                  >
                    Sin Combinadas
                  </button>
                </div>
              </div>
              {rutasCombinadas.map((combinada) => (
                <div 
                  key={`combinada-${combinada.id}`} 
                  className={`bg-white p-3 rounded-lg border border-purple-200 shadow-sm hover:shadow-md transition-all ${
                    rutasVisibles[`combinada-${combinada.id}`] === false ? 'opacity-50 bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Route className="text-purple-500" size={16} />
                      <h4 className="font-bold text-gray-800">Ruta Combinada</h4>
                    </div>
                    <button
                      onClick={() => toggleVisibilidadRuta(`combinada-${combinada.id}`)}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      title={rutasVisibles[`combinada-${combinada.id}`] === false ? "Mostrar ruta" : "Ocultar ruta"}
                    >
                      {rutasVisibles[`combinada-${combinada.id}`] === false ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  {/* Segmentos de la ruta combinada */}
                  <div className="space-y-2 mb-3">
                    {combinada.rutas.map((segmento, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <div className="w-2 h-8 rounded-full" style={{ backgroundColor: segmento.ruta.color }}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {segmento.ruta.nombre_ruta} ({segmento.ruta.empresa})
                          </p>
                          <p className="text-xs text-gray-500">
                            Segmento {index + 1} • {formatearDistancia(segmento.distancia)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Distancia total:</span>
                      <span className="font-medium">{formatearDistancia(combinada.distancia_total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tiempo estimado:</span>
                      <span className="font-medium text-purple-600">{combinada.tiempo_estimado_minutos} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distancia de transbordo:</span>
                      <span className={`font-medium ${
                        (combinada.distancia_transbordo || 0) <= 50 ? 'text-green-600' : 
                        (combinada.distancia_transbordo || 0) <= 100 ? 'text-yellow-600' : 'text-orange-600'
                      }`}>
                        {formatearDistancia(combinada.distancia_transbordo || 0)}
                      </span>
                    </div>
                  </div>

                  {rutasVisibles[`combinada-${combinada.id}`] === false && (
                    <p className="text-xs text-gray-400 mt-2">Ruta oculta en el mapa</p>
                  )}
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