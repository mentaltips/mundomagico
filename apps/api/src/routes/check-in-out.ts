import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

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
            gte: new Date(new Date(date as string).setHours(0, 0, 0, 0)),
            lte: new Date(new Date(date as string).setHours(23, 59, 59, 999)),
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
router.post('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const checkedById = req.user?.sub
    const {
      childId,
      checkInTime,
      checkOutTime,
      date,
      broughtBy,
      broughtByDoc,
      broughtByPhoto,
      checkInSignature,
      checkInNote,
      pickedUpBy,
      pickedUpByDoc,
      pickedUpByPhoto,
      checkOutSignature,
      checkOutNote,
      status,
    } = req.body

    const recordDate = date ? new Date(date) : new Date()

    // Upsert - one record per child per day
    const record = await prisma.childCheckInOut.upsert({
      where: {
        childId_date: {
          childId,
          date: new Date(new Date(recordDate).setHours(0, 0, 0, 0)),
        }
      },
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
        checkedById,
      },
      create: {
        schoolId,
        childId,
        checkedById,
        date: new Date(new Date(recordDate).setHours(0, 0, 0, 0)),
        ...(checkInTime && { checkInTime: new Date(checkInTime) }),
        ...(checkOutTime && { checkOutTime: new Date(checkOutTime) }),
        broughtBy,
        broughtByDoc,
        broughtByPhoto,
        checkInSignature,
        checkInNote,
        pickedUpBy,
        pickedUpByDoc,
        pickedUpByPhoto,
        checkOutSignature,
        checkOutNote,
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
// Used by the admin check-in-out page
router.get('/children', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { date, groupId, status } = req.query

    const dateObj = date
      ? new Date((date as string) + 'T00:00:00')
      : new Date(new Date().setHours(0, 0, 0, 0))

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
        checkInOuts: { where: { date: dateObj } },
        guardians: {
          include: { guardian: true },
          where: { canPickup: true },
        },
        authorizedPickups: { where: { authorization: { in: ['SIM', 'TEMPORARIO'] } } },
      },
      orderBy: { fullName: 'asc' },
    })

    const result = children.map((child) => ({
      id: child.id,
      fullName: child.fullName,
      nickname: child.nickname,
      photoUrl: child.photoUrl,
      groupName: child.group?.name ?? null,
      usesDiapers: child.usesDiapers,
      checkInOut: child.checkInOuts[0] ?? null,
      authorizedPersons: [
        ...child.guardians.map((cg) => ({
          name: cg.guardian.fullName,
          relationship: cg.guardian.relationship,
          phone: cg.guardian.phone,
          cpf: cg.guardian.cpf,
          type: 'guardian' as const,
        })),
        ...child.authorizedPickups.map((ap) => ({
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

export default router
