import React from 'react'
import { Plus } from 'lucide-react'

const BotonReportar: React.FC = () => {
  return (
    <div className="fixed bottom-6 right-6">
      <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-16 bg-gray-800 text-white text-base font-bold leading-normal tracking-[0.015em] shadow-lg hover:bg-gray-900 transition-all duration-300 group pl-5 pr-6 gap-3">
        <Plus size={26} />
        <span className="whitespace-nowrap">Reportar incidente</span>
      </button>
    </div>
  )
}

export default BotonReportar