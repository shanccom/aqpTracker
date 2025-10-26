// src/pages/Perfil/PerfilPage.jsx
import { useState } from "react";
import PerfilHeader from "./components/PerfilHeader";
import PerfilInfo from "./components/PerfilInfo";
import MisReportes from "./components/MisReportes";
import EditarPerfilModal from "./components/EditarPerfilModal";
import type { Profile } from './components/types';
import styles from "./PerfilPage.module.css";
import { useAuth } from '../../components/auth';

export default function PerfilPage() {
  const { user, refreshProfile } = useAuth();
  const [openModal, setOpenModal] = useState(false);

  if (!user) return <p>Cargando perfil...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        
        <main className={styles.content}>
          <PerfilHeader />
          <PerfilInfo perfil={user as Profile} onEdit={() => setOpenModal(true)} />
          <MisReportes />
        </main>
      </div>

      {openModal && (
        <EditarPerfilModal perfil={user as Profile} onClose={async () => { await refreshProfile(); setOpenModal(false); }} />
      )}
    </div>
  );
}
