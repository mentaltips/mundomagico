'use client'

import { useState } from 'react'
import {
  FileText, Download, Loader2, Users, CreditCard,
  ClipboardCheck, TrendingUp, Calendar, BarChart2,
  PieChart as PieChartIcon
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import toast from 'react-hot-toast'
import { PageHeader, StatCard } from '@/components/ui'

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

  const exportSections = [
    {
      type: 'children',
      label: 'Crianças',
      icon: <Users size={20} />,
      desc: 'Nome, turma, turno, responsáveis e saúde',
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
      desc: 'Registros de entrada e saída do mês',
    },
  ]

  return (
    <div className="page animate-in">
      <PageHeader 
        title="Relatórios & BI" 
        subtitle="Análise completa da escola e exportação de dados estratégicos."
        icon={<BarChart2 size={24} />}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Alunos" 
          value={children.length} 
          icon={<Users size={20} />} 
          color="text-primary bg-primary/10" 
          trend={`${statusData.find(s => s.name === 'Ativo')?.value ?? 0} ativos`}
        />
        <StatCard 
          label="Recebido" 
          value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={<CreditCard size={20} />} 
          color="text-emerald-500 bg-emerald-500/10" 
          trend={`${invoiceStatusData.find(s => s.name === 'Pago')?.value ?? 0} pagas`}
        />
        <StatCard 
          label="A Receber" 
          value={`R$ ${pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={<TrendingUp size={20} />} 
          color="text-amber-500 bg-amber-500/10" 
          trend={`${invoiceStatusData.find(s => s.name === 'Pendente')?.value ?? 0} pendentes`}
        />
        <StatCard 
          label="Relatórios Dev." 
          value={devReports.length} 
          icon={<ClipboardCheck size={20} />} 
          color="text-blue-500 bg-blue-500/10" 
          trend={`${devReports.filter(r => !r.isDraft).length} publicados`}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status */}
        <div className="bg-card rounded-[2.5rem] border border-border p-6 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <PieChartIcon size={18} />
            </div>
            <h3 className="font-black text-foreground text-sm uppercase tracking-widest">Status das Crianças</h3>
          </div>
          <div className="h-[240px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                  />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">Sem dados</div>
            )}
          </div>
        </div>

        {/* Distribution */}
        <div className="bg-card rounded-[2.5rem] border border-border p-6 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
              <BarChart2 size={18} />
            </div>
            <h3 className="font-black text-foreground text-sm uppercase tracking-widest">Turnos</h3>
          </div>
          <div className="h-[240px]">
            {shiftData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shiftData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--accent))' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {shiftData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">Sem dados</div>
            )}
          </div>
        </div>

        {/* Finance */}
        <div className="bg-card rounded-[2.5rem] border border-border p-6 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
              <CreditCard size={18} />
            </div>
            <h3 className="font-black text-foreground text-sm uppercase tracking-widest">Faturas</h3>
          </div>
          <div className="h-[240px]">
            {invoiceStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={invoiceStatusData}
                    cx="50%" cy="50%"
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {invoiceStatusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">Sem faturas</div>
            )}
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-card rounded-[2.5rem] border border-border p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Download size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground">Exportar Dados</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">Relatórios para planilhas e auditoria</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exportSections.map(({ type, label, icon, desc }) => (
            <div key={type} className="p-6 rounded-3xl border border-border bg-accent/20 hover:bg-accent/40 transition-colors flex flex-col group">
              <div className="w-10 h-10 bg-card rounded-2xl border border-border flex items-center justify-center text-muted-foreground shadow-sm group-hover:text-primary transition-colors mb-4">
                {icon}
              </div>
              <h4 className="font-black text-foreground mb-1">{label}</h4>
              <p className="text-xs text-muted-foreground font-medium mb-6 flex-1">{desc}</p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport(type, 'csv')}
                  disabled={!!exporting}
                  className="flex-1 btn-ghost py-2 rounded-xl text-[10px] gap-1.5"
                >
                  {exporting === `${type}-csv` ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  CSV
                </button>
                <button
                  onClick={() => handleExport(type, 'json')}
                  disabled={!!exporting}
                  className="flex-1 btn-primary py-2 rounded-xl text-[10px] gap-1.5"
                >
                  {exporting === `${type}-json` ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
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
