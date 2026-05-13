import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@mundo-magico/database'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // 1. Get Guardian and associated Children
    const guardian = await prisma.guardian.findFirst({
      where: { userId: session.user.id },
      include: {
        children: {
          include: {
            child: {
              include: {
                group: true,
              }
            }
          }
        }
      }
    })

    if (!guardian || guardian.children.length === 0) {
      return NextResponse.json({
        guardianName: session.user.name,
        children: []
      })
    }

    const primaryChild = guardian.children[0].child
    const today = new Date()

    // 2. Get Today's Daily Report
    const dailyReport = await prisma.childDailyReport.findFirst({
      where: {
        childId: primaryChild.id,
        date: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        }
      },
      include: {
        meals: true,
        sleep: true,
        hygiene: true,
        moods: true,
        activities: true,
      }
    })

    // 3. Get Announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        schoolId: session.user.schoolId,
        OR: [
          { groupId: primaryChild.groupId },
          { groupId: null }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    return NextResponse.json({
      guardianName: guardian.fullName,
      child: {
        id: primaryChild.id,
        name: primaryChild.nickname || primaryChild.fullName,
        fullName: primaryChild.fullName,
        group: primaryChild.group?.name || 'Sem Turma',
        shift: primaryChild.shift,
      },
      report: dailyReport ? {
        meals: dailyReport.meals,
        sleep: dailyReport.sleep,
        hygiene: dailyReport.hygiene,
        moods: dailyReport.moods,
        activities: dailyReport.activities,
        note: dailyReport.messageToParents,
        important: dailyReport.importantAlert,
      } : null,
      announcements: announcements.map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        date: a.createdAt,
      }))
    })

  } catch (error) {
    console.error('[PARENT_DASHBOARD_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
