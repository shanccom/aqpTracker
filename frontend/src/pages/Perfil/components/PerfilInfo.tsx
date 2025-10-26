import styles from './PerfilInfo.module.css';
import type { Profile } from './types';

export default function PerfilInfo({ perfil, onEdit }: { perfil: Profile; onEdit: () => void }) {
  const nombre = `${perfil.first_name} ${perfil.last_name}`;
  return (
    <section className={styles.wrapper}>
      <div className={styles.avatar} style={{ backgroundImage: `url(${perfil.foto || ''})` }} />
      <div className={styles.info}>
        <h2 className={styles.name}>{nombre}</h2>
        <p className={styles.email}>{perfil.email}</p>
        <p className={styles.meta}>Miembro desde: —</p>
      </div>
      <div className={styles.actions}>
        <button className={styles.editBtn} onClick={onEdit}>Editar Perfil</button>
      </div>
    </section>
  );
}
