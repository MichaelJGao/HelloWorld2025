'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { FileText, User, Mail, Calendar, Clock, Download, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

interface InvitedDocument {
  _id: string
  fileName: string
  originalName: string
  fileSize: number
  fileType: string
  extractedText: string
  keywords: Array<{
    word: string
    definition: string
    context: string
  }>
  summary?: {
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
  uploadDate: string
  lastAccessed: string
  isPublic: boolean
  tags: string[]
  inviter: {
    name: string
    email: string
  }
  invite: {
    message: string
    inviteeEmail: string
    inviteeName: string
  }
}

export default function InvitedDocumentViewer() {
  const params = useParams()
  const token = params.token as string
  
  const [document, setDocument] = useState<InvitedDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showText, setShowText] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (token) {
      fetchDocument()
    }
  }, [token])

  const fetchDocument = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/documents/invite/${token}`)
      
      if (response.ok) {
        const data = await response.json()
        setDocument(data.document)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load document')
      }
    } catch (err) {
      setError('Error loading document')
      console.error('Error loading document:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter text based on search
  const filteredText = document && searchTerm 
    ? document.extractedText.split('\n').filter(line => 
        line.toLowerCase().includes(searchTerm.toLowerCase())
      ).join('\n')
    : document?.extractedText || ''

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              Unable to Access Document
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Document not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {document.originalName}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Shared by {document.inviter.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowText(!showText)}
                className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                {showText ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {showText ? 'Hide Text' : 'Show Text'}
              </button>
              <Link 
                href="/"
                className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Invitation Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                You've been invited to view this document
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>{document.inviter.name}</strong> ({document.inviter.email}) shared this document with you.
                {document.invite.message && (
                  <span className="block mt-1 italic">"{document.invite.message}"</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Document Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Uploaded {formatDate(document.uploadDate)}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {document.summary?.readingTime || 'Unknown'}
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              {formatFileSize(document.fileSize)}
            </div>
          </div>

          {/* Document Summary */}
          {document.summary && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Document Summary
              </h3>
              {document.summary.mainTopic && (
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Main Topic:</strong> {document.summary.mainTopic}
                </p>
              )}
              {document.summary.summary && (
                <p className="text-gray-700 dark:text-gray-300">
                  {document.summary.summary}
                </p>
              )}
            </div>
          )}

          {/* Keywords */}
          {document.keywords.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                Key Terms ({document.keywords.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {document.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-sm rounded-full"
                  >
                    {keyword.word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search in document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Document Content */}
        {showText ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200 leading-relaxed">
              <div
                dangerouslySetInnerHTML={{
                  __html: filteredText.replace(/\n/g, '<br>')
                }}
              />
            </div>
            
            {searchTerm && (
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Showing filtered results for: "{searchTerm}"
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <EyeOff className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Text view is hidden</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Click "Show Text" to view the document content</p>
          </div>
        )}
      </div>
    </div>
  )
}
