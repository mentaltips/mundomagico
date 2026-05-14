'use client'

import { useState } from 'react'
import { format, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Zap, Eye, CheckCircle2, AlertCircle, Users,
  DollarSign, Calendar, Download, FileText,
  TrendingUp, RefreshCw, FileSpreadsheet
} from 'lucide-react'
import { PageHeader, Badge, LoadingState } from '@/components/ui'
import toast from 'react-hot-toast'

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const MONTHS = Array.from({ length: 6 }, (_, i) => {
  const d = addMonths(new Date(), i)
  return {
    value: format(d, 'yyyy-MM'),
    label: format(d, 'MMMM/yyyy', { locale: ptBR }),
  }
})

export default function BillingPage() {
  const [refMonth, setRefMonth] = useState(MONTHS[0].value)
  const [reportMonth, setReportMonth] = useState(format(new Date(), 'yyyy-MM'))
  const qc = useQueryClient()

  // Previsão de geração
  const { data: preview, isLoading: previewLoading, refetch: refetchPreview } = useQuery({
    queryKey: ['billing-preview', refMonth],
    queryFn: () => fetch(`/api/billing/preview-monthly?referenceMonth=${refMonth}`).then(r => r.json()),
  })

  // Gerar mensalidades
  const generate = useMutation({
    mutationFn: () =>
      fetch('/api/billing/generate-monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceMonth: refMonth }),
      }).then(r => r.json()),
    onSuccess: (data) => {
      toast.success(`${data.created} fatura(s) gerada(s) com sucesso!`)
      qc.invalidateQueries({ queryKey: ['billing-preview'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
    onError: () => toast.error('Erro ao gerar mensalidades'),
  })

  // Download de relatório
  const downloadReport = async (type: string) => {
    const params = new URLSearchParams({ type, month: reportMonth })
    const res = await fetch(`/api/reports/export?${params}`)
    if (!res.ok) { toast.error('Erro ao gerar relatório'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_${reportMonth}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Relatório baixado!')
  }

  const REPORTS = [
    { type: 'children',    icon: Users,          label: 'Lista de Crianças',    desc: 'Todos os cadastros com dados completos', color: 'text-blue-500 bg-blue-500/10' },
    { type: 'attendance',  icon: Calendar,        label: 'Frequência do Mês',    desc: 'Presenças, faltas e % por criança',      color: 'text-green-500 bg-green-500/10' },
    { type: 'financial',   icon: DollarSign,      label: 'Relatório Financeiro', desc: 'Faturas, pagamentos e totalizadores',    color: 'text-amber-500 bg-amber-500/10' },
    { type: 'development', icon: TrendingUp,       label: 'Desenvolvimento',      desc: 'Relatórios publicados por criança',      color: 'text-purple-500 bg-purple-500/10' },
  ]

  return (
    <div className="page animate-in">
      <PageHeader title="Cobrança & Relatórios" subtitle="Geração automática de mensalidades e exportação de dados" />

      {/* ── Geração de Mensalidades ─────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Zap size={20} />
          </div>
          <div>
            <h2 className="font-black text-foreground">Geração Automática de Mensalidades</h2>
            <p className="text-xs text-muted-foreground">Cria faturas em lote para todos os ativos com mensalidade cadastrada</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Mês de Referência</label>
            <select
              value={refMonth}
              onChange={e => setRefMonth(e.target.value)}
              className="input w-48"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => refetchPreview()}
            className="btn-ghost gap-2"
          >
            <Eye size={16} /> Visualizar
          </button>
          <button
            onClick={() => {
              if (!preview?.toGenerate) { toast('Nenhuma fatura a gerar para este mês.'); return }
              if (confirm(`Gerar ${preview.toGenerate} fatura(s) de ${preview.referenceMonth}?`)) generate.mutate()
            }}
            disabled={generate.isPending}
            className="btn-primary gap-2"
          >
            {generate.isPending ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
            Gerar Mensalidades
          </button>
        </div>

        {previewLoading ? (
          <LoadingState size="sm" />
        ) : preview ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'A Gerar',      value: preview.toGenerate,    icon: CheckCircle2, color: 'text-primary' },
              { label: 'Já Existem',   value: preview.alreadyExists, icon: AlertCircle,  color: 'text-amber-500' },
              { label: 'Sem Valor',    value: preview.withoutFee,    icon: Users,        color: 'text-rose-500' },
              { label: 'Total Previsto', value: fmtBRL(preview.totalAmount), icon: DollarSign, color: 'text-emerald-500', isCurrency: true },
            ].map((stat, i) => (
              <div key={i} className="rounded-2xl bg-accent/30 border border-border p-4 text-center">
                <stat.icon size={18} className={`mx-auto mb-2 ${stat.color}`} />
                <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        ) : null}

        {preview?.withoutFee > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 font-medium">
            ⚠️ {preview.withoutFee} criança(s)/aluno(s) sem mensalidade cadastrada. Configure o valor no cadastro de cada um.
          </div>
        )}
      </div>

      {/* ── Exportação de Relatórios ────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h2 className="font-black text-foreground">Exportação de Relatórios</h2>
            <p className="text-xs text-muted-foreground">Baixe dados em CSV — compatível com Excel e Google Sheets</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Mês de Referência</label>
          <input
            type="month"
            value={reportMonth}
            onChange={e => setReportMonth(e.target.value)}
            className="input w-48"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REPORTS.map((r) => (
            <button
              key={r.type}
              onClick={() => downloadReport(r.type)}
              className="flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${r.color}`}>
                <r.icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-foreground group-hover:text-primary transition-colors">{r.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
              <Download size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
