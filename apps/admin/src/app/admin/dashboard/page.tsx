'use client'

import { motion } from 'framer-motion'
import {
  Users, MessageSquare, CreditCard, TrendingUp,
  Calendar, ArrowUpRight, HeartPulse, Baby,
  ClipboardCheck, Bell, AlertCircle, BarChart2,
  ChevronRight, Activity, Clock, CheckCircle2,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { StatCard, LoadingState, EmptyState, Skeleton } from '@/components/ui'
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

// ── Component ─────────────────────────────────────────────────────────────────
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
      value: isLoading ? '—' : (stats?.activeAlunos ?? 0),
      icon: <Baby size={18} />,
      trend: stats?.activeAlunos ? `${stats.activeAlunos} total` : undefined,
      color: 'text-lime-700 bg-lime-100',
      href: '/admin/children',
    },
    {
      label: 'Turmas Ativas',
      value: isLoading ? '—' : (stats?.totalGroups ?? 0),
      icon: <Users size={18} />,
      color: 'text-blue-700 bg-blue-100',
      href: '/admin/groups',
    },
    {
      label: 'Faturas Pendentes',
      value: isLoading ? '—' : (stats?.pendingInvoices ?? 0),
      icon: <CreditCard size={18} />,
      trend: stats?.overdueInvoices ? `${stats.overdueInvoices} vencidas` : undefined,
      trendUp: false,
      color: 'text-amber-700 bg-amber-100',
      href: '/admin/finance',
    },
    {
      label: 'Frequência Hoje',
      value: isLoading ? '—' : (stats?.attendanceRate ?? '—'),
      icon: <TrendingUp size={18} />,
      trend: stats?.attendanceRate,
      trendUp: true,
      color: 'text-violet-700 bg-violet-100',
      href: '/admin/check-in-out',
    },
  ]

  const quickActions = [
    { icon: ClipboardCheck, label: 'Lançar Rotina', desc: 'Registrar o dia das crianças',  href: '/admin/daily-routine', color: 'bg-lime-500',   shadow: 'shadow-lime-200' },
    { icon: HeartPulse,     label: 'Saúde',         desc: 'Medicações e alertas',           href: '/admin/health',        color: 'bg-rose-500',   shadow: 'shadow-rose-200' },
    { icon: MessageSquare,  label: 'Comunicado',    desc: 'Enviar aviso aos pais',          href: '/admin/announcements', color: 'bg-amber-500',  shadow: 'shadow-amber-200' },
    { icon: Calendar,       label: 'Calendário',    desc: 'Eventos e reuniões',             href: '/admin/calendar',      color: 'bg-blue-500',   shadow: 'shadow-blue-200' },
  ]

  return (
    <div className="page animate-in">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <p className="text-xs font-bold text-muted-foreground capitalize mb-0.5">{today}</p>
          <h1 className="text-2xl font-black text-foreground">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="page-subtitle mt-0.5">Aqui está o resumo do seu dia</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/reports" className="btn-secondary text-xs gap-1.5">
            <BarChart2 size={14} />
            Relatórios
          </Link>
          <Link href="/admin/children/new" className="btn-primary text-xs gap-1.5">
            <Baby size={14} />
            Nova criança
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
          >
            {isLoading ? (
              <div className="card p-5 space-y-3">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ) : (
              <Link href={card.href} className="block">
                <StatCard {...card} />
              </Link>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-black text-foreground">Frequência Semanal</h3>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Presenças por dia desta semana</p>
            </div>
            <span className="badge badge-lime">Esta semana</span>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats?.weeklyAttendance ?? weekData}
                margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
              >
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
                    border: 'none',
                    backgroundColor: 'hsl(var(--card))',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    fontWeight: 700,
                    fontSize: 12,
                    padding: '10px 16px',
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(v: any) => [`${v} crianças`, 'Presenças']}
                />
                <Bar dataKey="val" radius={[8, 8, 0, 0]} barSize={36}>
                  {(stats?.weeklyAttendance ?? weekData).map((_: any, i: number) => (
                    <Cell key={i} fill={i === new Date().getDay() - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.2)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Bottom row of mini stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-border">
              {[
                { label: 'Presentes hoje',  value: stats.presentToday ?? '—',   color: 'text-primary' },
                { label: 'Ausentes',         value: stats.absentToday ?? '—',    color: 'text-destructive' },
                { label: 'Taxa do mês',      value: stats.attendanceRate ?? '—', color: 'text-sky-600' },
              ].map((m, i) => (
                <div key={i} className="text-center">
                  <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Notifications feed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="card p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-foreground rounded-xl flex items-center justify-center">
                <Bell size={14} className="text-background" />
              </div>
              <div>
                <h3 className="font-black text-foreground text-sm">Notificações</h3>
                {notifications.length > 0 && (
                  <p className="text-[10px] text-muted-foreground font-medium">{notifications.length} avisos</p>
                )}
              </div>
            </div>
            {notifications.filter((n) => n.priority === 'URGENTE').length > 0 && (
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[280px] pr-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="text-gray-200 mb-2" size={28} />
                <p className="text-xs text-gray-400 font-bold">Tudo em dia!</p>
              </div>
            ) : (
              notifications.slice(0, 6).map((n, i) => {
                const isUrgent = n.priority === 'URGENTE'
                return (
                  <Link
                    key={n.id}
                    href={n.href ?? '#'}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-colors group ${
                      isUrgent ? 'bg-rose-50 hover:bg-rose-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isUrgent ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Activity size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black truncate ${isUrgent ? 'text-rose-800' : 'text-gray-800'}`}>
                        {n.title}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5 line-clamp-1">{n.body}</p>
                    </div>
                    <ChevronRight size={12} className="text-gray-300 shrink-0 mt-1 group-hover:text-gray-500 transition-colors" />
                  </Link>
                )
              })
            )}
          </div>

          <Link
            href="/admin/announcements"
            className="mt-4 btn-secondary text-xs w-full justify-center"
          >
            Ver todos os comunicados
          </Link>
        </motion.div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Acesso Rápido</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => {
            const Icon = action.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.06 }}
              >
                <Link
                  href={action.href}
                  className="card-interactive p-5 flex items-center gap-4 group"
                >
                  <div className={`w-11 h-11 ${action.color} shadow-lg ${action.shadow} rounded-xl flex items-center justify-center shrink-0 text-white group-hover:scale-110 transition-transform`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-foreground text-sm truncate">{action.label}</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5 truncate">{action.desc}</p>
                  </div>
                  <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Recent activity row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending invoices summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-900 text-sm">Financeiro</h3>
            <Link href="/admin/finance" className="text-[10px] font-black text-lime-600 hover:text-lime-700 flex items-center gap-0.5">
              Ver tudo <ChevronRight size={12} />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Recebido',  value: `R$ ${(stats?.totalPaid ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,  color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 },
                { label: 'Pendente', value: `${stats?.pendingInvoices ?? 0} fat.`,  color: 'text-amber-600 bg-amber-50',   icon: Clock },
                { label: 'Vencido',  value: `${stats?.overdueInvoices ?? 0} fat.`,  color: 'text-rose-600 bg-rose-50',     icon: AlertCircle },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 gap-1.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                      <Icon size={14} />
                    </div>
                    <p className="text-xs font-black text-gray-900 leading-tight">{item.value}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Announcements preview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-900 text-sm">Comunicados Recentes</h3>
            <Link href="/admin/announcements" className="text-[10px] font-black text-lime-600 hover:text-lime-700 flex items-center gap-0.5">
              Ver tudo <ChevronRight size={12} />
            </Link>
          </div>
          <RecentAnnouncements />
        </motion.div>
      </div>

    </div>
  )
}

// ── Sub-component: Recent Announcements ───────────────────────────────────────
function RecentAnnouncements() {
  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ['announcements-preview'],
    queryFn: () => fetch('/api/announcements').then((r) => r.json()),
  })
  const announcements = Array.isArray(data) ? data.slice(0, 3) : []

  if (isLoading) return (
    <div className="space-y-2">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  )

  if (announcements.length === 0) {
    return (
      <p className="text-xs text-gray-400 font-medium text-center py-4">
        Nenhum comunicado enviado ainda
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {announcements.map((ann) => (
        <div key={ann.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
            ann.priority === 'URGENTE' ? 'bg-rose-50 text-rose-600' : 'bg-lime-50 text-lime-700'
          }`}>
            <MessageSquare size={12} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-gray-900 truncate">{ann.title}</p>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
              {new Date(ann.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </p>
          </div>
          {ann.priority === 'URGENTE' && (
            <span className="badge badge-red text-[9px] shrink-0">Urgente</span>
          )}
        </div>
      ))}
    </div>
  )
}
