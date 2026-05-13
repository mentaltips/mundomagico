'use client'

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Baby, Calendar, Utensils, Moon, Droplets, Activity,
  LogIn, LogOut, Stethoscope, Heart, Megaphone, ShieldCheck,
  DollarSign, Camera, FileText, Clock, Smile, AlertTriangle,
  ChevronRight, Sun, Star, ArrowLeft,
} from 'lucide-react'
import { Skeleton, SectionLabel } from '@/components/ui/index'

// ── Types ─────────────────────────────────────────────────────────────────────
type DashboardData = {
  guardianName: string
  child: {
    id: string
    name: string
    fullName: string
    group: string
    shift: string
  } | null
  report: {
    meals: { id: string; mealType: string; result?: string; amount?: string; description?: string; time?: string }[]
    sleep: { slept: boolean; quality?: string; sleepTime?: string; wakeTime?: string; observation?: string } | null
    hygiene: { diaperChanges: number; bath: boolean } | null
    moods: { mood: string; time?: string; observation?: string }[]
    activities: { name: string; description?: string }[]
    note: string | null
    important: string | null
  } | null
  announcements: { id: string; title: string; content: string; date: string }[]
}

type FeedItem = {
  id: string
  type: string
  title: string
  description: string | null
  time: string
  icon: string
  color: string
}

type FeedData = {
  childName: string
  items: FeedItem[]
}

const ICON_MAP: Record<string, any> = {
  Utensils, Moon, Droplets, Activity, LogIn, LogOut, Stethoscope, Heart,
}

const MOOD_EMOJI: Record<string, string> = {
  FELIZ: '😊', CALMO: '😌', AGITADO: '😤', TRISTE: '😢',
  CHOROSO: '😭', IRRITADO: '😠', SONOLENTO: '😴',
}

const SHIFT_LABEL: Record<string, string> = {
  MANHA: 'Manhã', TARDE: 'Tarde', INTEGRAL: 'Integral', NOTURNO: 'Noturno',
}

const quickActions = [
  { href: '/parent/calendar',  icon: Calendar,   label: 'Agenda',     color: 'bg-violet-500/10 text-violet-500' },
  { href: '/parent/payments',  icon: DollarSign,  label: 'Pagamentos', color: 'bg-emerald-500/10 text-emerald-500' },
  { href: '/parent/photos',    icon: Camera,      label: 'Fotos',      color: 'bg-amber-500/10 text-amber-500' },
  { href: '/parent/documents', icon: FileText,    label: 'Documentos', color: 'bg-sky-500/10 text-sky-500' },
]

