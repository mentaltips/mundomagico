import { Router } from 'express'
import { prisma } from '@mundo-magico/database'
import { hasPermission, requirePermission } from '../../shared/middlewares/permissions.middleware'

const router = Router()

router.use(requirePermission('canViewReports'))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: any) => {
    if (v == null) return ''
    const s = String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  return [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n')
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pt-BR')
}

function toNumber(v: unknown): number {
  if (v == null) return 0
  if (typeof v === 'number') return v
  return Number(v)
}

function fmtBRL(v: unknown): string {
  if (v == null) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toNumber(v))
}

function fmtJsonList(value: unknown): string {
  if (!value) return ''
  if (Array.isArray(value)) return value.map(String).join('; ')
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.map(String).join('; ') : value
    } catch {
      return value
    }
  }
  return String(value)
}

// ─── GET /reports/export?type=children ───────────────────────────────────────
// Tipos: children | attendance | financial | development
router.get('/export', async (req, res) => {
  const schoolId = req.user?.schoolId!
  const type = (req.query.type as string) || 'children'
  const month = (req.query.month as string) || new Date().toISOString().slice(0, 7)
  const format = (req.query.format as string) || 'csv'

  try {
    // ── 1. Lista de Crianças ─────────────────────────────────────────────────
    if (type === 'children') {
      const children = await prisma.child.findMany({
        where: { schoolId },
        include: { group: { select: { name: true } } },
        orderBy: { fullName: 'asc' },
      })

      const headers = ['Nome', 'Apelido', 'Nascimento', 'Grupo', 'Turno', 'Status', 'Mensalidade', 'Alergias', 'Usa fralda', 'Entrada']
      const rows = children.map((c) => [
        c.fullName,
        c.nickname,
        fmtDate(c.birthDate),
        c.group?.name,
        c.shift,
        c.status,
        c.monthlyFee ? fmtBRL(c.monthlyFee) : '',
        fmtJsonList(c.allergies),
        c.usesDiapers ? 'Sim' : 'Não',
        fmtDate(c.entryDate),
      ])

      const csv = toCSV(headers, rows)
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="criancas_${new Date().toISOString().slice(0,10)}.csv"`)
      return res.send('﻿' + csv) // BOM para Excel reconhecer UTF-8
    }

    // ── 2. Frequência do Mês ─────────────────────────────────────────────────
    if (type === 'attendance') {
      const [year, m] = month.split('-').map(Number)
      const start = new Date(year, m - 1, 1)
      const end = new Date(year, m, 0, 23, 59, 59)

      const children = await prisma.child.findMany({
        where: { schoolId, status: { in: ['ATIVO', 'ADAPTACAO'] } },
        include: {
          checkInOuts: {
            where: { date: { gte: start, lte: end }, status: 'PRESENTE' },
          },
          group: { select: { name: true } },
        },
        orderBy: { fullName: 'asc' },
      })

      const workdays = (() => {
        let count = 0
        const d = new Date(start)
        while (d <= end) {
          if (d.getDay() !== 0 && d.getDay() !== 6) count++
          d.setDate(d.getDate() + 1)
        }
        return count
      })()

      const headers = ['Nome', 'Grupo', 'Turno', 'Presenças', 'Faltas', 'Dias úteis', 'Frequência (%)']
      const rows = children.map((c) => {
        const presencas = c.checkInOuts.length
        const faltas = workdays - presencas
        const freq = workdays > 0 ? ((presencas / workdays) * 100).toFixed(1) + '%' : '—'
        return [c.fullName, c.group?.name, c.shift, presencas, faltas, workdays, freq]
      })

      const csv = toCSV(headers, rows)
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="frequencia_${month}.csv"`)
      return res.send('﻿' + csv)
    }

    // ── 3. Relatório Financeiro ──────────────────────────────────────────────
    if (type === 'financial') {
      if (!hasPermission(req.user?.role, 'canViewFinance')) {
        return res.status(403).json({ error: 'Acesso negado' })
      }

      const where: any = { schoolId }
      if (month) where.referenceMonth = month

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          child: { select: { fullName: true } },
          student: { select: { fullName: true } },
          payments: true,
        },
        orderBy: { dueDate: 'asc' },
      })

      const headers = ['Aluno/Criança', 'Descrição', 'Mês Ref.', 'Vencimento', 'Valor', 'Status', 'Pago em', 'Valor Pago']
      const rows = invoices.map((inv) => [
        inv.child?.fullName || inv.student?.fullName || '—',
        inv.description,
        inv.referenceMonth || '',
        fmtDate(inv.dueDate),
        fmtBRL(inv.amount),
        inv.status,
        inv.paidAt ? fmtDate(inv.paidAt) : '',
        inv.paidAmount ? fmtBRL(inv.paidAmount) : '',
      ])

      // Totalizadores ao final
      const total = invoices.reduce((s, i) => s + toNumber(i.amount), 0)
      const totalPago = invoices.filter(i => i.status === 'PAGO').reduce((s, i) => s + toNumber(i.paidAmount ?? i.amount), 0)
      const totalPendente = invoices.filter(i => i.status === 'PENDENTE').reduce((s, i) => s + toNumber(i.amount), 0)
      const totalVencido = invoices.filter(i => i.status === 'VENCIDO').reduce((s, i) => s + toNumber(i.amount), 0)

      rows.push(
        ['', '', '', '', '', '', '', ''],
        ['TOTAIS', '', '', '', fmtBRL(total), '', '', ''],
        ['Pago', '', '', '', '', '', '', fmtBRL(totalPago)],
        ['Pendente', '', '', '', fmtBRL(totalPendente), '', '', ''],
        ['Vencido', '', '', '', fmtBRL(totalVencido), '', '', ''],
      )

      const csv = toCSV(headers, rows)
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="financeiro_${month || 'completo'}.csv"`)
      return res.send('﻿' + csv)
    }

    // ── 4. Relatórios de Desenvolvimento ────────────────────────────────────
    if (type === 'development') {
      const reports = await prisma.developmentReport.findMany({
        where: { schoolId, isDraft: false },
        include: { child: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
      })

      const headers = ['Criança', 'Período', 'Início', 'Fim', 'Coordenação motora', 'Socialização', 'Linguagem', 'Autonomia', 'Publicado em']
      const rows = reports.map((r) => [
        r.child.fullName,
        r.period,
        fmtDate(r.startDate),
        fmtDate(r.endDate),
        r.motorCoordination,
        r.socialization,
        r.language,
        r.autonomy,
        r.publishedAt ? fmtDate(r.publishedAt) : '',
      ])

      const csv = toCSV(headers, rows)
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="desenvolvimento_${new Date().toISOString().slice(0,10)}.csv"`)
      return res.send('﻿' + csv)
    }

    res.status(400).json({ error: 'Tipo inválido. Use: children | attendance | financial | development' })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Erro ao gerar relatório' })
  }
})

export default router
