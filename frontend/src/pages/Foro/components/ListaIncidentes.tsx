import React from 'react'
import PostsList from '../../../components/posts/PostsList'

const datosDemo = [
  {
    id: 1,
    titulo: 'Retraso significativo en la Ruta 52',
    ubicacion: 'Av. Principal con Calle Secundaria',
    descripcion: 'El autobús lleva más de 30 minutos detenido en la parada principal por una avería mecánica. Eviten la ruta si pueden.',
    imagen: '/static/img/incidencia.png',
    autor: 'Ana Pérez',
    primer_reportero: { id: 10, first_name: 'Luis', foto: '/static/img/profile.jpg' },
    reports_count: 3,
    tiempo: 'hace 15 minutos',
    comentarios: 5,
    reacciones: 12,
    estado: 'Activo',
    distrito: 'Centro'
  },
  {
    id: 2,
    titulo: 'Accidente en Estación Central',
    ubicacion: 'Línea 3, Estación Central',
    descripcion: 'Un tren se ha detenido entre estaciones debido a una falla eléctrica. El servicio ha sido suspendido temporalmente.',
    imagen: null,
    autor: 'Juan Rodríguez',
    primer_reportero: { id: 11, first_name: 'María', foto: '/static/img/profile.jpg' },
    reports_count: 5,
    tiempo: 'hace 45 minutos',
    comentarios: 18,
    reacciones: 34,
    estado: 'Activo',
    distrito: 'Centro'

  },
  {
    id: 3,
    titulo: 'Obras en la vía',
    ubicacion: 'Línea 1, entre Sol y Gran Vía',
    descripcion: 'Servicio reestablecido con normalidad tras las obras nocturnas. El primer tren ha salido a su hora.',
    imagen: '/static/img/incidencia.png',
    autor: 'Metro Info',
    primer_reportero: { id: 12, first_name: 'Metro', foto: '/static/img/profile.jpg' },
    reports_count: 1,
    tiempo: 'hace 2 horas',
    comentarios: 1,
    reacciones: 8,
    estado: 'Resuelto',
    distrito: 'Centro'
  }
]

const ListaIncidentes: React.FC = () => {
  return (
    <div className="flex flex-col w-full gap-6">
      <PostsList posts={datosDemo} />
    </div>
  )
}

export default ListaIncidentes