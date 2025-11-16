// src/components/common/Map/MapComponent.tsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { BusRoute, RouteStop, RouteResults } from '../../../types/routes.types';

// Fix para iconos de Leaflet en React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  currentRoute: BusRoute | null;
  selectedStartStop: RouteStop | null;
  selectedEndStop: RouteStop | null;
  results: RouteResults | null;
}

const MapComponent: React.FC<MapComponentProps> = ({
    currentRoute,
    selectedStartStop,
    selectedEndStop,
    results
    }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const layersRef = useRef({
        routeLayer: null as L.Polyline | null,
        stopMarkers: [] as L.Marker[],
        highlightedSegment: null as L.Polyline | null,
        realRouteLayer: null as L.Polyline | null
    });

    useEffect(() => {
        if (!mapRef.current) return;

        // Inicializar mapa
        mapInstanceRef.current = L.map(mapRef.current).setView([-16.3989, -71.5369], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
        }).addTo(mapInstanceRef.current);

        return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
        };
    }, []);

    useEffect(() => {
        if (!mapInstanceRef.current || !currentRoute) return;

        clearMap();

        // Dibujar ruta base
        const routeCoordinates = currentRoute.stops.map(stop => [stop.lat, stop.lng] as [number, number]);
        layersRef.current.routeLayer = L.polyline(routeCoordinates, {
        color: currentRoute.color,
        weight: 4,
        opacity: 0.5,
        dashArray: '5, 10',
        lineJoin: 'round'
        }).addTo(mapInstanceRef.current);

        // Agregar marcadores de paradas
        currentRoute.stops.forEach((stop, index) => {
        const marker = L.marker([stop.lat, stop.lng], {
            icon: L.divIcon({
            html: `<div style="background: ${currentRoute.color}; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold;">${index + 1}</div>`,
            className: 'stop-marker',
            iconSize: [25, 25]
            })
        }).addTo(mapInstanceRef.current!)
        .bindPopup(`
            <b>Parada ${index + 1}</b><br>
            <strong>${stop.name}</strong><br>
            ${stop.lat.toFixed(4)}, ${stop.lng.toFixed(4)}
        `);

        layersRef.current.stopMarkers.push(marker);
        });

        // Ajustar vista del mapa
        if (layersRef.current.routeLayer) {
        mapInstanceRef.current.fitBounds(layersRef.current.routeLayer.getBounds());
        }

    }, [currentRoute]);

    useEffect(() => {
        if (!mapInstanceRef.current || !results || !results.segments) return;

        // Dibujar ruta real si existe
        if (results.isRealRoute && results.segments.some(seg => seg.geometry)) {
        const allCoordinates: [number, number][] = [];
        
        results.segments.forEach(segment => {
            if (segment.geometry) {
            segment.geometry.coordinates.forEach((coord: number[]) => {
                allCoordinates.push([coord[1], coord[0]] as [number, number]);
            });
            }
        });

        if (allCoordinates.length > 0) {
            layersRef.current.realRouteLayer = L.polyline(allCoordinates, {
            color: '#27ae60',
            weight: 6,
            opacity: 0.8,
            lineJoin: 'round'
            }).addTo(mapInstanceRef.current);
        }
        }

    }, [results]);

    const clearMap = () => {
        const layers = layersRef.current;
        
        // Limpiar marcadores
        layers.stopMarkers.forEach(marker => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(marker);
        }
        });
        layers.stopMarkers = [];

        // Limpiar capas
        Object.keys(layers).forEach(key => {
        if (key !== 'stopMarkers' && layers[key as keyof typeof layers] && mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(layers[key as keyof typeof layers] as L.Layer);
            (layers as any)[key] = null;
        }
        });
    };

    return (
        <div 
        ref={mapRef} 
        className="map-container" 
        style={{ height: '100%', width: '100%', borderRadius: '8px' }} 
        />
    );
};

export default MapComponent;