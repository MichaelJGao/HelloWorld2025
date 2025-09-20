'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Eye, EyeOff, Download, Search, BookOpen, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
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
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
  useEffect(() => {
    if (pdfDocument && currentPage && zoom === 1.0) {
      renderPageAtZoom(currentPage, zoom).then(zoomedPage => {
        setCurrentZoomedPage(zoomedPage)
      })
    }
  }, [pdfDocument, currentPage])


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

  const renderPageAtZoom = async (pageNum: number, zoomLevel: number) => {
    if (!pdfDocument) return null
    
    try {
      const page = await pdfDocument.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1.5 * zoomLevel })
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      
      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise
      
      return canvas.toDataURL()
    } catch (error) {
      console.error(`Error rendering page ${pageNum} at zoom ${zoomLevel}:`, error)
      return null
    }
  }

  const goToPage = async (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum)
      // Re-render page at current zoom level
      if (pdfDocument) {
        const zoomedPage = await renderPageAtZoom(pageNum, zoom)
        setCurrentZoomedPage(zoomedPage)
      }
    }
  }

  const handleZoom = async (newZoom: number) => {
    setZoom(newZoom)
    // Re-render current page at new zoom level
    if (pdfDocument && currentPage) {
      const zoomedPage = await renderPageAtZoom(currentPage, newZoom)
      setCurrentZoomedPage(zoomedPage)
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
      // Get enhanced context around the selected text
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

  const getEnhancedContext = (word: string, text: string, contextLength: number = 200): string => {
    const index = text.toLowerCase().indexOf(word.toLowerCase())
    if (index === -1) return text.substring(0, contextLength)
    
    const start = Math.max(0, index - contextLength)
    const end = Math.min(text.length, index + word.length + contextLength)
    
    return text.substring(start, end).trim()
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
            <span className="text-sm text-gray-600">Zoom:</span>
            <button
              onClick={() => handleZoom(0.5)}
              className={`px-2 py-1 text-xs rounded ${zoom === 0.5 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              50%
            </button>
            <button
              onClick={() => handleZoom(1.0)}
              className={`px-2 py-1 text-xs rounded ${zoom === 1.0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              100%
            </button>
            <button
              onClick={() => handleZoom(1.5)}
              className={`px-2 py-1 text-xs rounded ${zoom === 1.5 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              150%
            </button>
            <button
              onClick={() => handleZoom(2.0)}
              className={`px-2 py-1 text-xs rounded ${zoom === 2.0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              200%
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading PDF...</p>
          </div>
        ) : showPdfView && (currentZoomedPage || pdfPages.length > 0) ? (
          <div className="border border-gray-200 shadow-sm bg-white overflow-auto max-h-[70vh]">
            <div className="relative">
              <img
                src={currentZoomedPage || pdfPages[currentPage - 1]}
                alt={`Page ${currentPage}`}
                className="w-full h-auto"
                style={{ display: 'block' }}
              />
              {/* Text overlay with keyword highlighting */}
              <div
                className="absolute inset-0 pointer-events-auto cursor-text"
                style={{ 
                  userSelect: 'text',
                  fontSize: `${12 * zoom}px`,
                  lineHeight: '1.3',
                  fontFamily: 'serif',
                  padding: `${16 * zoom}px`,
                  color: 'transparent'
                }}
                onMouseUp={handleTextSelection}
                onMouseOver={handleKeywordHover}
                onMouseLeave={handleMouseLeave}
              >
                <div
                  className="h-full overflow-hidden"
                  style={{
                    fontSize: `${12 * zoom}px`,
                    lineHeight: '1.3',
                    fontFamily: 'serif'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: highlightKeywords((extractedText.split('\n\n')[currentPage - 1] || extractedText).replace(/\n/g, '<br>'))
                  }}
                />
              </div>
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
      <div className="lg:w-1/2 bg-white p-6 rounded-lg shadow-md overflow-y-auto max-h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Text View</h3>
          <button
            onClick={() => setShowTextView(!showTextView)}
            className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title={showTextView ? 'Hide Text View' : 'Show Text View'}
          >
            {showTextView ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
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
          selectedText={selectedText}
          onClose={() => setShowTooltip(false)}
        />
      )}
    </div>
  )
}