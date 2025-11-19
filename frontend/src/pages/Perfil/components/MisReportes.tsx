import { useEffect, useState } from 'react';
import styles from './MisReportes.module.css';
import Ojo from './CardReporte';
import type { Report } from './types';
import { useAuth } from '../../../components/auth';
import { getMyReports } from '../../../services/authService';

export default function MisReportes() {
  const { user, openLogin } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
        if (!user) return; // wait until we have user
      setLoading(true);
      setError(null);
      try {
  const data = await getMyReports(page, 10);
  if (!mounted) return;
        // Map backend shape to frontend Report type
        const items = (data.results || []).map((r: any) => ({
          id: r.id,
          nombre: r.incidencia?.titulo || 'Sin título',
          tipo: r.incidencia?.distrito || '',
          fecha: r.fecha_reporte || r.incidencia?.fecha_creacion || '',
          estado: r.incidencia?.estado || '',
          imagen: r.incidencia?.imagen || null,
          comentarios_count: r.incidencia?.comentarios_count ?? 0,
          reacciones_count: r.incidencia?.reacciones_count ?? 0,
        }));
  setReports(items);
        setHasNext(Boolean(data.next));
        setHasPrev(Boolean(data.previous));
      } catch (e: any) {
        // if unauthorized, prompt login
        if (e?.response?.status === 401) {
          openLogin();
          return;
        }
        if (!mounted) return;
        setError(e?.message || 'Error al cargar reportes');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [user, page]);

  if (!user) {
    return (
      <section className={styles.wrapper}>
        <h3 className={styles.heading}>Mis Reportes</h3>
        <p className="text-center mt-4">No estás autenticado. <button onClick={() => openLogin()} className="underline text-teal-600">Iniciar sesión</button> para ver tus reportes.</p>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      <h3 className={styles.heading}>Mis Reportes</h3>
      {loading && <p>Cargando reportes...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && reports.length === 0 && <p>No tienes reportes aún.</p>}
      <div className={styles.list}>
        {reports.map(r => (
          <Ojo key={r.id} title={r.nombre} date={r.fecha} status={r.estado || ''} image={r.imagen} comentarios={r.comentarios_count} reacciones={r.reacciones_count} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
        <button disabled={!hasPrev || loading} onClick={() => setPage(p => Math.max(1, p - 1))} className="btn">Anterior</button>
        <span>Página {page}</span>
        <button disabled={!hasNext || loading} onClick={() => setPage(p => p + 1)} className="btn">Siguiente</button>
      </div>
    </section>
  );
}
