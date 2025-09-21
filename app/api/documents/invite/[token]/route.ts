import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const db = await getDatabase()
    
    // Find the invitation
    const invite = await db.collection('invitations').findOne({
      token: params.token,
      isUsed: false,
      expiresAt: { $gt: new Date().toISOString() }
    })

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    // Get the document
    const document = await db.collection('documents').findOne({
      _id: new ObjectId(invite.documentId)
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Update last accessed
    await db.collection('documents').updateOne(
      { _id: new ObjectId(invite.documentId) },
      { $set: { lastAccessed: new Date().toISOString() } }
    )

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        _id: document._id.toString(),
        id: document._id.toString(),
        inviter: {
          name: invite.inviterName,
          email: invite.inviterEmail
        },
        invite: {
          message: invite.message,
          inviteeEmail: invite.inviteeEmail,
          inviteeName: invite.inviteeName
        }
      }
    })
  } catch (error) {
    console.error('Error accessing document via invite:', error)
    return NextResponse.json(
      { error: 'Failed to access document' },
      { status: 500 }
    )
  }
}