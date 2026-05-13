import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@mundo-magico/database'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { status } = await req.json()

    const invoice = await prisma.invoice.update({
      where: { id: params.id, schoolId: session.user.schoolId },
      data: { status }
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('[INVOICE_PATCH]', error)
    return NextResponse.json({ error: 'Erro ao atualizar fatura' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only allow deleting PENDING or CANCELLED invoices
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id, schoolId: session.user.schoolId }
    })

    if (!invoice) return NextResponse.json({ error: 'Fatura não encontrada' }, { status: 404 })
    if (invoice.status === 'PAGO') {
      return NextResponse.json({ error: 'Não é possível excluir uma fatura paga' }, { status: 400 })
    }

    await prisma.invoice.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[INVOICE_DELETE]', error)
    return NextResponse.json({ error: 'Erro ao excluir fatura' }, { status: 500 })
  }
}
