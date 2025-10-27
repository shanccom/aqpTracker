import styles from './CardReporte.module.css';

export default function Ojo({ title, date, status, image, comentarios, reacciones }: { title: string; date: string; status: string; image?: string | null; comentarios?: number; reacciones?: number }) {
  return (
    <article className={styles.card}>
      <div className={styles.left}>
        <div className={styles.thumb} aria-hidden>
          {image ? (
            <img src={image} alt={title} className={styles.thumbImg} />
          ) : (
            <div className={styles.thumbPlaceholder}>{title?.slice(0,1).toUpperCase()}</div>
          )}
        </div>
        <div className={styles.body}>
          <p className={styles.title}>{title}</p>
          <p className={styles.date}>{date}</p>
          <div className={styles.meta}>
            <span className={styles.metaItem}>{comentarios ?? 0} comentarios</span>
            <span className={styles.metaItem}>{reacciones ?? 0} reacciones</span>
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <div className={`${styles.status} ${status === 'Activo' ? styles.active : styles.resolved}`}>{status || '—'}</div>
      </div>
    </article>
  );
}
