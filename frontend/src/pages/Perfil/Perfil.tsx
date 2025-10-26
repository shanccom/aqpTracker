// src/pages/Perfil/PerfilPage.jsx
import { useState, useEffect } from "react";
import PerfilHeader from "./components/PerfilHeader";
import PerfilInfo from "./components/PerfilInfo";
import MisReportes from "./components/MisReportes";
import EditarPerfilModal from "./components/EditarPerfilModal";
import type { Profile } from './components/types';
import styles from "./PerfilPage.module.css";

export default function PerfilPage() {
  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [openModal, setOpenModal] = useState(false);

  // Simulación temporal (luego usarás usuarioService.js)
  useEffect(() => {
    setPerfil({
      telefono: null,
      direccion: null,
      foto: null,
      first_name: 'Julio profe',
      last_name: 'Chura',
      email: 'correoc2x@example.com',
    });
  }, []);

  if (!perfil) return <p>Cargando perfil...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        
        <main className={styles.content}>
          <PerfilHeader />
          <PerfilInfo perfil={perfil} onEdit={() => setOpenModal(true)} />
          <MisReportes />
        </main>
      </div>

      {openModal && (
        <EditarPerfilModal perfil={perfil} onClose={() => setOpenModal(false)} />
      )}
    </div>
  );
}
