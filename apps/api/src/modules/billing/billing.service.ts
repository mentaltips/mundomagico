import { Prisma, type Child, type Student } from '@mundo-magico/database'
import { MercadoPagoConfig, Preference } from 'mercadopago'
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

export async function generatePaymentLink(schoolId: string, invoiceId: string) {
  const invoice = await billingRepository.findInvoiceForPaymentLink(schoolId, invoiceId)
  if (!invoice) throw new AppError('Fatura nao encontrada', 404)
  if (invoice.status === 'PAGO') throw new AppError('Fatura ja esta paga', 400)

  const encryptedToken = invoice.school.integrationSecret?.mpAccessToken
  const accessToken = encryptedToken ? decrypt(encryptedToken) : null
  if (!accessToken) throw new AppError('Access Token do Mercado Pago nao configurado', 400)

  const payerName = invoice.child?.fullName || invoice.student?.fullName || 'Responsavel'
  const client = new MercadoPagoConfig({ accessToken })
  const preference = new Preference(client)

  const adminUrl = process.env.ADMIN_URL || 'https://admin.mundomagicocajamar.com.br'

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
      notification_url: `${process.env.API_BASE_URL}/api/webhooks/mercado-pago`,
      back_urls: {
        success: `${adminUrl}/responsavel/payments?status=sucesso`,
        failure: `${adminUrl}/responsavel/payments?status=erro`,
        pending: `${adminUrl}/responsavel/payments?status=pendente`,
      },
    },
  })


  return {
    preferenceId: result.id,
    initPoint: result.init_point,
    sandboxInitPoint: result.sandbox_init_point,
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
