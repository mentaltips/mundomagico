import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// ==========================================
// SEÇÃO DE PAGAMENTOS (Rotas específicas)
// ==========================================

// GET /payments - List monthly payments
router.get('/payments', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { month, year, staffId, status } = req.query

    const payments = await prisma.staffPayment.findMany({
      where: {
        schoolId,
        ...(month && { referenceMonth: parseInt(month as string) }),
        ...(year && { referenceYear: parseInt(year as string) }),
        ...(staffId && { staffId: staffId as string }),
        ...(status && { status: status as string })
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            roleType: true,
            photoUrl: true,
            pixKey: true,
            bankName: true,
            bankAgency: true,
            bankAccount: true
          }
        },
        bonuses: true,
        deductions: true
      },
      orderBy: { staff: { name: 'asc' } }
    })
    res.json(payments)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /payments/generate - Generate monthly payments
router.post('/payments/generate', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      return res.status(400).json({ error: 'School ID is required' })
    }
    const createdBy = req.user?.sub || 'SYSTEM'
    const { month, year, staffId } = req.body

    const refMonth = parseInt(month)
    const refYear = parseInt(year)

    if (!refMonth || !refYear) {
      return res.status(400).json({ error: 'Mês e ano são obrigatórios.' })
    }

    const staffMembers = await prisma.staff.findMany({
      where: {
        schoolId,
        status: 'ACTIVE',
        deletedAt: null,
        ...(staffId && { id: staffId })
      }
    })

    const generatedList: any[] = []

    for (const staff of staffMembers) {
      const baseSalary = staff.baseSalary || 0

      // Check duplicate
      const existing = await prisma.staffPayment.findUnique({
        where: {
          staffId_referenceMonth_referenceYear: {
            staffId: staff.id,
            referenceMonth: refMonth,
            referenceYear: refYear
          }
        }
      })

      if (existing) {
        generatedList.push({ staffId: staff.id, name: staff.name, skipped: true, reason: 'Já gerado' })
        continue
      }

      const payment = await prisma.staffPayment.create({
        data: {
          schoolId,
          staffId: staff.id,
          referenceMonth: refMonth,
          referenceYear: refYear,
          baseSalary,
          totalBonuses: 0,
          totalDeductions: 0,
          finalAmount: baseSalary,
          status: 'DRAFT',
          createdBy
        },
        include: { staff: true }
      })

      generatedList.push({ staffId: staff.id, name: staff.name, success: true, paymentId: payment.id })
    }

    res.status(201).json(generatedList)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /payments/:paymentId - Update payment details
router.patch('/payments/:paymentId', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { status, paymentDate, paymentMethod, notes } = req.body
    const paymentId = req.params.paymentId

    const payment = await prisma.staffPayment.findFirst({
      where: { id: paymentId, schoolId }
    })
    if (!payment) return res.status(404).json({ error: 'Payment sheet not found' })

    const updated = await prisma.staffPayment.update({
      where: { id: paymentId },
      data: {
        status,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        paymentMethod,
        notes
      }
    })
    res.json(updated)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /payments/:paymentId/bonus - Add payment bonus
router.post('/payments/:paymentId/bonus', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      return res.status(400).json({ error: 'School ID is required' })
    }
    const createdBy = req.user?.sub || 'SYSTEM'
    const { title, description, amount, type } = req.body
    const paymentId = req.params.paymentId

    const payment = await prisma.staffPayment.findFirst({
      where: { id: paymentId, schoolId }
    })
    if (!payment) return res.status(404).json({ error: 'Payment sheet not found' })

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Valor de bônus inválido.' })
    }

    const bonus = await prisma.staffPaymentBonus.create({
      data: {
        schoolId,
        staffId: payment.staffId,
        staffPaymentId: paymentId,
        title,
        description,
        amount: parsedAmount,
        type: type || 'MANUAL',
        createdBy
      }
    })

    const bonuses = await prisma.staffPaymentBonus.findMany({ where: { staffPaymentId: paymentId } })
    const totalBonuses = bonuses.reduce((acc: number, b: any) => acc + b.amount, 0)
    const finalAmount = payment.baseSalary + totalBonuses - payment.totalDeductions

    await prisma.staffPayment.update({
      where: { id: paymentId },
      data: { totalBonuses, finalAmount }
    })

    res.status(201).json(bonus)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /payments/:paymentId/deduction - Add payment deduction
