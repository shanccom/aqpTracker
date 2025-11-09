import React, { useState } from 'react'
import { ChevronDown, MapPin, Filter, X, Calendar } from 'lucide-react'
import MapPicker from '../../../components/MapPicker/MapPicker'

type Filters = {
  distrito?: string
  estado?: string
  from_date?: string
  to_date?: string
  lat?: number
  lng?: number
  radius_km?: number
}

const AREQUIPA_CENTER = { lat: -16.409047, lng: -71.537451 }

const FiltrosForo: React.FC<{ onChange?: (f: Filters) => void }> = ({ onChange }) => {
  const [distrito, setDistrito] = useState<string | undefined>(undefined)
  const [estado, setEstado] = useState<string | undefined>(undefined)
  const [fromDate, setFromDate] = useState<string | undefined>(undefined)
  const [toDate, setToDate] = useState<string | undefined>(undefined)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [radiusKm, setRadiusKm] = useState<number>(5)
  const [showMapModal, setShowMapModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filters are emitted explicitly when the user clicks "Buscar" or when clearing filters.

  const handleOpenMap = () => {
    if (!('geolocation' in navigator)) {
      setCoords(AREQUIPA_CENTER)
      setShowMapModal(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setShowMapModal(true)
      },
      () => {
        setCoords(AREQUIPA_CENTER)
        setShowMapModal(true)
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }

  const clearFilters = () => {
    setDistrito(undefined)
    setEstado(undefined)
    setFromDate(undefined)
    setToDate(undefined)
    setCoords(null)
    setRadiusKm(5)
    // emit cleared filters to parent if any
    onChange?.({})
  }

  const hasActiveFilters = Boolean(distrito || estado || fromDate || toDate || coords)

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        {/* Header móvil */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-emerald-600 transition-colors"
          >
            <Filter size={16} />
            <span>{showFilters ? 'Ocultar' : 'Mostrar'}</span>
          </button>
        </div>

        {/* Contenido de filtros */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* (Se eliminó la búsqueda por texto: ahora se usa el botón Buscar para emitir filtros) */}

            {/* Distrito */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distrito
              </label>
              <div className="relative">
                <select
                  value={distrito || ''}
                  onChange={(e) => setDistrito(e.target.value || undefined)}
                  className="appearance-none w-full bg-white border border-gray-300 text-gray-700 py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm"
                >
                  <option value="">Todos los distritos</option>
                  <option value="Centro">Centro</option>
                  <option value="Norte">Norte</option>
                  <option value="Sur">Sur</option>
                  <option value="Este">Este</option>
                  <option value="Oeste">Oeste</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <div className="relative">
                <select
                  value={estado || ''}
                  onChange={(e) => setEstado(e.target.value || undefined)}
                  className="appearance-none w-full bg-white border border-gray-300 text-gray-700 py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm"
                >
                  <option value="">Todos los estados</option>
                  <option value="Activo">Activo</option>
                  <option value="Resuelto">Resuelto</option>
                  <option value="Investigación">Investigación</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Rango de fechas
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input 
                    type="date" 
                    value={fromDate || ''} 
                    onChange={(e) => setFromDate(e.target.value || undefined)} 
                    className="w-full bg-white border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm"
                  />
                </div>
                <span className="text-gray-500 font-medium">hasta</span>
                <div className="flex-1">
                  <input 
                    type="date" 
                    value={toDate || ''} 
                    onChange={(e) => setToDate(e.target.value || undefined)} 
                    className="w-full bg-white border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-2" />
                Ubicación y radio
              </label>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleOpenMap}
                  className="flex items-center gap-2 bg-emerald-500 text-white py-3 px-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 hover:shadow-xl transition-all duration-300 flex-1"
                >
                  <MapPin size={16} />
                  <span className="font-medium">
                    {coords ? 'Cambiar ubicación' : 'Elegir en mapa'}
                  </span>
                </button>
                
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-xl py-3 px-4 shadow-sm">
                  <input 
                    type="number" 
                    min={0} 
                    max={100}
                    value={radiusKm} 
                    onChange={(e) => setRadiusKm(Number(e.target.value || 0))} 
                    className="w-16 bg-transparent border-none focus:outline-none focus:ring-0 text-center font-medium"
                  />
                  <span className="text-sm text-gray-600 font-medium">km</span>
                </div>
              </div>
              
              {/* Coordenadas actuales */}
              {coords && (
                <div className="mt-2 text-sm text-emerald-600 font-medium">
                  📍 Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              {hasActiveFilters ? (
                <span className="text-emerald-600 font-medium">Filtros activos</span>
              ) : (
                <span>Sin filtros aplicados</span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const f: Filters = {}
                  if (distrito) f.distrito = distrito
                  if (estado) f.estado = estado
                  if (fromDate) f.from_date = fromDate
                  if (toDate) f.to_date = toDate
                  if (coords) {
                    f.lat = coords.lat
                    f.lng = coords.lng
                    f.radius_km = radiusKm
                  }
                  onChange?.(f)
                }}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg shadow-sm hover:bg-emerald-600 transition-colors font-medium"
              >
                Buscar
              </button>

              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  <X size={16} />
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal del Mapa */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header del Modal */}
            <div className="bg-emerald-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Seleccionar Ubicación</h2>
                  <p className="text-emerald-100 text-sm mt-1">
                    Haz click en el mapa para seleccionar la ubicación exacta
                  </p>
                </div>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Mapa */}
            <div className="p-6">
              <MapPicker
                center={coords || AREQUIPA_CENTER}
                value={coords}
                onSelect={(lat, lng) => { 
                  setCoords({ lat, lng }); 
                  setShowMapModal(false);
                }}
              />
              
              {/* Información adicional */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-3 text-blue-700">
                  <MapPin size={20} className="text-blue-500" />
                  <div>
                    <p className="font-semibold">Cómo usar el mapa</p>
                    <p className="text-sm text-blue-600">
                      Haz click en cualquier punto del mapa para seleccionar la ubicación. 
                      El radio de búsqueda se aplicará desde este punto.
                    </p>
                  </div>
                </div>
              </div>

              {/* Acciones del modal */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowMapModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (coords) {
                      setShowMapModal(false);
                    }
                  }}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium shadow-lg shadow-emerald-200"
                >
                  Confirmar Ubicación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default FiltrosForo