import { AppError } from '../../shared/errors/AppError'
import { ERROR_CODES } from '../../shared/errors/error-codes'
import { toDateKey } from '../../shared/utils/date-key'
import * as checkInOutRepository from './check-in-out.repository'
import type { CheckInOutInput } from './check-in-out.schema'

export const normalizeDate = (dateStr?: string): Date => {
  let y: number, m: number, d: number
  if (!dateStr) {
    const now = new Date()
    y = now.getUTCFullYear(); m = now.getUTCMonth(); d = now.getUTCDate()
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/').map(Number)
    y = parts[2]; m = parts[1] - 1; d = parts[0]
  } else {
    const parts = dateStr.split('-').map(Number)
    y = parts[0]; m = parts[1] - 1; d = parts[2]
  }
  return new Date(Date.UTC(y, m, d, 0, 0, 0, 0))
}

export async function listRecords(schoolId: string, query: { date?: string; childId?: string }) {
  if (query.childId) {
    const childIsValid = await checkInOutRepository.verifyChild(query.childId, schoolId)
    if (!childIsValid) {
      throw new AppError('Crianca nao encontrada', 404, ERROR_CODES.NOT_FOUND)
    }
  }
  const startDate = query.date ? normalizeDate(query.date) : undefined
  const endDate = startDate ? new Date(startDate.getTime() + 86399999) : undefined

  return checkInOutRepository.findMany({
    schoolId,
    childId: query.childId,
    startDate,
    endDate,
  })
}

export async function registerCheckInOut(schoolId: string, checkedById: string | undefined, input: CheckInOutInput) {
  const childIsValid = await checkInOutRepository.verifyChild(input.childId, schoolId)
  if (!childIsValid) {
    throw new AppError('Crianca nao encontrada', 404, ERROR_CODES.NOT_FOUND)
  }

  const recordDate = normalizeDate(input.date || undefined)
  const dateKey = toDateKey(recordDate)

  const updateData = {
    ...(input.checkInTime && { checkInTime: new Date(input.checkInTime) }),
    ...(input.checkOutTime && { checkOutTime: new Date(input.checkOutTime) }),
    ...(input.broughtBy !== undefined && { broughtBy: input.broughtBy }),
    ...(input.broughtByDoc !== undefined && { broughtByDoc: input.broughtByDoc }),
    ...(input.broughtByPhoto !== undefined && { broughtByPhoto: input.broughtByPhoto }),
    ...(input.checkInSignature !== undefined && { checkInSignature: input.checkInSignature }),
    ...(input.checkInNote !== undefined && { checkInNote: input.checkInNote }),
    ...(input.pickedUpBy !== undefined && { pickedUpBy: input.pickedUpBy }),
    ...(input.pickedUpByDoc !== undefined && { pickedUpByDoc: input.pickedUpByDoc }),
    ...(input.pickedUpByPhoto !== undefined && { pickedUpByPhoto: input.pickedUpByPhoto }),
    ...(input.checkOutSignature !== undefined && { checkOutSignature: input.checkOutSignature }),
    ...(input.checkOutNote !== undefined && { checkOutNote: input.checkOutNote }),
    ...(input.status && { status: input.status }),
    date: recordDate,
    dateKey,
    checkedById,
  }

  const createData = {
    schoolId,
    childId: input.childId,
    checkedById,
    date: recordDate,
    dateKey,
    ...(input.checkInTime && { checkInTime: new Date(input.checkInTime) }),
    ...(input.checkOutTime && { checkOutTime: new Date(input.checkOutTime) }),
    broughtBy: input.broughtBy || null,
    broughtByDoc: input.broughtByDoc || null,
    broughtByPhoto: input.broughtByPhoto || null,
    checkInSignature: input.checkInSignature || null,
    checkInNote: input.checkInNote || null,
    pickedUpBy: input.pickedUpBy || null,
    pickedUpByDoc: input.pickedUpByDoc || null,
    pickedUpByPhoto: input.pickedUpByPhoto || null,
    checkOutSignature: input.checkOutSignature || null,
    checkOutNote: input.checkOutNote || null,
    status: input.status || 'PRESENTE',
  }

  return checkInOutRepository.upsert(input.childId, dateKey, updateData, createData)
}

