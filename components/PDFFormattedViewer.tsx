'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Eye, EyeOff, Download, FileText, Image as ImageIcon } from 'lucide-react'
import KeywordTooltip from './KeywordTooltip'
import { PDFPageContent, PDFContentItem } from '@/lib/pdfProcessor'

interface PDFFormattedViewerProps {
  file: File
  extractedText: string
  keywords: Array<{word: string, definition: string, context: string}>
  structuredContent?: PDFPageContent[]
}

export default function PDFFormattedViewer({ 
  file, 
  extractedText, 
  keywords, 
  structuredContent 
}: PDFFormattedViewerProps) {
  const [showText, setShowText] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedText, setSelectedText] = useState('')
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [showTooltip, setShowTooltip] = useState(false)
  const [hoveredKeyword, setHoveredKeyword] = useState<{word: string, definition: string, context: string} | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filteredContent, setFilteredContent] = useState<PDFPageContent[]>([])
  
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (structuredContent) {
      setTotalPages(structuredContent.length)
      setFilteredContent(structuredContent)
    } else {
      // Fallback to simple text-based pagination
      const pages = Math.ceil(extractedText.length / 2000) // Rough estimate
      setTotalPages(pages)
    }
  }, [structuredContent, extractedText])

  useEffect(() => {
    if (searchTerm && structuredContent) {
      const filtered = structuredContent.map(page => ({
        ...page,
        items: page.items.filter(item => 
          item.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(page => page.items.length > 0)
      setFilteredContent(filtered)
    } else {
      setFilteredContent(structuredContent || [])
    }
  }, [searchTerm, structuredContent])

  // Highlight keywords in the text
  const highlightKeywords = useCallback((text: string) => {
    let highlightedText = text
    
    // Sort keywords by length (longest first) to avoid partial matches
    const sortedKeywords = [...keywords].sort((a, b) => b.word.length - a.word.length)
    
    sortedKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      highlightedText = highlightedText.replace(regex, (match) => {
        return `<span class="keyword" data-keyword="${keyword.word}">${match}</span>`
      })
    })
    
    return highlightedText
  }, [keywords])

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim())
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 10 // Position below the selection by default
      })
      setShowTooltip(true)
    }
  }

  // Handle keyword hover
  const handleKeywordHover = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('keyword')) {
      const word = target.textContent || ''
      const keyword = keywords.find(k => k.word.toLowerCase() === word.toLowerCase())
      if (keyword) {
        setHoveredKeyword(keyword)
        const rect = target.getBoundingClientRect()
        setTooltipPosition({
          x: rect.left + rect.width / 2,
          y: rect.bottom + 10 // Position below the keyword by default
        })
        setShowTooltip(true)
      }
    }
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
    setHoveredKeyword(null)
  }

  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum)
    }
  }


  const renderSimpleTextView = () => {
    const pageSize = 2000
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const pageText = extractedText.substring(startIndex, endIndex)
    
    return (
      <div className="pdf-document pdf-page max-w-4xl mx-auto">
        {/* Content area with proper margins */}
        <div className="p-8">
          <div className="document-text prose prose-lg max-w-none leading-relaxed">
            <div
              ref={textRef}
              onMouseUp={handleTextSelection}
              onMouseOver={handleKeywordHover}
              onMouseLeave={handleMouseLeave}
              dangerouslySetInnerHTML={{
                __html: highlightKeywords(pageText.replace(/\n/g, '<br>'))
              }}
            />
          </div>
        </div>
        
        {/* Page number */}
        <div className="text-center mt-8 text-xs text-gray-400 font-mono">
          Page {currentPage} of {totalPages}
        </div>
      </div>
    )
  }

  const renderStructuredView = () => {
    const currentPageContent = filteredContent[currentPage - 1]
    if (!currentPageContent) return null

    // Group items by approximate Y position to create readable paragraphs
    const groupedItems = currentPageContent.items.reduce((groups, item) => {
      const yGroup = Math.floor(item.y / 20) // Group items within 20px of each other
      if (!groups[yGroup]) groups[yGroup] = []
      groups[yGroup].push(item)
      return groups
    }, {} as Record<number, PDFContentItem[]>)

    // Sort groups by Y position
    const sortedGroups = Object.keys(groupedItems)
      .map(Number)
      .sort((a, b) => b - a) // Higher Y values first (top to bottom)
      .map(yGroup => groupedItems[yGroup])

    return (
      <div className="pdf-document pdf-page max-w-4xl mx-auto">
        {/* Content area with proper margins */}
        <div className="p-8 space-y-4">
          {sortedGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="flex flex-wrap gap-2">
              {group
                .sort((a, b) => a.x - b.x) // Sort by X position within group
                .map((item, index) => {
                  if (item.type === 'image' && item.imageData) {
                    return (
                      <div key={`${groupIndex}-${index}`} className="my-4">
                        <img 
                          src={item.imageData} 
                          alt="PDF content" 
                          className="max-w-full h-auto border border-gray-300 rounded"
                          style={{ maxWidth: '300px' }}
                        />
                      </div>
                    )
                  }
                  
                  const content = highlightKeywords(item.content)
                  const isHeading = item.fontSize && item.fontSize > 14
                  
                  return (
                    <span
                      key={`${groupIndex}-${index}`}
                      className={`inline-block ${
                        isHeading ? 'font-bold text-lg' : ''
                      } ${item.isBold ? 'font-bold' : ''} ${item.isItalic ? 'italic' : ''}`}
                      style={{
                        fontSize: item.fontSize ? `${Math.min(item.fontSize, 16)}px` : '14px',
                        fontFamily: item.fontFamily || 'Times, serif',
                        color: item.color || '#000000',
                      }}
                      dangerouslySetInnerHTML={{ __html: content }}
                      onMouseUp={handleTextSelection}
                      onMouseOver={handleKeywordHover}
                      onMouseLeave={handleMouseLeave}
                    />
                  )
                })}
            </div>
          ))}
        </div>
        
        {/* Page number */}
        <div className="text-center mt-8 text-xs text-gray-400 font-mono">
          Page {currentPage} of {totalPages}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Document Viewer</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowText(!showText)}
              className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              {showText ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showText ? 'Hide Text' : 'Show Text'}
            </button>
            <a
              href={URL.createObjectURL(file)}
              download={file.name}
              className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </a>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search in document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Page Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center mt-4 space-x-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div className="p-6">
        {showText ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-500 mb-4">
              {searchTerm && (
                <span className="text-primary-600">
                  Filtered by: "{searchTerm}"
                </span>
              )}
            </div>
            
            {structuredContent && structuredContent.length > 0 ? (
              <div className="flex justify-center">
                {renderStructuredView()}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                {renderSimpleTextView()}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <EyeOff className="mx-auto h-12 w-12 mb-4" />
            <p>Text view is hidden</p>
            <p className="text-sm">Click "Show Text" to view the extracted content</p>
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
  )
}
