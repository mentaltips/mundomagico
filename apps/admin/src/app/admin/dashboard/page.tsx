'use client'

import { motion } from 'framer-motion'
import {
  Users, MessageSquare, CreditCard, TrendingUp,
  Calendar, ArrowUpRight, HeartPulse, Baby,
  ClipboardCheck, Bell, AlertCircle, BarChart2,
  ChevronRight, Activity, Clock, CheckCircle2, LayoutGrid, Megaphone, Plus
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { StatCard, LoadingState, EmptyState, Skeleton, PageHeader, Avatar, Badge } from '@/components/ui'
import Link from 'next/link'

// ── Helpers ───────────────────────────────────────────────────────────────────
const weekData = [
  { day: 'Seg', val: 0 },
  { day: 'Ter', val: 0 },
  { day: 'Qua', val: 0 },
  { day: 'Qui', val: 0 },
  { day: 'Sex', val: 0 },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const today = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long', day: '2-digit', month: 'long',
})

interface DashboardStats {
  activeAlunos: number
  totalGroups: number
  pendingInvoices: number
  overdueInvoices: number
  attendanceRate: string
  totalPaid: number
  presentToday: number
  absentToday: number
  weeklyAttendance: { day: string; val: number }[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const firstName = session?.user?.name?.split(' ')[0] ?? 'Admin'

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['stats'],
    queryFn: () => fetch('/api/stats').then((r) => r.json()),
  })

  const { data: notifData } = useQuery<{ notifications: any[]; unreadCount: number }>({
    queryKey: ['admin-notifications'],
    queryFn: () => fetch('/api/notifications').then((r) => r.json()),
    refetchInterval: 30_000,
  })

  const notifications: any[] = notifData?.notifications ?? []

  const statCards = [
    {
      label: 'Crianças Ativas',
      value: isLoading ? '—' : (stats?.activeAlunos ?? 0).toString(),
      icon: <Baby size={20} />,
      trend: stats?.activeAlunos ? `${stats.activeAlunos} total` : undefined,
      color: 'text-primary bg-primary/10',
      href: '/admin/children',
    },
    {
      label: 'Turmas Ativas',
      value: isLoading ? '—' : (stats?.totalGroups ?? 0).toString(),
      icon: <LayoutGrid size={20} />,
      color: 'text-blue-500 bg-blue-500/10',
      href: '/admin/groups',
    },
    {
      label: 'Faturas Pendentes',
      value: isLoading ? '—' : (stats?.pendingInvoices ?? 0).toString(),
      icon: <CreditCard size={20} />,
      trend: stats?.overdueInvoices ? `${stats.overdueInvoices} vencidas` : undefined,
      trendUp: false,
      color: 'text-amber-500 bg-amber-500/10',
      href: '/admin/finance',
    },
    {
      label: 'Frequência Hoje',
      value: isLoading ? '—' : (stats?.attendanceRate ?? '—'),
      icon: <TrendingUp size={20} />,
      trend: stats?.attendanceRate,
      trendUp: true,
      color: 'text-violet-500 bg-violet-500/10',
      href: '/admin/check-in-out',
    },
  ]

  const quickActions = [
    { icon: ClipboardCheck, label: 'Lançar Rotina', desc: 'Registrar o dia',  href: '/admin/daily-routine', color: 'bg-primary',   shadow: 'shadow-primary/20' },
    { icon: HeartPulse,     label: 'Saúde',         desc: 'Medicações',       href: '/admin/health',        color: 'bg-rose-500',   shadow: 'shadow-rose-500/20' },
    { icon: Megaphone,      label: 'Comunicado',    desc: 'Aviso aos pais',   href: '/admin/announcements', color: 'bg-amber-500',  shadow: 'shadow-amber-500/20' },
    { icon: Calendar,       label: 'Calendário',    desc: 'Eventos',          href: '/admin/calendar',      color: 'bg-blue-500',   shadow: 'shadow-blue-500/20' },
  ]

  return (
    <div className="page animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{today}</p>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            {greeting()}, <span className="text-primary">{firstName}</span> 👋
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">Aqui está o resumo do que está acontecendo na escola.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Link href="/admin/children/new" className="btn-primary flex-1 md:flex-initial gap-2">
            <Plus size={18} /> <span className="hidden sm:inline">Nova Criança</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Link key={i} href={card.href} className="block transition-transform active:scale-95">
            <StatCard {...card} />
          </Link>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 card p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-foreground">Frequência Semanal</h3>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Presenças por dia da semana</p>
            </div>
            <Badge label="Esta Semana" variant="primary" size="sm" />
          </div>
          
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.weeklyAttendance ?? weekData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 700 }}
                  dy={8}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, opacity: 0.5 }}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--accent))', radius: 8 }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--card))',
                    fontWeight: 900,
                    fontSize: 12,
                    padding: '12px',
                  }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                  formatter={(v: any) => [`${v} crianças`, 'Presenças']}
                />
                <Bar dataKey="val" radius={[8, 8, 0, 0]} barSize={32}>
                  {(stats?.weeklyAttendance ?? weekData).map((_: any, i: number) => (
                    <Cell 
                      key={i} 
                      fill={i === (new Date().getDay() - 1) ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.15)'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border">
            {[
              { label: 'Presentes', value: stats?.presentToday ?? '—', color: 'text-primary' },
              { label: 'Ausentes',  value: stats?.absentToday ?? '—',  color: 'text-rose-500' },
              { label: 'Média Mês', value: stats?.attendanceRate ?? '—', color: 'text-blue-500' },
            ].map((m, i) => (
              <div key={i} className="text-center">
                <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">{m.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card p-6 flex flex-col bg-card"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-foreground rounded-2xl flex items-center justify-center">
                <Bell size={18} className="text-background" />
              </div>
              <div>
                <h3 className="font-black text-foreground text-sm">Notificações</h3>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Últimos avisos</p>
              </div>
            </div>
            {notifications.length > 0 && <Badge label={notifications.length.toString()} variant="red" size="sm" />}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] pr-1 scrollbar-none">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-30">
                <CheckCircle2 size={40} className="mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">Tudo em dia!</p>
              </div>
            ) : (
              notifications.slice(0, 6).map((n, i) => (
                <Link
                  key={n.id}
                  href={n.href ?? '#'}
                  className={`flex items-start gap-3 p-3 rounded-2xl transition-all border border-transparent hover:border-border hover:bg-accent/20 group`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${n.priority === 'URGENTE' ? 'bg-rose-500/10 text-rose-500' : 'bg-accent text-muted-foreground'}`}>
                    <Activity size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-black truncate ${n.priority === 'URGENTE' ? 'text-rose-500' : 'text-foreground'}`}>
                      {n.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5 line-clamp-1">{n.body}</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground/30 group-hover:text-foreground transition-colors mt-1" />
                </Link>
              ))
            )}
          </div>

          <Link href="/admin/announcements" className="mt-6 btn-ghost py-3 text-[10px] tracking-widest uppercase">
            Ver Todos
          </Link>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-4 ml-1">Ações Rápidas</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => {
            const Icon = action.icon
            return (
              <Link
                key={i}
                href={action.href}
                className="card-hover p-4 flex items-center gap-4 group transition-transform active:scale-95"
              >
                <div className={`w-11 h-11 ${action.color} ${action.shadow} rounded-xl flex items-center justify-center shrink-0 text-white group-hover:scale-110 transition-transform`}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-foreground text-xs uppercase tracking-wider truncate">{action.label}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5 truncate">{action.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Finance & Announcements Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Finance Box */}
        <div className="card p-6 border-border flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                <Banknote size={18} />
              </div>
              <h3 className="font-black text-foreground text-sm uppercase tracking-widest">Resumo Financeiro</h3>
            </div>
            <Link href="/admin/finance" className="text-[10px] font-black text-primary hover:underline uppercase">Ver Painel</Link>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pago',   value: stats?.totalPaid ?? 0, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10', prefix: 'R$ ' },
              { label: 'Aberto', value: stats?.pendingInvoices ?? 0, icon: Clock, color: 'text-amber-500 bg-amber-500/10' },
              { label: 'Atraso', value: stats?.overdueInvoices ?? 0, icon: AlertCircle, color: 'text-rose-500 bg-rose-500/10' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-4 rounded-2xl bg-accent/20 border border-border/50 gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                  <item.icon size={14} />
                </div>
                <p className="text-xs font-black text-foreground">
                  {item.prefix || ''}{item.value.toLocaleString('pt-BR')}
                </p>
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Announcements Box */}
        <div className="card p-6 border-border flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                <Megaphone size={18} />
              </div>
              <h3 className="font-black text-foreground text-sm uppercase tracking-widest">Comunicados</h3>
            </div>
            <Link href="/admin/announcements" className="text-[10px] font-black text-primary hover:underline uppercase">Central</Link>
          </div>
          <RecentAnnouncements />
        </div>
      </div>
    </div>
  )
}

function RecentAnnouncements() {
  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ['announcements-preview'],
    queryFn: () => fetch('/api/announcements').then((r) => r.json()),
  })
  const announcements = Array.isArray(data) ? data.slice(0, 3) : []

  if (isLoading) return <LoadingState size="sm" />

  if (announcements.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center opacity-30">
      <MessageSquare size={32} className="mb-2" />
      <p className="text-[10px] font-black uppercase tracking-widest text-center">Nenhum enviado</p>
    </div>
  )

  return (
    <div className="space-y-2">
      {announcements.map((ann) => (
        <div key={ann.id} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-accent/20 transition-all border border-transparent hover:border-border group">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${ann.priority === 'URGENTE' ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>
            <MessageSquare size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-foreground truncate group-hover:text-primary transition-colors">{ann.title}</p>
            <p className="text-[10px] text-muted-foreground font-bold mt-0.5">
              {new Date(ann.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </p>
          </div>
          {ann.priority === 'URGENTE' && <Badge label="Urgente" variant="red" size="sm" />}
        </div>
      ))}
    </div>
  )
}

function Banknote(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01" />
      <path d="M18 12h.01" />
    </svg>
  )
}
