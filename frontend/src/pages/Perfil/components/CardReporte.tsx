import styles from './CardReporte.module.css';

export default function Ojo({ title, date, status, icon }: { title: string; date: string; status: string; icon: string }) {
  return (
    <article className={styles.card}>
      <div className={styles.left}>
        <div className={styles.icon} aria-hidden>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className={styles.body}>
          <p className={styles.title}>{title}</p>
          <p className={styles.date}>{date}</p>
        </div>
      </div>
      <div className={styles.right}>
        <div className={`${styles.status} ${status === 'Activo' ? styles.active : styles.resolved}`}>{status}</div>
      </div>
    </article>
  );
}
