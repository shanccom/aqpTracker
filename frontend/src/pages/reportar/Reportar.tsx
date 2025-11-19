import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepDetails from './components/StepDetails'
import StepLocation from './components/StepLocation'
import StepSimilar from './components/StepSimilar'
import StepImages from './components/StepImages'
import ProgressBar from './components/ProgressBar'
import foroService from '../../services/foroService'

export default function Reportar() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<any>({})

  function goNext(delta: any) {
    setData((d: any) => ({ ...d, ...delta }))
    setStep(s => s + 1)
  }

  function goBack() {
    setStep(s => Math.max(1, s - 1))
  }

  const navigate = useNavigate()

  async function submitAndFinish(delta: any) {
    // merge images into data
    setData((d: any) => ({ ...d, ...delta }))
    const merged = { ...data, ...delta }
    // build form data
    const fd = new FormData()
    fd.append('titulo', merged.titulo || '')
    fd.append('descripcion', merged.descripcion || '')
    if (merged.direccion) fd.append('direccion', merged.direccion)
    if (merged.latlng) {
      // ensure no more than 6 decimal places to satisfy backend DecimalField(max_digits=9, decimal_places=6)
      const lat = Number(merged.latlng.lat)
      const lng = Number(merged.latlng.lng)
      if (!Number.isNaN(lat) && Number.isFinite(lat)) fd.append('latitud', lat.toFixed(6))
      if (!Number.isNaN(lng) && Number.isFinite(lng)) fd.append('longitud', lng.toFixed(6))
    }
    // attempt to include distrito: if it's an object or id
    if (merged.distrito) {
      // if distrito looks like a number, send as id; otherwise send as name
      const d = merged.distrito
      if (typeof d === 'number' || (!isNaN(Number(d)) && String(d).trim() !== '')) {
        fd.append('distrito', String(d))
      } else {
        // try to look up distrito id is not available; send name as 'distrito_name' (backend may ignore)
        fd.append('distrito_name', String(d))
      }
    }
    const imgs: File[] = merged.images || []
  imgs.forEach((f) => fd.append('imagenes', f))

    try {
      await foroService.createIncidencia(fd)
      // on success redirect to foro
      navigate('/Foro')
    } catch (err: any) {
      console.error('Error creando incidencia', err)
      // simple fallback: alert
      alert('Error al guardar el incidente. Intenta nuevamente.')
    } finally {
    }
  }

  return (
  <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header con ProgressBar */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportar Incidente</h1>
          <p className="text-gray-600">Comparte información importante sobre incidentes en tu zona</p>
        </div>
        
        <ProgressBar step={step} totalSteps={4} />
        
        {step === 1 && <StepDetails data={data} onNext={goNext} />}
        {step === 2 && <StepLocation data={data} onNext={goNext} onBack={goBack} />}
        {step === 3 && <StepSimilar data={data} onBack={goBack} onNext={goNext} />}
  {step === 4 && <StepImages data={data} onBack={goBack} onNext={submitAndFinish} />}
      </div>
    </div>
  )
}