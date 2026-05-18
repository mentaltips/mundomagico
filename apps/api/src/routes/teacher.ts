import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// GET /dashboard - Teacher dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub
    const role = req.user?.role

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    // 1. Fetch Staff record associated with the user
    const staff = await prisma.staff.findFirst({
      where: { userId, schoolId, status: 'ACTIVE' }
    })

    // 2. Fetch groups (classes) for this teacher
    let groups: any[] = []
    if (staff) {
      const assignments = await prisma.staffGroupAssignment.findMany({
        where: { staffId: staff.id, status: 'ACTIVE' },
        include: {
          group: {
            include: {
              _count: { select: { children: true, students: true } }
            }
          }
        }
      })
      groups = assignments.map(a => a.group)
    } else if (['ADMIN', 'DIRECTOR'].includes(role || '')) {
      groups = await prisma.group.findMany({
        where: { schoolId, active: true },
        include: {
          _count: { select: { children: true, students: true } }
        }
      })
    }

    const groupIds = groups.map(g => g.id)

    // 3. Fetch check-ins for these specific groups
    const todayCheckIns = await prisma.childCheckInOut.findMany({
      where: {
        schoolId,
        date: { gte: today, lte: todayEnd },
        child: { groupId: { in: groupIds } }
      },
      include: { child: { select: { id: true, fullName: true } } }
    })

    // 4. Count pending reports for these specific groups
    const pendingReports = await prisma.childDailyReport.count({
      where: {
        schoolId,
        isDraft: true,
        date: { gte: today, lte: todayEnd },
        child: { groupId: { in: groupIds } }
      }
    })

    // 5. Fetch announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        schoolId,
        OR: [{ targetRole: 'TEACHER' }, { targetRole: 'CAREGIVER' }, { targetRole: null }]
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    res.json({ groups, todayCheckIns, pendingReports, announcements })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /classes - List classes (groups) for this school
router.get('/classes', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub
    const role = req.user?.role

    const staff = await prisma.staff.findFirst({
      where: { userId, schoolId, status: 'ACTIVE' }
    })

    let classes: any[] = []
    if (staff) {
      const assignments = await prisma.staffGroupAssignment.findMany({
        where: { staffId: staff.id, status: 'ACTIVE' },
        include: {
          group: {
            include: {
              children: {
                select: { id: true, fullName: true, photoUrl: true, status: true }
              },
              students: {
                select: { id: true, fullName: true, photoUrl: true, status: true }
              },
              _count: { select: { children: true, students: true } }
            }
          }
        }
      })
      classes = assignments.map(a => a.group)
    } else if (['ADMIN', 'DIRECTOR'].includes(role || '')) {
      classes = await prisma.group.findMany({
        where: { schoolId, active: true },
        include: {
          children: {
            select: { id: true, fullName: true, photoUrl: true, status: true }
          },
          students: {
            select: { id: true, fullName: true, photoUrl: true, status: true }
          },
          _count: { select: { children: true, students: true } }
        },
        orderBy: { name: 'asc' }
      })
    }
    res.json(classes)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /classes/:id - Get class details
router.get('/classes/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub
    const role = req.user?.role
    const groupId = req.params.id

    const staff = await prisma.staff.findFirst({
      where: { userId, schoolId, status: 'ACTIVE' }
    })

    if (staff) {
      const assignment = await prisma.staffGroupAssignment.findFirst({
        where: { staffId: staff.id, groupId, status: 'ACTIVE' }
      })
      if (!assignment) {
        return res.status(403).json({ error: 'Você não tem permissão para acessar esta turma.' })
      }
    } else if (!['ADMIN', 'DIRECTOR'].includes(role || '')) {
      return res.status(403).json({ error: 'Acesso negado.' })
    }

    const group = await prisma.group.findFirst({
      where: { id: groupId, schoolId },
      include: {
        children: {
          where: { status: 'ATIVO' },
          include: {
            medications: { where: { active: true } },
          }
        },
        students: { where: { status: 'ATIVO' } },
      }
    })
    if (!group) return res.status(404).json({ error: 'Class not found' })
    res.json(group)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /attendance - Get attendance for a date
router.get('/attendance', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub
    const role = req.user?.role
    const { date, groupId } = req.query
    const queryDate = date ? new Date(date as string) : new Date()
    queryDate.setHours(0, 0, 0, 0)
    const queryDateEnd = new Date(queryDate)
    queryDateEnd.setHours(23, 59, 59, 999)

    const staff = await prisma.staff.findFirst({
      where: { userId, schoolId, status: 'ACTIVE' }
    })

    let targetGroupIds: string[] = []
    if (groupId) {
      targetGroupIds = [groupId as string]
      if (staff) {
        const assignment = await prisma.staffGroupAssignment.findFirst({
          where: { staffId: staff.id, groupId: groupId as string, status: 'ACTIVE' }
        })
        if (!assignment) {
          return res.status(403).json({ error: 'Você não tem permissão para acessar esta turma.' })
        }
      } else if (!['ADMIN', 'DIRECTOR'].includes(role || '')) {
        return res.status(403).json({ error: 'Acesso negado.' })
      }
    } else {
      if (staff) {
        const assignments = await prisma.staffGroupAssignment.findMany({
          where: { staffId: staff.id, status: 'ACTIVE' },
          select: { groupId: true }
        })
        targetGroupIds = assignments.map(a => a.groupId)
      } else if (!['ADMIN', 'DIRECTOR'].includes(role || '')) {
        return res.status(403).json({ error: 'Acesso negado.' })
      }
    }

    const children = await prisma.child.findMany({
      where: {
        schoolId,
        status: 'ATIVO',
        ...(targetGroupIds.length > 0 ? { groupId: { in: targetGroupIds } } : groupId ? { groupId: groupId as string } : {}),
      },
      include: {
        group: { select: { id: true, name: true } },
        checkInOuts: {
          where: { date: { gte: queryDate, lte: queryDateEnd } },
          take: 1
        }
      },
      orderBy: { fullName: 'asc' }
    })
    res.json(children)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /attendance - Register attendance batch
router.post('/attendance', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const userId = req.user?.sub
    const role = req.user?.role
    const checkedById = req.user?.sub
    const { records, date } = req.body // records: [{ childId, status, checkInTime?, checkOutTime? }]

    if (!Array.isArray(records)) return res.status(400).json({ error: 'records must be an array' })

    const staff = await prisma.staff.findFirst({
      where: { userId, schoolId, status: 'ACTIVE' }
    })

    if (!staff && !['ADMIN', 'DIRECTOR'].includes(role || '')) {
      return res.status(403).json({ error: 'Acesso negado.' })
    }

    const childrenIds = records.map((r: any) => r.childId)
    const children = await prisma.child.findMany({
      where: { id: { in: childrenIds }, schoolId },
      select: { id: true, groupId: true }
    })

    if (children.length !== childrenIds.length) {
      return res.status(400).json({ error: 'Uma ou mais crianças não foram encontradas nesta escola.' })
    }

    if (staff) {
      const assignments = await prisma.staffGroupAssignment.findMany({
        where: { staffId: staff.id, status: 'ACTIVE' },
        select: { groupId: true }
      })
      const allowedGroupIds = assignments.map(a => a.groupId)

      const unauthorized = children.some(c => !c.groupId || !allowedGroupIds.includes(c.groupId))
      if (unauthorized) {
        return res.status(403).json({ error: 'Você não tem permissão para registrar frequência para uma ou mais crianças selecionadas.' })
      }
    }

    const recordDate = date ? new Date(date) : new Date()
    recordDate.setHours(0, 0, 0, 0)

    const results = await Promise.all(records.map(async (record: any) => {
      return prisma.childCheckInOut.upsert({
        where: { childId_date: { childId: record.childId, date: recordDate } },
        update: {
          status: record.status,
          checkedById,
          ...(record.checkInTime && { checkInTime: new Date(record.checkInTime) }),
          ...(record.checkOutTime && { checkOutTime: new Date(record.checkOutTime) }),
        },
        create: {
          schoolId,
          childId: record.childId,
          date: recordDate,
          status: record.status || 'PRESENTE',
          checkedById,
          ...(record.checkInTime && { checkInTime: new Date(record.checkInTime) }),
          ...(record.checkOutTime && { checkOutTime: new Date(record.checkOutTime) }),
        }
      })
    }))

    res.status(201).json(results)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
