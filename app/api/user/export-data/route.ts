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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        ownedProjects: {
          include: {
            documents: true,
            members: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        memberProjects: {
          include: {
            project: {
              include: {
                documents: true,
                owner: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prepare export data
    const exportData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      projects: {
        owned: user.ownedProjects.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          documents: project.documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            content: doc.content,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
          })),
          members: project.members.map(member => ({
            id: member.id,
            role: member.role,
            joinedAt: member.joinedAt,
            user: member.user
          }))
        })),
        memberOf: user.memberProjects.map(member => ({
          id: member.project.id,
          name: member.project.name,
          description: member.project.description,
          role: member.role,
          joinedAt: member.joinedAt,
          owner: member.project.owner,
          documents: member.project.documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            content: doc.content,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
          }))
        }))
      },
      exportDate: new Date().toISOString(),
      version: '1.0'
    }

    // Create JSON file
    const jsonData = JSON.stringify(exportData, null, 2)
    const buffer = Buffer.from(jsonData, 'utf-8')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-${new Date().toISOString().split('T')[0]}.json"`,
        'Content-Length': buffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Error exporting user data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