router.post('/payments/:paymentId/deduction', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      return res.status(400).json({ error: 'School ID is required' })
    }
    const createdBy = req.user?.sub || 'SYSTEM'
    const { title, description, amount, type } = req.body
    const paymentId = req.params.paymentId

    const payment = await prisma.staffPayment.findFirst({
      where: { id: paymentId, schoolId }
    })
    if (!payment) return res.status(404).json({ error: 'Payment sheet not found' })

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Valor de desconto inválido.' })
    }

    const deduction = await prisma.staffPaymentDeduction.create({
      data: {
        schoolId,
        staffId: payment.staffId,
        staffPaymentId: paymentId,
        title,
        description,
        amount: parsedAmount,
        type: type || 'DISCOUNT',
        createdBy
      }
    })

    const deductions = await prisma.staffPaymentDeduction.findMany({ where: { staffPaymentId: paymentId } })
    const totalDeductions = deductions.reduce((acc: number, d: any) => acc + d.amount, 0)
    const finalAmount = payment.baseSalary + payment.totalBonuses - totalDeductions

    await prisma.staffPayment.update({
      where: { id: paymentId },
      data: { totalDeductions, finalAmount }
    })

    res.status(201).json(deduction)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ==========================================
// SEÇÃO DE PERFIL / FUNCIONÁRIOS (Rotas dinâmicas / gerais)
// ==========================================

// GET / - List all staff
router.get('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const staff = await prisma.staff.findMany({
      where: { schoolId, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, email: true, active: true } },
        groupAssignments: {
          where: { status: 'ACTIVE' },
          include: { group: { select: { id: true, name: true } } }
        }
      },
      orderBy: { name: 'asc' }
    })
    res.json(staff)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST / - Create staff member profile
router.post('/', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      return res.status(400).json({ error: 'School ID is required' })
    }
    const {
      name, email, phone, whatsapp, cpf, birthDate,
      photoUrl, roleType, baseSalary, paymentDay, pixKey,
      bankName, bankAgency, bankAccount, financialNotes, userId
    } = req.body

    const newStaff = await prisma.staff.create({
      data: {
        schoolId,
        name,
        email,
        phone,
        whatsapp,
        cpf,
        birthDate: birthDate ? new Date(birthDate) : null,
        photoUrl,
        roleType: roleType || 'TEACHER',
        baseSalary: baseSalary ? parseFloat(baseSalary) : null,
        paymentDay: paymentDay ? parseInt(paymentDay) : null,
        pixKey,
        bankName,
        bankAgency,
        bankAccount,
        financialNotes,
        userId: userId || null
      }
    })
    res.status(201).json(newStaff)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /:id - Update staff profile
router.patch('/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const {
      name, email, phone, whatsapp, cpf, birthDate,
      photoUrl, roleType, status, baseSalary, paymentDay, pixKey,
      bankName, bankAgency, bankAccount, financialNotes, userId
    } = req.body

    const staff = await prisma.staff.findFirst({
      where: { id: req.params.id, schoolId }
    })
    if (!staff) return res.status(404).json({ error: 'Staff member not found' })

    const updated = await prisma.staff.update({
      where: { id: req.params.id },
      data: {
        name,
        email,
        phone,
        whatsapp,
        cpf,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        photoUrl,
        roleType,
        status,
        baseSalary: baseSalary !== undefined ? (baseSalary ? parseFloat(baseSalary) : null) : undefined,
        paymentDay: paymentDay !== undefined ? (paymentDay ? parseInt(paymentDay) : null) : undefined,
        pixKey,
        bankName,
        bankAgency,
        bankAccount,
        financialNotes,
        userId: userId !== undefined ? userId : undefined
      }
    })
    res.json(updated)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /:id - Soft delete staff profile
router.delete('/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const staff = await prisma.staff.findFirst({
      where: { id: req.params.id, schoolId }
    })
    if (!staff) return res.status(404).json({ error: 'Staff member not found' })

    await prisma.staff.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), status: 'INACTIVE' }
    })
    res.status(204).send()
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /:id/assignments - Assign staff to group (class)
router.post('/:id/assignments', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    if (!schoolId) {
      return res.status(400).json({ error: 'School ID is required' })
    }
    const staffId = req.params.id
    const { groupId, assignmentType } = req.body

    const assignment = await prisma.staffGroupAssignment.upsert({
      where: { staffId_groupId: { staffId, groupId } },
      update: { assignmentType: assignmentType || 'MAIN_TEACHER', status: 'ACTIVE' },
      create: {
        schoolId,
        staffId,
        groupId,
        assignmentType: assignmentType || 'MAIN_TEACHER',
        status: 'ACTIVE'
      }
    })
    res.status(201).json(assignment)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /:id/assignments/:assignmentId - Remove group assignment
router.delete('/:id/assignments/:assignmentId', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const assignment = await prisma.staffGroupAssignment.findFirst({
      where: { id: req.params.assignmentId, schoolId }
    })
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' })

    await prisma.staffGroupAssignment.delete({
      where: { id: req.params.assignmentId }
    })
    res.status(204).send()
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
