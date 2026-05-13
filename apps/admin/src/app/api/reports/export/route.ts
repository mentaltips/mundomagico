import { NextResponse } from 'next/server'
import { prisma } from '@mundo-magico/database'
import { getApiAuth } from '../../../../lib/auth'

export async function GET(req: Request) {
  const user = await getApiAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type   = searchParams.get('type') ?? 'children'
  const format = searchParams.get('format') ?? 'json'

  let data: unknown[] = []

  if (type === 'children') {
    const children = await prisma.child.findMany({
      where: { schoolId: user.schoolId },
      include: {
        group: { select: { name: true } },
        guardians: {
          include: { guardian: { select: { fullName: true, phone: true, relationship: true } } },
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: { fullName: 'asc' },
    })
    data = children.map((c) => ({
      nome:        c.fullName,
      apelido:     c.nickname ?? '',
      dataNascimento: c.birthDate.toLocaleDateString('pt-BR'),
      turma:       c.group?.name ?? '',
      turno:       c.shift,
      status:      c.status,
      responsavel: c.guardians[0]?.guardian.fullName ?? '',
      telefone:    c.guardians[0]?.guardian.phone ?? '',
      alergiias:   c.allergies ?? '',
    }))
  } else if (type === 'finance') {
    const invoices = await prisma.invoice.findMany({
      where: { schoolId: user.schoolId },
      include: {
        child:   { select: { fullName: true } },
        student: { select: { fullName: true } },
      },
      orderBy: { dueDate: 'desc' },
    })
    data = invoices.map((inv) => ({
      aluno:      inv.child?.fullName ?? inv.student?.fullName ?? '',
      descricao:  inv.description,
      valor:      inv.amount,
      vencimento: inv.dueDate.toLocaleDateString('pt-BR'),
      status:     inv.status,
      pago:       inv.paidAt?.toLocaleDateString('pt-BR') ?? '',
    }))
  } else if (type === 'attendance') {
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    const checkins = await prisma.childCheckInOut.findMany({
      where: {
        schoolId: user.schoolId,
        date: { gte: start, lte: today },
      },
      include: {
        child: { select: { fullName: true } },
      },
      orderBy: { date: 'desc' },
    })
    data = checkins.map((c) => ({
      crianca:    c.child.fullName,
      data:       c.date.toLocaleDateString('pt-BR'),
      entrada:    c.checkInTime?.toLocaleTimeString('pt-BR') ?? '',
      saida:      c.checkOutTime?.toLocaleTimeString('pt-BR') ?? '',
      trazidoPor: c.broughtBy ?? '',
      buscadoPor: c.pickedUpBy ?? '',
      status:     c.status,
    }))
  }

  if (format === 'csv') {
    if (data.length === 0) {
      return new Response('', {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${type}_export.csv"`,
        },
      })
    }
    const headers = Object.keys(data[0] as object)
    const rows = (data as Record<string, unknown>[]).map((row) =>
      headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    return new Response('﻿' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${type}_export.csv"`,
      },
    })
  }

  return NextResponse.json({ type, total: data.length, data })
}
