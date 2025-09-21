'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, BookOpen } from 'lucide-react'

interface PDFTronViewerProps {
  file: File | null
  onTextSelection?: (text: string) => void
}

export default function PDFTronViewer({ file, onTextSelection }: PDFTronViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const [instance, setInstance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    if (!viewerRef.current) return

    const initializeWebViewer = async () => {
      try {
        setIsLoading(true)
        
        // Import PDFTron WebViewer dynamically
        const WebViewer = (await import('@pdftron/webviewer')).default
        
        // Initialize WebViewer
        const webViewerInstance = await WebViewer(
          {
            path: '/webviewer',
            initialDoc: '', // We'll load the file after initialization
          },
          viewerRef.current
        )

        setInstance(webViewerInstance)

        // Set up event listeners
        webViewerInstance.UI.addEventListener('documentLoaded', () => {
          const { documentViewer } = webViewerInstance.Core
          const doc = documentViewer.getDocument()
          setTotalPages(doc.getPageCount())
          setCurrentPage(1)
        })

        webViewerInstance.UI.addEventListener('pageNumberUpdated', (pageNumber: number) => {
          setCurrentPage(pageNumber)
        })

        // Set up text selection handler
        webViewerInstance.UI.addEventListener('textSelected', (quads: any) => {
          if (onTextSelection && quads && quads.length > 0) {
            // Get the selected text
            const selection = webViewerInstance.UI.getSelectedText()
            if (selection) {
              onTextSelection(selection)
            }
          }
        })

        setIsLoading(false)
      } catch (error) {
        console.error('Error initializing PDFTron WebViewer:', error)
        setIsLoading(false)
      }
    }

    initializeWebViewer()
  }, [onTextSelection])

  useEffect(() => {
    if (file && instance) {
      const loadFile = async () => {
        try {
          setIsLoading(true)
          const arrayBuffer = await file.arrayBuffer()
          await instance.UI.loadDocument(arrayBuffer, { filename: file.name })
          setIsLoading(false)
        } catch (error) {
          console.error('Error loading PDF file:', error)
          setIsLoading(false)
        }
      }
      loadFile()
    }
  }, [file, instance])

  const goToPage = (page: number) => {
    if (instance && page >= 1 && page <= totalPages) {
      instance.UI.setCurrentPage(page)
    }
  }

  const handleZoom = (newZoom: number) => {
    if (instance) {
      const clampedZoom = Math.max(0.5, Math.min(3, newZoom))
      instance.UI.setZoomLevel(clampedZoom)
      setZoom(clampedZoom)
    }
  }

  return (
    <div className="w-full">
      {/* PDFTron Controls */}
      {instance && totalPages > 0 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleZoom(zoom - 0.25)}
              className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <button
              onClick={() => handleZoom(zoom + 0.25)}
              className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* PDFTron Viewer Container */}
      <div className="border border-gray-200 shadow-sm bg-white min-h-[600px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-[600px] text-gray-500">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
              <p>Loading PDF...</p>
            </div>
          </div>
        ) : (
          <div 
            ref={viewerRef}
            className="w-full h-[600px]"
            style={{ minHeight: '600px' }}
          />
        )}
      </div>
    </div>
  )
}
