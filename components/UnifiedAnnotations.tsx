/**
 * Unified Annotations Component
 * 
 * This component provides a comprehensive collaborative annotation system
 * for PDF documents. It supports both document owners and invited users
 * with real-time updates, threaded discussions, and various annotation types.
 * 
 * Key Features:
 * - Real-time collaborative annotations with polling
 * - Multiple annotation types (comment, highlight, question, suggestion)
 * - Threaded replies and discussions
 * - Text selection and annotation creation
 * - Edit and delete functionality
 * - Permission-based access control
 * - Error handling and loading states
 * 
 * @fileoverview Collaborative annotation system for PDF documents
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Plus, Edit2, Trash2, Reply, Send, X, Check, AlertCircle, User, Clock, Users } from 'lucide-react'

/**
 * Interface for annotation data structure
 */
interface Annotation {
  _id: string
  text: string
  selectedText: string
  position: any
  type: 'comment' | 'highlight' | 'question' | 'suggestion'
  authorEmail: string
  authorName: string
  createdAt: string
  updatedAt: string
  replies: Reply[]
  inviterEmail?: string
}

/**
 * Interface for reply data structure
 */
interface Reply {
  _id: string
  text: string
  authorEmail: string
  authorName: string
  createdAt: string
  updatedAt: string
}

/**
 * Props interface for UnifiedAnnotations component
 */
interface UnifiedAnnotationsProps {
  documentId?: string
  token?: string
  documentText: string
  isOwner?: boolean
  onAnnotationAdd?: (annotation: Annotation) => void
}

/**
 * Unified Annotations Component
 * 
 * This component renders the collaborative annotation interface with
 * real-time updates, text selection, and comprehensive annotation management.
 * 
 * State Management:
 * - annotations: Array of all annotations for the document
 * - selectedText: Currently selected text for annotation
 * - showAnnotationForm: Controls annotation form visibility
 * - annotationText: Text content for new annotation
 * - annotationType: Type of annotation being created
 * - editingAnnotation: ID of annotation being edited
 * - editingReply: Reply being edited
 * - replyingTo: Annotation ID for reply creation
 * - replyText: Text content for new reply
 * - loading: Loading state for API operations
 * - error: Error message display
 * - refreshing: Silent refresh state
 * 
 * @param documentId - Document ID for owner access
 * @param token - Invitation token for guest access
 * @param documentText - Full text content of the document
 * @param isOwner - Whether user is document owner
 * @param onAnnotationAdd - Callback when annotation is added
 * @returns JSX element containing the complete annotation interface
 */
