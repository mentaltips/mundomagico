import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

// GET /invoices - List invoices
router.get('/invoices', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { status, childId, studentId, referenceMonth } = req.query
    const invoices = await prisma.invoice.findMany({
      where: {
        schoolId,
        ...(status && { status: status as string }),
        ...(childId && { childId: childId as string }),
        ...(studentId && { studentId: studentId as string }),
        ...(referenceMonth && { referenceMonth: referenceMonth as string }),
      },
      include: {
        child: { select: { id: true, fullName: true } },
        student: { select: { id: true, fullName: true } },
        payments: true
      },
      orderBy: { dueDate: 'desc' }
    })
    res.json(invoices)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /invoices - Create invoice
router.post('/invoices', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { dueDate, boletoExpiry, pixExpiry, paidAt, ...rest } = req.body
    const invoice = await prisma.invoice.create({
      data: {
        ...rest,
        schoolId,
        dueDate: new Date(dueDate),
        ...(boletoExpiry && { boletoExpiry: new Date(boletoExpiry) }),
        ...(pixExpiry && { pixExpiry: new Date(pixExpiry) }),
        ...(paidAt && { paidAt: new Date(paidAt) }),
      }
    })
    res.status(201).json(invoice)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /invoices/:id - Get invoice
router.get('/invoices/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, schoolId },
      include: {
        child: { select: { id: true, fullName: true } },
        student: { select: { id: true, fullName: true } },
        payments: true
      }
    })
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    res.json(invoice)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /invoices/:id - Update invoice
router.patch('/invoices/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { dueDate, boletoExpiry, pixExpiry, paidAt, ...rest } = req.body
    const result = await prisma.invoice.updateMany({
      where: { id: req.params.id, schoolId },
      data: {
        ...rest,
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(boletoExpiry && { boletoExpiry: new Date(boletoExpiry) }),
        ...(pixExpiry && { pixExpiry: new Date(pixExpiry) }),
        ...(paidAt && { paidAt: new Date(paidAt) }),
      }
    })
    if (result.count === 0) return res.status(404).json({ error: 'Invoice not found' })
    const updated = await prisma.invoice.findUnique({ where: { id: req.params.id } })
    res.json(updated)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /invoices/:id/pay - Register payment
router.post('/invoices/:id/pay', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, schoolId } })
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })

    const { method, amount, mpPaymentId, mpStatus, paidAt } = req.body
    const paymentDate = paidAt ? new Date(paidAt) : new Date()

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId: req.params.id,
          method: method || 'MANUAL',
          amount: amount || invoice.amount,
          mpPaymentId,
          mpStatus,
          paidAt: paymentDate,
        }
      }),
      prisma.invoice.update({
        where: { id: req.params.id },
        data: {
          status: 'PAGO',
          paidAt: paymentDate,
          paidAmount: amount || invoice.amount,
        }
      })
    ])
    res.status(201).json(payment)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
