'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, ClipboardCheck, MessageSquare,
  Plus, Clock, AlertCircle,
  UserCheck, ChevronRight, Bell, BookOpen
} from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

type DashboardData = {
  groups: Array<{
    id: string
    name: string
    shift: string
    _count: { children: number; students: number }
  }>
  todayCheckIns: Array<{
    id: string
    status: string
    child: { id: string; fullName: string }
  }>
  pendingReports: number
  announcements: Array<{
    id: string
    title: string
    content: string
    createdAt: string
    targetRole: string | null
  }>
}

export default function TeacherHomePage() {
  const { data: session } = useSession()
  const user = session?.user
  const firstName = user?.name?.split(' ')[0] ?? 'Professor(a)'
  const initials = user?.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? 'PR'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/teacher/dashboard')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  const totalAlunos = data?.groups.reduce((acc, g) => acc + g._count.children + g._count.students, 0) ?? 0
  const presentesHoje = data?.todayCheckIns.filter(c => c.status === 'PRESENTE').length ?? 0
  const firstGroup = data?.groups[0]

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border p-5 pt-10">
        <div className="container mx-auto max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {greeting}, <span className="text-primary">{firstName}</span>! 🍎
              </h1>
              <p className="text-muted-foreground font-medium text-sm mt-1">Bem-vinda(o) ao seu painel do dia.</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-sm shrink-0">
              {initials}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl p-6 space-y-8">

        {/* Resumo do dia */}
        {!loading && !error && data && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-4"
          >
            <div className="bg-card rounded-2xl border border-border p-4 text-center shadow-sm">
              <p className="text-2xl font-black text-foreground">{totalAlunos}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Total de alunos</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 text-center shadow-sm">
              <p className="text-2xl font-black text-emerald-600">{presentesHoje}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Presentes hoje</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 text-center shadow-sm">
              <p className={`text-2xl font-black ${data.pendingReports > 0 ? 'text-amber-500' : 'text-foreground'}`}>
                {data.pendingReports}
              </p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Diários pendentes</p>
            </div>
          </motion.div>
        )}

        {/* Ações rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Diário de Rotina */}
          <Link
            href={firstGroup ? `/teacher/classes/${firstGroup.id}` : '/teacher/classes'}
            className="bg-primary p-8 rounded-[2rem] text-primary-foreground shadow-xl shadow-primary/10 hover:scale-105 transition-all"
          >
            <ClipboardCheck className="mb-4" size={32} />
            <h3 className="text-xl font-black mb-1">Diário de Rotina</h3>
            <p className="text-primary-foreground/80 text-xs font-medium">
              {firstGroup ? `Turma: ${firstGroup.name}` : 'Registrar sono, comida e higiene.'}
            </p>
          </Link>

          {/* Frequência */}
          <Link
            href="/teacher/attendance"
            className="bg-card p-8 rounded-[2rem] border border-border shadow-sm hover:shadow-md transition-all"
          >
            <UserCheck className="mb-4 text-emerald-500" size={32} />
            <h3 className="text-xl font-black text-foreground mb-1">Frequência</h3>
            <p className="text-muted-foreground text-xs font-medium">Chamada digital do dia.</p>
          </Link>

          {/* Minhas Turmas */}
          <Link
            href="/teacher/classes"
            className="bg-card p-8 rounded-[2rem] border border-border shadow-sm hover:shadow-md transition-all"
          >
            <BookOpen className="mb-4 text-violet-500" size={32} />
            <h3 className="text-xl font-black text-foreground mb-1">Minhas Turmas</h3>
            <p className="text-muted-foreground text-xs font-medium">
              {data ? `${data.groups.length} turma(s) vinculada(s)` : 'Ver turmas e alunos.'}
            </p>
          </Link>
        </motion.div>

        {/* Pendências do dia */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm"
        >
          <h2 className="text-xl font-black text-foreground mb-6 flex items-center gap-2">
            <Clock className="text-amber-500" size={24} />
            Pendências para hoje
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-2xl text-destructive text-sm font-medium">
              <AlertCircle size={18} />
              Não foi possível carregar as pendências. Tente recarregar a página.
            </div>
          ) : data && data.pendingReports > 0 ? (
            <div className="space-y-3">
              <Link
                href={firstGroup ? `/teacher/classes/${firstGroup.id}` : '/teacher/classes'}
                className="flex items-center justify-between p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 hover:border-amber-500/40 transition-all"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-1 h-10 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <div className="text-sm font-black text-foreground">
                      {data.pendingReports} {data.pendingReports === 1 ? 'diário pendente' : 'diários pendentes'} hoje
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">Toque para registrar agora</div>
                  </div>
                </div>
                <ChevronRight className="text-amber-500" size={18} />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-3">
                <UserCheck className="text-emerald-600" size={24} />
              </div>
              <p className="text-sm font-black text-foreground">Tudo em dia!</p>
              <p className="text-xs font-medium text-muted-foreground mt-1">Nenhum diário pendente para hoje.</p>
            </div>
          )}
        </motion.div>

        {/* Avisos recentes */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm"
        >
          <h2 className="text-xl font-black text-foreground mb-6 flex items-center gap-2">
            <Bell className="text-violet-500" size={24} />
            Avisos recentes
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground text-center py-4">Não foi possível carregar os avisos.</p>
          ) : data && data.announcements.length > 0 ? (
            <div className="space-y-3">
              {data.announcements.map((a) => (
                <div key={a.id} className="p-4 bg-muted/30 rounded-2xl border border-border">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-black text-foreground">{a.title}</p>
                    <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                      {new Date(a.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  {a.content && (
                    <p className="text-xs font-medium text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium text-muted-foreground text-center py-4">Nenhum aviso no momento.</p>
          )}
        </motion.div>

        {/* Minhas Turmas resumo */}
        {data && data.groups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                <Users className="text-primary" size={24} />
                Minhas Turmas
              </h2>
              <Link href="/teacher/classes" className="text-sm font-bold text-primary">Ver todas</Link>
            </div>

            <div className="space-y-3">
              {data.groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/teacher/classes/${group.id}`}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border hover:border-primary/20 hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-xs shrink-0">
                      {group.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">{group.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {group._count.children + group._count.students} aluno(s) · {group.shift}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="text-muted-foreground" size={18} />
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* FAB - Novo diário */}
      <Link
        href={firstGroup ? `/teacher/classes/${firstGroup.id}` : '/teacher/classes'}
        className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-primary-foreground rounded-full shadow-2xl shadow-primary/10 flex items-center justify-center hover:scale-110 transition-all z-40"
        title="Novo diário"
      >
        <Plus size={32} />
      </Link>
    </div>
  )
}
