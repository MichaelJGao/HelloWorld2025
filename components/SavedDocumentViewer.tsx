'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff, Download, Search, X, FileText } from 'lucide-react'
import KeywordTooltip from './KeywordTooltip'

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
  const textRef = useRef<HTMLDivElement>(null)

  // Highlight keywords in the text
  const highlightKeywords = (text: string) => {
    let highlightedText = text
    
    // Sort keywords by length (longest first) to avoid partial matches
    const sortedKeywords = [...document.keywords].sort((a, b) => b.word.length - a.word.length)
    
    sortedKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      highlightedText = highlightedText.replace(regex, (match) => {
        return `<span class="keyword" data-keyword="${keyword.word}">${match}</span>`
      })
    })
    
    return highlightedText
  }

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim())
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      })
      setShowTooltip(true)
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
      </div>
    </div>
  )
}
