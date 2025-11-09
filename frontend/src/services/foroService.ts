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
  return res.data || []
}

export default { searchIncidencias, createIncidencia, previewIncidencias }
