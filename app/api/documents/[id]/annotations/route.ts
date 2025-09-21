import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { DocumentAnnotation } from '@/lib/models'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDatabase()
    const users = db.collection('users')
    const documents = db.collection('documents')
    const annotations = db.collection('annotations')

    // Find user
    const user = await users.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify document exists and user has access
    const document = await documents.findOne({
      _id: new ObjectId(params.id),
      userId: user._id
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Get annotations for this document
    const documentAnnotations = await annotations
      .find({ 
        documentId: new ObjectId(params.id),
        userId: user._id
      })
      .sort({ createdAt: 1 })
      .toArray()

    return NextResponse.json({ annotations: documentAnnotations })
  } catch (error) {
    console.error('Error fetching annotations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch annotations' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, selectedText, note, color, position } = body

    if (!type || !selectedText || !position) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const users = db.collection('users')
    const documents = db.collection('documents')
    const annotations = db.collection('annotations')

    // Find user
    const user = await users.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify document exists and user has access
    const document = await documents.findOne({
      _id: new ObjectId(params.id),
      userId: user._id
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Create annotation
    const annotation: Omit<DocumentAnnotation, '_id'> = {
      documentId: new ObjectId(params.id),
      userId: user._id,
      type,
      selectedText,
      note: note || '',
      color: color || '#ffeb3b',
      position,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await annotations.insertOne(annotation)
    
    return NextResponse.json({ 
      success: true, 
      annotationId: result.insertedId,
      message: 'Annotation saved successfully'
    })
  } catch (error) {
    console.error('Error saving annotation:', error)
    return NextResponse.json(
      { error: 'Failed to save annotation' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { annotationId, note, color } = body

    if (!annotationId) {
      return NextResponse.json(
        { error: 'Annotation ID is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const users = db.collection('users')
    const documents = db.collection('documents')
    const annotations = db.collection('annotations')

    // Find user
    const user = await users.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify document exists and user has access
    const document = await documents.findOne({
      _id: new ObjectId(params.id),
      userId: user._id
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Update annotation
    const updateData: any = { updatedAt: new Date() }
    if (note !== undefined) updateData.note = note
    if (color !== undefined) updateData.color = color

    const result = await annotations.updateOne(
      { 
        _id: new ObjectId(annotationId),
        documentId: new ObjectId(params.id),
        userId: user._id
      },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Annotation updated successfully'
    })
  } catch (error) {
    console.error('Error updating annotation:', error)
    return NextResponse.json(
      { error: 'Failed to update annotation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const annotationId = searchParams.get('annotationId')

    if (!annotationId) {
      return NextResponse.json(
        { error: 'Annotation ID is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const users = db.collection('users')
    const documents = db.collection('documents')
    const annotations = db.collection('annotations')

    // Find user
    const user = await users.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify document exists and user has access
    const document = await documents.findOne({
      _id: new ObjectId(params.id),
      userId: user._id
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete annotation
    const result = await annotations.deleteOne({
      _id: new ObjectId(annotationId),
      documentId: new ObjectId(params.id),
      userId: user._id
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Annotation deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting annotation:', error)
    return NextResponse.json(
      { error: 'Failed to delete annotation' },
      { status: 500 }
    )
  }
}
