'use client'

import React, { useState } from 'react'
import { MessageSquare, Palette, Save, X, Edit3 } from 'lucide-react'

interface AnnotationToolbarProps {
  selectedText: string
  position: { x: number; y: number }
  onSave: (comment: string, color: string) => void
  onCancel: () => void
  onHighlight: (color: string) => void
}

const colors = [
  { name: 'Yellow', value: '#ffeb3b', bg: 'bg-yellow-200' },
  { name: 'Green', value: '#4caf50', bg: 'bg-green-200' },
  { name: 'Blue', value: '#2196f3', bg: 'bg-blue-200' },
  { name: 'Pink', value: '#e91e63', bg: 'bg-pink-200' },
  { name: 'Orange', value: '#ff9800', bg: 'bg-orange-200' },
  { name: 'Purple', value: '#9c27b0', bg: 'bg-purple-200' }
]

export default function AnnotationToolbar({ 
  selectedText, 
  position, 
  onSave, 
  onCancel, 
  onHighlight 
}: AnnotationToolbarProps) {
  const [comment, setComment] = useState('')
  const [selectedColor, setSelectedColor] = useState('#ffeb3b')
  const [showCommentInput, setShowCommentInput] = useState(false)

  const handleSave = () => {
    if (comment.trim()) {
      onSave(comment.trim(), selectedColor)
      setComment('')
      setShowCommentInput(false)
    }
  }

  const handleHighlight = (color: string) => {
    setSelectedColor(color)
    onHighlight(color)
  }

  return (
    <div 
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3"
      style={{
        left: Math.min(position.x, window.innerWidth - 300),
        top: Math.max(position.y - 10, 10)
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="text-sm text-gray-600 dark:text-gray-300 max-w-48 truncate">
          "{selectedText}"
        </div>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Color Selection */}
      <div className="flex items-center gap-2 mb-3">
        <Palette className="h-4 w-4 text-gray-500" />
        <div className="flex gap-1">
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => handleHighlight(color.value)}
              className={`w-6 h-6 rounded-full border-2 ${
                selectedColor === color.value 
                  ? 'border-gray-800 dark:border-gray-200' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowCommentInput(!showCommentInput)}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
            showCommentInput
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Add Comment
        </button>

        <button
          onClick={handleHighlight}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Edit3 className="h-4 w-4" />
          Highlight
        </button>
      </div>

      {/* Comment Input */}
      {showCommentInput && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                setComment('')
                setShowCommentInput(false)
              }}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!comment.trim()}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-3 w-3" />
              Save Comment
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
