import { Router } from 'express'
import { prisma } from '@mundo-magico/database'
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'

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
      // Batch creation
      const results = await Promise.all(
        data.map(async (item) => {
          const { dueDate, boletoExpiry, pixExpiry, paidAt, ...rest } = item
          try {
            // Check for duplicate referenceMonth if needed, but let's keep it simple
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

// POST /invoices/:id/pay - Request or register payment
router.post('/invoices/:id/pay', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const invoice = await prisma.invoice.findFirst({ 
      where: { id: req.params.id, schoolId },
      include: { school: true }
    })
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })

    const { method, amount, mpPaymentId, mpStatus, paidAt, payerCpf } = req.body
    const paymentDate = paidAt ? new Date(paidAt) : new Date()

    // ─── 1. PAGAMENTO MANUAL ───────────────────────────────────────────────
    if (method === 'MANUAL') {
      const [payment] = await prisma.$transaction([
        prisma.payment.create({
          data: {
            invoiceId: req.params.id,
            method: 'MANUAL',
            amount: amount || invoice.amount,
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
      return res.status(201).json(payment)
    }

    // ─── 2. MERCADO PAGO (BOLETO, PIX, CARTÃO) ──────────────────────────────
    const accessToken = invoice.school.mpAccessToken || process.env.MP_ACCESS_TOKEN
    if (!accessToken) {
      return res.status(400).json({ error: 'Gateway de pagamento não configurado para esta escola.' })
    }

    const client = new MercadoPagoConfig({ accessToken })
    const mpPayment = new Payment(client)
    const mpPreference = new Preference(client)

    // Dados do pagador (simplificado para o exemplo)
    const payer = {
      email: 'pagador@exemplo.com', // No futuro, buscar do banco
      identification: {
        type: 'CPF',
        number: payerCpf?.replace(/\D/g, '') || '00000000000',
      }
    }

    // --- PIX ---
    if (method === 'PIX') {
      const response = await mpPayment.create({
        body: {
          transaction_amount: invoice.amount,
          description: invoice.description,
          payment_method_id: 'pix',
          payer,
          notification_url: `${process.env.API_URL || 'https://api.mundomagico.com'}/api/webhooks/mercadopago`,
        }
      })

      const data = response as any
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          pixCopyPaste: data.point_of_interaction?.transaction_data?.qr_code,
          pixQrCode: data.point_of_interaction?.transaction_data?.qr_code_base64,
          mpPaymentId: String(data.id),
          mpPaymentStatus: data.status,
        }
      })

      return res.json({
        method: 'PIX',
        copyPaste: updatedInvoice.pixCopyPaste,
        qrCodeBase64: updatedInvoice.pixQrCode,
        status: data.status,
      })
    }

    // --- BOLETO ---
    if (method === 'BOLETO') {
      const response = await mpPayment.create({
        body: {
          transaction_amount: invoice.amount,
          description: invoice.description,
          payment_method_id: 'bolbradesco', // Exemplo Bradesco
          payer,
          notification_url: `${process.env.API_URL || 'https://api.mundomagico.com'}/api/webhooks/mercadopago`,
        }
      })

      const data = response as any
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          boletoUrl: data.transaction_details?.external_resource_url,
          boletoBarcode: data.barcode?.content,
          mpPaymentId: String(data.id),
          mpPaymentStatus: data.status,
        }
      })

      return res.json({
        method: 'BOLETO',
        boletoUrl: updatedInvoice.boletoUrl,
        barcode: updatedInvoice.boletoBarcode,
        status: data.status,
      })
    }

    // --- CARTÃO (Checkout Pro) ---
    if (method === 'CARTAO') {
      const response = await mpPreference.create({
        body: {
          items: [{
            id: invoice.id,
            title: invoice.description,
            quantity: 1,
            unit_price: invoice.amount,
            currency_id: 'BRL',
          }],
          back_urls: {
            success: `${process.env.ADMIN_URL}/parent/payments?status=success&invoice=${invoice.id}`,
            failure: `${process.env.ADMIN_URL}/parent/payments?status=failure&invoice=${invoice.id}`,
            pending: `${process.env.ADMIN_URL}/parent/payments?status=pending&invoice=${invoice.id}`,
          },
          auto_return: 'approved',
          external_reference: invoice.id,
          notification_url: `${process.env.API_URL || 'https://api.mundomagico.com'}/api/webhooks/mercadopago`,
        }
      })

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          mpPreferenceId: response.id,
          checkoutUrl: response.init_point,
        }
      })

      return res.json({
        method: 'CARTAO',
        checkoutUrl: response.init_point,
        status: 'pending'
      })
    }

    res.status(400).json({ error: 'Método de pagamento inválido' })
  } catch (error: any) {
    req.log.error(error)
    res.status(500).json({ error: error.message || 'Erro ao processar pagamento com Mercado Pago' })
  }
})

export default router
