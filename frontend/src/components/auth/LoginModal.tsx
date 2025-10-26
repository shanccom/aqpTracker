import React, { useState } from 'react';
import styles from './LoginModal.module.css';
import { useAuth } from './AuthProvider';

export default function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login, openRegister } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} role="dialog">
      <div className={styles.modal}>
        <h3>Iniciar sesión</h3>
        <form onSubmit={submit} className={styles.form}>
          <label>
            Email
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" />
          </label>
          <label>
            Contraseña
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" />
          </label>
          <div className={styles.row} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <small className="text-sm text-gray-500">¿No tienes cuenta?</small>
            <button type="button" className="text-sm text-emerald-600 hover:underline" onClick={() => { onClose(); openRegister(); }}>
              Regístrate
            </button>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.btn}>Cancelar</button>
            <button type="submit" className={styles.primary} disabled={loading}>{loading ? '...' : 'Entrar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
