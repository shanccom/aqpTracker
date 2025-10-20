import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import axios from "axios";
import "leaflet/dist/leaflet.css";

// Tipos para tu API
interface PuntoRuta {
  latitud: number;
  longitud: number;
  orden: number;
}

interface Ruta {
  id: number;
  nombre: string;
  descripcion?: string;
  puntos: PuntoRuta[];
}

export default function MapaRuta() {
  const [ruta, setRuta] = useState<Ruta | null>(null);

  useEffect(() => {
    axios
      .get<Ruta>("http://localhost:8000/api/rutas/1/")
      .then((res) => setRuta(res.data))
      .catch((err) => console.error("Error al cargar la ruta:", err));
  }, []);

  if (!ruta) return <p className="text-center mt-4">Cargando ruta...</p>;

  const puntos: [number, number][] = ruta.puntos.map((p) => [p.latitud, p.longitud]);

  return (
    <div className="w-full h-screen">
      {/* Se fuerzan los tipos genéricos para evitar conflictos */}
      <MapContainer
        center={puntos[0] as [number, number]}
        zoom={13}
        className="w-full h-full rounded-lg shadow-lg"
      >
        {/* TileLayer */}
        <TileLayer
          // @ts-ignore → forzamos porque los tipos actuales de react-leaflet están incompletos
          attribution="© OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Polyline */}
        <Polyline
          // @ts-ignore
          positions={puntos}
          pathOptions={{ color: "red", weight: 4 }}
        />

        <Marker position={puntos[0]}>
          <Popup>Punto de inicio</Popup>
        </Marker>

        <Marker position={puntos[puntos.length - 1]}>
          <Popup>Destino final</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
