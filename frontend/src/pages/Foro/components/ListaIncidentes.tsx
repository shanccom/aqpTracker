import React from 'react'
import PostsList from '../../../components/posts/PostsList'

const ListaIncidentes: React.FC<{ posts?: any[]; loading?: boolean; error?: string | null; onLike?: (id: number) => void; onApoyar?: (id: number) => void; externalOpenId?: number | null; onOpenExternal?: (post: any) => void }> = ({ posts = [], loading = false, error = null, onLike, onApoyar, externalOpenId = null, onOpenExternal }) => {
  if (loading) {
    return <div className="py-12 text-center">Cargando incidentes...</div>
  }
  if (error) {
    return <div className="py-12 text-center text-red-600">{error}</div>
  }

  return (
    <div className="flex flex-col w-full gap-6">
      <PostsList posts={posts.length ? posts : []} onLike={onLike} onApoyar={onApoyar} externalOpenId={externalOpenId} onOpenExternal={onOpenExternal} />
    </div>
  )
}

export default ListaIncidentes