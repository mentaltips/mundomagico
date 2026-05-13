import { NextResponse } from 'next/server'
import { getApiAuth } from '../../../../lib/auth'
import { prisma } from '@mundo-magico/database'

export async function GET(req: Request) {
  const user = await getApiAuth(req)
  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('groupId')

  if (!user || !['ADMIN', 'DIRECTOR', 'TEACHER', 'CAREGIVER'].includes(user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!groupId) {
    return NextResponse.json({ error: 'ID da turma é obrigatório' }, { status: 400 })
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const group = await prisma.group.findUnique({
      where: { id: groupId, schoolId: user.schoolId },
      include: {
        children: {
          where: { status: 'ATIVO' },
          select: {
            id: true,
            fullName: true,
            nickname: true,
            photoUrl: true,
            checkInOuts: {
              where: {
                date: { gte: today }
              },
              take: 1
            }
          },
          orderBy: { fullName: 'asc' }
        }
      }
    })

    if (!group) return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 })

    const formattedChildren = group.children.map(c => {
      const checkIn = c.checkInOuts[0]
      return {
        id: c.id,
        fullName: c.fullName,
        nickname: c.nickname,
        photoUrl: c.photoUrl,
        attendanceStatus: checkIn?.status || 'AUSENTE',
        checkInTime: checkIn?.checkInTime,
        checkOutTime: checkIn?.checkOutTime,
      }
    })

    return NextResponse.json({
      groupName: group.name,
      children: formattedChildren
    })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: 'Erro ao buscar dados da chamada' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await getApiAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { childId, type } = await req.json()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const now = new Date()

    if (type === 'IN') {
      const record = await prisma.childCheckInOut.upsert({
        where: { childId_date: { childId, date: today } },
        create: {
          schoolId: user.schoolId,
          childId,
          date: today,
          checkInTime: now,
          status: 'PRESENTE',
          checkedById: user.id
        },
        update: {
          checkInTime: now,
          status: 'PRESENTE',
          checkedById: user.id
        }
      })
      return NextResponse.json(record)
    } else if (type === 'OUT') {
      const record = await prisma.childCheckInOut.update({
        where: { childId_date: { childId, date: today } },
        data: {
          checkOutTime: now,
          status: 'SAIU_MAIS_CEDO', // Ou definir baseado no horário da turma
          checkedById: user.id
        }
      })
      return NextResponse.json(record)
    }

    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  } catch (error) {
    console.error('Error recording attendance:', error)
    return NextResponse.json({ error: 'Erro ao registrar' }, { status: 500 })
  }
}
