import styles from './MisReportes.module.css';
import Ojo from './CardReporte';
import type { Report } from './types';

const dummyReports: Report[] = [
  { id: 1, nombre: 'Retraso en la Ruta 5A', tipo: 'Transporte', fecha: '01 de Marzo de 2024', estado: 'Activo' },
  { id: 2, nombre: 'Parada fuera de servicio en Av. Principal', tipo: 'Infraestructura', fecha: '28 de Febrero de 2024', estado: 'Resuelto' },
  { id: 3, nombre: 'Obras en la Calle Central', tipo: 'Construcción', fecha: '25 de Febrero de 2024', estado: 'Resuelto' },
];

export default function MisReportes() {
  return (
    <section className={styles.wrapper}>
      <h3 className={styles.heading}>Mis Reportes</h3>
      <div className={styles.list}>
        {dummyReports.map(r => (
          <Ojo key={r.id} title={r.nombre} date={r.fecha} status={r.estado || ''} icon={'warning'} />
        ))}
      </div>
    </section>
  );
}
