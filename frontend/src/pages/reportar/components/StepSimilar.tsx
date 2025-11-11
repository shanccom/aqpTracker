import { useEffect, useState } from 'react'
import foroService from '../../../services/foroService'
import PostCard from '../../../components/posts/PostCard'
import PostModal from '../../../components/posts/PostModal'
import { AlertTriangle, CheckCircle, Loader } from 'lucide-react'
import { useCallback } from 'react'
import { useAuth } from '../../../components/auth/AuthProvider'

type Props = {
  data: any
  onBack: () => void
  onNext: (delta: any) => void
}

export default function StepSimilar({ data, onBack, onNext }: Props) {
  const [loading, setLoading] = useState(false)
  const [similares, setSimilares] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [tiposReaccion, setTiposReaccion] = useState<any[]>([])

  const { user } = useAuth()

  useEffect(() => {
    let mounted = true
    const loadTipos = async () => {
      try {
        const tipos = await foroService.listTipoReacciones()
        if (!mounted) return
        setTiposReaccion(Array.isArray(tipos) ? tipos : (tipos.results ?? []))
      } catch (e) {
        // ignore
      }
    }
    loadTipos()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    function normalizeArray(arr: any[]) {
      return arr.map((s: any) => ({
        ...s,
        ubicacion: typeof s.ubicacion === 'object' ? (s.ubicacion?.nombre || '') : (s.ubicacion || s.distrito?.nombre || ''),
      }))
    }

    async function load() {
      if (Array.isArray(data.similares) && data.similares.length > 0) {
        setSimilares(normalizeArray(data.similares))
        return
      }
      if (!data.latlng && !data.titulo && !data.distrito) return
      setLoading(true)
      try {
        const params: any = {}
        if (data.latlng) {
          params.lat = data.latlng.lat
          params.lng = data.latlng.lng
          params.radius = 0.5
        }
        if (data.titulo) params.q = data.titulo
        if (data.distrito) params.district = data.distrito

        const res = await foroService.previewIncidencias(params)
        setSimilares(normalizeArray(res || []))
      } catch (err) {
        console.error(err)
        setSimilares([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [data.latlng, data.titulo, data.similares])

  const handleLike = useCallback(async (postId: number) => {
    if (!user) return
    const tipo = tiposReaccion.find((t: any) => (t.nombre || '').toLowerCase().includes('me gusta')) || tiposReaccion[0]
    if (!tipo) return
    try {
      const reacs: any[] = await foroService.listReacciones({ incidencia: postId, tipo: tipo.id })
      const mine = reacs.find(r => {
        if (!r.usuario) return false
        try {
          if (user && (user as any).id && r.usuario.id) return r.usuario.id === (user as any).id
          if (user && (user as any).email && r.usuario.email) return r.usuario.email === (user as any).email
        } catch (e) {
          return false
        }
        return false
      })
      if (mine) {
        await foroService.deleteReaccion(mine.id)
        setSimilares(prev => prev.map(p => p.id === postId ? { ...p, reacciones: Math.max(0, (p.reacciones ?? 0) - 1) } : p))
      } else {
        await foroService.createReaccion(postId, tipo.id)
        setSimilares(prev => prev.map(p => p.id === postId ? { ...p, reacciones: (p.reacciones ?? 0) + 1 } : p))
      }
    } catch (err) {
      try {
        const params: any = {}
        if (data.latlng) { params.lat = data.latlng.lat; params.lng = data.latlng.lng; params.radius = 0.5 }
        if (data.titulo) params.q = data.titulo
        if (data.distrito) params.district = data.distrito
        const res = await foroService.previewIncidencias(params)
        setSimilares(res || [])
      } catch (e) {
        // ignore
      }
    }
  }, [tiposReaccion, user, data.latlng, data.titulo, data.distrito])

  const handleApoyar = useCallback(async (postId: number) => {
    try {
      await foroService.createReporte(postId)
      setSimilares(prev => prev.map(p => p.id === postId ? { ...p, reports_count: (p.reports_count ?? 0) + 1, apoyos_count: (p.apoyos_count ?? 0) + 1, reported_by_me: true } : p))
    } catch (err) {
      try {
        const params: any = {}
        if (data.latlng) { params.lat = data.latlng.lat; params.lng = data.latlng.lng; params.radius = 0.5 }
        if (data.titulo) params.q = data.titulo
        if (data.distrito) params.district = data.distrito
        const res = await foroService.previewIncidencias(params)
        setSimilares(res || [])
      } catch (e) {
        // ignore
      }
    }
  }, [data.latlng, data.titulo, data.distrito])

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header sólido verde */}
      <div className="bg-green-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold">3</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">Incidentes Similares</h2>
            <p className="text-green-100 text-sm">Revisa reportes existentes antes de continuar</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Estado de carga */}
            {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Loader size={48} className="animate-spin text-green-500 mb-4" />
            <p className="text-lg font-semibold">Buscando incidentes similares</p>
            <p className="text-sm">Estamos revisando reportes en tu zona...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resultados */}
                {similares.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">¡Zona libre de incidentes!</h3>
                <p className="text-gray-600 mb-6">
                  No se encontraron reportes similares en esta ubicación.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 max-w-md mx-auto">
                  <p className="text-green-700 font-semibold">
                    Puedes continuar para crear el primer reporte en esta área
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header de resultados */}
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <AlertTriangle size={24} className="text-green-500" />
                  <div>
                    <h3 className="font-semibold text-amber-800">
                      Se encontraron {similares.length} incidente(s) similar(es)
                    </h3>
                    <p className="text-sm text-green-600">
                      Revisa los reportes existentes antes de crear uno nuevo
                    </p>
                  </div>
                </div>

                {/* Lista de incidentes */}
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {similares.map(s => (
                    <div 
                      key={s.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow duration-200 rounded-lg"
                      onClick={() => setSelected(s)}
                    >
                      <PostCard post={s} onOpen={() => setSelected(s)} onLike={handleLike} onApoyar={handleApoyar} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navegación */}
        <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-gray-100">
          <button 
            onClick={onBack}
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300 font-semibold shadow-sm"
          >
            ← Volver
          </button>
          <button 
            onClick={() => onNext({ similares })}
            className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all duration-300 shadow-lg shadow-emerald-200 hover:shadow-xl"
          >
            Continuar con el Reporte →
          </button>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <PostModal 
          post={selected} 
          onClose={() => setSelected(null)} 
          onLike={handleLike}
          onApoyar={handleApoyar}
        />
      )}
    </div>
  )
}