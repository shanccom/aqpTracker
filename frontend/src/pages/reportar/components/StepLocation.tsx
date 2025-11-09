import React, { useState } from 'react'
import { MapPin, Navigation, CheckCircle } from 'lucide-react'

type Props = {
  data: any
  onBack: () => void
  onNext: (delta: any) => void
}

export default function StepLocation({ data, onBack, onNext }: Props) {
  const [direccion, setDireccion] = useState(data.direccion || '')
  const [latlng, setLatlng] = useState<{ lat: number; lng: number } | null>(data.latlng || null)
  const [previewSimilares, setPreviewSimilares] = useState<any[] | null>(data.similares ?? null)

  function handleMapClick(e: React.MouseEvent) {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const lat = Number((-12 + (y / rect.height) * 0.5).toFixed(6))
    const lng = Number((-77 + (x / rect.width) * 0.5).toFixed(6))
    const addr = `Lat: ${lat}, Lng: ${lng}`
    setLatlng({ lat, lng })
    setDireccion(addr)
    
    const found = simulateSearch(lat, lng, '')
    setPreviewSimilares(found)
  }

  const canNext = !!latlng

  function simulateSearch(lat: number, lng: number, q?: string) {
    const demo1 = {
      id: 101,
      titulo: q || 'Accidente en la vía',
      ubicacion: 'Av. Demo 123',
      descripcion: 'Choque entre dos vehículos, hay congestión.',
      imagen: '/static/img/incidencia.png',
      autor: 'Usuario Demo',
      tiempo: 'hace 10 min',
      comentarios: 2,
      reacciones: 5,
      estado: 'Activo',
      reports_count: 3,
      apoyos_count: 3,
      imagenes: [{ id: 1, url: '/static/img/incidencia.png' }],
    }

    const demo2 = {
      id: 102,
      titulo: 'Obras en la vía',
      ubicacion: 'Calle Falsa 456',
      descripcion: 'Obras que reducen el carril central.',
      imagen: null,
      autor: 'Municipio',
      tiempo: 'hace 1 hora',
      comentarios: 0,
      reacciones: 1,
      estado: 'Activo',
      reports_count: 1,
      apoyos_count: 1,
      imagenes: [],
    }

    return ((lat + lng) % 2 >= 0) ? [demo1, demo2] : []
  }

  const handleNext = () => {
    if (!latlng) return
    const similares = previewSimilares ?? simulateSearch(latlng.lat, latlng.lng, '')
    onNext({ direccion, latlng, similares })
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header sólido azul */}
      <div className="bg-green-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold">2</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">Ubica el Incidente</h2>
            <p className="text-green-100 text-sm">Selecciona la ubicación precisa en el mapa</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Mapa interactivo */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <MapPin size={18} className="text-green-500" />
            <span>Selecciona la ubicación en el mapa</span>
            {latlng && <CheckCircle size={16} className="text-emerald-500" />}
          </label>
          
          <div 
            onClick={handleMapClick} 
            className="relative w-full h-80 bg-green-50 rounded-2xl cursor-pointer flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-green-400 transition-all duration-300 group overflow-hidden"
          >
            {latlng ? (
              <div className="text-center z-10">
                <div className="text-green-500 text-5xl">📍</div>
                <div className="text-lg font-semibold text-gray-800 mt-3">{direccion}</div>
                <div className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
                  <Navigation size={14} />
                  Ubicación seleccionada
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 z-10">
                <div className="text-4xl mb-3">🗺️</div>
                <div className="font-semibold text-lg">Haz click en el mapa</div>
                <div className="text-sm mt-1">Selecciona la ubicación exacta del incidente</div>
                <div className="text-xs text-gray-400 mt-2">(Sistema de coordenadas simulado)</div>
              </div>
            )}
          </div>
        </div>

        {/* Dirección input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Dirección exacta</label>
          <input 
            value={direccion} 
            onChange={e => setDireccion(e.target.value)} 
            placeholder="Ej: Av. Principal 123, Miraflores"
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
          />
        </div>

        {/* Preview de incidentes similares */}
        {previewSimilares && (
          <div className="rounded-xl border transition-all duration-300 overflow-hidden">
            {previewSimilares.length === 0 ? (
              <div className="p-4 bg-green-50 border border-green-200">
                <div className="flex items-center gap-3 text-emerald-700">
                    <CheckCircle size={20} className="text-green-500" />
                  <div>
                    <p className="font-semibold">Zona libre de incidentes</p>
                    <p className="text-sm text-emerald-600">No se encontraron reportes similares. Serás el primero en reportar aquí.</p>
                  </div>
                </div>
              </div>
            ) : (
                <div className="p-4 bg-green-50 border border-green-200">
                  <div className="flex items-center gap-3 text-green-700">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {previewSimilares.length}
                    </div>
                    <div>
                      <p className="font-semibold">Incidentes similares detectados</p>
                      <p className="text-sm text-green-600">
                        Se encontraron {previewSimilares.length} reporte(s) similares en la zona
                      </p>
                    </div>
                  </div>
                </div>
            )}
          </div>
        )}

        {/* Navegación */}
        <div className="flex justify-between gap-4 pt-6 border-t border-gray-100">
          <button 
            onClick={onBack}
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300 font-semibold shadow-sm"
          >
            ← Volver
          </button>
          <button 
            disabled={!canNext}
            onClick={handleNext}
            className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
              canNext 
                ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 hover:shadow-xl'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Ver Incidentes Similares →
          </button>
        </div>
      </div>
    </div>
  )
}