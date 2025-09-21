/**
 * PDF Viewer Component
 * 
 * This component provides a simple PDF document viewing interface with
 * keyword highlighting, text selection, and search functionality.
 * It's designed for basic document viewing without advanced features.
 * 
 * Key Features:
 * - PDF text display with keyword highlighting
 * - Interactive keyword tooltips
 * - Text selection and search functionality
 * - Download capability
 * - Toggle text visibility
 * - Responsive design
 * 
 * @fileoverview Simple PDF viewer with keyword highlighting
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff, Download, Search } from 'lucide-react'
import KeywordTooltip from './KeywordTooltip'

/**
 * Props interface for PDFViewer component
 */
interface PDFViewerProps {
  file: File
  extractedText: string
  keywords: Array<{word: string, definition: string, context: string, isGPT?: boolean}>
}

/**
 * PDF Viewer Component
 * 
 * This component renders a simple PDF viewing interface with
 * keyword highlighting and basic interaction features.
 * 
 * State Management:
 * - showText: Controls text visibility toggle
 * - searchTerm: Manages search functionality
 * - selectedText: Currently selected text
 * - tooltipPosition: Position for keyword tooltips
 * - showTooltip: Controls tooltip visibility
 * - hoveredKeyword: Currently hovered keyword data
 * 
 * @param file - PDF file to display
 * @param extractedText - Text content extracted from PDF
 * @param keywords - Array of detected keywords with definitions
 * @returns JSX element containing the PDF viewer interface
 */
export default function PDFViewer({ file, extractedText, keywords }: PDFViewerProps) {
  const [showText, setShowText] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedText, setSelectedText] = useState('')
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [showTooltip, setShowTooltip] = useState(false)
  const [hoveredKeyword, setHoveredKeyword] = useState<{word: string, definition: string, context: string, isGPT?: boolean} | null>(null)
  const textRef = useRef<HTMLDivElement>(null)

  // Highlight keywords in the text
  const highlightKeywords = (text: string) => {
    let highlightedText = text
    
    // Sort keywords by length (longest first) to avoid partial matches
    const sortedKeywords = [...keywords].sort((a, b) => b.word.length - a.word.length)
    
    sortedKeywords.forEach(keyword => {
      // For multi-word phrases, use a more flexible regex
      if (keyword.word.includes(' ')) {
        // Escape special regex characters and create a case-insensitive pattern
        const escapedPhrase = keyword.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`\\b${escapedPhrase}\\b`, 'gi')
        highlightedText = highlightedText.replace(regex, (match) => {
          return `<span class="keyword" data-keyword="${keyword.word}">${match}</span>`
        })
      } else {
        // Single word - use word boundaries
        const regex = new RegExp(`\\b${keyword.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
        highlightedText = highlightedText.replace(regex, (match) => {
          return `<span class="keyword" data-keyword="${keyword.word}">${match}</span>`
        })
      }
    })
    
    return highlightedText
  }

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim()
      setSelectedText(text)
      setHoveredKeyword(null) // Clear any keyword hover when text is selected
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      })
      setShowTooltip(true)
      
      // Preserve the text selection by preventing interference
      setTimeout(() => {
        const currentSelection = window.getSelection()
        if (currentSelection && currentSelection.toString() !== text) {
          // Restore selection if it was cleared
          try {
            const newRange = document.createRange()
            newRange.setStart(range.startContainer, range.startOffset)
            newRange.setEnd(range.endContainer, range.endOffset)
            currentSelection.removeAllRanges()
            currentSelection.addRange(newRange)
          } catch (error) {
            console.log('Could not restore selection:', error)
          }
        }
      }, 50)
    }
  }

  // Handle keyword click
  const handleKeywordClick = (e: React.MouseEvent) => {
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
    // Don't close tooltip on mouse leave since we're using click instead of hover
    // Tooltips will only close when manually closed via the X button
  }

  // Filter text based on search
  const filteredText = searchTerm 
    ? extractedText.split('\n').filter(line => 
        line.toLowerCase().includes(searchTerm.toLowerCase())
      ).join('\n')
    : extractedText

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Document Viewer</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowText(!showText)}
              className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {showText ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showText ? 'Hide Text' : 'Show Text'}
            </button>
            <a
              href={URL.createObjectURL(file)}
              download={file.name}
              className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </a>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search in document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="p-6">
        {showText ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {filteredText.split('\n').length} lines • {filteredText.length} characters
              {searchTerm && (
                <span className="ml-2 text-primary-600 dark:text-primary-400">
                  • Filtered by: "{searchTerm}"
                </span>
              )}
            </div>
            
            <div
              ref={textRef}
              className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200 leading-relaxed"
              onMouseUp={handleTextSelection}
              onClick={handleKeywordClick}
              onMouseLeave={handleMouseLeave}
              dangerouslySetInnerHTML={{
                __html: highlightKeywords(filteredText.replace(/\n/g, '<br>'))
              }}
            />
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
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