export async function listChildrenStatus(schoolId: string, query: { date?: string; groupId?: string; status?: string }) {
  if (query.groupId) {
    const groupIsValid = await checkInOutRepository.verifyGroup(query.groupId, schoolId)
    if (!groupIsValid) {
      throw new AppError('Turma nao encontrada', 404, ERROR_CODES.NOT_FOUND)
    }
  }

  const dateObj = normalizeDate(query.date)
  const dateEnd = new Date(dateObj.getTime() + 86399999)

  const statusList = query.status
    ? query.status.split(',')
    : ['ATIVO', 'ADAPTACAO']

  const children = await checkInOutRepository.findChildrenWithStatus({
    schoolId,
    groupId: query.groupId,
    statusList,
    startDate: dateObj,
    endDate: dateEnd,
  })

  return children.map((child: any) => ({
    id: child.id,
    fullName: child.fullName,
    nickname: child.nickname,
    photoUrl: child.photoUrl,
    groupName: child.group?.name ?? null,
    usesDiapers: child.usesDiapers,
    checkInOut: child.checkInOuts[0] ?? null,
    authorizedPersons: [
      ...child.guardians.map((cg: any) => ({
        name: cg.guardian.fullName,
        relationship: cg.guardian.relationship,
        phone: cg.guardian.phone,
        cpf: cg.guardian.cpf,
        type: 'guardian' as const,
      })),
      ...child.authorizedPickups.map((ap: any) => ({
        name: ap.fullName,
        relationship: ap.relationship,
        phone: ap.phone,
        cpf: ap.cpf,
        type: 'authorized' as const,
      })),
    ],
  }))
}

export async function getMonthlyReport(schoolId: string, query: { year?: string; month?: string; groupId?: string }) {
  if (query.groupId) {
    const groupIsValid = await checkInOutRepository.verifyGroup(query.groupId, schoolId)
    if (!groupIsValid) {
      throw new AppError('Turma nao encontrada', 404, ERROR_CODES.NOT_FOUND)
    }
  }

  const y = parseInt(query.year || '') || new Date().getUTCFullYear()
  const m = parseInt(query.month || '') || new Date().getUTCMonth() + 1

  const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0))
  const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999))

  const businessDays: string[] = []
  const cur = new Date(startDate)
  while (cur <= endDate) {
    const dow = cur.getUTCDay()
    if (dow !== 0 && dow !== 6) {
      businessDays.push(cur.toISOString().slice(0, 10))
    }
    cur.setUTCDate(cur.getUTCDate() + 1)
  }

  const children = await checkInOutRepository.findMonthlyChildren({
    schoolId,
    groupId: query.groupId,
    startDate,
    endDate,
  })

  const report = children.map((child: any) => {
    const checkMap: Record<string, any> = {}
    for (const rec of child.checkInOuts) {
      const key = new Date(rec.date).toISOString().slice(0, 10)
      checkMap[key] = rec
    }

    const presentDays = child.checkInOuts.filter(
      (r: any) => r.status === 'PRESENTE' || r.status === 'AGUARDANDO_RETIRADA'
    ).length
    const absentDays = businessDays.length - presentDays
    const attendanceRate = businessDays.length > 0
      ? Math.round((presentDays / businessDays.length) * 100)
      : 0

    return {
      id: child.id,
      fullName: child.fullName,
      nickname: child.nickname,
      photoUrl: child.photoUrl,
      groupName: child.group?.name ?? null,
      groupId: child.groupId,
      presentDays,
      absentDays,
      attendanceRate,
      totalBusinessDays: businessDays.length,
      days: businessDays.map((dateStr) => {
        const rec = checkMap[dateStr]
        return {
          date: dateStr,
          status: rec?.status ?? 'AUSENTE',
          checkInTime: rec?.checkInTime ?? null,
          checkOutTime: rec?.checkOutTime ?? null,
          broughtBy: rec?.broughtBy ?? null,
          pickedUpBy: rec?.pickedUpBy ?? null,
        }
      }),
    }
  })

  return {
    year: y,
    month: m,
    businessDays,
    totalChildren: children.length,
    report,
  }
}
