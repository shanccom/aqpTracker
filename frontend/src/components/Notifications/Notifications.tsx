import { useEffect, useState, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/authService';
import { useAuth } from '../auth';

type Notif = {
  id: number;
  mensaje: string;
  incidencia: any | null;
  leida: boolean;
  fecha_creacion: string;
};

const POLL_INTERVAL = 20000; // 20s

export default function Notifications() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const timerRef = useRef<number | null>(null);

  const fetch = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getNotifications(1, 10);
      setItems(data.results || []);
      const unread = (data.results || []).filter((n: Notif) => !n.leida).length;
      setUnreadCount(unread);
    } catch (e) {
      // ignore for now
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetch();
    // start polling
    timerRef.current = window.setInterval(fetch, POLL_INTERVAL);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onToggle = () => {
    setOpen(!open);
    if (!open) {
      // opened now; refresh and optionally mark all as read?
      fetch();
    }
  };

  const onMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setItems((s) => s.map((it) => (it.id === id ? { ...it, leida: true } : it)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {}
  };

  const onMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((s) => s.map((it) => ({ ...it, leida: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="relative p-2 rounded-md hover:bg-gray-100"
        aria-label="Notificaciones"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0 -right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-md shadow-lg z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <strong>Notificaciones</strong>
            <div className="flex items-center gap-2">
              <button onClick={onMarkAll} className="text-sm text-gray-600 hover:text-gray-900">Marcar todas</button>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={16} /></button>
            </div>
          </div>
          <div className="max-h-64 overflow-auto">
            {loading && <div className="p-3 text-sm text-gray-500">Cargando...</div>}
            {!loading && items.length === 0 && <div className="p-3 text-sm text-gray-500">No hay notificaciones</div>}
            {!loading && items.map((n) => (
              <div key={n.id} className={`p-3 flex gap-2 items-start border-b ${n.leida ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="flex-1">
                  <div className="text-sm text-gray-800">{n.mensaje}</div>
                  <div className="text-xs text-gray-500">{new Date(n.fecha_creacion).toLocaleString()}</div>
                </div>
                <div className="flex flex-col gap-1">
                  {!n.leida ? (
                    <button onClick={() => onMarkRead(n.id)} className="text-emerald-600 text-sm">Leer</button>
                  ) : (
                    <span className="text-sm text-gray-400"><Check size={14} /></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
