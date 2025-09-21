import { ObjectId } from 'mongodb'

export interface User {
  _id?: ObjectId
  email: string
  name: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

export interface Document {
  _id?: ObjectId
  userId: ObjectId
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
  uploadDate: Date
  lastAccessed: Date
  isPublic: boolean
  tags: string[]
  projectId?: ObjectId
}

export interface Project {
  _id?: ObjectId
  name: string
  description?: string
  ownerId: ObjectId
  members: Array<{
    userId: ObjectId
    role: 'owner' | 'admin' | 'member'
    joinedAt: Date
  }>
  documents: ObjectId[]
  createdAt: Date
  updatedAt: Date
  isPublic: boolean
  tags: string[]
}

export interface DocumentAccess {
  _id?: ObjectId
  documentId: ObjectId
  userId: ObjectId
  accessType: 'view' | 'edit' | 'comment'
  grantedAt: Date
  grantedBy: ObjectId
}

export interface DocumentComment {
  _id?: ObjectId
  documentId: ObjectId
  userId: ObjectId
  content: string
  position?: {
    page: number
    x: number
    y: number
  }
  createdAt: Date
  updatedAt: Date
  replies?: ObjectId[]
  parentCommentId?: ObjectId
}

export interface DocumentAnnotation {
  _id?: ObjectId
  documentId: ObjectId
  userId: ObjectId
  type: 'highlight' | 'note'
  selectedText: string
  note?: string
  color?: string
  position: {
    startIndex: number
    endIndex: number
    startOffset: number
    endOffset: number
  }
  createdAt: Date
  updatedAt: Date
}