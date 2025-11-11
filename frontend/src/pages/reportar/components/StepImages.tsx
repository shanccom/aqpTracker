import React, { useState, useEffect, useRef } from 'react'

type Props = {
  data: any
  onBack: () => void
  onNext: (delta: any) => void
}

export default function StepImages({ data, onBack, onNext }: Props) {
  const [files, setFiles] = useState<File[]>(data.images || [])
  const [previews, setPreviews] = useState<Array<{ id: string; url: string }>>([])
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    // create previews
    const p = files.map((f) => ({ id: f.name + '_' + f.size + '_' + f.lastModified, url: URL.createObjectURL(f) }))
    setPreviews(p)
    return () => {
      p.forEach(x => URL.revokeObjectURL(x.url))
    }
  }, [files])

  function handleFiles(selected: FileList | null) {
    if (!selected) return
    const arr = Array.from(selected)
    setFiles(prev => [...prev, ...arr].slice(0, 10)) // limit to 10 images
  }

  function removeAt(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  const canNext = true // images optional

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-green-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold">4</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">Añadir imágenes</h2>
            <p className="text-green-100 text-sm">Agrega fotos que ayuden a describir el incidente (opcional)</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="text-sm font-semibold text-gray-700">Subir imágenes</label>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            className="mt-3 p-6 border-2 border-dashed rounded-xl bg-gray-50 text-center cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <div className="text-gray-500">Arrastra y suelta imágenes aquí, o haz click para seleccionar</div>
            <div className="text-xs text-gray-400 mt-2">Puedes subir hasta 10 imágenes. (png, jpg, jpeg)</div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
          </div>
        </div>

        {previews.length > 0 && (
          <div>
            <label className="text-sm font-semibold text-gray-700">Previsualización</label>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {previews.map((p, idx) => (
                <div key={p.id} className="relative rounded-lg overflow-hidden border border-gray-200">
                  <img src={p.url} alt={`img-${idx}`} className="object-cover w-full h-32" />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeAt(idx) }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
                    title="Eliminar imagen"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6 border-t border-gray-100">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300 font-semibold shadow-sm"
          >
            ← Volver
          </button>
          <button
            onClick={() => onNext({ images: files })}
            disabled={!canNext}
            className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${canNext ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}`}
          >
            Continuar →
          </button>
        </div>
      </div>
    </div>
  )
}
