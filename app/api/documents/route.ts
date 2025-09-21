/**
 * API Route: Documents Management
 * 
 * This API endpoint handles document storage and retrieval operations for the
 * PDF Keyword Analyzer application. It provides CRUD operations for user
 * documents with authentication and MongoDB integration.
 * 
 * Features:
 * - User authentication and authorization
 * - Document storage with metadata
 * - Keyword and summary preservation
 * - Document retrieval with sorting
 * - MongoDB integration for persistence
 * 
 * @fileoverview API route for document management operations
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'

/**
 * GET /api/documents
 * 
 * Retrieves all documents for the authenticated user, sorted by upload date.
 * 
 * Authentication: Required
 * 
 * Response:
 * - documents: Array of document objects with metadata
 * 
 * @param request - Next.js request object
 * @returns JSON response with user's documents
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Connect to database and fetch user's documents
    const db = await getDatabase()
    const documents = await db.collection('documents')
      .find({ userEmail: session.user.email })
      .sort({ uploadDate: -1 }) // Sort by most recent first
      .toArray()

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/documents
 * 
 * Creates a new document record in the database with extracted text, keywords,
 * and metadata from a processed PDF file.
 * 
 * Authentication: Required
 * 
 * Request Body:
 * - fileName: string - Name of the uploaded file
 * - originalName: string - Original filename
 * - fileSize: number - File size in bytes
 * - fileType: string - MIME type of the file
 * - extractedText: string - Text content extracted from PDF
 * - keywords: Array - Detected keywords with definitions
 * - summary: string - Optional document summary
 * 
 * Response:
 * - document: Document object with generated ID
 * 
 * @param request - Next.js request object containing document data
 * @returns JSON response with created document
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { fileName, originalName, fileSize, fileType, extractedText, keywords, summary } = body

    // Connect to database
    const db = await getDatabase()
    
    // Create document object with metadata
    const document = {
      userEmail: session.user.email,
      userName: session.user.name || 'User',
      fileName,
      originalName,
      fileSize,
      fileType,
      extractedText,
      keywords: keywords || [],
      summary: summary || null,
      uploadDate: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      isPublic: false,
      tags: []
    }

    // Insert document into database
    const result = await db.collection('documents').insertOne(document)
    
    return NextResponse.json({ 
      document: { ...document, _id: result.insertedId, id: result.insertedId.toString() }
    })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}