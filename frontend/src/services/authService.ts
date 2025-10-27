import api, { API_BASE } from '../api/axios';
import axios from 'axios';

export type Credentials = { email: string; password: string };
export type ProfileShape = {
  telefono: string | null;
  direccion: string | null;
  foto: string | null;
  date_joined?: string;
  first_name: string;
  last_name: string;
  email: string;
};

export async function login(creds: Credentials) {
  const res = await api.post('/api/token/', creds);
  return res.data as { access: string; refresh: string; profile: ProfileShape };
}

export async function register(data: { first_name: string; last_name: string; email: string; password: string }) {
  if (data instanceof FormData) {
    return api.post('/api/usuario/registro/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
  return api.post('/api/usuario/registro/', data);
}

export async function refreshToken(refresh: string) {
  const res = await axios.post(`${API_BASE}/api/token/refresh/`, { refresh }, { headers: { 'Content-Type': 'application/json' } });
  return res.data as { access: string; refresh?: string };
}

export async function logoutServer(refresh?: string) {
  if (!refresh) return;
  try {
    await api.post('/api/usuario/logout/', { refresh });
  } catch (e) {
    // ignore
  }
}

export async function getMyReports(page = 1, pageSize = 10) {
  const res = await api.get('/api/foro/reportes/me/', { params: { page, page_size: pageSize } });
  const data = res.data;
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  return data as { count: number; next: string | null; previous: string | null; results: Array<{ id: number; nombre: string; tipo: string; fecha: string; estado?: string }> };
}

export async function getNotifications(page = 1, pageSize = 10, unreadOnly = false) {
  const params: any = { page, page_size: pageSize };
  if (unreadOnly) params.leida = false;
  const res = await api.get('/api/foro/notificaciones/', { params });
  const data = res.data;
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  return data as { count: number; next: string | null; previous: string | null; results: Array<any> };
}

export async function markNotificationRead(id: number) {
  const res = await api.patch(`/api/foro/notificaciones/${id}/`, { leida: true });
  return res.data;
}

export async function markAllNotificationsRead() {
  const res = await api.post('/api/foro/notificaciones/mark_all_read/');
  return res.data as { marked: number };
}

// Fetch current user's profile
export async function getProfile() {
  const res = await api.get('/api/usuario/perfil/');
  return res.data as ProfileShape;
}

export async function updateProfile(data: FormData) {
  const res = await api.patch('/api/usuario/perfil/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data as ProfileShape;
}
