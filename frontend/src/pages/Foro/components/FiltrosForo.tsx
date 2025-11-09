import React from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'

const FiltrosForo: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative">
        <select className="appearance-none w-full md:w-auto bg-gray-50 border border-gray-300 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent shadow-sm">
          <option>Seleccionar distrito</option>
          <option>Centro</option>
          <option>Norte</option>
          <option>Sur</option>
          <option>Este</option>
          <option>Oeste</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">
          <ChevronDown size={18} />
        </div>
      </div>
      <button className="flex items-center gap-2 bg-gray-50 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg shadow-sm hover:bg-gray-100 transition-colors">
        <SlidersHorizontal size={16} />
        Reportes más recientes
      </button>
    </div>
  )
}

export default FiltrosForo