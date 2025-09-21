'use client'

import React, { useState } from 'react'
import { MessageSquare, Edit3, Trash2, X } from 'lucide-react'

interface Annotation {
  _id: string
  type: 'highlight' | 'note'
  selectedText: string
  note?: string
  color?: string
  position: {
    startIndex: number
    endIndex: number
    startOffset: number
    endOffset: number
  }
  createdAt: string
  updatedAt: string
}

interface AnnotationDisplayProps {
  annotation: Annotation
  onEdit: (annotation: Annotation) => void
  onDelete: (annotationId: string) => void
  position: { x: number; y: number }
  onClose: () => void
}

export default function AnnotationDisplay({ 
  annotation, 
  onEdit, 
  onDelete, 
  position, 
  onClose 
}: AnnotationDisplayProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editNote, setEditNote] = useState(annotation.note || '')

  const handleSave = () => {
    onEdit({
      ...annotation,
      note: editNote
    })
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this annotation?')) {
      onDelete(annotation._id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div 
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm"
      style={{
        left: Math.min(position.x, window.innerWidth - 350),
        top: Math.max(position.y - 10, 10)
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {annotation.type === 'note' ? (
            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <Edit3 className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {annotation.type === 'note' ? 'Note' : 'Highlight'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Selected Text */}
      <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-800 dark:text-gray-200">
        "{annotation.selectedText}"
      </div>

      {/* Note Content */}
      {annotation.note && (
        <div className="mb-3">
          {isEditing ? (
            <div>
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => {
                    setEditNote(annotation.note || '')
                    setIsEditing(false)
                  }}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-800 dark:text-gray-200">
              {annotation.note}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(annotation.createdAt)}
        </div>
        <div className="flex items-center gap-2">
          {annotation.note && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              title="Edit note"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            title="Delete annotation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
