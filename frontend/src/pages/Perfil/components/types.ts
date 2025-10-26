export interface Profile {
  telefono: string | null;
  direccion: string | null;
  foto: string | null;
  date_joined?: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Report {
  id: number;
  nombre: string;
  tipo: string; 
  fecha: string;
  estado?: string;
}
