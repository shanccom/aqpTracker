type Props = {
  step: number
  totalSteps: number
}

export default function ProgressBar({ step, totalSteps }: Props) {
  const percentage = (step / totalSteps) * 100
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <div className="mb-12">
      {/* Barra de progreso principal */}
      <div className="relative mb-4">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-green-600 h-3 rounded-full transition-all duration-500 ease-out shadow-lg shadow-green-200"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        
        {/* Puntos de paso */}
        <div className="absolute inset-0 flex justify-between items-center">
          {steps.map((stepNumber) => (
            <div
              key={stepNumber}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 transform ${
                stepNumber <= step
                  ? 'bg-green-600 text-white shadow-lg shadow-green-300 scale-110'
                    : stepNumber === step + 1
                    ? 'bg-white text-gray-400 border-2 border-green-300 shadow-md scale-105'
                    : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
              }`}
            >
              {stepNumber}
            </div>
          ))}
        </div>
      </div>

      {/* Labels de progreso */}
      <div className="flex justify-between text-sm font-medium text-gray-600">
        <span className={`transition-all duration-300 ${step >= 1 ? 'text-green-600 font-bold' : ''}`}>
          Detalles
        </span>
        <span className={`transition-all duration-300 ${step >= 2 ? 'text-green-600 font-bold' : ''}`}>
          Ubicación
        </span>
        <span className={`transition-all duration-300 ${step >= 3 ? 'text-green-600 font-bold' : ''}`}>
          Confirmar
        </span>
      </div>
    </div>
  )
}