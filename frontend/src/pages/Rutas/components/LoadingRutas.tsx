import React from 'react';
import { Bus } from 'lucide-react';

const LoadingRutas: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <Bus className="w-16 h-16 text-blue-600 animate-bounce mx-auto mb-4" />
        <p className="text-xl text-gray-700">Cargando rutas de Arequipa...</p>
      </div>
    </div>
  );
};

export default LoadingRutas;