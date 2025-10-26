import { useState } from 'react';
import styles from './EditarPerfilModal.module.css';
import type { Profile } from './types';
import { updateProfile } from '../../../services/authService';

export default function EditarPerfilModal({ perfil, onClose }: { perfil: Profile; onClose: () => void }) {
  const [firstName, setFirstName] = useState(perfil.first_name || '');
  const [lastName, setLastName] = useState(perfil.last_name || '');
  const [telefono, setTelefono] = useState(perfil.telefono || '');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('first_name', firstName);
      fd.append('last_name', lastName);
      fd.append('telefono', telefono || '');
      if (fotoFile) fd.append('foto', fotoFile);
      await updateProfile(fd);
      // parent will call refreshProfile and close
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} role="dialog">
      <div className={styles.modal}>
        <h3>Editar Perfil</h3>
        <form onSubmit={submit} className={styles.form}>
          <div className={styles.row}>
            <input placeholder="Nombre" value={firstName} onChange={e => setFirstName(e.target.value)} />
            <input placeholder="Apellido" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
          <input placeholder="Teléfono" value={telefono || ''} onChange={e => setTelefono(e.target.value)} />
          <label>
            Foto de perfil
            <input type="file" accept="image/*" onChange={e => setFotoFile(e.target.files ? e.target.files[0] : null)} />
          </label>
          {error && <div className="text-red-600">{error}</div>}
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.btn}>Cancelar</button>
            <button type="submit" className={styles.primary} disabled={loading}>{loading ? '...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
