import React from 'react'
import { Search } from 'lucide-react'

const EncabezadoForo: React.FC = () => {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="px-4 md:px-10 flex flex-1 justify-center py-3">
        <div className="flex w-full max-w-4xl items-center justify-between">
          <div className="flex items-center gap-4 text-gray-900">
            <h2 className="text-xl font-bold leading-tight tracking-tight">Incidentes Recientes</h2>
          </div>
          <div className="flex flex-1 justify-end gap-2">
            <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-gray-100 text-gray-600 hover:bg-gray-200">
              <Search size={18} />
            </button>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 border border-gray-300" style={{backgroundImage: `url('/static/img/profile.jpg')`}} />
          </div>
        </div>
      </div>
    </header>
  )
}

export default EncabezadoForo