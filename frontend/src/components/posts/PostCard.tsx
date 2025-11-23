import React, { useState, useEffect } from 'react'
import { MapPin, ThumbsUp, MessageCircle, Users, Calendar, User, Heart } from 'lucide-react'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { timeAgo, formatDateShort } from '../../utils/date'

type Post = {
  id: number
  titulo: string
  ubicacion?: string
  direccion?: string | null
  distrito?: string | null
  descripcion?: string
  imagen?: string | null
  autor?: string
  tiempo?: string
  comentarios?: number
  reacciones?: number
  estado?: string
  reports_count?: number
  primer_reportero?: { id?: number; first_name?: string; foto?: string }
  apoyos_count?: number
}

type Props = {
  post: Post
  onOpen: (post: Post) => void
  onApoyar?: (postId: number) => void
  onLike?: (postId: number) => void
}

const PostCard: React.FC<Props> = ({ post, onOpen, onApoyar, onLike }) => {
  const ubicacionText = typeof (post as any).ubicacion === 'object'
    ? ((post as any).ubicacion?.nombre ?? String((post as any).ubicacion))
    : (post.ubicacion || '')
  const direccionText = post.direccion || ''
  const distritoText = typeof (post as any).distrito === 'object'
    ? ((post as any).distrito?.nombre ?? String((post as any).distrito))
    : (post.distrito || '')
  const estadoText = typeof (post as any).estado === 'object'
    ? ((post as any).estado?.nombre ?? String((post as any).estado))
    : (post.estado || '')
  const autorText = typeof (post as any).autor === 'object'
    ? ((post as any).autor?.nombre || (post as any).autor?.first_name || String((post as any).autor))
    : (post.autor || '')

    const rawLat = (post as any).latitud ?? (post as any).lat ?? (post as any).latitude ?? (post as any).location?.lat
  const rawLon = (post as any).longitud ?? (post as any).lon ?? (post as any).lng ?? (post as any).location?.lon ?? (post as any).location?.lng
  const lat = rawLat !== undefined && rawLat !== null ? parseFloat(String(rawLat)) : undefined
  const lon = rawLon !== undefined && rawLon !== null ? parseFloat(String(rawLon)) : undefined
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon)
  const [isReported, setIsReported] = useState<boolean>((post as any).reported_by_me ?? false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    setIsReported((post as any).reported_by_me ?? false)
  }, [post])

  const handleApoyar = (e: React.MouseEvent) => {
    e.stopPropagation()
    if ((post as any).reported_by_me || isReported) return
    setShowConfirm(true)
  }

  const doConfirm = () => {
    setIsReported(true)
    setShowConfirm(false)
    onApoyar?.(post.id)
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    onLike?.(post.id)
  }

  const handleOpenIfNotAction = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement | null
    if (el && el.closest('button')) return
    onOpen(post)
  }

  return (
    <article onClick={handleOpenIfNotAction} className="cursor-pointer">
      <div className="flex flex-col rounded-xl shadow-sm bg-white border border-blue-50 overflow-hidden hover:shadow-md transition-all duration-200 hover:border-blue-100">
        
        {/* Header con ubicación y estado - ARRIBA DE TODO */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 pb-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
              <MapPin size={16} />
              <span className="truncate max-w-[200px]">{direccionText || ubicacionText || 'Ubicación no especificada'}</span>
            </div>
            
            {distritoText && (
              <div className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                {distritoText}
              </div>
            )}
          </div>

          {estadoText && (
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              estadoText === 'Activo' 
                ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                : estadoText === 'Resuelto'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200'
            }`}>
              {estadoText}
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Título */}
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight line-clamp-2 mb-3">
            {post.titulo}
          </h3>

          {/* Imagen */}
          {post.imagen && (
            <div className="mb-3">
              <div 
                className="w-full h-48 sm:h-56 bg-center bg-no-repeat bg-cover bg-gray-50 rounded-lg overflow-hidden"
                style={{ backgroundImage: `url('${post.imagen}')` }}
              />
            </div>
          )}

          {/* Mapa */}
          {hasCoords && (
            <div className="mb-3">
              <div className="w-full rounded-lg overflow-hidden border border-gray-200">
                {(() => {
                  const delta = 0.005
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
                      <iframe
                        title={`map-${post.id}`}
                        src={src}
                        className="w-full h-48 sm:h-56"
                        style={{ border: 0 }}
                      />
                      <div className="p-3 bg-gray-50 text-xs text-gray-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <MapPin size={12} />
                          <span className="truncate">{direccionText || distritoText || 'Ubicación'}</span>
                        </div>
                        <a 
                          href={outlink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver mapa completo
                        </a>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Descripción */}
          {post.descripcion && (
            <p className="text-gray-600 leading-relaxed line-clamp-3 mb-3 text-sm sm:text-base">
              {post.descripcion}
            </p>
          )}

          {/* Metadatos - Información del autor y tiempo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <User size={14} />
                <span className="truncate">{autorText || 'Usuario anónimo'}</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                <span>{post.tiempo ? timeAgo(post.tiempo) : 'Recientemente'}</span>
                {post.tiempo && (
                  <span className="text-gray-400 hidden sm:inline">· {formatDateShort(post.tiempo)}</span>
                )}
              </div>
            </div>

            {/* Contador de reportes */}
            {post.reports_count !== undefined && post.reports_count > 0 && (
              <div className="text-xs font-medium bg-red-50 text-red-700 px-2 py-1 rounded-md">
                {post.reports_count} {post.reports_count === 1 ? 'reporte' : 'reportes'}
              </div>
            )}
          </div>

          {/* Información del primer reportero */}
          {post.primer_reportero && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={12} />
              </div>
              <span>Reportado por {post.primer_reportero.first_name}</span>
            </div>
          )}

          {/* Footer - Contadores de interacción y botones */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-3 border-t border-gray-100">
            
            {/* Contadores de interacción - LADO IZQUIERDO */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {/* Contador de likes */}
              {(post.reacciones ?? 0) > 0 && (
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                  <Heart size={16} className="text-blue-500" />
                  <span className="font-medium">
                    A {post.reacciones} persona{post.reacciones === 1 ? '' : 's'} le gusta
                  </span>
                </div>
              )}

              {/* Contador de apoyos */}
              {(post.apoyos_count ?? 0) > 0 && (
                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                  <Users size={16} className="text-green-600" />
                  <span className="font-medium">
                    {post.apoyos_count} apoyando
                  </span>
                </div>
              )}
            </div>

            {/* Botones de acción - LADO DERECHO */}
            <div className="flex items-center gap-2 justify-end">
              {/* Botón Like */}
              <button 
                onClick={handleLike}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 active:scale-95 min-w-[100px] justify-center"
              >
                <ThumbsUp size={18} />
                <span className="font-medium">Me gusta</span>
              </button>

              {/* Botón Apoyar */}
              <button 
                onClick={handleApoyar}
                disabled={isReported || (post as any).reported_by_me}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white border border-green-700 rounded-lg hover:bg-green-700 hover:border-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 min-w-[100px] justify-center"
              >
                <Users size={18} />
                <span className="font-medium">
                  {(isReported || (post as any).reported_by_me) ? 'Apoyado' : 'Apoyar'}
                </span>
              </button>

              {/* Botón Comentar */}
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white border border-blue-700 rounded-lg min-w-[120px] justify-center">
                <MessageCircle size={18} />
                <span className="font-medium">Comentar</span>
                {(post.comentarios ?? 0) > 0 && (
                  <span className="bg-white text-blue-700 px-1.5 py-0.5 rounded text-xs min-w-6 text-center font-bold">
                    {post.comentarios}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm modal for apoyar */}
      <ConfirmModal
        open={showConfirm}
        title="Confirmar apoyo"
        message="Si confirmas, estarás indicando que este incidente existe. ¿Deseas continuar?"
        onConfirm={doConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </article>
  )
}

export default PostCard