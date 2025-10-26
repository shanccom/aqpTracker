// Simple auth service using fetch. Expects backend that returns { access, refresh, profile }
const API_BASE = import.meta.env.VITE_API_BASE || '';

export type Credentials = { email: string; password: string };
export type ProfileShape = {
  telefono: string | null;
  direccion: string | null;
  foto: string | null;
  first_name: string;
  last_name: string;
  email: string;
};

export async function login(creds: Credentials) {
  const res = await fetch(`${API_BASE}/api/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw err;
  }
  const data = await res.json();
  // expected { access, refresh, profile }
  return data as { access: string; refresh: string; profile: ProfileShape };
}

export async function refreshToken(refresh: string) {
  const res = await fetch(`${API_BASE}/api/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) throw new Error('Unable to refresh token');
  return res.json() as Promise<{ access: string; refresh?: string }>;
}

export async function logoutServer(refresh?: string) {
  try {
    if (!refresh) return;
    await fetch(`${API_BASE}/api/usuario/logout/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
  } catch (e) {
    // ignore
  }
}
