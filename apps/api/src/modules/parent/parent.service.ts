import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import * as parentRepository from './parent.repository'

export async function getParentDashboard(schoolId: string, userId: string) {
  const guardian = await parentRepository.findGuardianByUserId(userId, schoolId)
  if (!guardian) {
    throw new AppError('Guardian profile not found', 404, ERROR_CODES.NOT_FOUND)
  }

  const childGuardians = await parentRepository.findChildrenByGuardianId(guardian.id, schoolId)
  const children = childGuardians.map((cg) => cg.child)
  const childIds = children.map((c) => c.id)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const checkIns = await parentRepository.findCheckInOutsForChildren(schoolId, childIds, today, todayEnd)

  const minDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const latestReports = await parentRepository.findLatestDailyReports(schoolId, childIds, minDate)

  const sortedReports = [...latestReports].sort((a: any, b: any) => {
    const aIsNormalized = new Date(a.date).toISOString().endsWith('T00:00:00.000Z')
    const bIsNormalized = new Date(b.date).toISOString().endsWith('T00:00:00.000Z')
    if (aIsNormalized && !bIsNormalized) return -1
    if (!aIsNormalized && bIsNormalized) return 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const currentReport = sortedReports[0] || null

  const pendingInvoices = await parentRepository.findPendingInvoices(schoolId, childIds)
  const photos = await parentRepository.findSharedPhotos(schoolId, childIds)
  const announcements = await parentRepository.findGuardianAnnouncements(schoolId)

  let report = null
  if (currentReport) {
    report = {
      meals: currentReport.meals.map((m: any) => ({
        id: m.id,
        mealType: m.mealType,
        result: m.result,
        amount: m.amount,
        observation: m.observation,
      })),
      sleep: currentReport.sleep,
      hygiene: currentReport.hygiene,
      moods: currentReport.moods,
      activities: currentReport.activities.map((a: any) => ({
        name: a.activityType,
        description: a.description,
      })),
      note: currentReport.messageToParents,
      important: currentReport.importantAlert,
    }
  }

  return {
    guardian,
    guardianName: guardian.fullName,
    children,
    child: children[0]
      ? {
          id: children[0].id,
          name: children[0].fullName.split(' ')[0],
          fullName: children[0].fullName,
          group: children[0].group?.name,
          shift: children[0].group?.shift,
        }
      : null,
    checkIns,
    report,
    latestReports,
    pendingInvoices,
    photos,
    announcements: announcements.map((a: any) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      date: a.createdAt,
    })),
  }
}

export async function getParentFeed(schoolId: string, userId: string, page = 1, limit = 20) {
  const guardian = await parentRepository.findGuardianByUserId(userId, schoolId)
  if (!guardian) {
    throw new AppError('Guardian profile not found', 404, ERROR_CODES.NOT_FOUND)
  }

  const childGuardians = await parentRepository.findChildrenByGuardianId(guardian.id, schoolId)
  const childIds = childGuardians.map((cg) => cg.childId)

  const skip = (page - 1) * limit
  const feed: any[] = []

  const reports = await parentRepository.findDailyReportsForFeed(schoolId, childIds, limit, skip)
  reports.forEach((r: any) => {
    const isNormalized = new Date(r.date).toISOString().endsWith('T00:00:00.000Z')
    if (!isNormalized) return

    feed.push({
      id: `report-${r.id}`,
      type: 'DAILY_REPORT',
      title: 'Diário de Rotina',
      description: r.messageToParents || 'Acompanhe as atividades e cuidados de hoje.',
      time: r.sentAt
        ? new Date(r.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : new Date(r.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      date: r.date,
      icon: 'Utensils',
      color: 'text-primary',
      data: r,
    })
  })

  const photos = await parentRepository.findPhotosForFeed(schoolId, childIds, limit)
  photos.forEach((p: any) => {
    feed.push({
      id: `photo-${p.id}`,
      type: 'PHOTO',
      title: 'Nova Foto',
      description: `${p.child.fullName.split(' ')[0]} apareceu em uma nova foto!`,
      time: new Date(p.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      date: p.date,
      icon: 'Camera',
      color: 'text-amber-500',
      data: p,
    })
  })

  const announcements = await parentRepository.findAnnouncementsForFeed(schoolId, limit)
  announcements.forEach((a: any) => {
    feed.push({
      id: `announcement-${a.id}`,
      type: 'ANNOUNCEMENT',
      title: a.title,
      description: a.content,
      time: new Date(a.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      date: a.createdAt,
      icon: 'Megaphone',
      color: 'text-violet-500',
      data: a,
    })
  })

  const devReports = await parentRepository.findDevelopmentReportsForFeed(schoolId, childIds)
  devReports.forEach((dr: any) => {
    feed.push({
      id: `dev-report-${dr.id}`,
      type: 'DEVELOPMENT_REPORT',
      title: 'Relatório de Desenvolvimento',
      description: 'Um novo relatório de desempenho está disponível.',
      time: new Date(dr.publishedAt || dr.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      date: dr.publishedAt || dr.updatedAt,
      icon: 'Star',
      color: 'text-emerald-500',
      data: dr,
    })
  })

  feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return {
    page,
    limit,
    items: feed.slice(0, limit),
  }
}
