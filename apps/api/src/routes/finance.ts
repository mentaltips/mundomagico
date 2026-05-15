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

// POST /invoices - Create invoice(s)
router.post('/invoices', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const data = req.body

    if (Array.isArray(data)) {
      const results = await Promise.all(
        data.map(async (item) => {
          const { dueDate, boletoExpiry, pixExpiry, paidAt, ...rest } = item
          try {
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
            return invoice
          } catch (err) {
            return { error: 'Failed to create', childId: rest.childId, skipped: true }
          }
        })
      )
      return res.status(201).json(results)
    }

    const { dueDate, boletoExpiry, pixExpiry, paidAt, ...rest } = data
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

// DELETE /invoices/:id - Delete invoice
router.delete('/invoices/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, schoolId } })
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    if (invoice.status === 'PAGO') {
      return res.status(400).json({ error: 'Cannot delete a paid invoice' })
    }
    await prisma.invoice.delete({ where: { id: req.params.id } })
    res.status(204).send()
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
        child: { include: { guardians: true } },
        student: { select: { id: true, fullName: true } },
        payments: true,
        school: true
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

// POST /invoices/:id/pay - Mark invoice as paid
router.post('/invoices/:id/pay', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { paymentMethod, amount, notes } = req.body
    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, schoolId } })
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        status: 'PAGO',
        paidAt: new Date(),
        payments: {
            create: {
              amount: amount || invoice.amount,
              method: paymentMethod || 'DINHEIRO',
              paidAt: new Date(),
            }
        }
      },
      include: { payments: true }
    })
    res.json(updated)
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
