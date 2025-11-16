import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface RutaData {
  id: number;
  nombre: string;
  origen: string;
  destino: string;
  // Agrega más campos según necesites
}

const MapaRuta: React.FC = () => {
  const [rutaData, setRutaData] = useState<RutaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRuta = async () => {
      try {
        // DATOS MOCK TEMPORALES - Comenta la petición real
        // const response = await axios.get('http://127.0.0.1:8000/api/rutas/1/');
        // setRutaData(response.data);
        
        // Simulamos un delay como si fuera una petición real
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Datos de prueba
        const mockData: RutaData = {
          id: 1,
          nombre: "Ruta Arequipa Centro",
          origen: "Plaza de Armas",
          destino: "Yanahuara",
          // Agrega más datos según tu estructura
        };
        
        setRutaData(mockData);
        setLoading(false);
        
      } catch (error) {
        console.error('Error al cargar la ruta:', error);
        setError('Error cargando los datos');
        setLoading(false);
        
        // En caso de error, también usamos datos mock
        const mockData: RutaData = {
          id: 1,
          nombre: "Ruta de Prueba (Fallback)",
          origen: "Punto A",
          destino: "Punto B",
        };
        setRutaData(mockData);
      }
    };

    fetchRuta();
  }, []);

  if (loading) {
    return <div>Cargando ruta...</div>;
  }

  if (error) {
    return (
      <div>
        <div>Error: {error}</div>
        {rutaData && (
          <div>
            <h3>Usando datos de prueba:</h3>
            <p>Nombre: {rutaData.nombre}</p>
            <p>Origen: {rutaData.origen}</p>
            <p>Destino: {rutaData.destino}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2>Mapa de Ruta</h2>
      {rutaData && (
        <div>
          <h3>{rutaData.nombre}</h3>
          <p>Origen: {rutaData.origen}</p>
          <p>Destino: {rutaData.destino}</p>
          {/* Aquí irá tu mapa */}
          <div style={{ 
            width: '100%', 
            height: '400px', 
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ccc'
          }}>
            Mapa se mostrará aquí (usando datos de prueba)
          </div>
        </div>
      )}
    </div>
  );
};

export default MapaRuta;