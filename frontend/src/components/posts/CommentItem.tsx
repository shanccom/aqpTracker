import React from 'react'
import { ThumbsUp } from 'lucide-react'

type Comment = {
  id: number
  author: string
  avatar?: string
  text: string
  time?: string
  likes?: number
}

const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
  return (
    <div className="flex items-start gap-3">
      <img alt={`Avatar de ${comment.author}`} className="w-10 h-10 rounded-full" src={comment.avatar || '/static/img/profile.jpg'} />
      <div className="flex-1">
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-[#0d151c]">{comment.author}</p>
            <p className="text-xs text-slate-500">{comment.time || 'hace poco'}</p>
          </div>
          <p className="text-slate-600">{comment.text}</p>
        </div>
        <div className="flex items-center gap-4 mt-2 ml-3">
          <div className="flex items-center gap-1 text-slate-500">
            <button className="hover:text-primary transition-colors flex items-center gap-1">
              <ThumbsUp size={16} />
            </button>
            <span className="text-xs font-semibold">{comment.likes || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommentItem
