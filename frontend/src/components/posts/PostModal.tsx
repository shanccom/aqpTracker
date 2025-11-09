import React, { useState, useEffect } from 'react'
import { X, Users, ThumbsUp, MessageCircle } from 'lucide-react'
import CommentsList from './CommentsList'
import NewCommentBox from './NewCommentBox'
import api from '../../api/axios'

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
}

const PostModal: React.FC<{ post: Post | null, onClose: () => void, initialComments?: any[] }> = ({ post, onClose, initialComments = [] }) => {
  const [comments, setComments] = useState(initialComments)
  const [reported, setReported] = useState<boolean>(false)
  const [reportsCountState, setReportsCountState] = useState<number>(post?.reports_count ?? 0)
  const [loadingReport, setLoadingReport] = useState(false)
  const [liked, setLiked] = useState<boolean>(false)
  const [likesCount, setLikesCount] = useState<number>(post?.reacciones ?? 0)

  if (!post) return null

  const addComment = (text: string) => {
    const next = [{ id: Date.now(), author: 'Tú', text, time: 'ahora', likes: 0 }, ...comments]
    setComments(next)
  }

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

  const handleSupport = async () => {
    if (reported) return
    setLoadingReport(true)
    try {
      await api.post('/api/foro/reportes/', { incidencia_id: post.id })
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
    setLiked(!liked)
    setLikesCount(prev => liked ? prev - 1 : prev + 1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-xl overflow-auto shadow-2xl h-[90vh] border border-gray-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              <img src="/static/img/profile.jpg" alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{post.autor || 'Usuario anónimo'}</p>
              <p className="text-sm text-gray-500">{post.tiempo || 'hace poco'}</p>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100">
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Contenido principal */}
        <div className="p-6 overflow-auto">
          {/* Ubicación */}
          {post.ubicacion && (
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <span className="text-sm font-medium">{post.ubicacion}</span>
            </div>
          )}
          {/* Distrito */}
          {
            post.distrito && (
              <div className="flex items-center gap-2 text-gray-500 mb-3">
                <span className="text-sm font-medium">Distrito: {post.distrito}</span>
              </div>
            )
          }

          {/* Título y descripción */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{post.titulo}</h1>
          <div className="text-gray-600 mb-6 leading-relaxed">{post.descripcion}</div>

          {/* Imagen principal */}
          {post.imagen && (
            <div 
              className="w-full bg-center bg-no-repeat bg-cover aspect-[16/7] rounded-xl mb-6 border border-gray-200 bg-gray-50"
              style={{ backgroundImage: `url('${post.imagen}')` }} 
            />
          )}

          {/* Grid de imágenes adicionales */}
          {post.imagenes && post.imagenes.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {post.imagenes.slice(0, 4).map((img, idx) => (
                <img 
                  key={img.id || idx} 
                  alt={`Foto del incidente ${idx+1}`} 
                  className="w-full h-24 object-cover rounded-lg border border-gray-200 bg-gray-50"
                  src={img.url} 
                />
              ))}
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
                <ThumbsUp size={16} className={liked ? "text-blue-500" : ""} />
                <span className="text-sm font-medium">Me gusta</span>
              </button>

              {/* Botón Apoyar (color del logo) */}
              <button 
                onClick={handleSupport}
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
                {likesCount > 0 && (
                  <div className="flex items-center gap-1">
                    <ThumbsUp size={14} />
                    <span className="text-sm">{likesCount}</span>
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
              {post.estado && (
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  post.estado === 'Activo' 
                    ? 'bg-orange-100 text-orange-700' 
                    : post.estado === 'Resuelto'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {post.estado}
                </div>
              )}
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-gray-100 my-6"></div>

          {/* Comentarios */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Comentarios</h2>
            <CommentsList comments={comments} />
            <NewCommentBox onAdd={addComment} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostModal