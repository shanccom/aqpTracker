// src/pages/RutasTransporte/RutasTransporte.tsx
import React from 'react';
import BusRouteSystem from './Components/BusRouteSystem';
import './RutasTransporte.css';

const RutasTransporte: React.FC = () => {
  return (
    <div className="rutas-transporte-page">
      <div className="page-header">
        <h1> Gestión de Rutas de Transporte</h1>
        <p>Administra y calcula distancias entre paradas de buses</p>
      </div>
      <BusRouteSystem />
    </div>
  );
};

export default RutasTransporte;