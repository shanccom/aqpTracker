// src/pages/RutasTransporte/components/DistanceResults.tsx
import React from 'react';
import type { RouteResults } from '../../../types/routes.types';

interface DistanceResultsProps {
  results: RouteResults | null;
}

const DistanceResults: React.FC<DistanceResultsProps> = ({ results }) => {
  if (!results) return null;

  return (
    <div className="distance-results">
      <h3>📈 Resultados del Cálculo</h3>
      <div className="results-content">
        <div 
          className="result-item" 
          style={{ 
            background: results.isRealRoute ? '#e8f5e8' : '#fff3cd' 
          }}
        >
          <strong>🔍 Tipo de cálculo:</strong> {results.isRealRoute ? 'Ruta por calles (OSRM)' : 'Distancia en línea recta'}
        </div>
        <div className="result-item">
          <strong>📏 Distancia total:</strong> {results.totalDistance.toFixed(2)} km
          {!results.isRealRoute && (
            <>
              <br />
              <small style={{ color: '#666' }}>
                ⚠️ Distancia en línea recta - puede ser menor a la real
              </small>
            </>
          )}
        </div>
        <div className="result-item">
          <strong>⏱️ Tiempo estimado:</strong> {Math.round(results.totalTime)} minutos
          {results.isRealRoute && (
            <>
              <br />
              <small style={{ color: '#666' }}>
                ✅ Tiempo real considerando calles y tráfico
              </small>
            </>
          )}
        </div>
        <div className="result-item">
          <strong>🛑 Segmentos recorridos:</strong> {results.segmentCount} segmentos
        </div>
        <div className="result-item">
          <strong>📋 Detalle del recorrido:</strong>
          {results.segments.map((segment, index) => (
            <div 
              key={index}
              style={{ 
                margin: '8px 0', 
                padding: '8px', 
                background: '#f8f9fa', 
                borderRadius: '4px', 
                borderLeft: '3px solid #3498db' 
              }}
            >
              <strong>{segment.from}</strong> → <strong>{segment.to}</strong>
              <br />
              📏 {segment.distance.toFixed(2)} km | ⏱️ {Math.round(segment.time)} min
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DistanceResults;