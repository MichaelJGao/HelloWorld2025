import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET - Fetch annotations for a document via invite token
export async function GET(
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

    // Fetch annotations for this document
    const annotations = await annotationsCollection
      .find({ documentId: new ObjectId(invite.documentId) })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ annotations })
  } catch (error) {
    console.error('Error fetching annotations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch annotations' },
      { status: 500 }
    )
  }
}

// POST - Create a new annotation
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

    const { text, selectedText, position, type = 'comment' } = await request.json()

    if (!text || !selectedText) {
      return NextResponse.json({ error: 'Text and selected text are required' }, { status: 400 })
    }

    const newAnnotation = {
      documentId: new ObjectId(invite.documentId),
      inviterEmail: invite.inviterEmail,
      inviteeEmail: invite.inviteeEmail,
      authorEmail: invite.inviteeEmail, // For now, only invitee can annotate
      authorName: invite.inviteeName || invite.inviteeEmail,
      text,
      selectedText,
      position: position || {},
      type, // 'comment', 'highlight', 'question', 'suggestion'
      createdAt: new Date(),
      updatedAt: new Date(),
      replies: []
    }

    const result = await annotationsCollection.insertOne(newAnnotation)

    return NextResponse.json({
      success: true,
      annotation: { ...newAnnotation, _id: result.insertedId.toString() }
    })
  } catch (error) {
    console.error('Error creating annotation:', error)
    return NextResponse.json(
      { error: 'Failed to create annotation' },
      { status: 500 }
    )
  }
}

// PUT - Update an annotation
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

    const { annotationId, text, type } = await request.json()

    if (!annotationId) {
      return NextResponse.json({ error: 'Annotation ID is required' }, { status: 400 })
    }

    // Check if annotation exists and belongs to this document
    const annotation = await annotationsCollection.findOne({
      _id: new ObjectId(annotationId),
      documentId: new ObjectId(invite.documentId)
    })

    if (!annotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    // Check if user can edit this annotation (invited user can edit any annotation)
    if (annotation.authorEmail !== invite.inviteeEmail && annotation.inviterEmail !== invite.inviteeEmail) {
      return NextResponse.json({ error: 'Not authorized to edit this annotation' }, { status: 403 })
    }

    const updateData: any = { updatedAt: new Date() }
    if (text !== undefined) updateData.text = text
    if (type !== undefined) updateData.type = type

    const result = await annotationsCollection.updateOne(
      { _id: new ObjectId(annotationId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating annotation:', error)
    return NextResponse.json(
      { error: 'Failed to update annotation' },
      { status: 500 }
    )
  }
}

// DELETE - Delete an annotation
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

    if (!annotationId) {
      return NextResponse.json({ error: 'Annotation ID is required' }, { status: 400 })
    }

    // Check if annotation exists and belongs to this document
    const annotation = await annotationsCollection.findOne({
      _id: new ObjectId(annotationId),
      documentId: new ObjectId(invite.documentId)
    })

    if (!annotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    // Check if user can delete this annotation (invited user can delete any annotation)
    if (annotation.authorEmail !== invite.inviteeEmail && annotation.inviterEmail !== invite.inviteeEmail) {
      return NextResponse.json({ error: 'Not authorized to delete this annotation' }, { status: 403 })
    }

    const result = await annotationsCollection.deleteOne({
      _id: new ObjectId(annotationId)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting annotation:', error)
    return NextResponse.json(
      { error: 'Failed to delete annotation' },
      { status: 500 }
    )
  }
}