// ── Sub-components ────────────────────────────────────────────────────────────
function GuardianDashboard() {
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const isHistory = !!dateParam

  const displayDate = dateParam ? new Date(dateParam + 'T12:00:00') : new Date()
  const dateStr = displayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

  const { data: dashboard, isLoading: loadingDash } = useQuery<DashboardData>({
    queryKey: ['guardian-dashboard'],
    queryFn: () => fetch('/api/parent/dashboard').then((r) => r.json()),
    enabled: !isHistory,
  })

  const feedUrl = dateParam ? `/api/parent/feed?date=${dateParam}` : '/api/parent/feed'
  const { data: feedData, isLoading: loadingFeed } = useQuery<FeedData>({
    queryKey: ['guardian-feed', dateParam],
    queryFn: () => fetch(feedUrl).then((r) => r.json()),
  })

  const child = dashboard?.child
  const report = dashboard?.report
  const announcements = dashboard?.announcements ?? []
  const feed = feedData?.items ?? []

  const checkIn  = feed.find((i) => i.icon === 'LogIn')
  const checkOut = feed.find((i) => i.icon === 'LogOut')
  const isPresent = !!checkIn && !checkOut
  const loading = loadingDash || loadingFeed

  return (
    <div className="animate-in space-y-5 pb-8">

      {/* ── History back button ──────────────────────────────────────────── */}
      {isHistory && (
        <Link href="/parent/history" className="inline-flex items-center gap-2 text-sm font-black text-primary hover:text-primary/80 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Histórico
        </Link>
      )}

      {/* ── Welcome header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span className="capitalize">{dateStr}</span>
          </div>
          <h1 className="text-2xl font-black text-foreground leading-tight">
            {loading ? (
              <Skeleton className="w-40 h-7" />
            ) : (
              <>Olá{dashboard?.guardianName ? `, ${dashboard.guardianName.split(' ')[0]}` : ''}!</>
            )}
          </h1>
          {child && (
            <p className="text-sm text-muted-foreground font-medium mt-1">
              Acompanhe o dia de <span className="font-black text-foreground">{child.name}</span>
            </p>
          )}
        </div>

        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/20">
          <Baby className="h-7 w-7" />
        </div>
      </div>

      {/* ── Child info pill ──────────────────────────────────────────────── */}
      {child && (
        <div className="card flex items-center gap-3 p-3.5">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-foreground truncate">{child.fullName}</p>
            <p className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase tracking-wider">
              {child.group} · {SHIFT_LABEL[child.shift] ?? child.shift}
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border ${
            isPresent ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : checkOut ? 'bg-muted text-muted-foreground border-border' : 'bg-primary/10 text-primary border-primary/20'
          }`}>
            <ShieldCheck className="h-3 w-3" />
            {isPresent ? 'Na escola' : checkOut ? 'Saiu' : 'Sem registro'}
          </div>
        </div>
      )}

      {/* ── Check-in / Check-out status ──────────────────────────────────── */}
      {(checkIn || checkOut) && (
        <div className="grid grid-cols-2 gap-3">
          {checkIn && (
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <LogIn className="h-4 w-4 text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Entrada</span>
              </div>
              <p className="text-xl font-black text-foreground">{checkIn.time}</p>
              {checkIn.description && (
                <p className="text-[10px] text-muted-foreground font-medium mt-1 truncate">{checkIn.description}</p>
              )}
            </div>
          )}
          {checkOut && (
            <div className="bg-muted/50 border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <LogOut className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Saída</span>
              </div>
              <p className="text-xl font-black text-foreground">{checkOut.time}</p>
              {checkOut.description && (
                <p className="text-[10px] text-muted-foreground font-medium mt-1 truncate">{checkOut.description}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Important alert ──────────────────────────────────────────────── */}
      {report?.important && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-xs font-black text-amber-600 uppercase tracking-wider">Aviso Importante</p>
            <p className="text-xs text-foreground/80 mt-1 leading-relaxed font-medium">{report.important}</p>
          </div>
        </motion.div>
      )}

      {/* ── Daily summary cards ──────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        </div>
      ) : report ? (
        <div className="space-y-3">
          <SectionLabel>Resumo do Dia</SectionLabel>
          <div className="grid grid-cols-2 gap-3">

            {/* Refeições */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center">
                  <Utensils className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Refeições</span>
              </div>
              {report.meals.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 font-bold uppercase tracking-wider">Não registrado</p>
              ) : (
                <div className="space-y-1">
                  {report.meals.slice(0, 3).map((m, i) => (
                    <p key={i} className="text-xs font-black text-foreground truncate">
                      {m.mealType}: <span className="text-muted-foreground font-bold">{m.result || m.amount || '—'}</span>
                    </p>
                  ))}
                  {report.meals.length > 3 && (
                    <p className="text-[10px] text-muted-foreground font-bold">+{report.meals.length - 3} mais</p>
                  )}
                </div>
              )}
            </div>

            {/* Soneca */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                  <Moon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Soneca</span>
              </div>
              {!report.sleep ? (
                <p className="text-xs text-muted-foreground/50 font-bold uppercase tracking-wider">Não registrado</p>
              ) : (
                <>
                  <p className="text-sm font-black text-foreground">{report.sleep.slept ? '😴 Dormiu' : '😶 Não dormiu'}</p>
                  {report.sleep.slept && report.sleep.quality && (
                    <p className="text-xs text-muted-foreground font-bold mt-1">
                      {report.sleep.quality}
                      {report.sleep.sleepTime && report.sleep.wakeTime && (
                        <> · {report.sleep.sleepTime}–{report.sleep.wakeTime}</>
                      )}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Higiene */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 bg-sky-500/10 text-sky-500 rounded-xl flex items-center justify-center">
                  <Droplets className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Higiene</span>
              </div>
              {!report.hygiene ? (
                <p className="text-xs text-muted-foreground/50 font-bold uppercase tracking-wider">Não registrado</p>
              ) : (
                <>
                  <p className="text-sm font-black text-foreground">{report.hygiene.diaperChanges} trocas</p>
                  <p className="text-xs text-muted-foreground font-bold mt-1">{report.hygiene.bath ? '🚿 Tomou banho' : 'Sem banho'}</p>
                </>
              )}
            </div>

            {/* Humor */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 bg-pink-500/10 text-pink-500 rounded-xl flex items-center justify-center">
                  <Smile className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Humor</span>
              </div>
              {report.moods.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 font-bold uppercase tracking-wider">Não registrado</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {report.moods.slice(0, 3).map((m, i) => (
                    <span key={i} className="text-xs font-black text-foreground bg-accent px-2 py-1 rounded-lg">
                      {MOOD_EMOJI[m.mood] ?? '😊'} {m.mood}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Atividades */}
          {report.activities.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                  <Star className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Atividades do Dia</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {report.activities.map((a, i) => (
                  <span key={i} className="badge badge-amber font-black uppercase tracking-wider text-[9px]">{a.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Recado do professor */}
          {report.note && (
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5">Recado da Professora</p>
              <p className="text-xs text-foreground/80 leading-relaxed font-bold">{report.note}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center p-12 text-center border-dashed">
          <Clock className="h-10 w-10 text-muted-foreground/20 mb-3" />
          <p className="text-sm font-black text-foreground">Diário não preenchido</p>
          <p className="text-xs text-muted-foreground font-bold mt-1">As atividades do dia aparecerão aqui</p>
        </div>
      )}

      {/* ── Quick actions (today only) ───────────────────────────────────── */}
      {!isHistory && (
        <div className="space-y-3">
          <SectionLabel>Acesso Rápido</SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map(({ href, icon: Icon, label, color }) => (
              <Link
                key={href}
                href={href}
                className="card-interactive flex flex-col items-center gap-2.5 p-3 active:scale-95 transition-all"
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm border border-current/10 ${color}`}>
                  <Icon style={{ width: 20, height: 20 }} />
                </div>
                <span className="text-[9px] font-black text-muted-foreground text-center uppercase tracking-widest leading-tight">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Activity timeline ────────────────────────────────────────────── */}
      {feed.filter((i) => i.icon !== 'LogIn' && i.icon !== 'LogOut').length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Linha do Tempo</SectionLabel>
            <span className="badge badge-blue">
              <Calendar className="h-2.5 w-2.5" />
              Hoje
            </span>
          </div>
          <div className="relative space-y-3 before:absolute before:inset-0 before:ml-[18px] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-sky-200 before:via-gray-100 before:to-transparent">
            {feed
              .filter((i) => i.icon !== 'LogIn' && i.icon !== 'LogOut')
              .map((item) => {
                const ItemIcon = ICON_MAP[item.icon] || Heart
                return (
                  <div key={item.id} className="relative flex items-start gap-3">
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-4 border-background bg-card shadow-sm z-10">
                      <ItemIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="card flex-1 p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-black text-foreground text-sm tracking-tight">{item.title}</h4>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.time}</span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* ── Announcements (today only) ───────────────────────────────────── */}
      {!isHistory && announcements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Comunicados</SectionLabel>
            <Link href="/parent/messages" className="text-[10px] font-black text-primary flex items-center gap-1 hover:text-primary/80 transition-colors uppercase tracking-widest">
              Ver todos <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {announcements.slice(0, 3).map((ann) => (
              <div key={ann.id} className="card p-4 group card-hover">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-foreground truncate tracking-tight">{ann.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2 font-medium">{ann.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-muted-foreground/50" />
                      <p className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-widest">
                        {new Date(ann.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ParentHomePage() {
  return (
    <Suspense fallback={
      <div className="space-y-5 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 rounded-2xl bg-gray-100" />
        ))}
      </div>
    }>
      <GuardianDashboard />
    </Suspense>
  )
}
