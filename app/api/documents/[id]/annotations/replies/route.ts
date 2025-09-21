import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// POST - Add a reply to an annotation (document owner)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  try {
    const client = await clientPromise
    const db = client.db('pdf-analyzer')
    const documentsCollection = db.collection('documents')
    const annotationsCollection = db.collection('annotations')

    // Verify document ownership
    const document = await documentsCollection.findOne({
      _id: new ObjectId(id),
      userEmail: session.user.email,
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found or unauthorized' }, { status: 404 })
    }

    const { annotationId, text } = await request.json()

    if (!annotationId || !text) {
      return NextResponse.json({ error: 'Annotation ID and text are required' }, { status: 400 })
    }

    // Check if annotation exists and belongs to this document
    const annotation = await annotationsCollection.findOne({
      _id: new ObjectId(annotationId),
      documentId: new ObjectId(id)
    })

    if (!annotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    const newReply = {
      _id: new ObjectId(),
      text,
      authorEmail: session.user.email,
      authorName: session.user.name || session.user.email,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add reply to the annotation
    const result = await annotationsCollection.updateOne(
      { _id: new ObjectId(annotationId) },
      { 
        $push: { replies: newReply },
        $set: { updatedAt: new Date() }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      reply: { ...newReply, _id: newReply._id.toString() }
    })
  } catch (error) {
    console.error('Error adding reply:', error)
    return NextResponse.json(
      { error: 'Failed to add reply' },
      { status: 500 }
    )
  }
}

// PUT - Update a reply
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  try {
    const client = await clientPromise
    const db = client.db('pdf-analyzer')
    const documentsCollection = db.collection('documents')
    const annotationsCollection = db.collection('annotations')

    // Verify document ownership
    const document = await documentsCollection.findOne({
      _id: new ObjectId(id),
      userEmail: session.user.email,
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found or unauthorized' }, { status: 404 })
    }

    const { annotationId, replyId, text } = await request.json()

    if (!annotationId || !replyId || !text) {
      return NextResponse.json({ error: 'Annotation ID, reply ID, and text are required' }, { status: 400 })
    }

    // Check if annotation exists and belongs to this document
    const annotation = await annotationsCollection.findOne({
      _id: new ObjectId(annotationId),
      documentId: new ObjectId(id)
    })

    if (!annotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    // Find the reply
    const reply = annotation.replies.find((r: any) => r._id.toString() === replyId)
    if (!reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    // Check if user can edit this reply (only author can edit)
    if (reply.authorEmail !== session.user.email) {
      return NextResponse.json({ error: 'Not authorized to edit this reply' }, { status: 403 })
    }

    // Update the reply
    const result = await annotationsCollection.updateOne(
      { 
        _id: new ObjectId(annotationId),
        'replies._id': new ObjectId(replyId)
      },
      { 
        $set: { 
          'replies.$.text': text,
          'replies.$.updatedAt': new Date(),
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating reply:', error)
    return NextResponse.json(
      { error: 'Failed to update reply' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a reply
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  try {
    const client = await clientPromise
    const db = client.db('pdf-analyzer')
    const documentsCollection = db.collection('documents')
    const annotationsCollection = db.collection('annotations')

    // Verify document ownership
    const document = await documentsCollection.findOne({
      _id: new ObjectId(id),
      userEmail: session.user.email,
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found or unauthorized' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const annotationId = searchParams.get('annotationId')
    const replyId = searchParams.get('replyId')

    if (!annotationId || !replyId) {
      return NextResponse.json({ error: 'Annotation ID and reply ID are required' }, { status: 400 })
    }

    // Check if annotation exists and belongs to this document
    const annotation = await annotationsCollection.findOne({
      _id: new ObjectId(annotationId),
      documentId: new ObjectId(id)
    })

    if (!annotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    // Find the reply
    const reply = annotation.replies.find((r: any) => r._id.toString() === replyId)
    if (!reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    // Check if user can delete this reply (document owner can delete any reply)
    if (reply.authorEmail !== session.user.email && annotation.inviterEmail !== session.user.email) {
      return NextResponse.json({ error: 'Not authorized to delete this reply' }, { status: 403 })
    }

    // Remove the reply
    const result = await annotationsCollection.updateOne(
      { _id: new ObjectId(annotationId) },
      { 
        $pull: { replies: { _id: new ObjectId(replyId) } },
        $set: { updatedAt: new Date() }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting reply:', error)
    return NextResponse.json(
      { error: 'Failed to delete reply' },
      { status: 500 }
    )
  }
}
