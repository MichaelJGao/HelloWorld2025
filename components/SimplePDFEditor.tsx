'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Save, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'

interface SimplePDFEditorProps {
  file: File
  fileName: string
  isOpen: boolean
  onClose: () => void
}

export default function SimplePDFEditor({ file, fileName, isOpen, onClose }: SimplePDFEditorProps) {
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [pdfDocument, setPdfDocument] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Create object URL for the PDF file
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setPdfUrl(url)
      
      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [file])

  // Load PDF document
  useEffect(() => {
    if (pdfUrl && isOpen) {
      loadPdfDocument()
    }
  }, [pdfUrl, isOpen])

  // Render current page
  useEffect(() => {
    if (pdfDocument && canvasRef.current) {
      renderPage()
    }
  }, [pdfDocument, currentPage, zoom])

  const loadPdfDocument = async () => {
    if (!pdfUrl) return
    
    setIsLoading(true)
    try {
      // Configure PDF.js worker only in browser environment
      if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`
      }
      
      const pdf = await pdfjsLib.getDocument({ 
        url: pdfUrl,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        useSystemFonts: true,
        disableFontFace: true
      }).promise
      
      setPdfDocument(pdf)
      setTotalPages(pdf.numPages)
      setCurrentPage(1)
    } catch (error) {
      console.error('Error loading PDF:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderPage = async () => {
    if (!pdfDocument || !canvasRef.current) return

    try {
      const page = await pdfDocument.getPage(currentPage)
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (!context) return

      const viewport = page.getViewport({ scale: zoom })
      canvas.height = viewport.height
      canvas.width = viewport.width

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }

      await page.render(renderContext).promise
    } catch (error) {
      console.error('Error rendering page:', error)
    }
  }

  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum)
    }
  }

  const handleZoom = (newZoom: number) => {
    const clampedZoom = Math.max(0.5, Math.min(3, newZoom))
    setZoom(clampedZoom)
  }

  // Handle save/download
  const handleSave = async () => {
    try {
      // Download the original file
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fileName.replace('.pdf', '')}_copy.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error saving PDF:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-[95vw] h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {fileName}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Download PDF
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Controls */}
        {pdfDocument && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-4">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleZoom(zoom - 0.25)}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              
              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              
              <button
                onClick={() => handleZoom(zoom + 0.25)}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* PDF Viewer Container */}
        <div className="flex-1 relative overflow-auto bg-gray-100 dark:bg-gray-900">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading PDF...</p>
              </div>
            </div>
          ) : pdfDocument ? (
            <div className="w-full h-full flex justify-center items-start p-4">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="border border-gray-300 dark:border-gray-600 shadow-lg bg-white"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 text-gray-400"></div>
                <p className="text-gray-600 dark:text-gray-400">No PDF loaded</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
            <strong>PDF Viewer:</strong> Navigate through your PDF using the controls above. Click "Download PDF" to save a copy.
          </div>
        </div>
      </div>
    </div>
  )
}
