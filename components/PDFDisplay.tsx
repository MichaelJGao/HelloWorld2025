'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Eye, EyeOff, Download, Search, BookOpen, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Move, Edit3, Save, X, Highlighter, Type, Square, PenTool, MessageSquare, Pin } from 'lucide-react'
import KeywordTooltip from './KeywordTooltip'
import * as pdfjsLib from 'pdfjs-dist'

interface PDFDisplayProps {
  file: File | null
  extractedText: string
  keywords: Array<{ word: string; definition: string; context: string }>
  isAnnotating?: boolean
  setIsAnnotating?: (value: boolean) => void
}

export default function PDFDisplay({ file, extractedText, keywords, isAnnotating = false, setIsAnnotating }: PDFDisplayProps) {
  const [showTextView, setShowTextView] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredText, setFilteredText] = useState(extractedText)
  const [hoveredKeyword, setHoveredKeyword] = useState<{ word: string; definition: string; context: string } | null>(null)
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [showPdfView, setShowPdfView] = useState(true)
  const [selectedTextFromPdf, setSelectedTextFromPdf] = useState<string | null>(null)
  const [highlightedText, setHighlightedText] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [pdfDocument, setPdfDocument] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [zoom, setZoom] = useState(1.0)
  const [isPanning, setIsPanning] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  
  // Annotation states
  const [annotationMode, setAnnotationMode] = useState<'none' | 'highlight' | 'underline' | 'strikeout' | 'rectangle' | 'drawing' | 'comment' | 'pin' | 'text'>('none')
  const [annotations, setAnnotations] = useState<any[]>([])
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingPath, setDrawingPath] = useState<{ x: number; y: number }[]>([])
  const [showCommentBox, setShowCommentBox] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentPosition, setCommentPosition] = useState<{ x: number; y: number } | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textViewRef = useRef<HTMLDivElement>(null)

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

  // Load PDF document when file changes
  useEffect(() => {
    if (file) {
      loadPdfDocument(file)
    }
  }, [file])

  const loadPdfDocument = async (pdfFile: File) => {
    setIsLoading(true)
    try {
      // Configure PDF.js worker only in browser environment
      if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`
      }

      console.log('Loading PDF:', pdfFile.name, 'Size:', pdfFile.size)
      const arrayBuffer = await pdfFile.arrayBuffer()
      
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        useSystemFonts: true,
        disableFontFace: true
      }).promise
      
      console.log('PDF loaded successfully, pages:', pdf.numPages)
      setPdfDocument(pdf)
      setTotalPages(pdf.numPages)
      setCurrentPage(1)
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading PDF:', error)
      setIsLoading(false)
    }
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
    const clampedZoom = Math.max(0.5, Math.min(3, newZoom))
    setZoom(clampedZoom)
    setPanOffset({ x: 0, y: 0 })
  }

  // Panning functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnnotating) {
      if (annotationMode === 'drawing') {
        setIsDrawing(true)
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
          setDrawingPath([{ x: e.clientX - rect.left, y: e.clientY - rect.top }])
        }
      } else if (annotationMode === 'pin' || annotationMode === 'comment') {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
          setCommentPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
          setShowCommentBox(true)
        }
      }
    } else {
      if (e.button === 1 || e.button === 0) {
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
      e.preventDefault()
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isAnnotating && isDrawing && annotationMode === 'drawing') {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        setDrawingPath(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top }])
      }
    } else if (isPanning) {
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
    if (isAnnotating && isDrawing && annotationMode === 'drawing') {
      setIsDrawing(false)
      if (drawingPath.length > 1) {
        addDrawingAnnotation(drawingPath)
      }
      setDrawingPath([])
    }
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
      setSelectedText(text)
      
      if (isAnnotating && annotationMode !== 'none') {
        // Get selection rectangle for annotations
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        const canvasRect = canvasRef.current?.getBoundingClientRect()
        
        if (canvasRect) {
          setSelectionRect({
            x: rect.left - canvasRect.left,
            y: rect.top - canvasRect.top,
            width: rect.width,
            height: rect.height
          })
        }
      } else {
      // Find and highlight this text in the Text View
      findAndHighlightTextInTextView(text)
      
      // Also show tooltip for the selected text
      const enhancedContext = getEnhancedContext(text, extractedText, 150)
      setHoveredKeyword(null)
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.top + window.scrollY - 10,
      })
      setShowTooltip(true)
      }
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
      // setHighlightedTextId(highlightId) // Removed - no longer needed
      
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

  // Annotation functions
  const addAnnotation = (type: string) => {
    if (selectedText && selectionRect) {
      const annotation = {
        id: Date.now().toString(),
        type: type,
        text: selectedText,
        x: selectionRect.x,
        y: selectionRect.y,
        width: selectionRect.width,
        height: selectionRect.height,
        pageNumber: currentPage,
        color: getAnnotationColor(type)
      }
      
      setAnnotations(prev => [...prev, annotation])
      setSelectedText('')
      setSelectionRect(null)
      
      // Clear selection
      window.getSelection()?.removeAllRanges()
    }
  }

  const addDrawingAnnotation = (path: { x: number; y: number }[]) => {
    if (path.length > 1) {
      const minX = Math.min(...path.map(p => p.x))
      const maxX = Math.max(...path.map(p => p.x))
      const minY = Math.min(...path.map(p => p.y))
      const maxY = Math.max(...path.map(p => p.y))
      
      const annotation = {
        id: Date.now().toString(),
        type: 'drawing',
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        pageNumber: currentPage,
        color: '#ff0000',
        comment: JSON.stringify(path)
      }
      
      setAnnotations(prev => [...prev, annotation])
    }
  }

  const addCommentAnnotation = () => {
    if (commentPosition && commentText.trim()) {
      const annotation = {
        id: Date.now().toString(),
        type: 'comment',
        x: commentPosition.x,
        y: commentPosition.y,
        width: 20,
        height: 20,
        pageNumber: currentPage,
        color: '#007bff',
        comment: commentText
      }
      
      setAnnotations(prev => [...prev, annotation])
      setShowCommentBox(false)
      setCommentText('')
      setCommentPosition(null)
    }
  }

  const getAnnotationColor = (type: string): string => {
    switch (type) {
      case 'highlight': return '#ffff00'
      case 'underline': return '#00ff00'
      case 'strikeout': return '#ff0000'
      case 'rectangle': return '#0000ff'
      case 'drawing': return '#ff00ff'
      case 'comment': return '#007bff'
      case 'pin': return '#ff6600'
      case 'text': return '#333333'
      default: return '#ffff00'
    }
  }

  const deleteAnnotation = (annotationId: string) => {
    setAnnotations(prev => prev.filter(h => h.id !== annotationId))
  }

  const saveAnnotations = () => {
    // Here you would typically save the annotations to a file or server
    console.log('Saving annotations:', annotations)
    // For now, we'll just show an alert
    alert(`Saved ${annotations.length} annotations!`)
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
      <div className="lg:w-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-y-auto max-h-[80vh] card-hover">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Document View</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Annotation button moved to Text View section */}
          </div>
        </div>


        {/* Highlighted Text Display */}
        {highlightedText && (
          <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <span className="text-yellow-800 font-medium">Highlighted: </span>
            <span className="text-yellow-700">{highlightedText}</span>
          </div>
        )}


        {showPdfView ? (
          <div className={`border border-gray-200 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800 ${isAnnotating ? 'fixed inset-0 z-50 min-h-screen' : 'min-h-[600px]'}`}>
            {isLoading ? (
              <div className="flex items-center justify-center h-[600px] text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500 animate-pulse" />
                  <p>Loading PDF...</p>
                </div>
              </div>
            ) : pdfDocument ? (
              <div className={`w-full ${isAnnotating ? 'h-screen' : 'h-[600px]'} relative overflow-auto bg-gray-100 dark:bg-gray-900`}>
                {/* Annotation Toolbar */}
                {isAnnotating && (
                  <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 p-4">
                    <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400 mr-4">Annotation Tools:</span>
            <button
                          onClick={() => setAnnotationMode('none')}
                          className={`p-2 rounded-lg border ${annotationMode === 'none' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                          title="Select Tool"
                        >
                          <Move className="h-4 w-4" />
            </button>
            <button
                          onClick={() => setAnnotationMode('highlight')}
                          className={`p-2 rounded-lg border ${annotationMode === 'highlight' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                          title="Highlight"
                        >
                          <Highlighter className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setAnnotationMode('underline')}
                          className={`p-2 rounded-lg border ${annotationMode === 'underline' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                          title="Underline"
                        >
                          <Type className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setAnnotationMode('strikeout')}
                          className={`p-2 rounded-lg border ${annotationMode === 'strikeout' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                          title="Strikeout"
                        >
                          <Type className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setAnnotationMode('rectangle')}
                          className={`p-2 rounded-lg border ${annotationMode === 'rectangle' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                          title="Rectangle"
                        >
                          <Square className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setAnnotationMode('drawing')}
                          className={`p-2 rounded-lg border ${annotationMode === 'drawing' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                          title="Draw"
                        >
                          <PenTool className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setAnnotationMode('comment')}
                          className={`p-2 rounded-lg border ${annotationMode === 'comment' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                          title="Comment"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setAnnotationMode('pin')}
                          className={`p-2 rounded-lg border ${annotationMode === 'pin' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                          title="Pin"
                        >
                          <Pin className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
                        <button
                          onClick={saveAnnotations}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                        >
                          <Save className="h-4 w-4" />
                          Save Changes
                        </button>
                        <button
                          onClick={() => setIsAnnotating?.(false)}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Exit
                        </button>
        </div>
        </div>
          </div>
        )}

        {/* PDF Controls */}
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-4">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
                      className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
                    
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
            </span>
                    
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
                      className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
              <button
                      onClick={() => handleZoom(zoom - 0.25)}
                      className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
                    
                    <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
                    
              <button
                      onClick={() => handleZoom(zoom + 0.25)}
                      className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
                    
              <button
                onClick={() => {
                  setZoom(1)
                  setPanOffset({ x: 0, y: 0 })
                }}
                      className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                title="Reset View"
              >
                <Move className="h-4 w-4" />
              </button>
            </div>
              </div>

                <div 
                  className="relative w-full h-[500px] overflow-auto bg-gray-100 dark:bg-gray-900"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={(e) => {
                    handleMouseUp()
                    handlePdfTextSelection()
                  }}
                  onWheel={handleWheel}
                  style={{ cursor: isPanning ? 'grabbing' : (isAnnotating && annotationMode === 'drawing' ? 'crosshair' : 'grab') }}
                >
            {/* Canvas container with pan offset */}
            <div 
                    className="flex justify-center items-center min-h-[500px]"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                transition: isPanning ? 'none' : 'transform 0.1s ease-out'
              }}
            >
                    <div className="relative">
              <canvas
                ref={canvasRef}
                        className="border border-gray-300 dark:border-gray-600 shadow-sm"
                      />
                      
                      {/* Annotations */}
                      {annotations
                        .filter(annotation => annotation.pageNumber === currentPage)
                        .map(annotation => (
                          <div key={annotation.id}>
                            {annotation.type === 'highlight' && (
                              <div
                                className="absolute bg-yellow-200 bg-opacity-50 border border-yellow-400 cursor-pointer group"
                                style={{
                                  left: annotation.x + 'px',
                                  top: annotation.y + 'px',
                                  width: annotation.width + 'px',
                                  height: annotation.height + 'px',
                                }}
                                onClick={() => deleteAnnotation(annotation.id)}
                                title={`${annotation.text} (Click to delete)`}
                              >
                                <div className="absolute -top-6 left-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  {annotation.text?.substring(0, 30)}...
                                </div>
                              </div>
                            )}
                            
                            {annotation.type === 'underline' && (
                              <div
                                className="absolute border-b-2 border-green-500 cursor-pointer"
                                style={{
                                  left: annotation.x + 'px',
                                  top: annotation.y + annotation.height - 2 + 'px',
                                  width: annotation.width + 'px',
                                  height: '2px',
                                }}
                                onClick={() => deleteAnnotation(annotation.id)}
                                title="Underline (Click to delete)"
                              />
                            )}
                            
                            {annotation.type === 'strikeout' && (
                              <div
                                className="absolute border-t-2 border-red-500 cursor-pointer"
                                style={{
                                  left: annotation.x + 'px',
                                  top: annotation.y + annotation.height / 2 + 'px',
                                  width: annotation.width + 'px',
                                  height: '2px',
                                }}
                                onClick={() => deleteAnnotation(annotation.id)}
                                title="Strikeout (Click to delete)"
                              />
                            )}
                            
                            {annotation.type === 'rectangle' && (
                              <div
                                className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-30 cursor-pointer"
                                style={{
                                  left: annotation.x + 'px',
                                  top: annotation.y + 'px',
                                  width: annotation.width + 'px',
                                  height: annotation.height + 'px',
                                }}
                                onClick={() => deleteAnnotation(annotation.id)}
                                title="Rectangle (Click to delete)"
                              />
                            )}
                            
                            {annotation.type === 'comment' && (
                              <div
                                className="absolute cursor-pointer group"
                                style={{
                                  left: annotation.x + 'px',
                                  top: annotation.y + 'px',
                                }}
                                onClick={() => deleteAnnotation(annotation.id)}
                              >
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                  💬
                                </div>
                                <div className="absolute top-6 left-0 bg-white border border-gray-300 rounded-lg shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity max-w-xs">
                                  <div className="text-xs text-gray-700">{annotation.comment}</div>
                                </div>
                              </div>
                            )}
                            
                            {annotation.type === 'pin' && (
                              <div
                                className="absolute cursor-pointer group"
                                style={{
                                  left: annotation.x + 'px',
                                  top: annotation.y + 'px',
                                }}
                                onClick={() => deleteAnnotation(annotation.id)}
                              >
                                <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">
                                  📌
                                </div>
                                <div className="absolute top-6 left-0 bg-white border border-gray-300 rounded-lg shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity max-w-xs">
                                  <div className="text-xs text-gray-700">{annotation.comment}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      
                      {/* Selection highlight */}
                      {selectedText && selectionRect && (
                        <div
                          className="absolute bg-blue-200 bg-opacity-50 border border-blue-400"
                          style={{
                            left: selectionRect.x + 'px',
                            top: selectionRect.y + 'px',
                            width: selectionRect.width + 'px',
                            height: selectionRect.height + 'px',
                          }}
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Selection controls */}
                  {selectedText && annotationMode !== 'none' && (
                    <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3">
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        Selected: "{selectedText.substring(0, 50)}..."
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addAnnotation(annotationMode)}
                          className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
                        >
                          Add {annotationMode.charAt(0).toUpperCase() + annotationMode.slice(1)}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedText('')
                            setSelectionRect(null)
                            window.getSelection()?.removeAllRanges()
                          }}
                          className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Comment box */}
                  {showCommentBox && (
                    <div className="absolute top-2 left-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3">
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">Add Comment:</div>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="w-64 h-20 p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="Enter your comment..."
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={addCommentAnnotation}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                        >
                          Add Comment
                        </button>
                        <button
                          onClick={() => {
                            setShowCommentBox(false)
                            setCommentText('')
                            setCommentPosition(null)
                          }}
                          className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Pan indicator */}
                  {isPanning && (
                    <div className="absolute bottom-2 left-2 bg-black dark:bg-gray-800 bg-opacity-75 text-white dark:text-gray-200 px-2 py-1 rounded text-xs">
                      Panning... (Click and drag)
                    </div>
                  )}
                  
                  {/* Drawing indicator */}
                  {isAnnotating && annotationMode === 'drawing' && (
                    <div className="absolute bottom-2 right-2 bg-black dark:bg-gray-800 bg-opacity-75 text-white dark:text-gray-200 px-2 py-1 rounded text-xs">
                      Drawing Mode - Click and drag to draw
                    </div>
                  )}
            </div>
          </div>
        ) : (
              <div className="flex items-center justify-center h-[600px] text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <p>No PDF loaded</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800 p-6 min-h-[600px]">
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Text View • {keywords.length} keywords detected
            </div>
            <div
              className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200 leading-relaxed font-serif"
              onMouseUp={handleTextSelection}
              onMouseOver={handleKeywordHover}
              onMouseLeave={handleMouseLeave}
              dangerouslySetInnerHTML={{
                __html: highlightKeywords(extractedText.replace(/\n/g, '<br>'))
              }}
            />
          </div>
        )}
      </div>

            {/* Enhanced Text Viewer Section */}
            <div ref={textViewRef} className="lg:w-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-y-auto max-h-[80vh] card-hover">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Text View</h3>
          </div>
          <div className="flex items-center gap-3">
            {selectedTextFromPdf && (
              <div className="px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded-full font-medium border border-yellow-200 dark:border-yellow-700/50">
                📍 Selected from PDF
              </div>
            )}
            {/* Annotation button moved to Summary Panel */}
            <button
              onClick={() => setShowTextView(!showTextView)}
              className="group p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md"
              title={showTextView ? 'Hide Text View' : 'Show Text View'}
            >
              {showTextView ? (
                <EyeOff className="h-5 w-5 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
              ) : (
                <Eye className="h-5 w-5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              )}
            </button>
          </div>
        </div>

        {showTextView ? (
          <div>
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Search in document..."
                className="w-full p-3 pl-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 shadow-sm hover:shadow-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>

              {searchTerm && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
                  <Search className="h-4 w-4 mr-2" />
                  <span className="font-medium">Filtered by: "{searchTerm}"</span>
            </div>
              </div>
            )}

            <div
              className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200 leading-relaxed font-serif bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
              onMouseUp={handleTextSelection}
              onMouseOver={handleKeywordHover}
              onMouseLeave={handleMouseLeave}
              dangerouslySetInnerHTML={{
                __html: highlightKeywords(filteredText.replace(/\n/g, '<br>'))
              }}
            />
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mb-6">
              <EyeOff className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Text view is hidden</h3>
            <p className="text-gray-500 dark:text-gray-400">Click the eye icon to show the text view</p>
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