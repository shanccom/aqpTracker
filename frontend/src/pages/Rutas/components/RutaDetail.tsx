import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { rutasAPI } from '../../../services/api';
import RutaMap from '../../../components/RutaMap/RutaMap';
import type { RutaJSON } from '../../../types';

const RutaDetail: React.FC = () => {
  const { rutaId } = useParams<{ rutaId: string }>();
  const [ruta, setRuta] = useState<RutaJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRuta = async () => {
      if (!rutaId) return;

      try {
        setLoading(true);
        const data = await rutasAPI.getJSON(Number(rutaId));
        setRuta(data);
      } catch (err) {
        setError('Error al cargar la ruta. Por favor, intenta nuevamente.');
        console.error('Error fetching ruta:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRuta();
  }, [rutaId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !ruta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error || 'Ruta no encontrada'}</p>
          <Link to="/" className="text-blue-600 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Separar paraderos populares de los comunes
  const paraderosPopulares = ruta.paraderos.filter((p) => p.es_popular);
  const paraderosComunes = ruta.paraderos.filter((p) => !p.es_popular);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-8 mb-8 shadow-lg">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-block mb-4 text-white hover:underline">
            ← Volver al inicio
          </Link>
          <div className="flex items-center gap-4 mb-3">
            <div
              className="w-4 h-12 rounded"
              style={{ backgroundColor: ruta.color_linea }}
            ></div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                {ruta.nombre}
              </h1>
              <p className="text-lg opacity-90 mt-1">
                {ruta.empresa} - {ruta.sentido}
              </p>
            </div>
          </div>
          <p className="text-sm opacity-75">Código: {ruta.codigo}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mapa */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Recorrido de la Ruta
            </h2>
            <RutaMap ruta={ruta} />
          </div>

          {/* Información lateral */}
          <div className="space-y-6">
            {/* Paraderos Populares */}
            {paraderosPopulares.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  Paraderos Populares
                </h3>
                <ul className="space-y-3">
                  {paraderosPopulares.map((paradero, index) => (
                    <li
                      key={`popular-${paradero.id}-${index}`}
                      className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0"
                    >
                      <div className="w-6 h-6 rounded-full bg-red-500 flex-shrink-0 mt-0.5"></div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {paradero.nombre}
                        </p>
                        {paradero.distancia_metros !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            A {paradero.distancia_metros.toFixed(0)}m de la ruta
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Paraderos Comunes */}
            {paraderosComunes.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Otros Paraderos
                </h3>
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                  {paraderosComunes.map((paradero, index) => (
                    <li
                      key={`comun-${paradero.id}-${index}`}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex-shrink-0 mt-1"></div>
                      <p className="text-gray-700">{paradero.nombre}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Estadísticas */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Información
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Total de Paraderos</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {ruta.paraderos.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Paraderos Populares</p>
                  <p className="text-2xl font-bold text-red-600">
                    {paraderosPopulares.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Puntos de Recorrido</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {ruta.coordenadas.length}
                  </p>
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