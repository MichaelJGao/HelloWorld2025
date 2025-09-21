import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// POST - Add a reply to an annotation
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params

  try {
    const client = await clientPromise
    const db = client.db('pdf-analyzer')
    const invitesCollection = db.collection('invitations')
    const annotationsCollection = db.collection('annotations')

    // Verify the invite token
    const invite = await invitesCollection.findOne({ token })

    if (!invite) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
    }

    // Check if invitation has expired
    if (invite.expires < new Date()) {
      await invitesCollection.deleteOne({ _id: invite._id })
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
    }

    const { annotationId, text } = await request.json()

    if (!annotationId || !text) {
      return NextResponse.json({ error: 'Annotation ID and text are required' }, { status: 400 })
    }

    // Check if annotation exists and belongs to this document
    const annotation = await annotationsCollection.findOne({
      _id: new ObjectId(annotationId),
      documentId: new ObjectId(invite.documentId)
    })

    if (!annotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    const newReply = {
      _id: new ObjectId(),
      text,
      authorEmail: invite.inviteeEmail,
      authorName: invite.inviteeName || invite.inviteeEmail,
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
  { params }: { params: { token: string } }
) {
  const { token } = params

  try {
    const client = await clientPromise
    const db = client.db('pdf-analyzer')
    const invitesCollection = db.collection('invitations')
    const annotationsCollection = db.collection('annotations')

    // Verify the invite token
    const invite = await invitesCollection.findOne({ token })

    if (!invite) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
    }

    const { annotationId, replyId, text } = await request.json()

    if (!annotationId || !replyId || !text) {
      return NextResponse.json({ error: 'Annotation ID, reply ID, and text are required' }, { status: 400 })
    }

    // Check if annotation exists and belongs to this document
    const annotation = await annotationsCollection.findOne({
      _id: new ObjectId(annotationId),
      documentId: new ObjectId(invite.documentId)
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
    if (reply.authorEmail !== invite.inviteeEmail) {
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
  { params }: { params: { token: string } }
) {
  const { token } = params

  try {
    const client = await clientPromise
    const db = client.db('pdf-analyzer')
    const invitesCollection = db.collection('invitations')
    const annotationsCollection = db.collection('annotations')

    // Verify the invite token
    const invite = await invitesCollection.findOne({ token })

    if (!invite) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
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
      documentId: new ObjectId(invite.documentId)
    })

    if (!annotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    // Find the reply
    const reply = annotation.replies.find((r: any) => r._id.toString() === replyId)
    if (!reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    // Check if user can delete this reply (invited user can delete any reply)
    if (reply.authorEmail !== invite.inviteeEmail && annotation.inviterEmail !== invite.inviteeEmail) {
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
