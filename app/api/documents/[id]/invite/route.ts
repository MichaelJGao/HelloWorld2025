import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { DocumentInvite } from '@/lib/models'
import { sendDocumentInvite, generateInviteToken } from '@/lib/email'
import { ObjectId } from 'mongodb'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const documentId = params.id
    const body = await request.json()
    const { inviteeEmail, inviteeName, message } = body

    if (!inviteeEmail) {
      return NextResponse.json(
        { error: 'Invitee email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteeEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const users = db.collection('users')
    const documents = db.collection('documents')
    const invites = db.collection('documentInvites')

    // Find the inviter
    const inviter = await users.findOne({ email: session.user.email })
    if (!inviter) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find the document and verify ownership
    const document = await documents.findOne({ 
      _id: new ObjectId(documentId),
      userId: inviter._id 
    })
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check if there's already a pending invite for this email and document
    const existingInvite = await invites.findOne({
      documentId: new ObjectId(documentId),
      inviteeEmail: inviteeEmail.toLowerCase(),
      isUsed: false,
      expiresAt: { $gt: new Date() }
    })

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An active invite already exists for this email' },
        { status: 400 }
      )
    }

    // Generate invite token and expiration date (7 days from now)
    const token = generateInviteToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create the invite
    const invite: Omit<DocumentInvite, '_id'> = {
      documentId: new ObjectId(documentId),
      inviterId: inviter._id,
      inviterEmail: inviter.email,
      inviterName: inviter.name,
      inviteeEmail: inviteeEmail.toLowerCase(),
      inviteeName: inviteeName || '',
      message: message || '',
      token,
      expiresAt,
      isUsed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await invites.insertOne(invite)

    // Send email invitation
    const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/documents/invite/${token}`
    
    const emailSent = await sendDocumentInvite({
      inviterName: inviter.name,
      inviterEmail: inviter.email,
      documentName: document.originalName,
      inviteeEmail: inviteeEmail.toLowerCase(),
      message: message || '',
      inviteUrl
    })

    if (!emailSent) {
      // If email failed, we should still create the invite but log the error
      console.error('Failed to send email for invite:', result.insertedId)
    }

    return NextResponse.json({
      success: true,
      inviteId: result.insertedId,
      message: emailSent 
        ? 'Invitation sent successfully' 
        : 'Invitation created but email delivery failed'
    })

  } catch (error) {
    console.error('Error creating document invite:', error)
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const documentId = params.id
    const db = await getDatabase()
    const users = db.collection('users')
    const documents = db.collection('documents')
    const invites = db.collection('documentInvites')

    // Find the user
    const user = await users.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find the document and verify ownership
    const document = await documents.findOne({ 
      _id: new ObjectId(documentId),
      userId: user._id 
    })
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Get all invites for this document
    const documentInvites = await invites
      .find({ documentId: new ObjectId(documentId) })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ invites: documentInvites })

  } catch (error) {
    console.error('Error fetching document invites:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}
