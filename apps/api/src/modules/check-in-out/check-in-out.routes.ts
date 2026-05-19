import { Router } from 'express'
import { prisma } from '@mundo-magico/database'
import { validate } from '../../middleware/validate'
import { checkInOutSchema } from '../../schemas'
import { toDateKey } from '../../shared/utils/date-key'

const router = Router()

// Helper: normaliza data para meia-noite UTC
const normalizeDate = (dateStr?: string): Date => {
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

// GET / - List check-in/out records
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { date, childId } = req.query
    const records = await prisma.childCheckInOut.findMany({
      where: {
        schoolId,
        ...(childId && { childId: childId as string }),
        ...(date && {
          date: {
            gte: normalizeDate(date as string),
            lte: new Date(normalizeDate(date as string).getTime() + 86399999),
          }
        })
      },
      include: {
        child: true,
        checkedBy: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' }
    })
    res.json(records)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST / - Register check-in or check-out
router.post('/', validate(checkInOutSchema), async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const checkedById = req.user?.sub
    const {
      childId, checkInTime, checkOutTime, date,
      broughtBy, broughtByDoc, broughtByPhoto, checkInSignature, checkInNote,
      pickedUpBy, pickedUpByDoc, pickedUpByPhoto, checkOutSignature, checkOutNote,
      status,
    } = req.body

    const recordDate = normalizeDate(date as string)
    const dateKey = toDateKey(recordDate)
    console.log(`[CheckInOutAPI] POST - childId: ${childId}, date: ${date}, normalized: ${recordDate.toISOString()}`)

    const record = await prisma.childCheckInOut.upsert({
      where: { childId_dateKey: { childId, dateKey } },
      update: {
        ...(checkInTime && { checkInTime: new Date(checkInTime) }),
        ...(checkOutTime && { checkOutTime: new Date(checkOutTime) }),
        ...(broughtBy !== undefined && { broughtBy }),
        ...(broughtByDoc !== undefined && { broughtByDoc }),
        ...(broughtByPhoto !== undefined && { broughtByPhoto }),
        ...(checkInSignature !== undefined && { checkInSignature }),
        ...(checkInNote !== undefined && { checkInNote }),
        ...(pickedUpBy !== undefined && { pickedUpBy }),
        ...(pickedUpByDoc !== undefined && { pickedUpByDoc }),
        ...(pickedUpByPhoto !== undefined && { pickedUpByPhoto }),
        ...(checkOutSignature !== undefined && { checkOutSignature }),
        ...(checkOutNote !== undefined && { checkOutNote }),
        ...(status && { status }),
        date: recordDate,
        dateKey,
        checkedById,
      },
      create: {
        schoolId, childId, checkedById,
        date: recordDate,
        dateKey,
        ...(checkInTime && { checkInTime: new Date(checkInTime) }),
        ...(checkOutTime && { checkOutTime: new Date(checkOutTime) }),
        broughtBy, broughtByDoc, broughtByPhoto, checkInSignature, checkInNote,
        pickedUpBy, pickedUpByDoc, pickedUpByPhoto, checkOutSignature, checkOutNote,
        status: status || 'PRESENTE',
      },
    })
    res.status(201).json(record)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /children - Children with check-in/out status for a given date
router.get('/children', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { date, groupId, status } = req.query

    const dateObj = normalizeDate(date as string)
    const dateEnd = new Date(dateObj.getTime() + 86399999)

    const statusList = status
      ? (status as string).split(',')
      : ['ATIVO', 'ADAPTACAO']

    const children = await prisma.child.findMany({
      where: {
        schoolId,
        status: { in: statusList },
        ...(groupId ? { groupId: groupId as string } : {}),
      },
      include: {
        group: true,
        checkInOuts: {
          where: {
            date: { gte: dateObj, lte: dateEnd }
          }
        },
        guardians: {
          include: { guardian: true },
          where: { canPickup: true },
        },
        authorizedPickups: {
          where: { authorization: { in: ['SIM', 'TEMPORARIO'] } }
        },
      },
      orderBy: { fullName: 'asc' },
    })

    const result = children.map((child: any) => ({
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

    res.json(result)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /report/monthly - Monthly attendance report per child
// Query: year=2026&month=5&groupId=xxx (optional)
router.get('/report/monthly', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { year, month, groupId } = req.query

    const y = parseInt(year as string) || new Date().getUTCFullYear()
    const m = parseInt(month as string) || new Date().getUTCMonth() + 1

    const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0))
    const endDate   = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)) // last day of month

    // Business days in the month (Mon-Fri)
    const businessDays: string[] = []
    const cur = new Date(startDate)
    while (cur <= endDate) {
      const dow = cur.getUTCDay()
      if (dow !== 0 && dow !== 6) {
        businessDays.push(cur.toISOString().slice(0, 10))
      }
      cur.setUTCDate(cur.getUTCDate() + 1)
    }

    const children = await prisma.child.findMany({
      where: {
        schoolId,
        status: { in: ['ATIVO', 'ADAPTACAO'] },
        ...(groupId ? { groupId: groupId as string } : {}),
      },
      include: {
        group: true,
        checkInOuts: {
          where: {
            date: { gte: startDate, lte: endDate }
          },
          orderBy: { date: 'asc' },
        },
      },
      orderBy: [{ group: { name: 'asc' } }, { fullName: 'asc' }],
    })

    const report = children.map((child: any) => {
      const checkMap: Record<string, any> = {}
      for (const rec of child.checkInOuts) {
        const key = new Date(rec.date).toISOString().slice(0, 10)
        checkMap[key] = rec
      }

      const presentDays    = child.checkInOuts.filter((r: any) => r.status === 'PRESENTE' || r.status === 'AGUARDANDO_RETIRADA').length
      const absentDays     = businessDays.length - presentDays
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
        days: businessDays.map(dateStr => {
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

    res.json({
      year: y,
      month: m,
      businessDays,
      totalChildren: children.length,
      report,
    })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
