import { useState } from 'react';
import EmpresasList from './components/EmpresasList';
import RutasList from './components/RutasList';
import RutaDetail from './components/RutaDetail';

const Rutas = () => {
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<number | null>(null);
  const [selectedRutaId, setSelectedRutaId] = useState<number | null>(null);

  const handleEmpresaClick = (empresaId: number) => {
    setSelectedEmpresaId(empresaId);
    setSelectedRutaId(null);
  };

  const handleRutaClick = (rutaId: number) => {
    setSelectedRutaId(rutaId);
  };

  const handleBackToEmpresas = () => {
    setSelectedEmpresaId(null);
    setSelectedRutaId(null);
  };

  const handleBackToRutas = () => {
    setSelectedRutaId(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">

      {selectedRutaId !== null ? (
        <RutaDetail 
          rutaId={selectedRutaId} 
          onBack={handleBackToRutas}
        />
      ) : selectedEmpresaId !== null ? (
        <RutasList 
          empresaId={selectedEmpresaId} 
          onBack={handleBackToEmpresas}
          onRutaClick={handleRutaClick}
        />
      ) : (
        <EmpresasList onEmpresaClick={handleEmpresaClick} />
      )}
    </div>
  );
};

export default Rutas;