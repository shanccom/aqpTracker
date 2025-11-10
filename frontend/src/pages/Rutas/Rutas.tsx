import React, { useState, useEffect } from 'react';
import { Bus, MapPin, Clock, DollarSign, Users, X } from 'lucide-react';
import type { Ruta, Empresa, Estadisticas } from './types';
import { rutasService } from '../../services/rutasService';
import {
  StatCard,
  RutaCard,
  DetalleRuta,
  FiltrosRutas,
  LoadingRutas
} from './components/';

const Rutas: React.FC = () => {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<Ruta | null>(null);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [empresaFiltro, setEmpresaFiltro] = useState<number | null>(null);
  const [vistaActual, setVistaActual] = useState<'lista' | 'detalle'>('lista');

  useEffect(() => {
    cargarDatos();
  }, [empresaFiltro]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [rutasData, empresasData, estadisticasData] = await Promise.all([
        rutasService.getRutas(empresaFiltro || undefined),
        rutasService.getEmpresas(),
        rutasService.getEstadisticas()
      ]);

      setRutas(rutasData);
      setEmpresas(empresasData);
      setEstadisticas(estadisticasData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
    setLoading(false);
  };

  const cargarDetalleRuta = async (id: number) => {
    try {
      const data = await rutasService.getRutaById(id);
      setRutaSeleccionada(data);
      setVistaActual('detalle');
    } catch (error) {
      console.error('Error al cargar detalle:', error);
    }
  };

  const rutasFiltradas = rutas.filter(ruta =>
    ruta.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    ruta.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    ruta.empresa_nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) {
    return <LoadingRutas />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
            </div>
            {vistaActual === 'detalle' && (
              <button
                onClick={() => setVistaActual('lista')}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition"
              >
                <X className="w-5 h-5" />
                <span>Volver</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {vistaActual === 'lista' ? (
          <>
            {/* Estadísticas */}
            {estadisticas && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                  icon={<Bus className="w-8 h-8" />}
                  titulo="Rutas Activas"
                  valor={estadisticas.total_rutas}
                  color="blue"
                />
                <StatCard
                  icon={<Users className="w-8 h-8" />}
                  titulo="Empresas"
                  valor={estadisticas.total_empresas}
                  color="green"
                />
                <StatCard
                  icon={<MapPin className="w-8 h-8" />}
                  titulo="Paradas"
                  valor={estadisticas.total_paradas}
                  color="purple"
                />
                <StatCard
                  icon={<DollarSign className="w-8 h-8" />}
                  titulo="Precio Promedio"
                  valor={`S/ ${estadisticas.precio_promedio}`}
                  color="yellow"
                />
              </div>
            )}

            {/* Filtros y búsqueda */}
            <FiltrosRutas
              busqueda={busqueda}
              setBusqueda={setBusqueda}
              empresaFiltro={empresaFiltro}
              setEmpresaFiltro={setEmpresaFiltro}
              empresas={empresas}
            />

            {/* Lista de rutas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rutasFiltradas.map(ruta => (
                <RutaCard
                  key={ruta.id}
                  ruta={ruta}
                  onClick={() => cargarDetalleRuta(ruta.id)}
                />
              ))}
            </div>

            {rutasFiltradas.length === 0 && (
              <div className="text-center py-12">
                <Bus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600">No se encontraron rutas</p>
              </div>
            )}
          </>
        ) : (
          // Vista de detalle
          rutaSeleccionada && <DetalleRuta ruta={rutaSeleccionada} />
        )}
      </div>
    </div>
  );
};

export default Rutas;