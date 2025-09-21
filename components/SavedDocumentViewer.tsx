'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff, Download, Search, X, FileText, Save, MessageSquare, Share2 } from 'lucide-react'
import KeywordTooltip from './KeywordTooltip'
import AnnotationToolbar from './AnnotationToolbar'
import AnnotationDisplay from './AnnotationDisplay'
import InviteModal from './InviteModal'

interface SavedDocument {
  _id: string
  fileName: string
  originalName: string
  fileSize: number
  fileType: string
  extractedText: string
  keywords: Array<{
    word: string
    definition: string
    context: string
  }>
  summary?: {
    mainTopic: string
    keyFindings: string[]
    methodology: string
    importantConcepts: string[]
    targetAudience: string
    practicalApplications: string[]
    documentType: string
    summary: string
    readingTime: string
    complexity: string
  }
  uploadDate: string
  lastAccessed: string
  isPublic: boolean
  tags: string[]
}

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

interface SavedDocumentViewerProps {
  document: SavedDocument
  onClose: () => void
}

export default function SavedDocumentViewer({ document, onClose }: SavedDocumentViewerProps) {
  const [showText, setShowText] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedText, setSelectedText] = useState('')
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [showTooltip, setShowTooltip] = useState(false)
  const [hoveredKeyword, setHoveredKeyword] = useState<{word: string, definition: string, context: string} | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [showAnnotationToolbar, setShowAnnotationToolbar] = useState(false)
  const [annotationToolbarPosition, setAnnotationToolbarPosition] = useState({ x: 0, y: 0 })
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null)
  const [annotationDisplayPosition, setAnnotationDisplayPosition] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  // Load annotations when component mounts
  useEffect(() => {
    loadAnnotations()
  }, [document._id])

  // Load annotations from API
  const loadAnnotations = async () => {
    try {
      const response = await fetch(`/api/documents/${document._id}/annotations`)
      if (response.ok) {
        const data = await response.json()
        console.log('Loaded annotations:', data.annotations)
        setAnnotations(data.annotations || [])
      } else {
        console.error('Failed to load annotations:', response.status)
      }
    } catch (error) {
      console.error('Error loading annotations:', error)
    }
  }

  // Save annotation
  const saveAnnotation = async (note: string, color: string) => {
    if (!selectedText.trim()) return

    try {
      setLoading(true)
      const selection = window.getSelection()
      if (!selection || !selection.rangeCount) return

      const range = selection.getRangeAt(0)
      const startContainer = range.startContainer
      const endContainer = range.endContainer

      // Calculate position in the original text
      const textContent = textRef.current?.textContent || ''
      const startIndex = textContent.indexOf(selectedText)
      const endIndex = startIndex + selectedText.length

      const annotationData = {
        type: note ? 'note' : 'highlight',
        selectedText: selectedText.trim(),
        note: note || '',
        color,
        position: {
          startIndex,
          endIndex,
          startOffset: range.startOffset,
          endOffset: range.endOffset
        }
      }

      const response = await fetch(`/api/documents/${document._id}/annotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(annotationData)
      })

      if (response.ok) {
        console.log('Annotation saved successfully')
        await loadAnnotations() // Reload annotations
        setShowAnnotationToolbar(false)
        setSelectedText('')
        selection.removeAllRanges()
      } else {
        console.error('Failed to save annotation:', response.status)
      }
    } catch (error) {
      console.error('Error saving annotation:', error)
    } finally {
      setLoading(false)
    }
  }

  // Update annotation
  const updateAnnotation = async (annotation: Annotation) => {
    try {
      const response = await fetch(`/api/documents/${document._id}/annotations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          annotationId: annotation._id,
          note: annotation.note,
          color: annotation.color
        })
      })

      if (response.ok) {
        await loadAnnotations() // Reload annotations
        setSelectedAnnotation(null)
      }
    } catch (error) {
      console.error('Error updating annotation:', error)
    }
  }

  // Delete annotation
  const deleteAnnotation = async (annotationId: string) => {
    try {
      const response = await fetch(`/api/documents/${document._id}/annotations?annotationId=${annotationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadAnnotations() // Reload annotations
        setSelectedAnnotation(null)
      }
    } catch (error) {
      console.error('Error deleting annotation:', error)
    }
  }

  // Highlight keywords and annotations in the text
  const highlightKeywords = (text: string) => {
    let highlightedText = text
    
    // First, highlight annotations (they take priority)
    annotations.forEach(annotation => {
      const escapedText = annotation.selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escapedText, 'gi')
      highlightedText = highlightedText.replace(regex, (match) => {
        const backgroundColor = annotation.color || '#ffeb3b'
        const textColor = annotation.type === 'note' ? '#000' : '#333'
        return `<span class="annotation" data-annotation-id="${annotation._id}" style="background-color: ${backgroundColor}; color: ${textColor}; padding: 1px 2px; border-radius: 2px; cursor: pointer; border: 1px solid rgba(0,0,0,0.1);">${match}</span>`
      })
    })
    
    // Then highlight keywords (but avoid overlapping with annotations)
    const sortedKeywords = [...document.keywords].sort((a, b) => b.word.length - a.word.length)
    
    sortedKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      highlightedText = highlightedText.replace(regex, (match, offset) => {
        // Check if this match is already inside an annotation span
        const beforeMatch = highlightedText.substring(0, offset)
        const afterMatch = highlightedText.substring(offset + match.length)
        
        // Count annotation spans before this position
        const openAnnotations = (beforeMatch.match(/<span class="annotation"/g) || []).length
        const closeAnnotations = (beforeMatch.match(/<\/span>/g) || []).length
        
        // If we're inside an annotation, don't highlight
        if (openAnnotations > closeAnnotations) {
          return match
        }
        
        return `<span class="keyword" data-keyword="${keyword.word}">${match}</span>`
      })
    })
    
    return highlightedText
  }

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim()
      setSelectedText(selectedText)
      
      // Check if this is an existing annotation
      const existingAnnotation = annotations.find(ann => 
        ann.selectedText === selectedText
      )
      
      if (existingAnnotation) {
        // Show existing annotation
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setAnnotationDisplayPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        })
        setSelectedAnnotation(existingAnnotation)
        setShowTooltip(false)
      } else {
        // Show annotation toolbar for new annotation
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setAnnotationToolbarPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        })
        setShowAnnotationToolbar(true)
        setShowTooltip(false)
      }
    }
  }

  // Handle keyword hover
  const handleKeywordHover = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('keyword')) {
      const word = target.textContent || ''
      const keyword = document.keywords.find(k => k.word.toLowerCase() === word.toLowerCase())
      if (keyword) {
        setHoveredKeyword(keyword)
        setTooltipPosition({
          x: e.clientX,
          y: e.clientY - 10
        })
        setShowTooltip(true)
      }
    }
  }

  // Handle annotation click
  const handleAnnotationClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('annotation')) {
      const annotationId = target.getAttribute('data-annotation-id')
      const annotation = annotations.find(ann => ann._id === annotationId)
      if (annotation) {
        setSelectedAnnotation(annotation)
        setAnnotationDisplayPosition({
          x: e.clientX,
          y: e.clientY - 10
        })
        setShowTooltip(false)
        setShowAnnotationToolbar(false)
      }
    }
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
    setHoveredKeyword(null)
  }

  // Filter text based on search
  const filteredText = searchTerm 
    ? document.extractedText.split('\n').filter(line => 
        line.toLowerCase().includes(searchTerm.toLowerCase())
      ).join('\n')
    : document.extractedText

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {document.originalName}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{formatFileSize(document.fileSize)}</span>
                <span>•</span>
                <span>Uploaded {formatDate(document.uploadDate)}</span>
                {document.summary?.readingTime && (
                  <>
                    <span>•</span>
                    <span>{document.summary.readingTime}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowText(!showText)}
              className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {showText ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showText ? 'Hide Text' : 'Show Text'}
            </button>
            <div className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md">
              <MessageSquare className="h-4 w-4" />
              {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Share Document"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </button>
            <button
              onClick={loadAnnotations}
              className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Refresh annotations"
            >
              <Save className="h-4 w-4 mr-1" />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search in document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {showText ? (
            <div className="h-full overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Document Summary */}
                {document.summary && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Document Summary
                    </h3>
                    {document.summary.mainTopic && (
                      <p className="text-blue-800 dark:text-blue-200 mb-2">
                        <strong>Main Topic:</strong> {document.summary.mainTopic}
                      </p>
                    )}
                    {document.summary.summary && (
                      <p className="text-blue-800 dark:text-blue-200">
                        {document.summary.summary}
                      </p>
                    )}
                  </div>
                )}

                {/* Keywords */}
                {document.keywords.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                      Detected Keywords ({document.keywords.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {document.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-sm rounded-full"
                        >
                          {keyword.word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Annotations Debug */}
                {annotations.length > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                      Your Annotations ({annotations.length})
                    </h3>
                    <div className="space-y-2">
                      {annotations.map((annotation, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-purple-100 dark:bg-purple-800 rounded">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: annotation.color || '#ffeb3b' }}
                          />
                          <span className="text-sm text-purple-800 dark:text-purple-200">
                            "{annotation.selectedText}"
                          </span>
                          {annotation.note && (
                            <span className="text-xs text-purple-600 dark:text-purple-300">
                              - {annotation.note}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Text Stats */}
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {filteredText.split('\n').length} lines • {filteredText.length} characters
                  {searchTerm && (
                    <span className="ml-2 text-blue-600 dark:text-blue-400">
                      • Filtered by: "{searchTerm}"
                    </span>
                  )}
                </div>
                
                {/* Document Text */}
                <div
                  ref={textRef}
                  className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200 leading-relaxed"
                  onMouseUp={handleTextSelection}
                  onMouseOver={handleKeywordHover}
                  onMouseLeave={handleMouseLeave}
                  onClick={handleAnnotationClick}
                  dangerouslySetInnerHTML={{
                    __html: highlightKeywords(filteredText.replace(/\n/g, '<br>'))
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <EyeOff className="mx-auto h-12 w-12 mb-4" />
                <p>Text view is hidden</p>
                <p className="text-sm">Click "Show Text" to view the extracted content</p>
              </div>
            </div>
          )}
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <KeywordTooltip
            position={tooltipPosition}
            keyword={hoveredKeyword}
            selectedText={selectedText}
            onClose={() => setShowTooltip(false)}
          />
        )}

        {/* Annotation Toolbar */}
        {showAnnotationToolbar && (
          <AnnotationToolbar
            selectedText={selectedText}
            position={annotationToolbarPosition}
            onSave={saveAnnotation}
            onCancel={() => {
              setShowAnnotationToolbar(false)
              setSelectedText('')
              window.getSelection()?.removeAllRanges()
            }}
            onHighlight={(color) => saveAnnotation('', color)}
          />
        )}

        {/* Annotation Display */}
        {selectedAnnotation && (
          <AnnotationDisplay
            annotation={selectedAnnotation}
            position={annotationDisplayPosition}
            onEdit={updateAnnotation}
            onDelete={deleteAnnotation}
            onClose={() => setSelectedAnnotation(null)}
          />
        )}

        {/* Invite Modal */}
        <InviteModal
          isOpen={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          documentId={document._id}
          documentName={document.originalName}
        />
      </div>
    </div>
  )
}
