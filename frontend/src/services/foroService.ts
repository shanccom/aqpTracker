import api from '../api/axios'

export async function searchIncidencias(params: Record<string, any>) {
  const res = await api.get('/api/foro/incidencias/', { params })
  const data = res.data
  if (Array.isArray(data)) return data
  return data.results ?? []
}

export async function createIncidencia(formData: FormData) {
  const res = await api.post('/api/foro/incidencias/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data
}

export async function previewIncidencias(params: Record<string, any>) {
  const res = await api.get('/api/foro/incidencias_preview/', { params })
  const data = res.data || []

  // normalize to the Post shape expected by PostCard / PostsList
  const normalize = (item: any) => {
    // estado from backend may be lowercase or different language; try to normalize simple cases
    const estadoRaw = item.estado || ''
    const estado = typeof estadoRaw === 'string'
      ? (estadoRaw.charAt(0).toUpperCase() + estadoRaw.slice(1))
      : estadoRaw

    // prefer direccion textual when available, otherwise use distrito
    const direccionText = item.direccion || null
    const ubicacionValue = direccionText || item.distrito || undefined

    return {
      id: item.id,
      titulo: item.titulo,
      imagen: item.imagen || null,
      ubicacion: ubicacionValue,
      direccion: direccionText,
      distrito: item.distrito || null,
      descripcion: item.descripcion || undefined,
      autor: item.usuario || undefined,
      tiempo: item.fecha_creacion || undefined,
      comentarios: item.comentarios_count ?? item.comentarios ?? 0,
      reacciones: item.reacciones_count ?? item.reacciones ?? 0,
      estado: estado || undefined,
      reports_count: item.reports_count ?? 0,
      primer_reportero: item.primer_reportero ?? null,
      apoyos_count: item.apoyos_count ?? undefined,
      latitud: item.latitud !== undefined ? (item.latitud ? Number(item.latitud) : null) : null,
      longitud: item.longitud !== undefined ? (item.longitud ? Number(item.longitud) : null) : null,
    }
  }

  if (Array.isArray(data)) return data.map(normalize)
  // if paginated
  if (Array.isArray(data.results)) return data.results.map(normalize)
  return []
}

export async function listTipoReacciones() {
  const res = await api.get('/api/foro/tiporeacciones/')
  return res.data || []
}

export async function createReaccion(incidenciaId: number, tipoId: number) {
  const payload = { incidencia: incidenciaId, tipo: tipoId }
  const res = await api.post('/api/foro/reacciones/', payload)
  return res.data
}

export async function listReacciones(params: Record<string, any>) {
  const res = await api.get('/api/foro/reacciones/', { params })
  const data = res.data
  if (Array.isArray(data)) return data
  return data.results ?? []
}

export async function deleteReaccion(id: number) {
  const res = await api.delete(`/api/foro/reacciones/${id}/`)
  return res.data
}

export async function createReporte(incidenciaId: number) {
  const payload = { incidencia_id: incidenciaId }
  const res = await api.post('/api/foro/reportes/', payload)
  return res.data
}

export default { searchIncidencias, createIncidencia, previewIncidencias, listTipoReacciones, createReaccion, listReacciones, deleteReaccion, createReporte }
