import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        ownedProjects: true,
        memberProjects: true,
        uploadedDocuments: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete user and all associated data
    // Prisma will handle cascading deletes based on the schema
    await prisma.user.delete({
      where: { id: user.id }
    })

    return NextResponse.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Error deleting user account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
