import React, { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import api from '../../../api/axios'

type Props = {
  data: any
  onNext: (delta: any) => void
}

export default function StepDetails({ data, onNext }: Props) {
  const [titulo, setTitulo] = useState(data.titulo || '')
  const [descripcion, setDescripcion] = useState(data.descripcion || '')
  const [distrito, setDistrito] = useState(data.distrito || '')
  const [distritosList, setDistritosList] = useState<Array<any>>([])
  const [loadingDistritos, setLoadingDistritos] = useState(false)
  const [distritosError, setDistritosError] = useState<string | null>(null)

  const canNext = titulo.trim().length >= 5 && descripcion.trim().length >= 10 && distrito

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoadingDistritos(true)
      setDistritosError(null)
      try {
        const res = await api.get('/api/foro/distritos/')
        if (!mounted) return
        setDistritosList(res.data || [])
      } catch (err) {
        console.error('Error cargando distritos', err)
        if (!mounted) return
        setDistritosError('Error cargando distritos')
      } finally {
        if (!mounted) return
        setLoadingDistritos(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
  {/* Header sólido azul (coincide con StepLocation) */}
  <div className="bg-green-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold">1</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">Detalles del Incidente</h2>
            <p className="text-green-100 text-sm">Proporciona información clara sobre lo ocurrido</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Título */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <span>Título del incidente</span>
            {titulo.length >= 5 && (
              <CheckCircle size={16} className="text-green-600" />
            )}
          </label>
          <input 
            value={titulo} 
            onChange={e => setTitulo(e.target.value)} 
            placeholder="Ej: Accidente vehicular en Av. Principal"
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all duration-200"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Mínimo 5 caracteres</span>
            <span className={titulo.length >= 5 ? 'text-blue-600 font-medium' : ''}>
              {titulo.length}/5
            </span>
          </div>
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <span>Descripción detallada</span>
            {descripcion.length >= 10 && (
              <CheckCircle size={16} className="text-green-600" />
            )}
          </label>
          <textarea 
            value={descripcion} 
            onChange={e => setDescripcion(e.target.value)} 
            placeholder="Describe exactamente lo que ocurrió, incluyendo detalles relevantes..."
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all duration-200 min-h-[120px] resize-none"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Mínimo 10 caracteres</span>
            <span className={descripcion.length >= 10 ? 'text-blue-600 font-medium' : ''}>
              {descripcion.length}/10
            </span>
          </div>
        </div>

        {/* Distrito */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <span>Distrito</span>
            {distrito && (
              <CheckCircle size={16} className="text-green-600" />
            )}
          </label>
          <select 
            value={distrito} 
            onChange={e => setDistrito(e.target.value)} 
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all duration-200 appearance-none"
          >
            <option value="">{loadingDistritos ? 'Cargando distritos...' : 'Seleccione un distrito'}</option>
            {distritosError && (
              <option value="" disabled>{distritosError}</option>
            )}
            {distritosList.map(d => (
              // usamos el nombre como valor para mantener compatibilidad con el resto del código
              <option key={d.id} value={d.nombre}>{d.nombre}</option>
            ))}
          </select>
        </div>

        {/* Botón siguiente */}
        <div className="flex justify-end pt-4">
          <button 
            disabled={!canNext}
            onClick={() => onNext({ titulo, descripcion, distrito })}
            className={`px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 ${
              canNext 
                ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 hover:shadow-xl'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Continuar a Ubicación →
          </button>
        </div>
      </div>
    </div>
  )
}