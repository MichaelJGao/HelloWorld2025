import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDatabase()
    const documents = await db.collection('documents')
      .find({ userEmail: session.user.email })
      .sort({ uploadDate: -1 })
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fileName, originalName, fileSize, fileType, extractedText, keywords, summary } = body

    const db = await getDatabase()
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