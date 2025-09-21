import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user settings from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        // Add settings fields when you extend the User model
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return default settings for now (you can extend this with a UserSettings model)
    const settings = {
      name: user.name,
      email: user.email,
      notifications: {
        email: true,
        push: true,
        documentUpdates: true,
        projectInvites: true
      },
      privacy: {
        profileVisibility: 'private' as const,
        showEmail: false,
        allowCollaboration: true
      },
      preferences: {
        theme: 'system' as const,
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 30
      }
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await request.json()

    // Update user name if provided
    if (settings.name) {
      await prisma.user.update({
        where: { email: session.user.email },
        data: { name: settings.name }
      })
    }

    // TODO: Store other settings in a UserSettings model
    // For now, we'll just update the name and return success

    return NextResponse.json({ message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Error updating user settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
