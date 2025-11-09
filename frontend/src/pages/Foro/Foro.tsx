import React, { useState, useEffect } from 'react'
import EncabezadoForo from './components/EncabezadoForo'
import FiltrosForo from './components/FiltrosForo'
import ListaIncidentes from './components/ListaIncidentes'
import BotonReportar from './components/BotonReportar'
import foroService from '../../services/foroService'

const ForoView: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([])
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

  // initial load: fetch all (preview) incidencias when component mounts
  useEffect(() => {
    let mounted = true
    const load = async () => {
      setError(null)
      setLoading(true)
      try {
        const results = await foroService.previewIncidencias({})
        if (!mounted) return
        setPosts(results)
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

  return (
    <div className="relative flex h-auto min-h-screen w-full overflow-x-hidden bg-background-light dark:bg-background-dark">
      <div className="flex flex-col flex-1">
        <EncabezadoForo />
        <main className="flex flex-1 justify-center py-5 px-4 md:px-10">
          <div className="w-full max-w-4xl flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-start gap-4">
              <FiltrosForo onChange={handleFiltersChange} />
            </div>
            <ListaIncidentes posts={posts} loading={loading} error={error} />
          </div>
        </main>
      </div>
      <BotonReportar />
    </div>
  )
}

export default ForoView