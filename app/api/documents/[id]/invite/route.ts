import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendDocumentInvite, generateInviteToken } from '@/lib/email'
import { getDatabase } from '@/lib/mongodb'
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

    const body = await request.json()
    const { inviteeEmail, inviteeName, message } = body

    if (!inviteeEmail) {
      return NextResponse.json({ error: 'Invitee email is required' }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Get the document
    const document = await db.collection('documents').findOne({
      _id: new ObjectId(params.id),
      userEmail: session.user.email
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Generate invite token
    const token = generateInviteToken()
    
    // Create invitation
    const invitation = {
      token,
      documentId: params.id,
      inviterEmail: session.user.email,
      inviterName: session.user.name || 'User',
      inviteeEmail,
      inviteeName: inviteeName || '',
      message: message || '',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      isUsed: false
    }

    await db.collection('invitations').insertOne(invitation)

    // Send email
    const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/documents/invite/${token}`
    
    try {
      await sendDocumentInvite({
        inviterName: session.user.name || 'User',
        inviterEmail: session.user.email,
        inviteeEmail,
        inviteeName: inviteeName || '',
        documentName: document.originalName,
        inviteUrl,
        message: message || ''
      })
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true, 
      invitation: {
        ...invitation,
        _id: invitation._id?.toString(),
        id: invitation._id?.toString()
      }
    })
  } catch (error) {
    console.error('Error creating invitation:', error)
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

    const db = await getDatabase()
    const invitations = await db.collection('invitations')
      .find({ 
        documentId: params.id,
        inviterEmail: session.user.email 
      })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}