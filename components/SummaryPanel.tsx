'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Clock, Users, Target, Lightbulb, BookOpen, Download, RefreshCw, AlertCircle, CheckCircle, Brain } from 'lucide-react'
import SentimentAnalysis from './SentimentAnalysis'

interface SummaryData {
  mainTopic: string
  keyFindings: string[]
  methodology: string
  importantConcepts: string[]
  targetAudience: string
  practicalApplications: string[]
  documentType: string
  summary: string
  readingTime: string
  complexity: string
}

interface SummaryPanelProps {
  extractedText: string
  keywords: Array<{word: string, definition: string, context: string}>
  fileName: string
}

export default function SummaryPanel({ extractedText, keywords, fileName }: SummaryPanelProps) {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [source, setSource] = useState<string>('')
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'sentiment'>('summary')

  const generateSummary = async (forceRegenerate = false) => {
    setIsGenerating(true)
    setError('')
    
    try {
      console.log('Generating summary with data:', {
        textLength: extractedText.length,
        fileName,
        keywordsCount: keywords.length,
        forceRegenerate
      })

      // Use the EXACT same code as the working test button
      const maxTextLength = 8000
      const textToSend = extractedText.length > maxTextLength 
        ? extractedText.substring(0, maxTextLength) + '...'
        : extractedText
      
      const response = await fetch('/api/generate-document-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: textToSend,
          title: fileName,
          keywords: keywords,
          forceRegenerate
        }),
      })
      
      const result = await response.json()
      console.log('Summary result:', result)
      
      // Use the EXACT same success logic as the test button
      setSummaryData(result.data)
      setSource(result.source || 'Unknown')
      setError('') // Clear any previous errors
      
    } catch (err: any) {
      console.error('Error generating summary:', err)
      setError('Error generating summary. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const exportSummary = (format: 'text' | 'markdown') => {
    if (!summaryData) return

    let content = ''
    const timestamp = new Date().toLocaleString()

    if (format === 'markdown') {
      content = `# Document Summary: ${fileName}

*Generated on ${timestamp}*

## Main Topic
${summaryData.mainTopic}

## Executive Summary
${summaryData.summary}

## Key Findings
${summaryData.keyFindings.map(finding => `- ${finding}`).join('\n')}

## Methodology
${summaryData.methodology}

## Important Concepts
${summaryData.importantConcepts.map(concept => `- ${concept}`).join('\n')}

## Target Audience
${summaryData.targetAudience}

## Practical Applications
${summaryData.practicalApplications.map(app => `- ${app}`).join('\n')}

## Document Information
- **Type**: ${summaryData.documentType}
- **Reading Time**: ${summaryData.readingTime}
- **Complexity**: ${summaryData.complexity}
- **Keywords Detected**: ${keywords.length}
- **Source**: ${source}
`
    } else {
      content = `DOCUMENT SUMMARY: ${fileName}
Generated on: ${timestamp}

MAIN TOPIC: ${summaryData.mainTopic}

EXECUTIVE SUMMARY:
${summaryData.summary}

KEY FINDINGS:
${summaryData.keyFindings.map(finding => `• ${finding}`).join('\n')}

METHODOLOGY: ${summaryData.methodology}

IMPORTANT CONCEPTS:
${summaryData.importantConcepts.map(concept => `• ${concept}`).join('\n')}

TARGET AUDIENCE: ${summaryData.targetAudience}

PRACTICAL APPLICATIONS:
${summaryData.practicalApplications.map(app => `• ${app}`).join('\n')}

DOCUMENT INFORMATION:
- Type: ${summaryData.documentType}
- Reading Time: ${summaryData.readingTime}
- Complexity: ${summaryData.complexity}
- Keywords Detected: ${keywords.length}
- Source: ${source}
`
    }

    const blob = new Blob([content], { type: format === 'markdown' ? 'text/markdown' : 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName.replace('.pdf', '')}_summary.${format === 'markdown' ? 'md' : 'txt'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-primary-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Document Analysis</h2>
            {source && (
              <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {source}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Sub-tab Navigation */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveSubTab('summary')}
                className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeSubTab === 'summary'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="h-4 w-4 mr-1" />
                Summary
              </button>
              <button
                onClick={() => setActiveSubTab('sentiment')}
                className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeSubTab === 'sentiment'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Brain className="h-4 w-4 mr-1" />
                Sentiment
              </button>
            </div>
            
            {summaryData && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => exportSummary('text')}
                  className="flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  title="Export as text"
                >
                  <Download className="h-3 w-3 mr-1" />
                  TXT
                </button>
                <button
                  onClick={() => exportSummary('markdown')}
                  className="flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  title="Export as markdown"
                >
                  <Download className="h-3 w-3 mr-1" />
                  MD
                </button>
              </div>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {!summaryData ? (
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              Generate an intelligent summary of your document
            </p>
            <div className="space-y-2">
              <button
                onClick={async () => {
                  setIsGenerating(true)
                  setError('')
                  
                  try {
                    console.log('Generating summary with data:', {
                      textLength: extractedText.length,
                      fileName,
                      keywordsCount: keywords.length
                    })

                    const maxTextLength = 8000
                    const textToSend = extractedText.length > maxTextLength 
                      ? extractedText.substring(0, maxTextLength) + '...'
                      : extractedText
                    
                    const response = await fetch('/api/generate-document-summary', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        text: textToSend,
                        title: fileName,
                        keywords: keywords,
                        forceRegenerate: false
                      }),
                    })
                    
                    const result = await response.json()
                    console.log('Summary result:', result)
                    
                    setSummaryData(result.data)
                    setSource(result.source || 'Unknown')
                    setError('')
                    
                  } catch (err: any) {
                    console.error('Error generating summary:', err)
                    setError('Error generating summary. Please try again.')
                  } finally {
                    setIsGenerating(false)
                  }
                }}
                disabled={isGenerating}
                className="flex items-center mx-auto px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Generate Summary
                  </>
                )}
              </button>
              
              {/* Debug Info */}
              <div className="text-xs text-gray-500 text-center">
                <p>Text length: {extractedText.length} characters</p>
                {extractedText.length > 8000 && (
                  <p className="text-orange-600">⚠️ Text will be truncated to 8000 chars</p>
                )}
                <p>Keywords: {keywords.length}</p>
                <p>File: {fileName}</p>
              </div>
              
              {/* Test Buttons */}
              <div className="space-y-1">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/generate-document-summary', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          text: 'Test document about AI and machine learning.',
                          title: 'test.pdf',
                          keywords: []
                        }),
                      })
                      const result = await response.json()
                      console.log('Test API result:', result)
                      alert(`Test successful! Source: ${result.source}`)
                    } catch (err) {
                      console.error('Test failed:', err)
                      alert('Test failed: ' + err)
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline block"
                >
                  Test API Connection
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      const maxTextLength = 8000
                      const textToSend = extractedText.length > maxTextLength 
                        ? extractedText.substring(0, maxTextLength) + '...'
                        : extractedText
                      
                      const response = await fetch('/api/generate-document-summary', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          text: textToSend,
                          title: fileName,
                          keywords: keywords,
                          forceRegenerate: false
                        }),
                      })
                      const result = await response.json()
                      console.log('Real data test result:', result)
                      alert(`Real data test successful! Source: ${result.source}`)
                    } catch (err) {
                      console.error('Real data test failed:', err)
                      alert('Real data test failed: ' + err)
                    }
                  }}
                  className="text-xs text-green-600 hover:text-green-800 underline block"
                >
                  Test with Real Data
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {activeSubTab === 'summary' ? (
              <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500 mr-2" />
                <div>
                  <p className="text-sm text-blue-600">Reading Time</p>
                  <p className="font-medium text-blue-900">{summaryData.readingTime}</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-green-50 rounded-lg">
                <Users className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="text-sm text-green-600">Complexity</p>
                  <p className="font-medium text-green-900 capitalize">{summaryData.complexity}</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                <Target className="h-5 w-5 text-purple-500 mr-2" />
                <div>
                  <p className="text-sm text-purple-600">Document Type</p>
                  <p className="font-medium text-purple-900">{summaryData.documentType}</p>
                </div>
              </div>
            </div>

            {/* Main Topic */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Main Topic</h3>
              <p className="text-gray-700">{summaryData.mainTopic}</p>
            </div>

            {/* Executive Summary */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Executive Summary</h3>
              <p className="text-gray-700 leading-relaxed">{summaryData.summary}</p>
            </div>

            {/* Key Findings */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Key Findings</h3>
              <ul className="space-y-1">
                {summaryData.keyFindings.map((finding, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Important Concepts */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Important Concepts</h3>
              <div className="flex flex-wrap gap-2">
                {summaryData.importantConcepts.map((concept, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Methodology</h3>
                  <p className="text-gray-700">{summaryData.methodology}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Target Audience</h3>
                  <p className="text-gray-700">{summaryData.targetAudience}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Practical Applications</h3>
                  <ul className="space-y-1">
                    {summaryData.practicalApplications.map((app, index) => (
                      <li key={index} className="flex items-start">
                        <Lightbulb className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{app}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Regenerate Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => generateSummary(true)}
                disabled={isGenerating}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Regenerating...' : 'Regenerate Summary'}
              </button>
              {source === 'Cache' && (
                <p className="text-xs text-gray-500 mt-1">
                  Summary loaded from cache. Click regenerate for a fresh analysis.
                </p>
              )}
            </div>
              </>
            ) : (
              <SentimentAnalysis 
                extractedText={extractedText}
                fileName={fileName}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
