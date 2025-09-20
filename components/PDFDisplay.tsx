'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Eye, EyeOff, Download, Search, BookOpen, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Move } from 'lucide-react'
import KeywordTooltip from './KeywordTooltip'
import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`

interface PDFDisplayProps {
  file: File | null
  extractedText: string
  keywords: Array<{ word: string; definition: string; context: string }>
}

export default function PDFDisplay({ file, extractedText, keywords }: PDFDisplayProps) {
  const [showTextView, setShowTextView] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredText, setFilteredText] = useState(extractedText)
  const [hoveredKeyword, setHoveredKeyword] = useState<{ word: string; definition: string; context: string } | null>(null)
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [pdfDocument, setPdfDocument] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [zoom, setZoom] = useState(1.0)
  const [showPdfView, setShowPdfView] = useState(true)
  const [pdfPages, setPdfPages] = useState<string[]>([])
  const [currentZoomedPage, setCurrentZoomedPage] = useState<string | null>(null)
  const [selectedTextFromPdf, setSelectedTextFromPdf] = useState<string | null>(null)
  const [highlightedTextId, setHighlightedTextId] = useState<string | null>(null)
  // PDF.js viewer state
  const [isPanning, setIsPanning] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [highlightedText, setHighlightedText] = useState<string>('')
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textViewRef = useRef<HTMLDivElement>(null)
  const pdfContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setFilteredText(extractedText)
  }, [extractedText])

  useEffect(() => {
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'gi')
      setFilteredText(extractedText.replace(regex, (match) => `<mark>${match}</mark>`))
    } else {
      setFilteredText(extractedText)
    }
  }, [searchTerm, extractedText])

  useEffect(() => {
    if (file) {
      loadPdfDocument(file)
    }
  }, [file])

  // Initialize zoomed page when PDF loads


  const loadPdfDocument = async (pdfFile: File) => {
    setIsLoading(true)
    try {
      console.log('Loading PDF:', pdfFile.name, 'Size:', pdfFile.size)
      const arrayBuffer = await pdfFile.arrayBuffer()
      
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true
      }).promise
      
      console.log('PDF loaded successfully, pages:', pdf.numPages)
      setPdfDocument(pdf)
      setTotalPages(pdf.numPages)
      
      // Pre-render all pages as images for simple display
      await renderAllPages(pdf)
    } catch (error) {
      console.error('Error loading PDF:', error)
      setPdfDocument(null)
      setTotalPages(0)
    } finally {
      setIsLoading(false)
    }
  }

  const renderAllPages = async (pdf: any) => {
    const pages: string[] = []
    
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1.5 })
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')!
        
        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise
        
        pages.push(canvas.toDataURL())
        console.log(`Rendered page ${i}`)
      } catch (error) {
        console.error(`Error rendering page ${i}:`, error)
      }
    }
    
    setPdfPages(pages)
  }

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDocument || !canvasRef.current) return

    try {
      const page = await pdfDocument.getPage(pageNum)
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (!context) return

      const viewport = page.getViewport({ scale: zoom })
      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise
    } catch (error) {
      console.error('Error rendering page:', error)
    }
  }, [pdfDocument, zoom])

  // Re-render when page or zoom changes
  useEffect(() => {
    if (pdfDocument && currentPage) {
      renderPage(currentPage)
    }
  }, [pdfDocument, currentPage, renderPage])

  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum)
    }
  }

  const handleZoom = (newZoom: number) => {
    setZoom(newZoom)
    // Reset pan offset when zooming
    setPanOffset({ x: 0, y: 0 })
  }

  // Panning functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle mouse or Ctrl+left click
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
      e.preventDefault()
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x
      const deltaY = e.clientY - lastPanPoint.y
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      const newZoom = Math.max(0.5, Math.min(3, zoom + delta))
      handleZoom(newZoom)
    }
  }

  const highlightKeywords = useCallback((text: string) => {
    let highlightedText = text

    const sortedKeywords = [...keywords].sort((a, b) => b.word.length - a.word.length)

    sortedKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      highlightedText = highlightedText.replace(regex, (match) => {
        return `<span class="keyword" data-keyword="${keyword.word}">${match}</span>`
      })
    })

    return highlightedText
  }, [keywords])

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) {
      const text = selection.toString().trim()
      setHighlightedText(text)
      setSelectedText(text)
      setHoveredKeyword(null)
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.top + window.scrollY - 10,
      })
      setShowTooltip(true)
    }
  }

  const handlePdfTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) {
      const text = selection.toString().trim()
      console.log('PDF text selected:', text)
      setSelectedTextFromPdf(text)
      
      // Find and highlight this text in the Text View
      findAndHighlightTextInTextView(text)
      
      // Also show tooltip for the selected text
      const enhancedContext = getEnhancedContext(text, extractedText, 150)
      setSelectedText(text)
      setHoveredKeyword(null)
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.top + window.scrollY - 10,
      })
      setShowTooltip(true)
    } else {
      console.log('No text selected or selection is empty')
    }
  }

  const findAndHighlightTextInTextView = (searchText: string) => {
    if (!textViewRef.current || !searchText) {
      console.log('No textViewRef or searchText:', { textViewRef: !!textViewRef.current, searchText })
      return
    }

    console.log('Searching for text:', searchText)

    // Clear previous highlights
    const previousHighlights = textViewRef.current.querySelectorAll('.pdf-selection-highlight')
    previousHighlights.forEach(highlight => {
      const parent = highlight.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight)
        parent.normalize()
      }
    })

    // Find the text in the Text View - use a more flexible approach
    const textContent = textViewRef.current.textContent || ''
    console.log('Text view content length:', textContent.length)
    console.log('First 200 chars of text view:', textContent.substring(0, 200))
    
    // Try different search approaches
    let searchIndex = -1
    let actualSearchText = searchText
    
    // First try exact match
    searchIndex = textContent.toLowerCase().indexOf(searchText.toLowerCase())
    
    // If not found, try with cleaned text (remove extra spaces, newlines)
    if (searchIndex === -1) {
      const cleanedSearchText = searchText.replace(/\s+/g, ' ').trim()
      const cleanedTextContent = textContent.replace(/\s+/g, ' ').trim()
      searchIndex = cleanedTextContent.toLowerCase().indexOf(cleanedSearchText.toLowerCase())
      actualSearchText = cleanedSearchText
      console.log('Trying cleaned search:', { cleanedSearchText, found: searchIndex !== -1 })
    }
    
    // If still not found, try partial matches
    if (searchIndex === -1) {
      const words = searchText.split(/\s+/).filter(word => word.length > 2)
      for (const word of words) {
        searchIndex = textContent.toLowerCase().indexOf(word.toLowerCase())
        if (searchIndex !== -1) {
          actualSearchText = word
          console.log('Found partial match with word:', word)
          break
        }
      }
    }
    
    console.log('Final search result:', { searchIndex, actualSearchText })
    
    if (searchIndex !== -1) {
      // Create a unique ID for this highlight
      const highlightId = `highlight-${Date.now()}`
      setHighlightedTextId(highlightId)
      
      // Scroll to the text view first
      textViewRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      })
      
      // Use a simpler approach - just highlight the first occurrence
      const textNodes = []
      const walker = document.createTreeWalker(
        textViewRef.current,
        NodeFilter.SHOW_TEXT,
        null
      )
      
      let node
      while (node = walker.nextNode()) {
        textNodes.push(node)
      }
      
      // Find the node containing our text
      let currentPos = 0
      for (const textNode of textNodes) {
        const nodeText = textNode.textContent || ''
        const nodeLength = nodeText.length
        
        if (currentPos <= searchIndex && searchIndex < currentPos + nodeLength) {
          const relativeIndex = searchIndex - currentPos
          const beforeText = nodeText.substring(0, relativeIndex)
          const matchText = nodeText.substring(relativeIndex, relativeIndex + actualSearchText.length)
          const afterText = nodeText.substring(relativeIndex + actualSearchText.length)
          
          // Create highlight span
          const span = document.createElement('span')
          span.className = 'pdf-selection-highlight bg-yellow-200 border-b-2 border-yellow-400 px-1'
          span.id = highlightId
          span.textContent = matchText
          
          // Replace the text node
          const parent = textNode.parentNode
          if (parent) {
            const fragment = document.createDocumentFragment()
            if (beforeText) fragment.appendChild(document.createTextNode(beforeText))
            fragment.appendChild(span)
            if (afterText) fragment.appendChild(document.createTextNode(afterText))
            parent.replaceChild(fragment, textNode)
          }
          
          // Scroll to the highlighted element
          setTimeout(() => {
            const highlightElement = document.getElementById(highlightId)
            if (highlightElement) {
              highlightElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              })
            }
          }, 200)
          
          console.log('Successfully highlighted text:', matchText)
          break
        }
        
        currentPos += nodeLength
      }
    } else {
      console.log('Text not found in Text View')
    }
  }

  const handleKeywordHover = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('keyword')) {
      const word = target.getAttribute('data-keyword') || ''
      const keyword = keywords.find(k => k.word.toLowerCase() === word.toLowerCase())
      if (keyword) {
        // Get better context around the keyword
        const enhancedKeyword = {
          ...keyword,
          context: getEnhancedContext(word, extractedText)
        }
        setHoveredKeyword(enhancedKeyword)
        setSelectedText(null)
        setTooltipPosition({
          x: e.clientX,
          y: e.clientY - 10,
        })
        setShowTooltip(true)
      }
    }
  }

  const getEnhancedContext = (word: string, text: string, contextLength: number = 150): string => {
    const index = text.toLowerCase().indexOf(word.toLowerCase())
    if (index === -1) return text.substring(0, contextLength)
    
    // Find the sentence boundaries around the word
    const beforeText = text.substring(0, index)
    const afterText = text.substring(index + word.length)
    
    // Find the start of the current sentence
    const sentenceStart = Math.max(0, beforeText.lastIndexOf('.') + 1)
    const sentenceEnd = Math.min(text.length, afterText.indexOf('.') + index + word.length + 1)
    
    // If we can't find sentence boundaries, use a smaller context window
    if (sentenceStart === index || sentenceEnd === index + word.length) {
      const start = Math.max(0, index - contextLength / 2)
      const end = Math.min(text.length, index + word.length + contextLength / 2)
      return text.substring(start, end).trim()
    }
    
    // Return the sentence containing the word, but limit its length
    const sentence = text.substring(sentenceStart, sentenceEnd).trim()
    if (sentence.length > contextLength * 2) {
      // If sentence is too long, take a portion around the word
      const wordIndex = sentence.toLowerCase().indexOf(word.toLowerCase())
      const start = Math.max(0, wordIndex - contextLength / 2)
      const end = Math.min(sentence.length, wordIndex + word.length + contextLength / 2)
      return sentence.substring(start, end).trim()
    }
    
    return sentence
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
    setHoveredKeyword(null)
    setSelectedText(null)
  }

  if (!file) {
    return null
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 mt-8">
      {/* PDF Viewer Section */}
      <div className="lg:w-1/2 bg-white p-6 rounded-lg shadow-md overflow-y-auto max-h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Document View</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPdfView(!showPdfView)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              {showPdfView ? 'Show Text' : 'Show PDF'}
            </button>
          </div>
        </div>

        {/* PDF Controls */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-600 min-w-[80px] text-center">
              {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Use Ctrl+Scroll to zoom, Ctrl+Click to pan</span>
          </div>
        </div>

        {/* Highlighted Text Display */}
        {highlightedText && (
          <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <span className="text-yellow-800 font-medium">Highlighted: </span>
            <span className="text-yellow-700">{highlightedText}</span>
          </div>
        )}


        {isLoading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading PDF...</p>
          </div>
        ) : showPdfView ? (
          <div 
            ref={pdfContainerRef}
            className="relative border border-gray-200 shadow-sm bg-white overflow-hidden max-h-[70vh]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          >
            {/* PDF Controls Overlay */}
            <div className="absolute top-2 right-2 z-10 flex gap-1">
              <button
                onClick={() => handleZoom(Math.max(0.5, zoom - 0.25))}
                className="p-1 bg-white bg-opacity-90 rounded shadow-sm hover:bg-opacity-100 transition-all"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="px-2 py-1 bg-white bg-opacity-90 rounded shadow-sm text-xs font-medium">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => handleZoom(Math.min(3, zoom + 0.25))}
                className="p-1 bg-white bg-opacity-90 rounded shadow-sm hover:bg-opacity-100 transition-all"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setZoom(1)
                  setPanOffset({ x: 0, y: 0 })
                }}
                className="p-1 bg-white bg-opacity-90 rounded shadow-sm hover:bg-opacity-100 transition-all"
                title="Reset View"
              >
                <Move className="h-4 w-4" />
              </button>
            </div>
            
            {/* Pan indicator */}
            {isPanning && (
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                Panning...
              </div>
            )}
            
            {/* Canvas container with pan offset */}
            <div 
              className="flex justify-center items-center min-h-[400px]"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                transition: isPanning ? 'none' : 'transform 0.1s ease-out'
              }}
            >
              <canvas
                ref={canvasRef}
                className="border border-gray-300 shadow-sm"
                onMouseUp={handleTextSelection}
              />
            </div>
          </div>
        ) : (
          <div className="border border-gray-200 shadow-sm bg-white p-6 min-h-[600px]">
            <div className="mb-4 text-sm text-gray-600">
              {pdfDocument ? `Page ${currentPage} of ${totalPages}` : 'PDF View'} • {keywords.length} keywords detected
            </div>
            <div
              className="prose prose-sm max-w-none text-gray-800 leading-relaxed font-serif"
              onMouseUp={handleTextSelection}
              onMouseOver={handleKeywordHover}
              onMouseLeave={handleMouseLeave}
              dangerouslySetInnerHTML={{
                __html: highlightKeywords((extractedText.split('\n\n')[currentPage - 1] || extractedText).replace(/\n/g, '<br>'))
              }}
            />
          </div>
        )}
      </div>

            {/* Text Viewer Section */}
            <div ref={textViewRef} className="lg:w-1/2 bg-white p-6 rounded-lg shadow-md overflow-y-auto max-h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Text View</h3>
          <div className="flex items-center gap-2">
            {selectedTextFromPdf && (
              <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                📍 Selected from PDF
              </div>
            )}
            <button
              onClick={() => setShowTextView(!showTextView)}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title={showTextView ? 'Hide Text View' : 'Show Text View'}
            >
              {showTextView ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {showTextView ? (
          <div>
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search in document..."
                className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            <div className="mb-4 text-sm text-gray-600">
              {searchTerm && (
                <span>
                  • Filtered by: "{searchTerm}"
                </span>
              )}
            </div>

            <div
              className="prose prose-sm max-w-none text-gray-800 leading-relaxed font-serif"
              onMouseUp={handleTextSelection}
              onMouseOver={handleKeywordHover}
              onMouseLeave={handleMouseLeave}
              dangerouslySetInnerHTML={{
                __html: highlightKeywords(filteredText.replace(/\n/g, '<br>'))
              }}
            />
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <EyeOff className="mx-auto h-12 w-12 mb-4" />
            <p>Text view is hidden</p>
          </div>
        )}
      </div>

      {showTooltip && (
        <KeywordTooltip
          position={tooltipPosition}
          keyword={hoveredKeyword}
          selectedText={selectedText || undefined}
          onClose={() => setShowTooltip(false)}
        />
      )}
    </div>
  )
}