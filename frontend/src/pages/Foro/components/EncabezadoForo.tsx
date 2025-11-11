import React from 'react'

const EncabezadoForo: React.FC = () => {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="px-4 md:px-10 flex flex-1 justify-center py-3">
        <div className="flex w-full max-w-4xl items-center justify-between">
          <div className="flex items-center gap-4 text-gray-900">
            <h2 className="text-xl font-bold leading-tight tracking-tight">Incidentes Recientes</h2>
          </div>
          
        </div>
      </div>
    </header>
  )
}

export default EncabezadoForo