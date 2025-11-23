import React, { useState, useEffect, useMemo } from 'react'
import { X, Users, ThumbsUp, MessageCircle } from 'lucide-react'
import ConfirmModal from '../ui/ConfirmModal'
import { timeAgo, formatDateTime } from '../../utils/date'
import CommentsList from './CommentsList'
import NewCommentBox from './NewCommentBox'
import api from '../../api/axios'
import { useAuth } from '../auth/AuthProvider'

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
  apoyos_count?: number
  imagenes?: Array<{ id: number; url: string }>
  distrito?: string
  direccion?: string | null
  reported_by_me?: boolean
}

const PostModal: React.FC<{ post: Post | null, onClose: () => void, initialComments?: any[], onLike?: (id: number) => void, onApoyar?: (id: number) => void }> = ({ post, onClose, initialComments = [], onLike, onApoyar }) => {
  const { user, openLogin } = useAuth()
  const [comments, setComments] = useState(initialComments)
  const [reported, setReported] = useState<boolean>(false)
  const [reportsCountState, setReportsCountState] = useState<number>(post?.reports_count ?? 0)
  const [loadingReport, setLoadingReport] = useState(false)

  const [fullPost, setFullPost] = useState<any | null>(null)

  // gallery state
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)

  if (!post) return null

  const distritoText = typeof (post as any).distrito === 'object'
    ? ((post as any).distrito?.nombre ?? String((post as any).distrito))
    : (post.distrito || '')
  const direccionText = post.direccion || ''
  const estadoText = typeof (post as any).estado === 'object'
    ? ((post as any).estado?.nombre ?? String((post as any).estado))
    : (post.estado || '')
  const autorText = typeof (post as any).autor === 'object'
    ? ((post as any).autor?.nombre || (post as any).autor?.first_name || String((post as any).autor))
    : (post.autor || '')

  const addComment = (text: string) => {
    if (!user) {
      // prompt login if not authenticated
      openLogin()
      return
    }
    // POST the comment to backend then update UI with the returned comment
    (async () => {
      try {
        const payload = { incidencia: post.id, contenido: text }
        const res = await api.post('/api/foro/comentarios/', payload)
        const created = res.data
        // map backend comment to UI shape expected by CommentsList
        const usuario = created.usuario || null
        const author = usuario ? (usuario.first_name || usuario.email || 'Usuario') : 'Tú'
        const avatar = usuario ? (usuario.foto || (user?.foto ?? '/img/profile_default.png')) : (user?.foto ?? '/img/profile_default.png')
        const mapped = {
          id: created.id,
          author,
          avatar,
          text: created.contenido || created.body || text,
          time: created.fecha_creacion || 'ahora',
          likes: 0,
          liked_by_me: false,
        }
        setComments(prev => [mapped, ...(prev || [])])
      } catch (err) {
        // fallback to optimistic local comment if request fails
        const next = [{ id: Date.now(), author: 'Tú', avatar: user?.foto ?? '/img/profile_default.png', text, time: 'ahora', likes: 0 }, ...comments]
        setComments(next)
      }
    })()
  }

  // load default reaction type to use when liking a comment
  const [defaultTipoId, setDefaultTipoId] = useState<number | null>(null)
  useEffect(() => {
    let mounted = true
    async function loadTipos() {
      try {
        const res = await api.get('/api/foro/tiporeacciones/')
        const data = res.data || []
        if (!mounted) return
        // prefer one with 'me gusta' in the name
        const found = (data || []).find((t: any) => (t.nombre || '').toLowerCase().includes('me gusta'))
        setDefaultTipoId(found ? found.id : (data[0] ? data[0].id : null))
      } catch (e) {
        // ignore
      }
    }
    loadTipos()
    return () => { mounted = false }
  }, [])

  const handleCommentLike = async (commentId: number) => {
    if (!defaultTipoId) return
    try {
      const res = await api.post('/api/foro/reacciones/toggle/', { comentario: commentId, tipo: defaultTipoId })
      const data = res.data || {}
      // prefer authoritative count from server when available
      if (typeof data.count === 'number') {
        setComments(prev => (prev || []).map((c: any) => c.id === commentId ? { ...c, likes: data.count, liked_by_me: !!data.liked_by_me } : c))
      } else if (data.created) {
        setComments(prev => (prev || []).map((c: any) => c.id === commentId ? { ...c, likes: (c.likes || 0) + 1, liked_by_me: true } : c))
      } else if (data.deleted) {
        setComments(prev => (prev || []).map((c: any) => c.id === commentId ? { ...c, likes: Math.max(0, (c.likes || 1) - 1), liked_by_me: false } : c))
      }
    } catch (e) {
      // ignore for now (could show toast)
    }
  }

  const openLoginIfNeeded = () => openLogin()

  useEffect(() => {
    let mounted = true
    async function checkReported() {
      if (!post) return
      try {
        const res = await api.get('/api/foro/reportes/me/')
        const data = res.data.results ?? res.data
        const exists = data.some((r: any) => r.incidencia && r.incidencia.id === post.id)
        if (mounted) setReported(!!exists)
      } catch (e) {
        // ignore
      }
    }
    checkReported()
    return () => { mounted = false }
  }, [post?.id])

  // fetch full incidencia details when modal opens (imagenes, coords, etc.)
  useEffect(() => {
    let mounted = true
    async function fetchDetail() {
      if (!post) return
      try {
        // fetch UI-shaped payload intended for the modal (includes mapped comentarios)
        const res = await api.get(`/api/foro/incidencias_modal/${post.id}/`)
        if (!mounted) return
        setFullPost(res.data)
        // if the modal-shaped payload includes comentarios in UI shape, use them
        if (res.data && Array.isArray(res.data.comentarios)) {
          setComments(res.data.comentarios)
        }
      } catch (e) {
        // ignore - we can render with preview
      }
    }
    fetchDetail()
    return () => { mounted = false }
  }, [post?.id])

  // keep comments in sync when fullPost changes
  useEffect(() => {
    if (!fullPost) return
    if (Array.isArray(fullPost.comentarios)) setComments(fullPost.comentarios)
  }, [fullPost])

  // build images list (main image + additional images)
  const images: string[] = useMemo(() => {
    const srcs: string[] = []
    const source = fullPost ?? post
    if (!source) return srcs
    if (source.imagen) srcs.push(source.imagen)
    if (Array.isArray(source.imagenes) && source.imagenes.length > 0) {
      source.imagenes.forEach((i: any) => { if (i && i.url) srcs.push(i.url) })
    }
    return Array.from(new Set(srcs))
  }, [fullPost, post])

  // coordinates taken preferably from detail
  const rawLat = (fullPost as any)?.latitud ?? (fullPost as any)?.lat ?? (post as any).latitud ?? (post as any).lat
  const rawLon = (fullPost as any)?.longitud ?? (fullPost as any)?.lon ?? (post as any).longitud ?? (post as any).lon
  const lat = rawLat !== undefined && rawLat !== null ? parseFloat(String(rawLat)) : undefined
  const lon = rawLon !== undefined && rawLon !== null ? parseFloat(String(rawLon)) : undefined
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon)

  const openGalleryAt = (idx: number) => {
    if (images.length === 0) return
    setGalleryIndex(idx)
    setGalleryOpen(true)
  }

  const closeGallery = () => setGalleryOpen(false)
  const nextImage = () => setGalleryIndex(i => (i + 1) % images.length)
  const prevImage = () => setGalleryIndex(i => (i - 1 + images.length) % images.length)

  useEffect(() => {
    if (!galleryOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeGallery()
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [galleryOpen, images.length])

  const handleSupport = async () => {
    if (!user) { openLoginIfNeeded(); return }
    if (reported) return
    setLoadingReport(true)
    try {
      // confirmation handled by modal UI
      if (onApoyar) {
        await onApoyar(post.id)
      } else {
        await api.post('/api/foro/reportes/', { incidencia_id: post.id })
      }
      setReported(true)
      setReportsCountState(c => (c || 0) + 1)
    } catch (err: any) {
      // if already reported or other error, try to refresh counts
      try {
        const inc = await api.get(`/api/foro/incidencias/${post.id}/`)
        const data = inc.data
        setReportsCountState(data.reports_count ?? data.reports_count ?? reportsCountState)
      } catch (e) {
        // ignore
      }
    } finally {
      setLoadingReport(false)
    }
  }

  const handleLike = () => {
    if (!user) { openLoginIfNeeded(); return }
    if (onLike) {
      try {
        onLike(post.id)
      } catch (e) {
        // ignore
      }
    }
  }

  // keep reportsCountState in sync if post prop changes
  useEffect(() => {
    setReportsCountState(post?.reports_count ?? 0)
  }, [post?.reports_count])

  // if parent marks post as reported_by_me, update local reported flag too
  useEffect(() => {
    if ((post as any).reported_by_me) setReported(true)
  }, [post?.reported_by_me])

  const [showConfirm, setShowConfirm] = useState(false)

  const doConfirmSupport = async () => {
    setShowConfirm(false)
    await handleSupport()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-xl overflow-auto shadow-2xl h-[90vh] border border-gray-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {/* Show author's foto only when a user is logged in; otherwise show frontend default */}
              <img
                src={
                  (fullPost && fullPost.autor && fullPost.autor.foto) ||
                  (typeof (post as any).autor === 'object' && (post as any).autor?.foto) ||
                  '/img/profile_default.png'
                }
                alt={autorText || 'avatar'}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{autorText || 'Usuario anónimo'}</p>
              <p className="text-sm text-gray-500">{post.tiempo ? `${timeAgo(post.tiempo)} · ${formatDateTime(post.tiempo)}` : 'hace poco'}</p>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100">
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Contenido principal */}
        <div className="p-6 overflow-auto">
          {/* Ubicación */}
          {/* Dirección textual (si existe) */}
          {direccionText && (
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <span className="text-sm font-medium">Dirección: {direccionText}</span>
            </div>
          )}
          {/* Ubicación / Distrito */}
          {distritoText && (
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <span className="text-sm font-medium">Distrito: {distritoText}</span>
            </div>
          )}

          {/* Título y descripción */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{post.titulo}</h1>
          <div className="text-gray-600 mb-6 leading-relaxed">{post.descripcion}</div>

          {/* Imagenes como galería: miniaturas que abren una vista ampliada */}
          {images.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {images.map((src, idx) => (
                  <button key={idx} onClick={() => openGalleryAt(idx)} className="block w-full h-28 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <img src={src} alt={`Foto ${idx+1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">Pulsa una imagen para verla en detalle</div>
            </div>
          )}

          {/* Mapa grande si hay coordenadas (proviene del detalle si está disponible) */}
          {hasCoords && (
            <div className="w-full rounded-md overflow-hidden border border-gray-100 mb-6">
              {(() => {
                const delta = 0.0025
                const left = (lon as number) - delta
                const right = (lon as number) + delta
                const bottom = (lat as number) - delta
                const top = (lat as number) + delta
                const bbox = encodeURIComponent(`${left},${bottom},${right},${top}`)
                const marker = encodeURIComponent(`${lat},${lon}`)
                const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`
                const outlink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`
                return (
                  <div>
                    <iframe title={`map-modal-${post.id}`} src={src} className="w-full h-60" style={{ border: 0 }} />
                    <div className="p-2 text-xs text-gray-500 flex items-center justify-between">
                      <div>{direccionText || distritoText || 'Ubicación'}</div>
                      <a href={outlink} target="_blank" rel="noopener noreferrer" className="underline">Ver en OpenStreetMap</a>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Sección de interacciones - COHERENTE CON EL COMPONENTE ANTERIOR */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6 mb-6">
            {/* Lado izquierdo - Botones de acción */}
            <div className="flex items-center gap-3">
              {/* Botón Like */}
              <button 
                onClick={handleLike}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
              >
                <ThumbsUp size={16} />
                <span className="text-sm font-medium">Me gusta</span>
              </button>

              {/* Botón Apoyar (color del logo) */}
              <button 
                onClick={() => setShowConfirm(true)}
                disabled={reported || loadingReport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white border border-[#065f46] rounded-lg hover:bg-[#054f3f] hover:border-[#054f3f] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Users size={16} />
                <span className="text-sm font-medium">
                  {reported ? 'Apoyado' : (loadingReport ? 'Enviando...' : 'Apoyar')}
                </span>
              </button>

              {/* Contador de comentarios */}
              <div className="flex items-center gap-2 text-gray-600 ml-2">
                <MessageCircle size={16} />
                <span className="text-sm font-medium">{post.comentarios || 0}</span>
              </div>
            </div>

            {/* Lado derecho - Contadores y estado */}
            <div className="flex items-center gap-4">
              {/* Contadores de interacciones */}
              <div className="flex items-center gap-4 text-gray-500">
                {(post.reacciones ?? 0) > 0 && (
                  <div className="flex items-center gap-1">
                    <ThumbsUp size={14} />
                    <span className="text-sm">{post.reacciones}</span>
                  </div>
                )}
                {reportsCountState > 0 && (
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span className="text-sm">{reportsCountState}</span>
                  </div>
                )}
              </div>

              {/* Estado */}
              {estadoText && (
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  estadoText === 'Activo' 
                    ? 'bg-orange-100 text-orange-700' 
                    : estadoText === 'Resuelto'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {estadoText}
                </div>
              )}
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-gray-100 my-6"></div>

          {/* Comentarios */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Comentarios</h2>
            <CommentsList comments={comments} onLike={handleCommentLike} />
              {/* Pass only the logged-in user's foto to the NewCommentBox; otherwise show default */}
              <NewCommentBox onAdd={addComment} avatar={user?.foto ?? '/img/profile_default.png'} />
          </div>
        </div>
        <ConfirmModal
          open={showConfirm}
          title="Confirmar apoyo"
          message="Si confirmas, estarás indicando que este incidente existe ante la comunidad. ¿Deseas continuar?"
          onConfirm={doConfirmSupport}
          onCancel={() => setShowConfirm(false)}
        />
        {/* Image gallery overlay */}
        {galleryOpen && images.length > 0 && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80">
            <button onClick={closeGallery} className="absolute top-6 right-6 text-white p-2 rounded-md">Cerrar</button>
            <button onClick={prevImage} className="absolute left-6 text-white p-2 rounded-md">◀</button>
            <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
              <img src={images[galleryIndex]} alt={`Imagen ${galleryIndex+1}`} className="max-w-full max-h-full object-contain rounded-md" />
            </div>
            <button onClick={nextImage} className="absolute right-6 text-white p-2 rounded-md">▶</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PostModal