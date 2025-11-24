import { useState } from 'react';
import EmpresasList from './components/EmpresasList';
import RutasList from './components/RutasList';
import RutaDetail from './components/RutaDetail';

const Rutas = () => {
    const [selectedEmpresaId, setSelectedEmpresaId] = useState<number | null>(null);
    const [selectedRutaId, setSelectedRutaId] = useState<number | null>(null);
    
    // ⚠️ NUEVO ESTADO CLAVE: Guardará el nombre de la empresa seleccionada
    const [selectedEmpresaNombre, setSelectedEmpresaNombre] = useState<string | undefined>(undefined); 

    // ⚠️ HANDLER MODIFICADO: Ahora recibe el nombre de la empresa (string)
    const handleEmpresaClick = (empresaId: number, empresaNombre: string) => {
        setSelectedEmpresaId(empresaId);
        setSelectedEmpresaNombre(empresaNombre); // Guarda el nombre para pasarlo a RutasList
        setSelectedRutaId(null);
    };

    const handleRutaClick = (rutaId: number) => {
        setSelectedRutaId(rutaId);
    };

    const handleBackToEmpresas = () => {
        setSelectedEmpresaId(null);
        setSelectedEmpresaNombre(undefined); // Limpiar el nombre al volver
        setSelectedRutaId(null);
    };

    const handleBackToRutas = () => {
        setSelectedRutaId(null);
    };

    return (
        <div className="container mx-auto px-4 py-8">

            {selectedRutaId !== null ? (
                // 1. Vista de detalle de ruta
                <RutaDetail 
                    rutaId={selectedRutaId} 
                    onBack={handleBackToRutas}
                />
            ) : selectedEmpresaId !== null ? (
                // 2. Vista de lista de rutas
                <RutasList 
                    empresaId={selectedEmpresaId} 
                    empresaNombre={selectedEmpresaNombre} // ⬅️ PASAMOS EL NOMBRE AQUÍ
                    onBack={handleBackToEmpresas}
                    onRutaClick={handleRutaClick}
                />
            ) : (
                // 3. Vista de lista de empresas
                <EmpresasList 
                    // ⬅️ PASAMOS EL HANDLER MODIFICADO
                    onEmpresaClick={handleEmpresaClick} 
                />
            )}
        </div>
    );
};

export default Rutas;