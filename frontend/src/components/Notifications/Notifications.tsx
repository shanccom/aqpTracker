import { useEffect, useState, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/authService';
import { useAuth } from '../auth';

type Notif = {
  id: number;
  mensaje: string;
  incidencia: any | null; // may be nested IncidenciaMinSerializer now
  leida: boolean;
  fecha_creacion: string;
  actor?: {
    id?: number;
    email?: string;
    first_name?: string;
    last_name?: string;
    foto?: string | null;
  } | null;
};

const POLL_INTERVAL = 20000; // 20s

export default function Notifications() {
  const { user, openLogin } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const timerRef = useRef<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth < 768);
  const prevIsMobileRef = useRef<boolean>(window.innerWidth < 768);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const fetch = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getNotifications(1, 10);
      setItems(data.results || []);
      const unread = (data.results || []).filter((n: Notif) => !n.leida).length;
      setUnreadCount(unread);
      // no debug JSON shown
    } catch (e: any) {
      if (e?.response?.status === 401) {
        openLogin();
        setLoading(false);
        return;
      }
      // ignore other errors for now
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
  }, [user]);

  useEffect(() => {
    function onResize() {
      const mobile = window.innerWidth < 768;
      if (mobile !== prevIsMobileRef.current && open) {
        setOpen(false);
      }
      if (open && window.innerWidth >= 768) {
        setOpen(false);
      }
      prevIsMobileRef.current = mobile;
      setIsMobile(mobile);
    }
    window.addEventListener('resize', onResize);
    onResize();

    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (!open) return;
      if (panelRef.current && panelRef.current.contains(target)) return;
      if (buttonRef.current && buttonRef.current.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const onToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
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

  if (!user) return (
    <div className="relative">
      <button onClick={() => openLogin()} className="p-2 rounded-md hover:bg-gray-100">Inicia sesión para ver notificaciones</button>
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={onToggle}
        className="relative p-2 rounded-md hover:bg-gray-100"
        aria-label="Notificaciones"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0 -right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">{unreadCount}</span>
        )}
      </button>

      {open && (() => {
        const panelInner = (
          <>
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
              <strong>Notificaciones</strong>
              <div className="flex items-center gap-2">
                <button onClick={onMarkAll} className="text-sm text-gray-600 hover:text-gray-900">Marcar todas</button>
                <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={16} /></button>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-auto">
              {loading && <div className="p-3 text-sm text-gray-500">Cargando...</div>}
              {!loading && items.length === 0 && <div className="p-3 text-sm text-gray-500">No hay notificaciones</div>}
              {!loading && items.map((n) => {
              const inc = n.incidencia;
              const actorObj = (n as any).actor;
              // prefer structured actor if provided by backend
              const actorName = actorObj?.first_name || actorObj?.email || '';
              const actorFoto = actorObj?.foto || null;
              // fallback: try to extract actor name from mensaje
              const extractActor = (msg: string) => {
                const patterns = [' comentó', ' reaccionó', ' le dio', ' comentó tu', ' reaccionó ('];
                for (const p of patterns) {
                  const idx = msg.indexOf(p);
                  if (idx > 0) return msg.slice(0, idx);
                }
                return msg.split(' ')[0];
              };
              const parsedActor = extractActor(n.mensaje || '');
              const displayName = actorName || parsedActor;
              return (
                <div key={n.id} className={`p-3 flex gap-3 items-start bg-white ${!n.leida ? 'border-l-4 border-teal-300' : ''} rounded-md transition-all duration-150 ease-in-out shadow-sm`}> 
                  <div className="flex-shrink-0 mt-1">
                    {actorFoto ? (
                      <img src={actorFoto} alt={displayName || 'avatar'} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${n.leida ? 'bg-gray-100' : 'bg-emerald-100 text-emerald-800'} text-sm font-semibold`}>
                        {n.leida ? <Check size={14} className="text-gray-500" /> : <span>{(displayName || '?').slice(0,1).toUpperCase()}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800 font-semibold">{displayName} <span className="font-normal">{n.mensaje.replace(parsedActor, '').trim()}</span></div>
                    <div className="text-xs text-gray-500">{new Date(n.fecha_creacion).toLocaleString()}</div>
                    {inc && (
                      <div className="mt-2 flex items-center gap-2">
                        {inc.imagen ? (
                          <img src={inc.imagen} alt={inc.titulo} className="w-12 h-8 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-8 bg-gray-50 rounded flex items-center justify-center text-xs text-gray-400">Sin imagen</div>
                        )}
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-800">{inc.titulo}</div>
                          <div className="text-xs text-gray-500 flex gap-3">
                            <span>{inc.comentarios_count ?? 0} comentarios</span>
                            <span>{inc.reacciones_count ?? 0} reacciones</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {!n.leida ? (
                      <button onClick={() => onMarkRead(n.id)} className="text-emerald-600 text-sm">Leer</button>
                    ) : (
                      <span className="text-sm text-gray-400"><Check size={14} /></span>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </>
        );

        if (isMobile) {
          return (
            <div className="fixed inset-0 bg-white p-4 z-50" ref={panelRef}>
              {panelInner}
            </div>
          );
        }

        // desktop: render inline dropdown inside the header (keeps it visually within the bar)
        return (
          <div ref={panelRef} className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-sm ring-1 ring-black/5 border border-transparent z-50">{panelInner}</div>
        );
      })()}
      
    </div>
  );
}
