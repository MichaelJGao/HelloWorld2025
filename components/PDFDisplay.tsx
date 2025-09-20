'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff, Download, Search, FileText } from 'lucide-react'
import KeywordTooltip from './KeywordTooltip'

interface PDFDisplayProps {
  file: File
  extractedText: string
  keywords: Array<{word: string, definition: string, context: string}>
}

export default function PDFDisplay({ file, extractedText, keywords }: PDFDisplayProps) {
  const [showText, setShowText] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedText, setSelectedText] = useState('')
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [showTooltip, setShowTooltip] = useState(false)
  const [hoveredKeyword, setHoveredKeyword] = useState<{word: string, definition: string, context: string} | null>(null)
  const [pdfPages, setPdfPages] = useState<Array<{pageNumber: number, text: string}>>([])
  const textRef = useRef<HTMLDivElement>(null)

  // Split text into pages (simulate PDF pages)
  useEffect(() => {
    if (extractedText) {
      const wordsPerPage = 300 // Approximate words per page
      const words = extractedText.split(/\s+/)
      const pages = []
      
      for (let i = 0; i < words.length; i += wordsPerPage) {
        const pageWords = words.slice(i, i + wordsPerPage)
        const pageText = pageWords.join(' ')
        pages.push({
          pageNumber: Math.floor(i / wordsPerPage) + 1,
          text: pageText
        })
      }
      
      setPdfPages(pages)
    }
  }, [extractedText])

  // Highlight keywords in the text
  const highlightKeywords = (text: string) => {
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
      const keyword = keywords.find(k => k.word.toLowerCase() === word.toLowerCase())
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
  const filteredPages = searchTerm 
    ? pdfPages.filter(page => 
        page.text.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : pdfPages

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary-500" />
            Document Viewer
          </h2>
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
      </div>

      <div className="p-6">
        {showText ? (
          <div className="space-y-6">
            <div className="text-sm text-gray-500 mb-4">
              {filteredPages.length} pages • {keywords.length} keywords detected
              {searchTerm && (
                <span className="ml-2 text-primary-600">
                  • Filtered by: "{searchTerm}"
                </span>
              )}
            </div>
            
            {/* PDF-like page display */}
            <div className="space-y-4">
              {filteredPages.map((page, index) => (
                <div
                  key={page.pageNumber}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 min-h-[800px]"
                  style={{
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    background: 'linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)'
                  }}
                >
                  {/* Page header */}
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-200">
                    <span className="text-sm text-gray-500 font-medium">
                      Page {page.pageNumber}
                    </span>
                    <span className="text-sm text-gray-400">
                      {file.name}
                    </span>
                  </div>
                  
                  {/* Page content */}
                  <div
                    ref={textRef}
                    className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}
                    onMouseUp={handleTextSelection}
                    onMouseOver={handleKeywordHover}
                    onMouseLeave={handleMouseLeave}
                    dangerouslySetInnerHTML={{
                      __html: highlightKeywords(page.text.replace(/\n/g, '<br>'))
                    }}
                  />
                  
                  {/* Page footer */}
                  <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                    <span className="text-xs text-gray-400">
                      {page.pageNumber}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
