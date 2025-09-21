import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { Document } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDatabase()
    const users = db.collection('users')
    const documents = db.collection('documents')

    // Find or create user
    let user = await users.findOne({ email: session.user.email })
    if (!user) {
      const newUser = {
        email: session.user.email,
        name: session.user.name || '',
        image: session.user.image || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = await users.insertOne(newUser)
      user = { _id: result.insertedId, ...newUser }
    }

    // Get user's documents
    const userDocuments = await documents
      .find({ userId: user._id })
      .sort({ uploadDate: -1 })
      .toArray()

    return NextResponse.json({ documents: userDocuments })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fileName, originalName, fileSize, fileType, extractedText, keywords, summary } = body

    if (!fileName || !extractedText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const users = db.collection('users')
    const documents = db.collection('documents')

    // Find or create user
    let user = await users.findOne({ email: session.user.email })
    if (!user) {
      const newUser = {
        email: session.user.email,
        name: session.user.name || '',
        image: session.user.image || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = await users.insertOne(newUser)
      user = { _id: result.insertedId, ...newUser }
    }

    // Create document
    const document: Omit<Document, '_id'> = {
      userId: user._id,
      fileName,
      originalName: originalName || fileName,
      fileSize: fileSize || 0,
      fileType: fileType || 'application/pdf',
      extractedText,
      keywords: keywords || [],
      summary,
      uploadDate: new Date(),
      lastAccessed: new Date(),
      isPublic: false,
      tags: []
    }

    const result = await documents.insertOne(document)
    
    return NextResponse.json({ 
      success: true, 
      documentId: result.insertedId,
      message: 'Document saved successfully'
    })
  } catch (error) {
    console.error('Error saving document:', error)
    return NextResponse.json(
      { error: 'Failed to save document' },
      { status: 500 }
    )
  }
}
