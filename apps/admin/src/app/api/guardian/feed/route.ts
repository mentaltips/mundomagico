import { NextResponse } from 'next/server'
import { getApiAuth } from '../../../../lib/auth'
import { prisma } from '@mundo-magico/database'

export async function GET(req: Request) {
  const user = await getApiAuth(req)

  if (!user || user.role !== 'GUARDIAN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get('date')

  try {
    // 1. Encontrar o perfil de Guardian vinculado ao usuário
    const guardian = await prisma.guardian.findFirst({
      where: { userId: user.id },
      include: {
        children: {
          include: {
            child: true
          }
        }
      }
    })

    if (!guardian || guardian.children.length === 0) {
      return NextResponse.json({ items: [], childName: 'Seu filho' })
    }

    const firstChild = guardian.children[0].child
    const targetDate = dateParam ? new Date(dateParam + 'T00:00:00') : new Date()
    targetDate.setHours(0, 0, 0, 0)

    const nextDay = new Date(targetDate)
    nextDay.setDate(targetDate.getDate() + 1)

    // 2. Buscar atividades do dia
    const checkIn = await prisma.childCheckInOut.findFirst({
      where: {
        childId: firstChild.id,
        date: { gte: targetDate, lt: nextDay }
      }
    })

    const items: any[] = []

    if (checkIn) {
      if (checkIn.checkInTime) {
        items.push({
          id: 'checkin-' + checkIn.id,
          type: 'CHECK_IN',
          title: 'Chegada na Escola',
          description: checkIn.broughtBy ? `Trazido por ${checkIn.broughtBy}` : 'Entrada registrada',
          time: checkIn.checkInTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          icon: 'LogIn',
          color: 'green-600'
        })
      }
      
      if (checkIn.checkOutTime) {
        items.push({
          id: 'checkout-' + checkIn.id,
          type: 'CHECK_OUT',
          title: 'Saída da Escola',
          description: checkIn.pickedUpBy ? `Retirado por ${checkIn.pickedUpBy}` : 'Saída registrada',
          time: checkIn.checkOutTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          icon: 'LogOut',
          color: 'red-600'
        })
      }
    }

    // Buscar Diário do dia
    const report = await prisma.childDailyReport.findFirst({
      where: {
        childId: firstChild.id,
        date: { gte: targetDate, lt: nextDay }
      },
      include: {
        meals: true,
        sleep: true,
        hygiene: true,
      }
    })

    if (report) {
      report.meals.forEach(meal => {
        items.push({
          id: 'meal-' + meal.id,
          type: 'MEAL',
          title: meal.mealType,
          description: `Comeu: ${meal.result || meal.amount || 'Informado'}. ${meal.description || ''}`,

          time: meal.time ? new Date(meal.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
          icon: 'Utensils',
          color: 'orange-500'
        })
      })

      if (report.sleep) {
        let sleepDesc = report.sleep.slept ? `Dormiu. Qualidade: ${report.sleep.quality}` : 'Não dormiu hoje.'
        if (report.sleep.sleepTime && report.sleep.wakeTime) {
          sleepDesc += ` (${report.sleep.sleepTime} - ${report.sleep.wakeTime})`
        }
        if (report.sleep.observation) sleepDesc += `. ${report.sleep.observation}`

        items.push({
          id: 'sleep-' + report.sleep.id,
          type: 'SLEEP',
          title: 'Soneca',
          description: sleepDesc,
          time: report.sleep.sleepTime || '--:--',
          icon: 'Moon',
          color: 'blue-500'
        })
      }

      if (report.hygiene) {
        items.push({
          id: 'hygiene-' + report.hygiene.id,
          type: 'HYGIENE',
          title: 'Higiene',
          description: `Trocas de fralda: ${report.hygiene.diaperChanges}. ${report.hygiene.bath ? 'Tomou banho.' : ''}`,
          time: '--:--', // Higiene geralmente não tem horário específico no feed resumido
          icon: 'Droplets',
          color: 'sky-500'
        })
      }
    }

    // Ordenar por hora descrescente (mais recente primeiro)
    items.sort((a, b) => b.time.localeCompare(a.time))

    return NextResponse.json({
      childName: firstChild.nickname || firstChild.fullName.split(' ')[0],
      items: items
    })

  } catch (error) {
    console.error('Error fetching guardian feed:', error)
    return NextResponse.json({ error: 'Erro ao buscar feed' }, { status: 500 })
  }
}
