import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { empresasAPI, rutasAPI } from '../../../services/api';
import RutaList from '../../../components/Ruta/RutaList';
import type { Empresa, Ruta } from '../../../types';

const EmpresaDetail: React.FC = () => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!empresaId) return;

      try {
        setLoading(true);
        const [empresaData, rutasData] = await Promise.all([
          empresasAPI.getById(Number(empresaId)),
          empresasAPI.getRutas(Number(empresaId)),
        ]);
        setEmpresa(empresaData);
        setRutas(rutasData);
      } catch (err) {
        setError('Error al cargar los datos. Por favor, intenta nuevamente.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [empresaId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !empresa) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error || 'Empresa no encontrada'}</p>
          <Link to="/" className="text-blue-600 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="text-white py-8 mb-8 shadow-lg"
        style={{ backgroundColor: empresa.color_principal }}
      >
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-block mb-4 text-white hover:underline">
            ← Volver a empresas
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {empresa.nombre}
          </h1>
          {empresa.descripcion && (
            <p className="text-lg opacity-90">{empresa.descripcion}</p>
          )}
          <p className="mt-3 opacity-80">{rutas.length} rutas disponibles</p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Rutas Disponibles
          </h2>
          <p className="text-gray-600">
            Haz clic en una ruta para ver su recorrido en el mapa
          </p>
        </div>

        <RutaList rutas={rutas} empresaColor={empresa.color_principal} />
      </div>
    </div>
  );
};

export default EmpresaDetail;