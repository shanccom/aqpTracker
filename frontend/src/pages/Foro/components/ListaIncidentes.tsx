import React from 'react'
import PostsList from '../../../components/posts/PostsList'

const ListaIncidentes: React.FC<{ posts?: any[]; loading?: boolean; error?: string | null }> = ({ posts = [], loading = false, error = null }) => {
  // when no posts provided, show placeholder demo or empty state
  if (loading) {
    return <div className="py-12 text-center">Cargando incidentes...</div>
  }
  if (error) {
    return <div className="py-12 text-center text-red-600">{error}</div>
  }

  return (
    <div className="flex flex-col w-full gap-6">
      <PostsList posts={posts.length ? posts : []} />
    </div>
  )
}

export default ListaIncidentes