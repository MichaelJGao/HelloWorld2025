'use client'

import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2, AlertCircle, BookOpen, Eye, MessageCircle } from 'lucide-react'
import PDFDisplay from '@/components/PDFDisplay'
import SummaryPanel from '@/components/SummaryPanel'
import LandingPage from '@/components/LandingPage'
import ThemeToggle from '@/components/ThemeToggle'
import ChatBot from '@/components/ChatBot'
import { extractTextFromPDF } from '@/lib/pdfProcessor'
import { detectKeywords } from '@/lib/keywordDetector'

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState<string>('')
  const [keywords, setKeywords] = useState<Array<{word: string, definition: string, context: string}>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'viewer' | 'summary' | 'chat'>('viewer')
  const [showLandingPage, setShowLandingPage] = useState(true)
  const [showChatBot, setShowChatBot] = useState(false)

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      setError('')
      setIsProcessing(true)
      setShowLandingPage(false) // Hide landing page when file is uploaded
      
      try {
        // Extract text from PDF
        const text = await extractTextFromPDF(file)
        console.log('Extracted text length:', text.length)
        console.log('First 500 characters:', text.substring(0, 500))
        setExtractedText(text)
        
        // Detect keywords using AI
        const keywordResponse = await fetch('/api/detect-keywords', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        })
        
        if (keywordResponse.ok) {
          const { keywords } = await keywordResponse.json()
          console.log('AI detected keywords:', keywords.length, keywords)
          setKeywords(keywords)
        } else {
          // Fallback to local detection
          const detectedKeywords = detectKeywords(text)
          console.log('Fallback detected keywords:', detectedKeywords.length, detectedKeywords)
          setKeywords(detectedKeywords)
        }
      } catch (err) {
        setError('Failed to process PDF. Please try again.')
        console.error('Error processing PDF:', err)
      } finally {
        setIsProcessing(false)
      }
    } else {
      setError('Please upload a valid PDF file.')
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  })

  // Show landing page if no file is uploaded
  if (showLandingPage) {
    return <LandingPage onGetStarted={() => setShowLandingPage(false)} />
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-8 relative">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setShowLandingPage(true)}
                className="group flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-all duration-300 hover:scale-105"
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span>
                <span className="ml-1">Back to Home</span>
              </button>
              <div></div>
              <ThemeToggle />
            </div>
            <div className="relative">
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                PDF Keyword Analyzer
              </h1>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Upload a PDF document and get intelligent keyword summaries with hover tooltips. 
              Perfect for research papers, textbooks, and technical documents.
            </p>
          </header>

        {!pdfFile ? (
          <div className="max-w-2xl mx-auto">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 transform hover:scale-105
                ${isDragActive 
                  ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 shadow-xl scale-105' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-800 dark:hover:to-blue-900/20 hover:shadow-lg'
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="relative mb-6">
                <Upload className={`mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 transition-all duration-300 ${isDragActive ? 'text-primary-500 scale-110' : ''}`} />
                {isDragActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {isDragActive ? 'Drop your PDF here' : 'Upload a PDF file'}
              </p>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Drag and drop or click to select a PDF file
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                <FileText className="w-4 h-4 mr-2" />
                PDF files only
              </div>
            </div>
            
            
            {error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center animate-slide-up">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                <span className="text-red-700 dark:text-red-400">{error}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {isProcessing ? (
              <div className="text-center py-20">
                {/* Main Processing Animation */}
                <div className="relative mb-12">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                    <Loader2 className="h-16 w-16 text-white animate-spin" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"></div>
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-ping"></div>
                </div>

                {/* Processing Steps */}
                <div className="max-w-md mx-auto mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Processing your PDF
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                    Our AI is analyzing your document to extract insights
                  </p>
                  
                  {/* Processing Steps */}
                  <div className="space-y-4 text-left">
                    <div className="flex items-center p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
                        <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Extracting text content</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Reading and parsing document</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                        <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Detecting keywords</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">AI-powered keyword analysis</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mr-4">
                        <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Preparing results</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Organizing insights and summaries</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="max-w-sm mx-auto">
                  <div className="flex justify-center items-center space-x-2 text-primary-600 dark:text-primary-400 mb-4">
                    <div className="loading-dots">
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                    <span className="text-sm font-medium ml-2">Please wait...</span>
                  </div>
                  
                  {/* Fun Facts and Features */}
                  <div className="space-y-3">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                      <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                        💡 <strong>Did you know?</strong> Our AI can process documents up to 10x faster than traditional methods!
                      </p>
                    </div>
                    
                    {/* Features Preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center mb-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Smart Keywords</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">AI-powered detection</p>
                      </div>
                      
                      <div className="p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center mb-1">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Intelligent Summary</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">Key insights & findings</p>
                      </div>
                      
                      <div className="p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center mb-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Sentiment Analysis</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">Emotional tone detection</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background Decorative Elements */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                  <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/10 dark:bg-blue-400/5 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-200/10 dark:bg-purple-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-200/5 to-purple-200/5 dark:from-blue-400/3 dark:to-purple-400/3 rounded-full blur-3xl animate-pulse delay-500"></div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 flex items-center justify-between card-hover">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <FileText className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{pdfFile.name}</h3>
                      <div className="flex items-center mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {keywords.length} keywords detected
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Tab Navigation */}
                  <div className="flex items-center space-x-1 bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl p-1.5">
                    <button
                      onClick={() => setActiveTab('viewer')}
                      className={`flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                        activeTab === 'viewer'
                          ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-md transform scale-105'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600/50'
                      }`}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Viewer
                    </button>
                    <button
                      onClick={() => setActiveTab('summary')}
                      className={`flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                        activeTab === 'summary'
                          ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-md transform scale-105'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600/50'
                      }`}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Summary
                    </button>
                    <button
                      onClick={() => setActiveTab('chat')}
                      className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${
                        activeTab === 'chat'
                          ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </button>
                  </div>
                </div>
                
                {activeTab === 'viewer' ? (
                  <PDFDisplay 
                    file={pdfFile} 
                    extractedText={extractedText}
                    keywords={keywords}
                  />
                ) : activeTab === 'summary' ? (
                  <>
                    {console.log('SummaryPanel props:', {
                      textLength: extractedText.length,
                      keywordsCount: keywords.length,
                      fileName: pdfFile.name
                    })}
                    <SummaryPanel
                      extractedText={extractedText}
                      keywords={keywords}
                      fileName={pdfFile.name}
                    />
                  </>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
                    <div className="text-center py-12">
                      <MessageCircle className="mx-auto h-16 w-16 text-primary-500 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        AI PDF Assistant
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                        Ask questions about your PDF content and get intelligent answers based on the document's context.
                      </p>
                      <button
                        onClick={() => setShowChatBot(true)}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Start Chatting
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        </div>
      </div>

      {/* ChatBot Component */}
      {pdfFile && extractedText && (
        <ChatBot
          pdfContext={extractedText}
          keywords={keywords}
          fileName={pdfFile.name}
          isVisible={showChatBot}
          onToggle={() => setShowChatBot(!showChatBot)}
        />
      )}
    </main>
  )
}

