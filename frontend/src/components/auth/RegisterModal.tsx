import React, { useState } from 'react';
import styles from './RegisterModal.module.css';
import { register as apiRegister } from '../../services/authService';
import { useAuth } from './AuthProvider';

export default function RegisterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // send as FormData if a file is present (or include telefono)
      const fd = new FormData();
      fd.append('first_name', firstName);
      fd.append('last_name', lastName);
      fd.append('email', email);
      fd.append('password', password);
      fd.append('telefono', telefono || '');
      if (fotoFile) fd.append('foto', fotoFile);
      await apiRegister(fd as any);
      // optionally auto-login after register if backend supports same credentials
      await login({ email, password });
      onClose();
    } catch (err: any) {
      setError(err?.email?.[0] || err?.detail || err?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} role="dialog">
      <div className={styles.modal}>
        <h3 className={styles.title}>Crear cuenta</h3>
        <form onSubmit={submit} className={styles.form}>
          <div className={styles.row}>
            <input placeholder="Nombre" value={firstName} onChange={e => setFirstName(e.target.value)} />
            <input placeholder="Apellido" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
          <input placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} />
          <input placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} type="password" />
          <input placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} />
          <label className={styles.fileLabel}>
            Foto de perfil (opcional)
            <input type="file" accept="image/*" onChange={e => setFotoFile(e.target.files ? e.target.files[0] : null)} />
          </label>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.btn}>Cancelar</button>
            <button type="submit" className={styles.primary} disabled={loading}>{loading ? '...' : 'Registrarse'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
