import React, { useState, useEffect } from 'react'
import PostCard from './PostCard'
import PostModal from './PostModal'

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
}

const PostsList: React.FC<{ posts: Post[]; onLike?: (id: number) => void; onApoyar?: (id: number) => void; onOpenExternal?: (post: Post) => void; externalOpenId?: number | null }> = ({ posts, onLike, onApoyar, onOpenExternal, externalOpenId = null }) => {
  const [selected, setSelected] = useState<Post | null>(null)

  const open = (p: Post) => setSelected(p)
  const close = () => setSelected(null)

  // keep selected in sync when posts array updates (e.g., like/apoyar changed counts)
  useEffect(() => {
    if (!selected) return
    const updated = posts.find(x => x.id === selected.id)
    if (updated) setSelected(updated)
  }, [posts])

  // allow external opener (e.g., navigate from profile to foro with an id)
  useEffect(() => {
    if (onOpenExternal) return // external open handled by parent
    if (!externalOpenId) return
    const target = posts.find(p => p.id === externalOpenId)
    if (target) setSelected(target)
  }, [externalOpenId, posts, onOpenExternal])

  // demo comments per post
  const demoComments = [
    { id: 1, author: 'Juan Pérez', avatar: '/static/img/profile.jpg', text: 'Justo pasé por ahí, confirmo que está bloqueando el carril derecho.', time: 'hace 10 minutos', likes: 15 },
    { id: 2, author: 'Ana García', avatar: '/static/img/profile.jpg', text: '@Juan Pérez gracias por la info!', time: 'hace 2 minutos', likes: 2 },
    { id: 3, author: 'Carlos Ruiz', avatar: '/static/img/profile.jpg', text: '¿Alguien sabe cuánto tiempo tardará la reparación?', time: 'hace 1 hora', likes: 5 }
  ]

  return (
    <div className="flex flex-col w-full gap-6">
      {posts.map(p => (
        <PostCard key={p.id} post={p} onOpen={onOpenExternal ?? open} onLike={onLike} onApoyar={onApoyar} />
      ))}

      {/* render modal only when not using external opener */}
      {!onOpenExternal && selected && (
        <PostModal post={selected} onClose={close} initialComments={demoComments} onLike={onLike} onApoyar={onApoyar} />
      )}
    </div>
  )
}

export default PostsList
