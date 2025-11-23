import React, { useState } from 'react'
import { Send } from 'lucide-react'

const NewCommentBox: React.FC<{ onAdd: (text: string) => void; avatar?: string }> = ({ onAdd, avatar }) => {
  const [value, setValue] = useState('')
  const submit = () => {
    const t = value.trim()
    if (!t) return
    onAdd(t)
    setValue('')
  }

  return (
    <div className="mt-4 flex items-start gap-3">
      <img alt="Tu avatar" className="w-10 h-10 rounded-full" src={avatar ?? '/img/profile_default.png'} />
      <div className="flex-1 relative">
  <textarea value={value} onChange={(e) => setValue(e.target.value)} className="w-full p-3 pr-12 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent transition text-slate-600" placeholder="Añade tu comentario para ayudar a otros usuarios..." rows={3} />
        <button onClick={submit} className="absolute right-3 top-3 text-primary hover:bg-primary/10 rounded-full p-2 transition-colors">
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}

export default NewCommentBox
