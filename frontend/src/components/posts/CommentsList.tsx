import React from 'react'
import CommentItem from './CommentItem'

type Comment = {
  id: number
  author: string
  avatar?: string
  text: string
  time?: string
  likes?: number
}

const CommentsList: React.FC<{ comments: Comment[] }> = ({ comments }) => {
  return (
    <div className="space-y-6">
      {comments.map(c => (
        <CommentItem key={c.id} comment={c} />
      ))}
    </div>
  )
}

export default CommentsList
