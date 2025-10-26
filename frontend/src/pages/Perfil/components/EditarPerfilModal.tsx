import styles from './EditarPerfilModal.module.css';
import type { Profile } from './types';

export default function EditarPerfilModal({ perfil, onClose }: { perfil: Profile; onClose: () => void }) {
  const nombre = `${perfil.first_name} ${perfil.last_name}`;
  return (
    <div className={styles.overlay} role="dialog">
      <div className={styles.modal}>
        <h3>Editar Perfil (demo)</h3>
        <p>Nombre: {nombre}</p>
        <p>Email: {perfil.email}</p>
        <div className={styles.actions}>
          <button onClick={onClose} className={styles.btn}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
