import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@mundo-magico/database'
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || ''

// POST /api/finance/invoices/[id]/pay
// body: { method: 'BOLETO' | 'PIX' | 'CARTAO', payerEmail?, payerCpf?, cardToken? }
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, schoolId: session.user.schoolId },
      include: { child: true, student: true },
    })

    if (!invoice) return NextResponse.json({ error: 'Fatura não encontrada' }, { status: 404 })
    if (invoice.status === 'PAGO') return NextResponse.json({ error: 'Fatura já paga' }, { status: 400 })

    const body = await req.json()
    const { method, payerEmail, payerCpf, cardToken } = body

    const payerName = invoice.child?.fullName || invoice.student?.fullName || 'Responsável'
    const email = payerEmail || session.user.email || 'pagador@email.com'
    const cpf = (payerCpf || '').replace(/\D/g, '')

    const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN })

    // ── BOLETO ────────────────────────────────────────────────
    if (method === 'BOLETO') {
      const payment = new Payment(client)
      const result = await payment.create({
        body: {
          transaction_amount: invoice.amount,
          description: invoice.description,
          payment_method_id: 'bolbradesco',
          payer: {
            email,
            first_name: payerName.split(' ')[0],
            last_name: payerName.split(' ').slice(1).join(' ') || payerName,
            identification: { type: 'CPF', number: cpf },
          },
          notification_url: `${APP_URL}/api/webhooks/mercadopago`,
          external_reference: invoice.id,
        },
      })

      const paymentRes: any = result
      const boletoUrl = paymentRes.transaction_details?.external_resource_url || null
      const barcode = paymentRes.barcode?.content || null
      const expiry = result.date_of_expiration ? new Date(result.date_of_expiration) : null

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          mpPaymentId: String(result.id),
          mpPaymentStatus: result.status,
          boletoUrl,
          boletoBarcode: barcode,
          boletoExpiry: expiry,
          status: result.status === 'approved' ? 'PAGO' : 'PENDENTE',
        },
      })

      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          method: 'BOLETO',
          mpPaymentId: String(result.id),
          mpStatus: result.status,
          amount: invoice.amount,
        },
      })

      return NextResponse.json({
        method: 'BOLETO',
        paymentId: result.id,
        status: result.status,
        boletoUrl,
        barcode,
        expiry,
      })
    }

    // ── PIX ───────────────────────────────────────────────────
    if (method === 'PIX') {
      const payment = new Payment(client)
      const result = await payment.create({
        body: {
          transaction_amount: invoice.amount,
          description: invoice.description,
          payment_method_id: 'pix',
          payer: {
            email,
            first_name: payerName.split(' ')[0],
            last_name: payerName.split(' ').slice(1).join(' ') || payerName,
            identification: { type: 'CPF', number: cpf },
          },
          notification_url: `${APP_URL}/api/webhooks/mercadopago`,
          external_reference: invoice.id,
        },
      })

      // Force fresh build with casted result
      const paymentRes: any = result
      const pixData = paymentRes.point_of_interaction?.transaction_data
      const qrCode = pixData?.qr_code_base64 || null
      const copyPaste = pixData?.qr_code || null
      const expiry = result.date_of_expiration ? new Date(result.date_of_expiration) : null

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          mpPaymentId: String(result.id),
          mpPaymentStatus: result.status,
          pixQrCode: qrCode,
          pixCopyPaste: copyPaste,
          pixExpiry: expiry,
          status: result.status === 'approved' ? 'PAGO' : 'PENDENTE',
        },
      })

      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          method: 'PIX',
          mpPaymentId: String(result.id),
          mpStatus: result.status,
          amount: invoice.amount,
        },
      })

      return NextResponse.json({
        method: 'PIX',
        paymentId: result.id,
        status: result.status,
        qrCodeBase64: qrCode,
        copyPaste,
        expiry,
      })
    }

    // ── CARTÃO (Checkout Pro) ─────────────────────────────────
    if (method === 'CARTAO') {
      const preference = new Preference(client)
      const result = await preference.create({
        body: {
          items: [
            {
              id: invoice.id,
              title: invoice.description,
              quantity: 1,
              unit_price: invoice.amount,
              currency_id: 'BRL',
            },
          ],
          payer: { email },
          back_urls: {
            success: `${APP_URL}/parent/payments?status=success&invoice=${invoice.id}`,
            failure: `${APP_URL}/parent/payments?status=failure&invoice=${invoice.id}`,
            pending: `${APP_URL}/parent/payments?status=pending&invoice=${invoice.id}`,
          },
          auto_return: 'approved',
          notification_url: `${APP_URL}/api/webhooks/mercadopago`,
          external_reference: invoice.id,
          payment_methods: {
            excluded_payment_types: [{ id: 'ticket' }, { id: 'bank_transfer' }],
          },
          statement_descriptor: 'MUNDO MAGICO',
        },
      })

      const checkoutUrl = result.init_point || null

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          mpPreferenceId: result.id,
          checkoutUrl,
        },
      })

      return NextResponse.json({
        method: 'CARTAO',
        preferenceId: result.id,
        checkoutUrl,
      })
    }

    return NextResponse.json({ error: 'Método inválido. Use: BOLETO, PIX ou CARTAO' }, { status: 400 })
  } catch (error: any) {
    console.error('[INVOICE_PAY]', error?.cause || error)
    return NextResponse.json({ error: 'Erro ao processar pagamento', detail: error?.message }, { status: 500 })
  }
}

// GET — retorna dados de pagamento já gerados para a fatura
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, schoolId: session.user.schoolId },
      include: { payments: { orderBy: { createdAt: 'desc' } } },
    })

    if (!invoice) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })
    return NextResponse.json(invoice)
  } catch (error) {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
