import { useEffect, useState } from 'react';
import styles from './MisReportes.module.css';
import Ojo from './CardReporte';
import type { Report } from './types';
import { useAuth } from '../../../components/auth';
import { getMyReports } from '../../../services/authService';

export default function MisReportes() {
  const { user } = useAuth();
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
        setReports(data.results.map(r => ({ id: r.id, nombre: r.nombre, tipo: r.tipo, fecha: r.fecha, estado: r.estado })));
        setHasNext(Boolean(data.next));
        setHasPrev(Boolean(data.previous));
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Error al cargar reportes');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [user, page]);

  return (
    <section className={styles.wrapper}>
      <h3 className={styles.heading}>Mis Reportes</h3>
      {loading && <p>Cargando reportes...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && reports.length === 0 && <p>No tienes reportes aún.</p>}
      <div className={styles.list}>
        {reports.map(r => (
          <Ojo key={r.id} title={r.nombre} date={r.fecha} status={r.estado || ''} icon={'warning'} />
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
