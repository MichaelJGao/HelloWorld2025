import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token
    const db = await getDatabase()
    const invites = db.collection('documentInvites')
    const documents = db.collection('documents')
    const users = db.collection('users')

    // Find the invite by token
    const invite = await invites.findOne({ 
      token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    })

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    // Find the document
    const document = await documents.findOne({ 
      _id: new ObjectId(invite.documentId)
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Find the inviter
    const inviter = await users.findOne({ 
      _id: new ObjectId(invite.inviterId)
    })

    // Mark invite as used
    await invites.updateOne(
      { _id: invite._id },
      { 
        $set: { 
          isUsed: true, 
          usedAt: new Date(),
          updatedAt: new Date()
        }
      }
    )

    // Update document's last accessed time
    await documents.updateOne(
      { _id: new ObjectId(invite.documentId) },
      { $set: { lastAccessed: new Date() } }
    )

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        _id: document._id.toString(),
        inviter: {
          name: inviter?.name || invite.inviterName,
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
