import { Prisma, type Child, type Student } from '@mundo-magico/database'
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'
import { decrypt } from '../../shared/utils/crypto'
import { AppError } from '../../shared/errors/AppError'
import type { GenerateMonthlyInput, PreviewMonthlyQuery } from './billing.schema'
import * as billingRepository from './billing.repository'

type BillablePerson = Pick<Child | Student, 'id' | 'fullName' | 'monthlyFee' | 'dueDay'> & {
  invoices: { id: string }[]
}

function resolveReferenceMonth(input?: string) {
  return input || new Date().toISOString().slice(0, 7)
}

function parseReferenceMonth(referenceMonth: string) {
  const [year, month] = referenceMonth.split('-').map(Number)
  return { year, month }
}

function getDueDate(referenceMonth: string, dueDay: number | null) {
  const { year, month } = parseReferenceMonth(referenceMonth)
  const day = Math.min(dueDay ?? 10, 28)
  return new Date(year, month - 1, day)
}

function getDescription(referenceMonth: string) {
  return `Mensalidade ${referenceMonth.split('-').reverse().join('/')}`
}

function splitBillablePeople(children: BillablePerson[], students: BillablePerson[]) {
  const all = [...children, ...students]
  return {
    toGenerate: all.filter((person) => person.invoices.length === 0),
    alreadyExists: all.filter((person) => person.invoices.length > 0),
  }
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

function getPublicApiBaseUrl() {
  const apiBaseUrl = process.env.API_BASE_URL || process.env.API_URL
  if (!apiBaseUrl || apiBaseUrl.includes('localhost') || apiBaseUrl.includes('127.0.0.1')) {
    return null
  }

  return apiBaseUrl.replace(/\/$/, '')
}

function getMercadoPagoAccessToken(encryptedToken?: string | null) {
  const accessToken = encryptedToken ? decrypt(encryptedToken) : process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    throw new AppError('Access Token do Mercado Pago nao configurado', 400)
  }

  return accessToken
}

function onlyDigits(value?: string | null) {
  return value?.replace(/\D/g, '') || ''
}

function getMercadoPagoErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const maybeError = error as { message?: unknown; cause?: unknown }
    if (typeof maybeError.message === 'string') return maybeError.message
    if (Array.isArray(maybeError.cause)) {
      return maybeError.cause
        .map((cause) => (cause && typeof cause === 'object' && 'description' in cause ? String((cause as any).description) : null))
        .filter(Boolean)
        .join('; ')
    }
  }

  return 'Falha ao criar cobranca no Mercado Pago'
}

export async function previewMonthly(schoolId: string, query: PreviewMonthlyQuery) {
  const referenceMonth = resolveReferenceMonth(query.referenceMonth)
  const [children, students, childrenNoFee, studentsNoFee] = await Promise.all([
    billingRepository.findBillableChildren(schoolId, referenceMonth),
    billingRepository.findBillableStudents(schoolId, referenceMonth),
    billingRepository.countChildrenWithoutFee(schoolId),
    billingRepository.countStudentsWithoutFee(schoolId),
  ])

  const { toGenerate, alreadyExists } = splitBillablePeople(children, students)
  const totalAmount = toGenerate.reduce((sum, person) => sum + Number(person.monthlyFee ?? 0), 0)

  return {
    referenceMonth,
    toGenerate: toGenerate.length,
    alreadyExists: alreadyExists.length,
    withoutFee: childrenNoFee + studentsNoFee,
    totalAmount,
    preview: toGenerate.map((person) => ({
      id: person.id,
      name: person.fullName,
      amount: person.monthlyFee,
      dueDay: person.dueDay,
    })),
  }
}

export async function generatePaymentLink(schoolId: string, invoiceId: string, method: 'BOLETO' | 'CARTAO' = 'CARTAO') {
  const invoice = await billingRepository.findInvoiceForPaymentLink(schoolId, invoiceId)
  if (!invoice) throw new AppError('Fatura nao encontrada', 404)
  if (invoice.status === 'PAGO') throw new AppError('Fatura ja esta paga', 400)

  const accessToken = getMercadoPagoAccessToken(invoice.school.integrationSecret?.mpAccessToken)

  const payerName = invoice.child?.fullName || invoice.student?.fullName || 'Responsavel'
  const client = new MercadoPagoConfig({ accessToken })
  const preference = new Preference(client)

  const adminUrl = process.env.ADMIN_URL || 'https://admin.mundomagicocajamar.com.br'
  const apiBaseUrl = getPublicApiBaseUrl()
  const paymentMethods = method === 'BOLETO'
    ? { excluded_payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }, { id: 'bank_transfer' }] }
    : { excluded_payment_types: [{ id: 'ticket' }] }

  try {
    const result = await preference.create({
      body: {
        external_reference: invoice.id,
        items: [{
          id: invoice.id,
          title: invoice.description || 'Mensalidade',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: Number(invoice.amount),
        }],
        payer: { name: payerName },
        ...(apiBaseUrl && { notification_url: `${apiBaseUrl}/api/webhooks/mercado-pago` }),
        payment_methods: paymentMethods,
        back_urls: {
          success: `${adminUrl}/responsavel/payments?status=success`,
          failure: `${adminUrl}/responsavel/payments?status=failure`,
          pending: `${adminUrl}/responsavel/payments?status=pending`,
        },
      },
    })

    await billingRepository.updateInvoiceCheckoutData(schoolId, invoice.id, {
      mpPreferenceId: result.id,
      checkoutUrl: result.init_point || result.sandbox_init_point,
    })

    return {
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    }
  } catch (error) {
    throw new AppError(getMercadoPagoErrorMessage(error), 400)
  }
}