export default function UnifiedAnnotations({ 
  documentId,
  token,
  documentText, 
  isOwner = false,
  onAnnotationAdd 
}: UnifiedAnnotationsProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [selectedText, setSelectedText] = useState('')
  const [showAnnotationForm, setShowAnnotationForm] = useState(false)
  const [annotationText, setAnnotationText] = useState('')
  const [annotationType, setAnnotationType] = useState<'comment' | 'highlight' | 'question' | 'suggestion'>('comment')
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null)
  const [editingReply, setEditingReply] = useState<{annotationId: string, replyId: string} | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  
  const textRef = useRef<HTMLDivElement>(null)

  /**
   * Initialize annotations and set up real-time polling
   */
  useEffect(() => {
    fetchAnnotations()
    
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchAnnotations(true) // Silent refresh
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [documentId, token])

  /**
   * Fetch annotations from API
   * 
   * Retrieves all annotations for the document with support for
   * both owner and guest access modes.
   * 
   * @param silent - Whether to show loading indicators
   */
  const fetchAnnotations = async (silent = false) => {
    try {
      if (!silent) setRefreshing(true)
      
      const url = isOwner 
        ? `/api/documents/${documentId}/annotations`
        : `/api/documents/invite/${token}/annotations`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAnnotations(data.annotations || [])
      } else {
        const errorData = await response.json()
        if (!silent) setError(errorData.error || 'Failed to load annotations')
      }
    } catch (err) {
      if (!silent) setError('Error loading annotations')
      console.error('Error fetching annotations:', err)
    } finally {
      if (!silent) setRefreshing(false)
    }
  }

  /**
   * Handle text selection for annotation creation
   * 
   * Captures selected text and shows the annotation form
   * for creating new annotations.
   */
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim())
      setShowAnnotationForm(true)
    }
  }

  /**
   * Create a new annotation
   * 
   * Saves a new annotation to the database with the selected text
   * and annotation content.
   */
  const createAnnotation = async () => {
    if (!annotationText.trim() || !selectedText.trim()) return

    setLoading(true)
    setError('')

    try {
      const url = isOwner 
        ? `/api/documents/${documentId}/annotations`
        : `/api/documents/invite/${token}/annotations`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: annotationText,
          selectedText,
          type: annotationType,
          position: {} // Could be enhanced to store cursor position
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAnnotations(prev => [data.annotation, ...prev])
        setAnnotationText('')
        setSelectedText('')
        setShowAnnotationForm(false)
        onAnnotationAdd?.(data.annotation)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create annotation')
      }
    } catch (err) {
      setError('Error creating annotation')
      console.error('Error creating annotation:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateAnnotation = async (annotationId: string, text: string, type: string) => {
    setLoading(true)
    setError('')

    try {
      const url = isOwner 
        ? `/api/documents/${documentId}/annotations`
        : `/api/documents/invite/${token}/annotations`
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          annotationId,
          text,
          type
        }),
      })

      if (response.ok) {
        setAnnotations(prev => 
          prev.map(ann => 
            ann._id === annotationId 
              ? { ...ann, text, type, updatedAt: new Date().toISOString() }
              : ann
          )
        )
        setEditingAnnotation(null)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update annotation')
      }
    } catch (err) {
      setError('Error updating annotation')
      console.error('Error updating annotation:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteAnnotation = async (annotationId: string) => {
    if (!confirm('Are you sure you want to delete this annotation?')) return

    setLoading(true)
    setError('')

    try {
      const url = isOwner 
        ? `/api/documents/${documentId}/annotations?annotationId=${annotationId}`
        : `/api/documents/invite/${token}/annotations?annotationId=${annotationId}`
      
      const response = await fetch(url, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAnnotations(prev => prev.filter(ann => ann._id !== annotationId))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete annotation')
      }
    } catch (err) {
      setError('Error deleting annotation')
      console.error('Error deleting annotation:', err)
    } finally {
      setLoading(false)
    }
  }

  const addReply = async (annotationId: string) => {
    if (!replyText.trim()) return

    setLoading(true)
    setError('')

    try {
      const url = isOwner 
        ? `/api/documents/${documentId}/annotations/replies`
        : `/api/documents/invite/${token}/annotations/replies`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          annotationId,
          text: replyText
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAnnotations(prev => 
          prev.map(ann => 
            ann._id === annotationId 
              ? { ...ann, replies: [...ann.replies, data.reply] }
              : ann
          )
        )
        setReplyText('')
        setReplyingTo(null)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to add reply')
      }
    } catch (err) {
      setError('Error adding reply')
      console.error('Error adding reply:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateReply = async (annotationId: string, replyId: string, text: string) => {
    setLoading(true)
    setError('')

    try {
      const url = isOwner 
        ? `/api/documents/${documentId}/annotations/replies`
        : `/api/documents/invite/${token}/annotations/replies`
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          annotationId,
          replyId,
          text
        }),
      })

      if (response.ok) {
        setAnnotations(prev => 
          prev.map(ann => 
            ann._id === annotationId 
              ? {
                  ...ann, 
                  replies: ann.replies.map(reply => 
                    reply._id === replyId 
                      ? { ...reply, text, updatedAt: new Date().toISOString() }
                      : reply
                  )
                }
              : ann
          )
        )
        setEditingReply(null)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update reply')
      }
    } catch (err) {
      setError('Error updating reply')
      console.error('Error updating reply:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteReply = async (annotationId: string, replyId: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return

    setLoading(true)
    setError('')

    try {
      const url = isOwner 
        ? `/api/documents/${documentId}/annotations/replies?annotationId=${annotationId}&replyId=${replyId}`
        : `/api/documents/invite/${token}/annotations/replies?annotationId=${annotationId}&replyId=${replyId}`
      
      const response = await fetch(url, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAnnotations(prev => 
          prev.map(ann => 
            ann._id === annotationId 
              ? { ...ann, replies: ann.replies.filter(reply => reply._id !== replyId) }
              : ann
          )
        )
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete reply')
      }
    } catch (err) {
      setError('Error deleting reply')
      console.error('Error deleting reply:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'comment': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'highlight': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'question': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'suggestion': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
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

  const getAuthorType = (authorEmail: string, inviterEmail?: string) => {
    if (!inviterEmail) return 'User'
    return authorEmail === inviterEmail ? 'Document Owner' : 'Collaborator'
  }

  const canEditAnnotation = (annotation: Annotation) => {
    // For now, allow both owner and invited user to edit any annotation
    // This can be made more restrictive if needed
    return true
  }

  const canDeleteAnnotation = (annotation: Annotation) => {
    // For now, allow both owner and invited user to delete any annotation
    // This can be made more restrictive if needed
    return true
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Document Text with Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Document Content
          </h3>
          <div className="flex items-center gap-2">
            {refreshing && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Select text to add annotations
            </div>
          </div>
        </div>
        
        <div 
          ref={textRef}
          className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200 leading-relaxed select-text"
          onMouseUp={handleTextSelection}
        >
          <div dangerouslySetInnerHTML={{ __html: documentText.replace(/\n/g, '<br>') }} />
        </div>
      </div>

      {/* Annotation Form */}
      {showAnnotationForm && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Add annotation for: "{selectedText}"
            </span>
            <button
              onClick={() => setShowAnnotationForm(false)}
              className="ml-auto text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Annotation Type
              </label>
              <select
                value={annotationType}
                onChange={(e) => setAnnotationType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="comment">Comment</option>
                <option value="highlight">Highlight</option>
                <option value="question">Question</option>
                <option value="suggestion">Suggestion</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Annotation
              </label>
              <textarea
                value={annotationText}
                onChange={(e) => setAnnotationText(e.target.value)}
                placeholder="Add your comment, question, or suggestion..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={createAnnotation}
                disabled={loading || !annotationText.trim()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 mr-1" />
                {loading ? 'Adding...' : 'Add Annotation'}
              </button>
              <button
                onClick={() => setShowAnnotationForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Annotations List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Collaborative Annotations ({annotations.length})
          </h3>
          {refreshing && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>

        {annotations.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No annotations yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Select text above to add the first annotation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {annotations.map((annotation) => (
              <div key={annotation._id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                {/* Annotation Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(annotation.type)}`}>
                      {annotation.type}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <User className="h-3 w-3" />
                      <span>{annotation.authorName}</span>
                      <span className="text-xs">
                        ({getAuthorType(annotation.authorEmail, annotation.inviterEmail)})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(annotation.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setReplyingTo(annotation._id)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Reply"
                    >
                      <Reply className="h-4 w-4" />
                    </button>
                    {canEditAnnotation(annotation) && (
                      <button
                        onClick={() => setEditingAnnotation(annotation._id)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                    {canDeleteAnnotation(annotation) && (
                      <button
                        onClick={() => deleteAnnotation(annotation._id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Selected Text */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 mb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                    "{annotation.selectedText}"
                  </p>
                </div>

                {/* Annotation Text */}
                {editingAnnotation === annotation._id ? (
                  <div className="space-y-2">
                    <textarea
                      defaultValue={annotation.text}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const textarea = document.querySelector(`textarea[defaultValue="${annotation.text}"]`) as HTMLTextAreaElement
                          updateAnnotation(annotation._id, textarea.value, annotation.type)
                        }}
                        className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingAnnotation(null)}
                        className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-800 dark:text-gray-200 mb-3">{annotation.text}</p>
                )}

                {/* Replies */}
                {annotation.replies.length > 0 && (
                  <div className="ml-4 space-y-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <Users className="h-3 w-3" />
                      <span>{annotation.replies.length} replies</span>
                    </div>
                    {annotation.replies.map((reply) => (
                      <div key={reply._id} className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {reply.authorName}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              ({getAuthorType(reply.authorEmail, annotation.inviterEmail)})
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingReply({annotationId: annotation._id, replyId: reply._id})}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              title="Edit"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => deleteReply(annotation._id, reply._id)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        
                        {editingReply?.annotationId === annotation._id && editingReply?.replyId === reply._id ? (
                          <div className="space-y-2">
                            <textarea
                              defaultValue={reply.text}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const textarea = document.querySelector(`textarea[defaultValue="${reply.text}"]`) as HTMLTextAreaElement
                                  updateReply(annotation._id, reply._id, textarea.value)
                                }}
                                className="flex items-center px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Save
                              </button>
                              <button
                                onClick={() => setEditingReply(null)}
                                className="px-2 py-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 dark:text-gray-300">{reply.text}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {replyingTo === annotation._id && (
                  <div className="ml-4 mt-3 bg-gray-50 dark:bg-gray-700 rounded p-3">
                    <div className="space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Add a reply..."
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => addReply(annotation._id)}
                          disabled={loading || !replyText.trim()}
                          className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          {loading ? 'Sending...' : 'Reply'}
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null)
                            setReplyText('')
                          }}
                          className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
