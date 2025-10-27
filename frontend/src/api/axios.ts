import axios from 'axios';
import { getAccessToken, setAccessToken } from './tokenStore';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach access token before requests
api.interceptors.request.use((config: any) => {
  const token = getAccessToken();
  if (token && config && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Refresh logic: queue requests while refreshing
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (error?: any) => void; config: any }> = [];

const processQueue = (err: any, token: string | null = null) => {
  failedQueue.forEach(p => {
    if (err) p.reject(err);
    else {
      if (token && p.config.headers) p.config.headers['Authorization'] = `Bearer ${token}`;
      p.resolve(p.config);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res: any) => res,
  async (err: any) => {
    const originalRequest = err.config;
    if (!originalRequest) return Promise.reject(err);

    if (err.response && err.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        }).then((cfg: any) => api(cfg));
      }

      isRefreshing = true;
      try {
        const refresh = localStorage.getItem('refresh');
        if (!refresh) throw new Error('No refresh token');

        // use plain axios to avoid interceptors
        const plain = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });
        const r = await plain.post('/api/token/refresh/', { refresh });

        const newAccess = r.data.access as string;
        const newRefresh = r.data.refresh as string | undefined;
        setAccessToken(newAccess);
        if (newRefresh) localStorage.setItem('refresh', newRefresh);

        processQueue(null, newAccess);
        isRefreshing = false;

        originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        // clear tokens
        localStorage.removeItem('refresh');
        setAccessToken(null);
        try {
          window.dispatchEvent(new CustomEvent('auth:logged_out'));
        } catch (e) {
          // ignore in non-browser environments
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

export default api;
