'use client'

import React, { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3, 
  Brain, 
  Target,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'

interface SentimentData {
  overallSentiment: string
  sentimentScore: number
  emotionalTone: string
  confidence: number
  keyIndicators: string[]
  sectionBreakdown: Array<{
    section: string
    sentiment: string
    score: number
  }>
  audiencePerception: string
  summary: string
}

interface SentimentAnalysisProps {
  extractedText: string
  fileName: string
}

export default function SentimentAnalysis({ extractedText, fileName }: SentimentAnalysisProps) {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string>('')
  const [source, setSource] = useState<string>('')

  const analyzeSentiment = async (forceRegenerate = false) => {
    setIsAnalyzing(true)
    setError('')
    
    try {
      console.log('Analyzing sentiment with data:', {
        textLength: extractedText.length,
        fileName,
        forceRegenerate
      })

      const maxTextLength = 8000
      const textToSend = extractedText.length > maxTextLength 
        ? extractedText.substring(0, maxTextLength) + '...'
        : extractedText
      
      const response = await fetch('/api/analyze-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: textToSend,
          title: fileName,
          forceRegenerate
        }),
      })
      
      const result = await response.json()
      console.log('Sentiment result:', result)
      
      if (result.success && result.data) {
        setSentimentData(result.data)
        setSource(result.source || 'Unknown')
        setError('')
      } else {
        console.error('Invalid response format:', result)
        setError('Invalid response from server. Please try again.')
      }
    } catch (err: any) {
      console.error('Error analyzing sentiment:', err)
      setError('Error analyzing sentiment. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return <TrendingUp className="w-6 h-6 text-green-500" />
      case 'negative':
        return <TrendingDown className="w-6 h-6 text-red-500" />
      case 'mixed':
        return <BarChart3 className="w-6 h-6 text-yellow-500" />
      default:
        return <Minus className="w-6 h-6 text-gray-500" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'from-green-500 to-emerald-500'
      case 'negative':
        return 'from-red-500 to-pink-500'
      case 'mixed':
        return 'from-yellow-500 to-orange-500'
      default:
        return 'from-gray-500 to-slate-500'
    }
  }

  const getSentimentBgColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'bg-green-50 border-green-200'
      case 'negative':
        return 'bg-red-50 border-red-200'
      case 'mixed':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score > 0.3) return 'text-green-600'
    if (score < -0.3) return 'text-red-600'
    return 'text-gray-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score > 0.3) return 'bg-green-100'
    if (score < -0.3) return 'bg-red-100'
    return 'bg-gray-100'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="h-5 w-5 text-purple-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Sentiment Analysis</h2>
            {source && (
              <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {source}
              </span>
            )}
          </div>
          <button
            onClick={() => analyzeSentiment(true)}
            disabled={isAnalyzing}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
          </button>
        </div>
      </div>

      <div className="p-4">
        {!sentimentData ? (
          <div className="text-center py-8">
            <Brain className="mx-auto h-12 w-12 text-purple-400 mb-4" />
            <p className="text-gray-600 mb-4">
              Analyze the emotional tone and sentiment of your document
            </p>
            <button
              onClick={() => analyzeSentiment(false)}
              disabled={isAnalyzing}
              className="flex items-center mx-auto px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze Sentiment
                </>
              )}
            </button>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Sentiment */}
            <div className={`p-6 rounded-xl border-2 ${getSentimentBgColor(sentimentData.overallSentiment)}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {getSentimentIcon(sentimentData.overallSentiment)}
                  <h3 className="text-xl font-semibold text-gray-800 ml-3">
                    Overall Sentiment: {sentimentData.overallSentiment.charAt(0).toUpperCase() + sentimentData.overallSentiment.slice(1)}
                  </h3>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(sentimentData.sentimentScore)} ${getScoreColor(sentimentData.sentimentScore)}`}>
                  {sentimentData.sentimentScore > 0 ? '+' : ''}{sentimentData.sentimentScore}
                </div>
              </div>
              <p className="text-gray-700 mb-2">{sentimentData.summary}</p>
              <div className="flex items-center text-sm text-gray-600">
                <Target className="h-4 w-4 mr-1" />
                <span>Confidence: {sentimentData.confidence}%</span>
              </div>
            </div>

            {/* Sentiment Score Visualization */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sentiment Score</h3>
              <div className="relative">
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${getSentimentColor(sentimentData.overallSentiment)} transition-all duration-1000`}
                    style={{ 
                      width: `${((sentimentData.sentimentScore + 1) / 2) * 100}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Negative (-1)</span>
                  <span>Neutral (0)</span>
                  <span>Positive (+1)</span>
                </div>
                <div 
                  className="absolute top-0 w-1 h-4 bg-white border-2 border-gray-400 rounded-full transform -translate-x-1/2"
                  style={{ 
                    left: `${((sentimentData.sentimentScore + 1) / 2) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Emotional Tone */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Emotional Tone</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700">{sentimentData.emotionalTone}</p>
              </div>
            </div>

            {/* Key Indicators */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Sentiment Indicators</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sentimentData.keyIndicators.map((indicator, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{indicator}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audience Perception */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Audience Perception</h3>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">{sentimentData.audiencePerception}</p>
                </div>
              </div>
            </div>

            {/* Section Breakdown */}
            {sentimentData.sectionBreakdown && sentimentData.sectionBreakdown.length > 1 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Section Breakdown</h3>
                <div className="space-y-3">
                  {sentimentData.sectionBreakdown.map((section, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        {getSentimentIcon(section.sentiment)}
                        <span className="ml-2 text-gray-700 font-medium">{section.section}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600 capitalize">{section.sentiment}</span>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getScoreBgColor(section.score)} ${getScoreColor(section.score)}`}>
                          {section.score > 0 ? '+' : ''}{section.score}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regenerate Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => analyzeSentiment(true)}
                disabled={isAnalyzing}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Re-analyzing...' : 'Re-analyze Sentiment'}
              </button>
              {source === 'Cache' && (
                <p className="text-xs text-gray-500 mt-1">
                  Sentiment analysis loaded from cache. Click re-analyze for fresh analysis.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
