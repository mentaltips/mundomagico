import { Router } from 'express'
import { prisma } from '@mundo-magico/database'
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'
import { createWhatsAppService } from '../services/whatsapp'

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

// POST /invoices/:id/pay - Request or register payment
router.post('/invoices/:id/pay', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const invoice = await prisma.invoice.findFirst({ 
      where: { id: req.params.id, schoolId },
      include: { 
        school: true,
        child: {
          include: {
            guardians: {
              where: { isPrimary: true },
              include: { guardian: true }
            }
          }
        },
        student: {
          include: {
            guardians: {
              where: { isPrimary: true },
              include: { guardian: true }
            }
          }
        }
      }
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

    // Busca o responsável principal (da criança ou do aluno)
    const primaryGuardian = invoice.child?.guardians[0]?.guardian || invoice.student?.guardians[0]?.guardian
    
    const payer = {
      email: primaryGuardian?.email || 'financeiro@mundomagicocajamar.com.br',
      identification: {
        type: 'CPF',
        number: payerCpf?.replace(/\D/g, '') || primaryGuardian?.cpf?.replace(/\D/g, '') || '00000000000',
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

// POST /automation/run - Run billing automation for all schools
router.post('/automation/run', async (req, res) => {
  try {
    const today = new Date()
    const currentDay = today.getDate()
    
    // 1. Buscar todas as escolas com automação ativa e que o dia de geração seja HOJE
    const schools = await prisma.school.findMany({
      // @ts-ignore
      where: { autoGenerateInvoices: true, billingGenerationDay: currentDay }
    })

    const results = []
    
    // Iniciar serviço de WhatsApp (padrão global ou por escola se necessário)
    // Aqui vamos instanciar dentro do loop de cada escola usando as configs dela
    
    for (const school of schools) {
      // @ts-ignore
      const whatsapp = createWhatsAppService({ token: school.whatsappToken, phoneNumberId: school.whatsappPhone })

      // 2. Buscar todos os alunos/crianças ativos que tenham mensalidade cadastrada
      const [children, students] = await Promise.all([
        prisma.child.findMany({
          where: { schoolId: school.id, status: 'ATIVO', monthlyFee: { gt: 0 } },
          include: { guardians: { where: { isPrimary: true }, include: { guardian: true } } }
        }),
        prisma.student.findMany({
          where: { schoolId: school.id, status: 'ATIVO', monthlyFee: { gt: 0 } },
          include: { guardians: { where: { isPrimary: true }, include: { guardian: true } } }
        })
      ])

      const referenceMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        .toISOString().slice(0, 7) // Próximo mês no formato YYYY-MM
      
      // @ts-ignore
      const description = school.invoiceDescription
        .replace('{month}', (today.getMonth() + 2).toString().padStart(2, '0'))
        .replace('{year}', today.getFullYear().toString())

      // 3. Gerar faturas para quem não tem ainda para o mês de referência
      const billingData = [...children, ...students].map(p => ({
        schoolId: school.id,
        childId: (p as any).groupId ? p.id : null, // Simplificação: se tem groupId é Child
        studentId: (p as any).groupId ? null : p.id,
        guardianId: (p as any).guardians?.[0]?.guardianId || null,
        description,
        amount: p.monthlyFee || 0,
        dueDate: new Date(today.getFullYear(), today.getMonth() + 1, p.dueDay || 10),
        referenceMonth,
        status: 'PENDENTE',
        guardian: (p as any).guardians?.[0]?.guardian // Passando info do guardian para o loop de envio
      }))

      for (const data of billingData) {
        const { guardian, ...invoiceData } = data as any
        
        const exists = await prisma.invoice.findFirst({
          where: { 
            schoolId: invoiceData.schoolId, 
            referenceMonth: invoiceData.referenceMonth,
            OR: [
              { childId: invoiceData.childId },
              { studentId: invoiceData.studentId }
            ]
          }
        })

        if (!exists && invoiceData.amount > 0) {
          const created = await prisma.invoice.create({ data: invoiceData })
          results.push({ school: school.name, target: invoiceData.childId || invoiceData.studentId, status: 'CREATED' })

          // DISPARAR WHATSAPP
          if (whatsapp && guardian?.phone) {
            const dueDateStr = new Date(invoiceData.dueDate).toLocaleDateString('pt-BR')
            const amountStr = invoiceData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
            const paymentLink = `${process.env.ADMIN_URL || 'https://admin.mundomagico.com'}/parent/payments?invoice=${created.id}`

            await whatsapp.sendInvoiceNotification(
              guardian.phone,
              guardian.name || 'Responsável',
              amountStr,
              dueDateStr,
              invoiceData.description,
              paymentLink
            )
          }
        }
      }
    }

    res.json({ message: 'Automação concluída', results })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Erro na automação de faturamento' })
  }
})

export default router
