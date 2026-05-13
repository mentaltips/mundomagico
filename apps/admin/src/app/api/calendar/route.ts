import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') // formato: yyyy-MM

    let dateFilter = {}
    if (month) {
      const [year, m] = month.split('-').map(Number)
      const start = new Date(year, m - 1, 1)
      const end = new Date(year, m, 0, 23, 59, 59)
      dateFilter = { date: { gte: start, lte: end } }
    }

    const events = await prisma.calendarEvent.findMany({
      where: { schoolId: session.user.schoolId, ...dateFilter },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('[CALENDAR_GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 })
  }
}

const schema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().optional(),
  date: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  type: z.enum(['EVENTO', 'REUNIAO', 'FERIADO', 'FESTIVIDADE', 'OUTRO']).default('EVENTO'),
  groupId: z.string().optional(),
  location: z.string().optional(),
  color: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = schema.parse(body)

    const event = await prisma.calendarEvent.create({
      data: {
        schoolId: session.user.schoolId,
        title: data.title,
        description: data.description,
        date: new Date(data.date + 'T12:00:00'),
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type,
        groupId: data.groupId || null,
        location: data.location,
        color: data.color || '#38bdf8',
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('[CALENDAR_POST]', error)
    return NextResponse.json({ error: 'Erro ao criar evento' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const event = await prisma.calendarEvent.findUnique({ where: { id } })
    if (!event || event.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
    }

    await prisma.calendarEvent.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[CALENDAR_DELETE]', error)
    return NextResponse.json({ error: 'Erro ao excluir evento' }, { status: 500 })
  }
}
