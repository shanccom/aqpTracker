import React, { useState, useEffect } from 'react'
import EncabezadoForo from './components/EncabezadoForo'
import FiltrosForo from './components/FiltrosForo'
import ListaIncidentes from './components/ListaIncidentes'
import BotonReportar from './components/BotonReportar'
import foroService from '../../services/foroService'
import { useCallback } from 'react'
import { useAuth } from '../../components/auth/AuthProvider'

const ForoView: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([])
  const [tiposReaccion, setTiposReaccion] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiltersChange = async (filters: Record<string, any>) => {
    setError(null)
    setLoading(true)
    try {
      // prefer preview endpoint for lightweight results
      const results = await foroService.previewIncidencias(filters)
      setPosts(results)
    } catch (e: any) {
      setError('Error al cargar incidencias')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setError(null)
      setLoading(true)
      try {
        const results = await foroService.previewIncidencias({})
        if (!mounted) return
        setPosts(results)
        // load reaction types once so we can post likes (reacciones)
        try {
          const tipos = await foroService.listTipoReacciones()
          if (!mounted) return
          setTiposReaccion(Array.isArray(tipos) ? tipos : (tipos.results ?? []))
        } catch (e) {
          // ignore failures to keep page usable
        }
      } catch (e: any) {
        if (!mounted) return
        setError('Error al cargar incidencias')
        setPosts([])
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const { user } = useAuth()

  const handleLike = useCallback(async (postId: number) => {
    // toggle like for current user
    if (!user) return
    const tipo = tiposReaccion.find((t: any) => (t.nombre || '').toLowerCase().includes('me gusta')) || tiposReaccion[0]
    if (!tipo) return
    try {
      // list reactions for this incidencia and tipo
      const reacs: any[] = await foroService.listReacciones({ incidencia: postId, tipo: tipo.id })
      // find reaction by current user; compare id when available, otherwise compare email
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
        // already liked -> remove
        await foroService.deleteReaccion(mine.id)
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, reacciones: Math.max(0, (p.reacciones ?? 0) - 1) } : p))
      } else {
        // not liked -> create
        await foroService.createReaccion(postId, tipo.id)
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, reacciones: (p.reacciones ?? 0) + 1 } : p))
      }
    } catch (err: any) {
      // if something fails, refresh preview to keep counters consistent
      try {
        const results = await foroService.previewIncidencias({})
        setPosts(results)
      } catch (e) {
        // ignore
      }
    }
  }, [tiposReaccion, user])

  const handleApoyar = useCallback(async (postId: number) => {
    try {
      await foroService.createReporte(postId)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, reports_count: (p.reports_count ?? 0) + 1, apoyos_count: (p.apoyos_count ?? 0) + 1, reported_by_me: true } : p))
    } catch (err: any) {
      // server may return 500 for duplicate report (unique constraint). Refresh preview to keep UI consistent
      try {
        const results = await foroService.previewIncidencias({})
        setPosts(results)
      } catch (e) {
        // ignore
      }
    }
  }, [])

  return (
    <div className="relative flex h-auto min-h-screen w-full overflow-x-hidden bg-background-light dark:bg-background-dark">
      <div className="flex flex-col flex-1">
        <EncabezadoForo />
        <main className="flex flex-1 justify-center py-5 px-4 md:px-10">
          <div className="w-full max-w-4xl flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-start gap-4">
              <FiltrosForo onChange={handleFiltersChange} />
            </div>
            <ListaIncidentes posts={posts} loading={loading} error={error} onLike={handleLike} onApoyar={handleApoyar} />
          </div>
        </main>
      </div>
      <BotonReportar />
    </div>
  )
}

export default ForoView