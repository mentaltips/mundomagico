import { NextResponse } from 'next/server'
import { getApiAuth } from '../../../../../lib/auth'
import { prisma } from '@mundo-magico/database'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getApiAuth(req)

  if (!user || !['ADMIN', 'DIRECTOR', 'TEACHER', 'CAREGIVER'].includes(user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const group = await prisma.group.findUnique({
      where: {
        id: params.id,
        schoolId: user.schoolId
      },
      include: {
        children: {
          where: {
            status: 'ATIVO'
          },
          select: {
            id: true,
            fullName: true,
            nickname: true,
            photoUrl: true
          },
          orderBy: {
            fullName: 'asc'
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 })
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error fetching class details:', error)
    return NextResponse.json({ error: 'Erro ao buscar detalhes da turma' }, { status: 500 })
  }
}
