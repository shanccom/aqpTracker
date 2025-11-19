import { useEffect, useState } from 'react'
import PostsList from '../../../components/posts/PostsList'
import { getMyAuthoredIncidencias, getMySupportedIncidencias } from '../../../services/authService'

type Post = {
  id: number
  titulo: string
  ubicacion?: string
  descripcion?: string
  imagen?: string | null
  autor?: string
  tiempo?: string
  comentarios?: number
  reacciones?: number
  estado?: string
  reports_count?: number
  primer_reportero?: { id?: number; first_name?: string; foto?: string }
}

export default function MyPostsTabs() {
  const [tab, setTab] = useState<'authored'|'supported'>('authored')
  const [authored, setAuthored] = useState<Post[]>([])
  const [supported, setSupported] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const a = await getMyAuthoredIncidencias()
        if (!mounted) return
        setAuthored(a.results ?? [])

        const s = await getMySupportedIncidencias()
        if (!mounted) return
        setSupported(s.results ?? [])
      } catch (e: any) {
        console.error('Error loading my posts tabs', e)
        if (!mounted) return
        setError(e?.message || 'Error al cargar publicaciones')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setTab('authored')} className={`px-3 py-1 rounded-md ${tab === 'authored' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-emerald-100'}`}>
          Mis publicaciones
        </button>
        <button onClick={() => setTab('supported')} className={`px-3 py-1 rounded-md ${tab === 'supported' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-emerald-100'}`}>
          Publicaciones que apoyé
        </button>
      </div>

  {loading && <div className="py-6 text-center text-sm text-gray-500">Cargando...</div>}
  {error && <div className="py-4 text-center text-sm text-red-600">{error}</div>}

      {!loading && tab === 'authored' && (
        authored.length ? <PostsList posts={authored} /> : <div className="py-10 text-center text-gray-500">No has publicado incidentes todavía.</div>
      )}

      {!loading && tab === 'supported' && (
        supported.length ? <PostsList posts={supported} /> : <div className="py-10 text-center text-gray-500">No has apoyado publicaciones todavía.</div>
      )}
    </div>
  )
}
