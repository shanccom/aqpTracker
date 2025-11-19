import { useState, useEffect } from 'react'
import foroService from '../../../services/foroService'
import { MapPin, Navigation, CheckCircle } from 'lucide-react'
import MapPicker from '../../../components/MapPicker/MapPicker'

const AREQUIPA_CENTER = { lat: -16.409047, lng: -71.537451 }

type Props = {
  data: any
  onBack: () => void
  onNext: (delta: any) => void
}

export default function StepLocation({ data, onBack, onNext }: Props) {
  const [direccion, setDireccion] = useState(data.direccion || '')
  const [latlng, setLatlng] = useState<{ lat: number; lng: number } | null>(data.latlng || null)
  const [previewSimilares, setPreviewSimilares] = useState<any[] | null>(data.similares ?? null)
  const [loadingSimilares, setLoadingSimilares] = useState(false)
  const [similaresError, setSimilaresError] = useState<string | null>(null)

  const [center, setCenter] = useState<{ lat: number; lng: number }>(data.latlng || AREQUIPA_CENTER)
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    // on mount try to get user's current position and center/select map there
    if (!('geolocation' in navigator)) {
      setCenter(AREQUIPA_CENTER)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (!mounted) return
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCenter(p)
        // automatically select the coords and fetch address/similares
        try {
          await handleMapSelect(p.lat, p.lng)
        } catch (e) {
          // ignore errors here; handleMapSelect shows its own errors
        }
      },
      () => {
        if (!mounted) return
        setCenter(AREQUIPA_CENTER)
      },
      { enableHighAccuracy: true, timeout: 7000 }
    )

    return () => { mounted = false }
  }, [])

  async function reverseGeocode(lat: number, lng: number) {
    setAddressLoading(true)
    setAddressError(null)
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&accept-language=es`
      const res = await fetch(url, { headers: { 'User-Agent': 'aqp-tracker/1.0 (your@email)' } })
      if (!res.ok) throw new Error('No se pudo obtener dirección')
      const data = await res.json()
      const display = data.display_name || data.name || `Lat: ${lat}, Lng: ${lng}`
      return display
    } catch (err) {
      console.error('reverseGeocode error', err)
      setAddressError('No se pudo obtener la dirección')
      return `Lat: ${lat}, Lng: ${lng}`
    } finally {
      setAddressLoading(false)
    }
  }

  async function handleMapSelect(lat: number, lng: number) {
    // update center and selected coords
    setLatlng({ lat, lng })
    setCenter({ lat, lng })
    // get human readable address
    const addr = await reverseGeocode(lat, lng)
    setDireccion(addr)

    // fetch similares from backend
    setLoadingSimilares(true)
    setSimilaresError(null)
    try {
      const radiusKm = 0.2
      const today = new Date()
      const yyyy = today.getFullYear()
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const dd = String(today.getDate()).padStart(2, '0')
      const dateStr = `${yyyy}-${mm}-${dd}`
      const params = {
        lat: lat,
        lng: lng,
        radius: radiusKm,
        estado: 'Activo',
        from_date: dateStr,
        to_date: dateStr,
      }
      const results = await foroService.previewIncidencias(params)
      setPreviewSimilares(results)
    } catch (err: any) {
      setSimilaresError('No se pudo consultar incidencias similares')
      setPreviewSimilares([])
    } finally {
      setLoadingSimilares(false)
    }
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
          
          <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-gray-200">
            <MapPicker center={center} value={latlng} onSelect={(lat, lng) => handleMapSelect(lat, lng)} />

            <div className="absolute top-3 right-3 z-20 flex gap-2">
              <button
                onClick={async () => {
                  if (!('geolocation' in navigator)) {
                    setCenter(AREQUIPA_CENTER)
                    return
                  }
                  navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                      setCenter(p)
                      // optionally select coords automatically
                      await handleMapSelect(p.lat, p.lng)
                    },
                    () => {
                      // user denied or error -> keep Arequipa center
                      setCenter(AREQUIPA_CENTER)
                    },
                    { enableHighAccuracy: true, timeout: 7000 }
                  )
                }}
                title="Usar mi ubicación"
                className="bg-white/90 px-3 py-2 rounded-xl shadow-sm hover:shadow-md flex items-center gap-2 text-sm"
              >
                <Navigation size={14} />
                Mi ubicación
              </button>
            </div>
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
          <div className="flex items-center gap-3 text-sm">
            {addressLoading && <div className="text-gray-500">Buscando dirección...</div>}
            {addressError && <div className="text-red-600">{addressError}</div>}
          </div>
        </div>

        {/* Preview de incidentes similares */}
        {loadingSimilares ? (
          <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-700">Buscando incidentes similares...</div>
        ) : similaresError ? (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">{similaresError}</div>
        ) : previewSimilares && (
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