import React from 'react'

const ConfirmModal: React.FC<{ open: boolean; title?: string; message: string; onConfirm: () => void; onCancel: () => void }> = ({ open, title = 'Confirmar', message, onConfirm, onCancel }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-lg border border-gray-100">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="p-4">
          <p className="text-gray-700">{message}</p>
        </div>
        <div className="p-3 flex justify-end gap-2 border-t">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
