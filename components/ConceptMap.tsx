'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Brain, RefreshCw, Download, Maximize2, Minimize2 } from 'lucide-react'

interface ConceptNode {
  id: string
  label: string
  type: 'main' | 'method' | 'keyword' | 'concept' | 'result'
  x: number
  y: number
  importance: number
  description: string
}

interface ConceptLink {
  source: string
  target: string
  label: string
  strength: number
}

interface ConceptMapData {
  nodes: ConceptNode[]
  links: ConceptLink[]
}

interface ConceptMapProps {
  extractedText: string
  keywords: Array<{word: string, definition: string, context: string}>
  fileName: string
}

export default function ConceptMap({ extractedText, keywords, fileName }: ConceptMapProps) {
  const [conceptMapData, setConceptMapData] = useState<ConceptMapData>({ nodes: [], links: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (nodeId: string, event: React.MouseEvent) => {
    setDraggedNode(nodeId)
    event.preventDefault()
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (draggedNode && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      setConceptMapData(prev => ({
        ...prev,
        nodes: prev.nodes.map(node => 
          node.id === draggedNode ? { ...node, x, y } : node
        )
      }))
    }
  }

  const handleMouseUp = () => {
    setDraggedNode(null)
  }

  const handleMouseEnter = (nodeId: string, event: React.MouseEvent) => {
    setHoveredNode(nodeId)
    setTooltipPosition({ x: event.clientX, y: event.clientY })
  }

  const handleMouseLeave = () => {
    setHoveredNode(null)
  }

  const exportAsJson = () => {
    const dataStr = JSON.stringify(conceptMapData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `concept-map-${fileName.replace('.pdf', '')}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const generateConceptMap = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/generate-concept-map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: extractedText,
          keywords: keywords.map(k => k.word),
          fileName: fileName
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate concept map')
      }

      const data = await response.json()
      
      if (data.success && data.nodes && data.links) {
        setConceptMapData({ nodes: data.nodes, links: data.links })
      } else {
        throw new Error(data.error || 'Failed to generate concept map')
      }
    } catch (err) {
      console.error('Error generating concept map:', err)
      setError('Failed to generate concept map. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'main': return '#3B82F6' // Blue
      case 'method': return '#10B981' // Green
      case 'keyword': return '#F59E0B' // Yellow
      case 'concept': return '#8B5CF6' // Purple
      case 'result': return '#EF4444' // Red
      default: return '#6B7280' // Gray
    }
  }

  const getNodeSize = (importance: number) => {
    // Base size from importance (20-60px radius)
    return Math.max(20, Math.min(60, importance * 40))
  }

  const getCompactText = (label: string, nodeSize: number) => {
    // Calculate how many characters can fit based on node size
    const maxChars = Math.floor((nodeSize * 2) / 8) // Approximate chars that fit
    if (label.length <= maxChars) return label
    return label.substring(0, Math.max(3, maxChars - 3)) + '...'
  }

  const renderConceptMap = () => {
    if (!conceptMapData.nodes.length) return null

    const width = isFullscreen ? (typeof window !== 'undefined' ? window.innerWidth - 100 : 1920) : 800
    const height = isFullscreen ? (typeof window !== 'undefined' ? window.innerHeight - 200 : 1080) : 600

    // Use the nodes from the API response (they're already positioned)
    const nodes = conceptMapData.nodes
    const links = conceptMapData.links

    return (
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
        style={{ maxWidth: '100%', height: 'auto' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Render connections first (behind nodes) */}
        {links.map((link, index) => {
          const sourceNode = nodes.find(n => n.id === link.source)
          const targetNode = nodes.find(n => n.id === link.target)
          if (!sourceNode || !targetNode) return null
          
          // Calculate midpoint for label positioning
          const midX = (sourceNode.x + targetNode.x) / 2
          const midY = (sourceNode.y + targetNode.y) / 2
          
          return (
            <g key={`link-${index}`}>
              <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke="#D1D5DB"
                strokeWidth={Math.max(1, link.strength * 3)}
                opacity="0.7"
                markerEnd="url(#arrowhead)"
              />
              {/* Connection label */}
              <text
                x={midX}
                y={midY - 5}
                textAnchor="middle"
                className="text-xs fill-gray-600 dark:fill-gray-300 font-medium"
                style={{ fontSize: '10px' }}
              >
                {link.label}
              </text>
            </g>
          )
        })}

        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#D1D5DB"
            />
          </marker>
        </defs>

        {/* Render nodes */}
        {nodes.map(node => {
          const nodeSize = getNodeSize(node.importance)
          const compactText = getCompactText(node.label, nodeSize)
          
          return (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeSize}
                fill={getNodeColor(node.type)}
                stroke="#FFFFFF"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onMouseDown={(e) => handleMouseDown(node.id, e)}
                onMouseEnter={(e) => handleMouseEnter(node.id, e)}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: draggedNode === node.id ? 'grabbing' : 'grab' }}
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-medium fill-white pointer-events-none"
                style={{ fontSize: '12px' }}
              >
                {compactText}
              </text>
              
              {/* Node type indicator */}
              <circle
                cx={node.x + nodeSize * 0.7}
                cy={node.y - nodeSize * 0.7}
                r="4"
                fill="#FFFFFF"
                stroke={getNodeColor(node.type)}
                strokeWidth="1"
                className="pointer-events-none"
              />
            </g>
          )
        })}

        {/* Legend */}
        <g transform={`translate(20, ${height - 120})`}>
          <rect
            x="0"
            y="0"
            width="200"
            height="100"
            fill="rgba(255, 255, 255, 0.9)"
            stroke="#D1D5DB"
            strokeWidth="1"
            rx="8"
          />
          <text x="10" y="20" className="text-sm font-semibold fill-gray-800">Legend</text>
          
          {[
            { type: 'main', label: 'Main Concepts', color: '#3B82F6' },
            { type: 'method', label: 'Methods', color: '#10B981' },
            { type: 'keyword', label: 'Keywords', color: '#F59E0B' },
            { type: 'concept', label: 'Concepts', color: '#8B5CF6' },
            { type: 'result', label: 'Results', color: '#EF4444' }
          ].map((item, index) => (
            <g key={item.type} transform={`translate(10, ${30 + index * 12})`}>
              <circle cx="6" cy="6" r="4" fill={item.color} />
              <text x="15" y="10" className="text-xs fill-gray-700">{item.label}</text>
            </g>
          ))}
        </g>
      </svg>
    )
  }

  const exportConceptMap = () => {
    if (!svgRef.current) return

    const svgData = new XMLSerializer().serializeToString(svgRef.current)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      
      const link = document.createElement('a')
      link.download = `${fileName.replace('.pdf', '')}_concept_map.png`
      link.href = canvas.toDataURL()
      link.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  useEffect(() => {
    if (extractedText && keywords.length > 0) {
      generateConceptMap()
    }
  }, [extractedText, keywords])

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4' : ''}`}>
      <div className={`${isFullscreen ? 'h-full' : 'h-[600px]'} flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Concept Map
            </h2>
            {conceptMapData.nodes.length > 0 && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                {conceptMapData.nodes.length} concepts
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={generateConceptMap}
              disabled={isLoading}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
            
            {conceptMapData.nodes.length > 0 && (
              <>
                <button
                  onClick={exportAsJson}
                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </button>
                <button
                  onClick={exportConceptMap}
                  className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export PNG
                </button>
              </>
            )}
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={containerRef} className="flex-1 flex items-center justify-center">
          {isLoading ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-purple-500 animate-pulse border-4 border-purple-500 border-t-transparent rounded-full"></div>
              <p className="text-gray-600 dark:text-gray-400">Analyzing document structure...</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Generating concept map</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-red-500"></div>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={generateConceptMap}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : conceptMapData.nodes.length === 0 ? (
            <div className="text-center">
              <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">No concept map generated yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Upload a PDF and extract keywords to generate a concept map
              </p>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {renderConceptMap()}
            </div>
          )}
        </div>

        {/* Info Panel */}
        {conceptMapData.nodes.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Concept Map Analysis:</strong> This visualization shows the relationships between key concepts, methods, and keywords found in your document. 
              Node size indicates importance, and connections show conceptual relationships. You can drag nodes to reposition them.
            </div>
          </div>
        )}

        {/* Tooltip */}
        {hoveredNode && (
          <div
            className="fixed z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg pointer-events-none"
            style={{
              left: tooltipPosition.x + 10,
              top: tooltipPosition.y - 10,
            }}
          >
            {conceptMapData.nodes.find(n => n.id === hoveredNode)?.label}
          </div>
        )}
      </div>
    </div>
  )
}
