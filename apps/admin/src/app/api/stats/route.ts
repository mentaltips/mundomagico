import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@mundo-magico/database'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const schoolId = session.user.schoolId
    const today = new Date()

    const [totalChildren, totalStudents, totalGroups, presentToday, activeAnnouncements] =
      await Promise.all([
        prisma.child.count({ where: { schoolId, status: 'ATIVO' } }),
        prisma.student.count({ where: { schoolId, status: 'ATIVO' } }),
        prisma.group.count({ where: { schoolId, active: true } }),
        prisma.childCheckInOut.count({
          where: {
            schoolId,
            status: 'PRESENTE',
            date: { gte: startOfDay(today), lte: endOfDay(today) },
          },
        }),
        prisma.announcement.count({ where: { schoolId } }),
      ])

    const totalAlunos = totalChildren + totalStudents
    const attendanceRate =
      totalAlunos > 0 ? `${Math.round((presentToday / totalAlunos) * 100)}%` : '—'

    return NextResponse.json({
      totalStudents: totalAlunos,
      activeAlunos: totalAlunos,
      totalGroups,
      presentToday,
      pendingInvoices: activeAnnouncements,
      attendanceRate,
    })
  } catch (error) {
    console.error('[STATS_GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
