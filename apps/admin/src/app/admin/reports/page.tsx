'use client'

import { useState } from 'react'
import {
  FileText, Download, Loader2, Users, CreditCard,
  ClipboardCheck, TrendingUp, Calendar, BarChart2
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import toast from 'react-hot-toast'

const COLORS = ['#84cc16', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function ReportsPage() {
  const [exporting, setExporting] = useState<string | null>(null)

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => fetch('/api/stats').then((r) => r.json()),
  })

  const { data: childrenRaw = [] } = useQuery<{ status: string; shift: string; group?: { name: string } }[]>({
    queryKey: ['children-report'],
    queryFn: () => fetch('/api/children').then((r) => r.json()),
  })
  const children = Array.isArray(childrenRaw) ? childrenRaw : []

  const { data: invoicesRaw = [] } = useQuery<{ status: string; amount: number; dueDate: string }[]>({
    queryKey: ['invoices-report'],
    queryFn: () => fetch('/api/finance/invoices').then((r) => r.json()),
  })
  const invoices = Array.isArray(invoicesRaw) ? invoicesRaw : []

  const { data: devReportsRaw = [] } = useQuery<{ isDraft: boolean }[]>({
    queryKey: ['dev-reports-count'],
    queryFn: () => fetch('/api/development-reports').then((r) => r.json()),
  })
  const devReports = Array.isArray(devReportsRaw) ? devReportsRaw : []

  const handleExport = async (type: string, fmt: string) => {
    setExporting(`${type}-${fmt}`)
    try {
      const res = await fetch(`/api/reports/export?type=${type}&format=${fmt}`)
      if (fmt === 'csv') {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const json = await res.json()
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
      toast.success('Exportado com sucesso!')
    } catch { toast.error('Erro ao exportar') }
    finally { setExporting(null) }
  }

  // Dados para gráficos
  const statusData = [
    { name: 'Ativo',        value: (children as { status: string }[]).filter((c) => c.status === 'ATIVO').length },
    { name: 'Adaptação',    value: (children as { status: string }[]).filter((c) => c.status === 'ADAPTACAO').length },
    { name: 'Ag. Vaga',     value: (children as { status: string }[]).filter((c) => c.status === 'AGUARDANDO_VAGA').length },
    { name: 'Inativo',      value: (children as { status: string }[]).filter((c) => c.status === 'INATIVO').length },
  ].filter((d) => d.value > 0)

  const shiftData = [
    { name: 'Manhã',    value: (children as { shift: string }[]).filter((c) => c.shift === 'MANHA').length },
    { name: 'Tarde',    value: (children as { shift: string }[]).filter((c) => c.shift === 'TARDE').length },
    { name: 'Integral', value: (children as { shift: string }[]).filter((c) => c.shift === 'INTEGRAL').length },
  ].filter((d) => d.value > 0)

  const invoiceStatusData = [
    { name: 'Pago',      value: (invoices as { status: string }[]).filter((i) => i.status === 'PAGO').length,     fill: '#84cc16' },
    { name: 'Pendente',  value: (invoices as { status: string }[]).filter((i) => i.status === 'PENDENTE').length,  fill: '#f59e0b' },
    { name: 'Vencido',   value: (invoices as { status: string }[]).filter((i) => i.status === 'VENCIDO').length,   fill: '#ef4444' },
    { name: 'Cancelado', value: (invoices as { status: string }[]).filter((i) => i.status === 'CANCELADO').length, fill: '#9ca3af' },
  ].filter((d) => d.value > 0)

  const totalRevenue = (invoices as { status: string; amount: number }[])
    .filter((i) => i.status === 'PAGO')
    .reduce((sum, i) => sum + i.amount, 0)

  const pendingRevenue = (invoices as { status: string; amount: number }[])
    .filter((i) => i.status === 'PENDENTE')
    .reduce((sum, i) => sum + i.amount, 0)

  const summaryCards = [
    {
      label: 'Total de Crianças',
      value: children.length,
      sub: `${statusData.find((s) => s.name === 'Ativo')?.value ?? 0} ativas`,
      icon: <Users size={20} />,
      color: 'text-primary bg-lime-50',
    },
    {
      label: 'Receita Recebida',
      value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sub: `${invoiceStatusData.find((s) => s.name === 'Pago')?.value ?? 0} faturas pagas`,
      icon: <CreditCard size={20} />,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'A Receber',
      value: `R$ ${pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sub: `${invoiceStatusData.find((s) => s.name === 'Pendente')?.value ?? 0} faturas pendentes`,
      icon: <TrendingUp size={20} />,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Relatórios Dev.',
      value: devReports.length,
      sub: `${devReports.filter((r) => !r.isDraft).length} publicados`,
      icon: <ClipboardCheck size={20} />,
      color: 'text-blue-600 bg-blue-50',
    },
  ]

  const exportSections = [
    {
      type: 'children',
      label: 'Crianças',
      icon: <Users size={20} />,
      desc: 'Nome, turma, turno, responsáveis e informações de saúde',
    },
    {
      type: 'finance',
      label: 'Financeiro',
      icon: <CreditCard size={20} />,
      desc: 'Histórico de cobranças e pagamentos',
    },
    {
      type: 'attendance',
      label: 'Frequência',
      icon: <Calendar size={20} />,
      desc: 'Registros de entrada e saída do mês atual',
    },
  ]

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
          <BarChart2 className="text-primary" size={28} />
          Relatórios
        </h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral da escola e exportações de dados</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${card.color}`}>
              {card.icon}
            </div>
            <p className="text-2xl font-black text-gray-900 leading-none">{card.value}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{card.label}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status das crianças */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-gray-900 mb-4">Status das Crianças</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} crianças`]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Sem dados</div>
          )}
        </div>

        {/* Turno */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-gray-900 mb-4">Distribuição por Turno</h2>
          {shiftData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={shiftData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} crianças`]} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {shiftData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Sem dados</div>
          )}
        </div>

        {/* Financeiro */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-gray-900 mb-4">Status das Faturas</h2>
          {invoiceStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={invoiceStatusData}
                  cx="50%" cy="50%"
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {invoiceStatusData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} faturas`]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Sem faturas</div>
          )}
        </div>
      </div>

      {/* Exportações */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-black text-gray-900 mb-1 flex items-center gap-2">
          <FileText size={20} className="text-primary" />
          Exportar Dados
        </h2>
        <p className="text-sm text-gray-500 mb-6">Baixe os dados em CSV para planilhas ou JSON para integração</p>

        <div className="space-y-3">
          {exportSections.map(({ type, label, icon, desc }) => (
            <div key={type} className="flex items-center justify-between bg-gray-50 rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-gray-500 shadow-sm">
                  {icon}
                </div>
                <div>
                  <p className="font-black text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleExport(type, 'csv')}
                  disabled={!!exporting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-black text-xs hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  {exporting === `${type}-csv` ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  CSV
                </button>
                <button
                  onClick={() => handleExport(type, 'json')}
                  disabled={!!exporting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl font-black text-xs hover:bg-lime-600 transition-all disabled:opacity-50"
                >
                  {exporting === `${type}-json` ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  JSON
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