export async function generatePixPayment(
  schoolId: string,
  invoiceId: string,
  payer: { cpf?: string | null; email?: string | null; name?: string | null },
) {
  const invoice = await billingRepository.findInvoiceForPaymentLink(schoolId, invoiceId)
  if (!invoice) throw new AppError('Fatura nao encontrada', 404)
  if (invoice.status === 'PAGO') throw new AppError('Fatura ja esta paga', 400)

  const cpf = onlyDigits(payer.cpf)
  if (cpf.length !== 11) throw new AppError('CPF do pagador invalido', 400)
  if (!payer.email) throw new AppError('E-mail do responsavel e obrigatorio para gerar PIX', 400)

  const accessToken = getMercadoPagoAccessToken(invoice.school.integrationSecret?.mpAccessToken)
  const client = new MercadoPagoConfig({ accessToken })
  const payment = new Payment(client)
  const apiBaseUrl = getPublicApiBaseUrl()

  try {
    const result = await payment.create({
      body: {
        transaction_amount: Number(invoice.amount),
        description: invoice.description || 'Mensalidade',
        payment_method_id: 'pix',
        external_reference: invoice.id,
        ...(apiBaseUrl && { notification_url: `${apiBaseUrl}/api/webhooks/mercado-pago` }),
        payer: {
          email: payer.email,
          first_name: payer.name || 'Responsavel',
          identification: {
            type: 'CPF',
            number: cpf,
          },
        },
      },
    })

    const qrCodeBase64 = result.point_of_interaction?.transaction_data?.qr_code_base64
    const copyPaste = result.point_of_interaction?.transaction_data?.qr_code

    if (!qrCodeBase64 || !copyPaste || !result.id) {
      throw new AppError('Mercado Pago nao retornou QR Code PIX', 400)
    }

    await billingRepository.savePixPaymentData({
      schoolId,
      invoiceId: invoice.id,
      paymentId: String(result.id),
      amount: invoice.amount,
      mpStatus: result.status,
      qrCodeBase64,
      copyPaste,
      expiresAt: result.date_of_expiration ? new Date(result.date_of_expiration) : undefined,
      raw: result,
    })

    return {
      method: 'PIX',
      status: result.status || 'pending',
      qrCodeBase64,
      copyPaste,
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(getMercadoPagoErrorMessage(error), 400)
  }
}

export async function generateMonthly(schoolId: string, input: GenerateMonthlyInput) {
  const referenceMonth = resolveReferenceMonth(input.referenceMonth)
  const [children, students] = await Promise.all([
    billingRepository.findBillableChildren(schoolId, referenceMonth),
    billingRepository.findBillableStudents(schoolId, referenceMonth),
  ])

  const created: Array<{ id: string; name: string; amount: unknown }> = []
  const skipped: Array<{ id: string; name: string; reason: string }> = []

  for (const child of children) {
    if (child.invoices.length > 0) {
      skipped.push({ id: child.id, name: child.fullName, reason: 'ja existe' })
      continue
    }

    try {
      const invoice = await billingRepository.createInvoice({
        schoolId,
        childId: child.id,
        description: getDescription(referenceMonth),
        amount: child.monthlyFee!,
        dueDate: getDueDate(referenceMonth, child.dueDay),
        referenceMonth,
        status: 'PENDENTE',
      })
      created.push({ id: invoice.id, name: child.fullName, amount: child.monthlyFee })
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error
      const existing = await billingRepository.findMonthlyChildInvoice(schoolId, child.id, referenceMonth)
      skipped.push({ id: child.id, name: child.fullName, reason: existing ? 'ja existe' : 'duplicidade detectada' })
    }
  }

  for (const student of students) {
    if (student.invoices.length > 0) {
      skipped.push({ id: student.id, name: student.fullName, reason: 'ja existe' })
      continue
    }

    try {
      const invoice = await billingRepository.createInvoice({
        schoolId,
        studentId: student.id,
        description: getDescription(referenceMonth),
        amount: student.monthlyFee!,
        dueDate: getDueDate(referenceMonth, student.dueDay),
        referenceMonth,
        status: 'PENDENTE',
      })
      created.push({ id: invoice.id, name: student.fullName, amount: student.monthlyFee })
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error
      const existing = await billingRepository.findMonthlyStudentInvoice(schoolId, student.id, referenceMonth)
      skipped.push({ id: student.id, name: student.fullName, reason: existing ? 'ja existe' : 'duplicidade detectada' })
    }
  }

  return {
    referenceMonth,
    created: created.length,
    skipped: skipped.length,
    details: { created, skipped },
  }
}
