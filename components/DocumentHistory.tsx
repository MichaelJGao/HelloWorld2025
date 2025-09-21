'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  FileText, 
  Calendar, 
  Clock, 
  Tag, 
  Eye, 
  Trash2, 
  Download,
  Search,
  Filter,
  MoreVertical,
  Star,
  Share2
} from 'lucide-react'
import SavedDocumentViewer from './SavedDocumentViewer'

interface Document {
  _id: string
  fileName: string
  originalName: string
  fileSize: number
  uploadDate: string
  lastAccessed: string
  tags: string[]
  isPublic: boolean
  summary?: {
    mainTopic: string
    summary: string
    readingTime: string
  }
}

export default function DocumentHistory() {
  const { data: session } = useSession()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date')
  const [error, setError] = useState('')
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
  const [loadingDocument, setLoadingDocument] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchDocuments()
    }
  }, [session])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      } else {
        setError('Failed to fetch documents')
      }
    } catch (err) {
      setError('Error loading documents')
      console.error('Error fetching documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const viewDocument = async (documentId: string) => {
    try {
      setLoadingDocument(documentId)
      const response = await fetch(`/api/documents/${documentId}`)
      
      if (response.ok) {
        const data = await response.json()
        setViewingDocument(data.document)
      } else {
        setError('Failed to load document')
      }
    } catch (err) {
      setError('Error loading document')
      console.error('Error loading document:', err)
    } finally {
      setLoadingDocument(null)
    }
  }

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDocuments(docs => docs.filter(doc => doc._id !== documentId))
      } else {
        setError('Failed to delete document')
      }
    } catch (err) {
      setError('Error deleting document')
      console.error('Error deleting document:', err)
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

  const filteredDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.summary?.mainTopic.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTag = !filterTag || doc.tags.includes(filterTag)
      return matchesSearch && matchesTag
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.originalName.localeCompare(b.originalName)
        case 'size':
          return b.fileSize - a.fileSize
        case 'date':
        default:
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      }
    })

  const allTags = Array.from(new Set(documents.flatMap(doc => doc.tags)))

  if (!session) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Sign in to view your documents
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Please sign in to access your document history
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading your documents...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Documents
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {documents.length} document{documents.length !== 1 ? 's' : ''} stored
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'size')}
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {documents.length === 0 ? 'No documents yet' : 'No documents match your search'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {documents.length === 0 
              ? 'Upload your first PDF to get started'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc._id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {doc.originalName}
                    </h3>
                    {doc.isPublic && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs rounded-full">
                        Public
                      </span>
                    )}
                  </div>
                  
                  {doc.summary?.mainTopic && (
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                      <strong>Topic:</strong> {doc.summary.mainTopic}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(doc.uploadDate)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {doc.summary?.readingTime || 'Unknown'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      {formatFileSize(doc.fileSize)}
                    </div>
                  </div>
                  
                  {doc.tags.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="h-4 w-4 text-gray-400" />
                      <div className="flex gap-1 flex-wrap">
                        {doc.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => viewDocument(doc._id)}
                    disabled={loadingDocument === doc._id}
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="View Document"
                  >
                    {loadingDocument === doc._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => deleteDocument(doc._id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <SavedDocumentViewer
          document={viewingDocument}
          onClose={() => setViewingDocument(null)}
        />
      )}
    </div>
  )
}
