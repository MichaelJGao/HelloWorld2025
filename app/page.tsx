'use client'

import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react'
import PDFDisplay from '@/components/PDFDisplay'
import { extractTextFromPDF } from '@/lib/pdfProcessor'
import { detectKeywords } from '@/lib/keywordDetector'

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState<string>('')
  const [keywords, setKeywords] = useState<Array<{word: string, definition: string, context: string}>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      setError('')
      setIsProcessing(true)
      
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

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PDF Keyword Analyzer
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload a PDF document and get intelligent keyword summaries with hover tooltips. 
            Perfect for research papers, textbooks, and technical documents.
          </p>
        </header>

        {!pdfFile ? (
          <div className="max-w-2xl mx-auto">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                ${isDragActive 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'Drop your PDF here' : 'Upload a PDF file'}
              </p>
              <p className="text-gray-500">
                Drag and drop or click to select a PDF file
              </p>
            </div>
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {isProcessing ? (
              <div className="text-center py-12">
                <Loader2 className="mx-auto h-12 w-12 text-primary-500 animate-spin mb-4" />
                <p className="text-lg text-gray-600">Processing your PDF...</p>
                <p className="text-sm text-gray-500 mt-2">
                  Extracting text and analyzing keywords
                </p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center">
                  <FileText className="h-8 w-8 text-primary-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">{pdfFile.name}</h3>
                    <p className="text-sm text-gray-500">
                      {keywords.length} keywords detected
                    </p>
                  </div>
                </div>
                
                <PDFDisplay 
                  file={pdfFile} 
                  extractedText={extractedText}
                  keywords={keywords}
                />
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

