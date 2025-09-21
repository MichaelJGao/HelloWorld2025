'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2, ExternalLink, BookOpen } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface KeywordTooltipProps {
  position: { x: number; y: number }
  keyword?: { word: string; definition: string; context: string } | null
  selectedText?: string
  onClose: () => void
}

export default function KeywordTooltip({ position, keyword, selectedText, onClose }: KeywordTooltipProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState<string>('')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imageAlt, setImageAlt] = useState<string>('')
  const [source, setSource] = useState<string>('')
  const [wikipediaUrl, setWikipediaUrl] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [imageMessage, setImageMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isFallback, setIsFallback] = useState<boolean>(false)

  useEffect(() => {
    if (keyword || selectedText) {
      generateSummary()
    }
  }, [keyword, selectedText])

  const generateSummary = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const term = keyword?.word || selectedText || ''
      
      // First try to get definition from document context
      let definition = keyword?.definition || ''
      
      // If no definition from context, search online
      if (!definition) {
        const response = await fetch('/api/generate-summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            term,
            context: keyword?.context || '',
            searchOnline: true
          }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to generate summary')
        }
        
        const data = await response.json()
        definition = data.summary
        setImageUrl(data.imageUrl || '')
        setImageAlt(data.imageAlt || '')
        setSource(data.source || '')
        setWikipediaUrl(data.wikipediaUrl || '')
        setDescription(data.description || '')
        setImageMessage(data.message || '')
        
        // Show fallback indicator if using fallback summary
        if (data.fallback) {
          console.log('Using fallback summary for:', term)
          setIsFallback(true)
        }
      } else {
        // Even if we have a definition from context, still try to get an image
        try {
          const imageResponse = await fetch('/api/search-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              term, 
              context: keyword?.context || '' 
            }),
          })
          
          if (imageResponse.ok) {
            const imageData = await imageResponse.json()
            setImageUrl(imageData.imageUrl || '')
            setImageAlt(imageData.imageAlt || '')
            setSource(imageData.source || '')
            setWikipediaUrl(imageData.wikipediaUrl || '')
            setDescription(imageData.description || '')
            setImageMessage(imageData.message || '')
          }
        } catch (imageError) {
          console.error('Error fetching image for context definition:', imageError)
          // Continue without image
        }
      }
      
      setSummary(definition)
    } catch (err) {
      setError('Failed to generate summary. Please try again.')
      console.error('Error generating summary:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExternalSearch = () => {
    const searchTerm = keyword?.word || selectedText || ''
    const searchUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(searchTerm)}`
    window.open(searchUrl, '_blank')
  }

  if (!keyword && !selectedText) return null

  // Calculate tooltip dimensions for positioning
  const tooltipWidth = 420 // max-w-md is approximately 28rem = 448px, using 420 for safety
  const tooltipHeight = 300 // Estimated height for positioning calculations
  
  // Calculate optimal position
  const leftPosition = Math.min(
    Math.max(position.x - tooltipWidth / 2, 10), // Center horizontally, but keep 10px margin
    window.innerWidth - tooltipWidth - 10 // Don't exceed right edge
  )
  
  const topPosition = position.y - tooltipHeight - 10 // Position above the selection by default
  
  // If tooltip would be cut off at the top, position it below instead
  const finalTopPosition = topPosition < 10 
    ? position.y + 20 // Position below the selection
    : topPosition

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 max-w-md"
      style={{
        left: leftPosition,
        top: finalTopPosition,
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">
              {keyword?.word || selectedText}
            </h3>
            {keyword?.context && (
              <p className="text-xs text-gray-500 mt-1">
                Found in document context
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleExternalSearch}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Search on Wikipedia"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-primary-500 animate-spin mr-2" />
            <span className="text-gray-600">Generating summary...</span>
          </div>
        ) : error ? (
          <div className="text-red-600 text-sm py-4">
            {error}
          </div>
        ) : (
          <div className="space-y-3">
            {imageUrl && (
              <div className="w-full bg-gray-100 rounded-md overflow-hidden">
                <img
                  src={imageUrl}
                  alt={imageAlt || keyword?.word || selectedText}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                {source && (
                  <div className="p-2 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>
                        {source === 'Wikipedia' ? '📖 Wikipedia' : 
                         source === 'No image found on Wikipedia' ? '📷 No image found on Wikipedia' : 
                         `📷 ${source}`}
                      </span>
                      {wikipediaUrl && (
                        <a
                          href={wikipediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Article
                        </a>
                      )}
                    </div>
                    {description && (
                      <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                        {description.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="text-gray-700 leading-relaxed">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                  em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
                  code: ({ children }) => (
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ),
                }}
              >
                {summary}
              </ReactMarkdown>
            </div>

            {keyword?.context && (
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-start">
                  <BookOpen className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Document Context:</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {keyword.context}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {isFallback && (
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center text-xs text-amber-600">
                  <div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
                  <span>Using offline definition</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
