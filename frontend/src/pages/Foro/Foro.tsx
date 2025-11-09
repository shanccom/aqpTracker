import React from 'react'
import EncabezadoForo from './components/EncabezadoForo'
import FiltrosForo from './components/FiltrosForo'
import ListaIncidentes from './components/ListaIncidentes'
import BotonReportar from './components/BotonReportar'

const ForoView: React.FC = () => {
  return (
    <div className="relative flex h-auto min-h-screen w-full overflow-x-hidden bg-background-light dark:bg-background-dark">
      <div className="flex flex-col flex-1">
        <EncabezadoForo />
        <main className="flex flex-1 justify-center py-5 px-4 md:px-10">
          <div className="w-full max-w-4xl flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-start gap-4">
              <FiltrosForo />
            </div>
            <ListaIncidentes />
          </div>
        </main>
      </div>
      <BotonReportar />
    </div>
  )
}

export default ForoView