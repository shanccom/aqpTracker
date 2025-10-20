import MapaRuta from "../../components/MapaRuta/MapaRuta"


export default function Rutas() {
    return (
              <div className="flex flex-col items-center">
        <h1 className="text-2xl font-bold mt-4">🚌 AQP Tracker - Ruta Combi</h1>
        <MapaRuta />
      </div>
    )
}
