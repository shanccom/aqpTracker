import React from 'react'
import { MapPin, ThumbsUp, MessageCircle, Users } from 'lucide-react'

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
  apoyos_count?: number
}

type Props = {
  post: Post
  onOpen: (post: Post) => void
  onApoyar?: (postId: number) => void
  onLike?: (postId: number) => void
}

const PostCard: React.FC<Props> = ({ post, onOpen, onApoyar, onLike }) => {
  const handleApoyar = (e: React.MouseEvent) => {
    e.stopPropagation()
    onApoyar?.(post.id)
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    onLike?.(post.id)
  }

  return (
    <article onClick={() => onOpen(post)} className="cursor-pointer">
      <div className="flex flex-col items-stretch justify-start rounded-xl shadow-sm bg-white border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 hover:border-gray-200">
        {post.imagen && (
          <div 
            className="w-full bg-center bg-no-repeat aspect-[16/7] bg-cover bg-gray-50"
            style={{ backgroundImage: `url('${post.imagen}')` }}
          />
        )}
        
        <div className="flex w-full grow flex-col items-stretch justify-center gap-4 p-6">
          {/* Header con ubicación */}
          {post.ubicacion && (
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin size={14} className="text-gray-400" />
              <span className="text-sm font-medium">{post.ubicacion}</span>
            </div>
          )}

          {/* Contenido principal */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 leading-tight">
              {post.titulo}
            </h3>
            
            {post.descripcion && (
              <p className="text-gray-600 leading-relaxed line-clamp-3">
                {post.descripcion}
              </p>
            )}
          </div>

          {/* Metadatos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                por {post.autor || 'Usuario anónimo'} • {post.tiempo || 'hace poco'}
              </span>
            </div>

            {/* Primer reportero y reportes */}
            <div className="flex items-center justify-between">
              {post.primer_reportero && (
                <div className="flex items-center gap-1.5">
                  <img 
                    src={post.primer_reportero.foto || '/static/img/profile.jpg'} 
                    alt="avatar" 
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="text-xs text-gray-500">
                    Reportado por {post.primer_reportero.first_name}
                  </span>
                </div>
              )}
              
              {post.reports_count !== undefined && post.reports_count > 0 && (
                <span className="text-xs text-gray-500 font-medium">
                  {post.reports_count} {post.reports_count === 1 ? 'reporte' : 'reportes'}
                </span>
              )}
            </div>
          </div>

          {/* Footer con TODAS las interacciones */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            {/* LADO IZQUIERDO - Acciones principales */}
            <div className="flex items-center gap-3">
              {/* Botón Like */}
              <button 
                onClick={handleLike}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
              >
                <ThumbsUp size={16} />
                <span className="text-sm font-medium">Me gusta</span>
              </button>

              {/* Botón Apoyar */}
              <button 
                onClick={handleApoyar}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
              >
                <Users size={16} />
                <span className="text-sm font-medium">Apoyar</span>
              </button>

              {/* Contador de comentarios */}
              <div className="flex items-center gap-2 text-gray-600 ml-2">
                <MessageCircle size={16} />
                <span className="text-sm font-medium">{post.comentarios || 0}</span>
              </div>
            </div>

            {/* LADO DERECHO - Contadores y estado */}
            <div className="flex items-center gap-4">
              {/* Contadores de interacciones */}
              <div className="flex items-center gap-4 text-gray-500">
                {post.reacciones > 0 && (
                  <div className="flex items-center gap-1">
                    <ThumbsUp size={14} />
                    <span className="text-sm">{post.reacciones}</span>
                  </div>
                )}
                {post.apoyos_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span className="text-sm">{post.apoyos_count}</span>
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
        </div>
      </div>
    </article>
  )
}

export default PostCard