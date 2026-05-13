import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@mundo-magico/database'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    const announcements = await prisma.announcement.findMany({
      where: { schoolId: session.user.schoolId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(announcements)
  } catch (error) {
    console.error('[ANNOUNCEMENTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    const body = await request.json()
    const { title, content, type, groupId, priority } = body

    const announcement = await prisma.announcement.create({
      data: {
        schoolId: session.user.schoolId,
        title,
        content,
        groupId: groupId || null,
      }
    })

    return NextResponse.json(announcement)
  } catch (error) {
    console.error('[ANNOUNCEMENTS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const announcement = await prisma.announcement.findUnique({ where: { id } })
    if (!announcement || announcement.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: 'Comunicado não encontrado' }, { status: 404 })
    }

    await prisma.announcement.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[ANNOUNCEMENTS_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
