import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

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
    const document = await db.collection('documents').findOne({
      _id: new ObjectId(params.id),
      userEmail: session.user.email
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Update last accessed
    await db.collection('documents').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { lastAccessed: new Date().toISOString() } }
    )

    return NextResponse.json({ 
      document: {
        ...document,
        _id: document._id.toString(),
        id: document._id.toString()
      }
    })
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document' },
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
    const db = await getDatabase()

    const result = await db.collection('documents').updateOne(
      { 
        _id: new ObjectId(params.id),
        userEmail: session.user.email 
      },
      { $set: { ...body, lastModified: new Date().toISOString() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json(
      { error: 'Failed to update document' },
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

    const db = await getDatabase()
    const result = await db.collection('documents').deleteOne({
      _id: new ObjectId(params.id),
      userEmail: session.user.email
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}