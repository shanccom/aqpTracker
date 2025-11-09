import { useState } from 'react'
import StepDetails from './components/StepDetails'
import StepLocation from './components/StepLocation'
import StepSimilar from './components/StepSimilar'
import ProgressBar from './components/ProgressBar'

export default function Reportar() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<any>({})

  function goNext(delta: any) {
    setData(d => ({ ...d, ...delta }))
    setStep(s => s + 1)
  }

  function goBack() {
    setStep(s => Math.max(1, s - 1))
  }

  return (
  <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header con ProgressBar */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportar Incidente</h1>
          <p className="text-gray-600">Comparte información importante sobre incidentes en tu zona</p>
        </div>
        
        <ProgressBar step={step} totalSteps={3} />
        
        {step === 1 && <StepDetails data={data} onNext={goNext} />}
        {step === 2 && <StepLocation data={data} onNext={goNext} onBack={goBack} />}
        {step === 3 && <StepSimilar data={data} onBack={goBack} onNext={(delta:any) => { 
          console.log('similares', delta);
          // TODO: continue to photos/review 
        }} />}
      </div>
    </div>
  )
}