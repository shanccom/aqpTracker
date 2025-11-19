export function timeAgo(iso?: string | null) {
  if (!iso) return 'hace poco'
  const date = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000) // seconds
  if (diff < 60) return `hace ${diff}s`
  const mins = Math.floor(diff / 60)
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days}d`
  const months = Math.floor(days / 30)
  if (months < 12) return `hace ${months}mes` + (months > 1 ? 'es' : '')
  const years = Math.floor(months / 12)
  return `hace ${years} año${years > 1 ? 's' : ''}`
}

export function formatDateShort(iso?: string | null) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
  } catch (e) {
    return String(iso)
  }
}

export function formatDateTime(iso?: string | null) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d)
  } catch (e) {
    return String(iso)
  }
}
