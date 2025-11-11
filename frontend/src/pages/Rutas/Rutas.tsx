import React, { useEffect, useState } from 'react';
import { empresasAPI } from '../../services/api';
import EmpresaList from '../../components/Empresa/EmpresaList';
import type { Empresa } from '../../types';

const Rutas: React.FC = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        setLoading(true);
        const data = await empresasAPI.getAll();
        setEmpresas(data);
      } catch (err) {
        setError('Error al cargar las empresas. Por favor, intenta nuevamente.');
        console.error('Error fetching empresas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmpresas();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 mb-8 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            🚌 AQP Tracker
          </h1>
          <p className="text-xl text-blue-100">
            Sistema de seguimiento de transporte público en Arequipa
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Empresas de Transporte
          </h2>
          <p className="text-gray-600">
            Selecciona una empresa para ver sus rutas disponibles
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <EmpresaList empresas={empresas} loading={loading} />
      </div>
    </div>
  );
};

export default Rutas;