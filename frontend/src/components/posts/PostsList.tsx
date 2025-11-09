import React, { useState } from 'react'
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

const PostsList: React.FC<{ posts: Post[] }> = ({ posts }) => {
  const [selected, setSelected] = useState<Post | null>(null)

  const open = (p: Post) => setSelected(p)
  const close = () => setSelected(null)

  // demo comments per post (could be fetched by id)
  const demoComments = [
    { id: 1, author: 'Juan Pérez', avatar: '/static/img/profile.jpg', text: 'Justo pasé por ahí, confirmo que está bloqueando el carril derecho.', time: 'hace 10 minutos', likes: 15 },
    { id: 2, author: 'Ana García', avatar: '/static/img/profile.jpg', text: '@Juan Pérez gracias por la info!', time: 'hace 2 minutos', likes: 2 },
    { id: 3, author: 'Carlos Ruiz', avatar: '/static/img/profile.jpg', text: '¿Alguien sabe cuánto tiempo tardará la reparación?', time: 'hace 1 hora', likes: 5 }
  ]

  return (
    <div className="flex flex-col w-full gap-6">
      {posts.map(p => (
        <PostCard key={p.id} post={p} onOpen={open} />
      ))}

      {selected && (
        <PostModal post={selected} onClose={close} initialComments={demoComments} />
      )}
    </div>
  )
}

export default PostsList
