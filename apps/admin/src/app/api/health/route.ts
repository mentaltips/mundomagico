import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@mundo-magico/database'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    const medications = await prisma.medication.findMany({
      where: { 
        schoolId: session.user.schoolId,
        active: true 
      },
      include: { 
        child: {
          select: {
            fullName: true,
            nickname: true,
            photoUrl: true,
            groupId: true,
            group: { select: { name: true } }
          }
        },
        administrations: {
          orderBy: { administeredAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(medications)
  } catch (error) {
    console.error('[HEALTH_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    const body = await request.json()
    const { medicationId, dosage, notes } = body

    const administration = await prisma.medicationAdministration.create({
      data: {
        medicationId,
        dosage,
        notes,
        administeredBy: session.user.id,
        administeredAt: new Date()
      }
    })

    return NextResponse.json(administration)
  } catch (error) {
    console.error('[HEALTH_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
