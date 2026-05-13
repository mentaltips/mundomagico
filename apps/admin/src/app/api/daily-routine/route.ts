import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@mundo-magico/database'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')

    const today = new Date()

    const children = await prisma.child.findMany({
      where: {
        schoolId: session.user.schoolId,
        status: 'ATIVO',
        ...(groupId ? { groupId } : {}),
      },
      include: {
        group: true,
        dailyReports: {
          where: {
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
          }
        }
      },
      orderBy: { fullName: 'asc' }
    })

    return NextResponse.json(children)
  } catch (error) {
    console.error('[DAILY_ROUTINE_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    const body = await request.json()
    const { childId, date, meals, sleep, hygiene, moods, activities, isDraft } = body

    const reportDate = new Date(date)

    const report = await prisma.childDailyReport.upsert({
      where: {
        childId_date: {
          childId,
          date: startOfDay(reportDate)
        }
      },
      update: {
        isDraft,
        sentAt: isDraft ? null : new Date(),
        createdBy: session.user.id,
        // We'll handle relations separately or with nested writes if possible
      },
      create: {
        schoolId: session.user.schoolId,
        childId,
        date: startOfDay(reportDate),
        isDraft,
        sentAt: isDraft ? null : new Date(),
        createdBy: session.user.id,
      }
    })

    // Simple implementation for meals/sleep/etc. 
    // In a real app we'd sync these properly.
    if (meals) {
      await prisma.dailyMeal.deleteMany({ where: { reportId: report.id } })
      await prisma.dailyMeal.createMany({
        data: meals.map((m: any) => ({ ...m, reportId: report.id }))
      })
    }

    if (sleep) {
      await prisma.dailySleep.upsert({
        where: { reportId: report.id },
        update: { ...sleep },
        create: { ...sleep, reportId: report.id }
      })
    }

    if (hygiene) {
      await prisma.dailyHygiene.upsert({
        where: { reportId: report.id },
        update: { ...hygiene },
        create: { ...hygiene, reportId: report.id }
      })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('[DAILY_ROUTINE_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
