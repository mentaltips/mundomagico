import { NextResponse } from 'next/server'
import { getApiAuth } from '../../../../lib/auth'
import { prisma } from '@mundo-magico/database'

export async function GET(req: Request) {
  const user = await getApiAuth(req)

  if (!user || !['ADMIN', 'DIRECTOR', 'TEACHER', 'CAREGIVER'].includes(user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const groups = await prisma.group.findMany({
      where: {
        schoolId: user.schoolId,
        active: true,
      },
      include: {
        _count: {
          select: { children: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Error fetching teacher groups:', error)
    return NextResponse.json({ error: 'Erro ao buscar turmas' }, { status: 500 })
  }
}
