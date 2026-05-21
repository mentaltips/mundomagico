'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { signOut, useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, History, MessageSquare, User, LogOut, DollarSign,
  Calendar, Camera, FileText, Bell, X, AlertCircle,
  Megaphone, BarChart2, CreditCard, CheckCheck, ChevronRight
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { OfflineIndicator } from '@/components/OfflineIndicator'

const NOTIF_ICONS: Record<string, any> = {
  announcement: Megaphone,
  alert: AlertCircle,
  report: BarChart2,
  payment: CreditCard,
}
const NOTIF_COLORS: Record<string, string> = {
  announcement: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400',
  alert:        'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400',
  report:       'text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400',
  payment:      'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',
}

const navItems = [
  { label: 'Início',      href: '/responsavel',           icon: Home },
  { label: 'Histórico',   href: '/responsavel/history',   icon: History },
  { label: 'Recados',     href: '/responsavel/messages',  icon: MessageSquare },
  { label: 'Agenda',      href: '/responsavel/calendar',  icon: Calendar },
  { label: 'Fotos',       href: '/responsavel/photos',    icon: Camera },
  { label: 'Docs',        href: '/responsavel/documents', icon: FileText },
  { label: 'Pagamentos',  href: '/responsavel/payments',  icon: DollarSign },
  { label: 'Perfil',      href: '/responsavel/profile',   icon: User },
]

// Only show 5 items in bottom nav; rest accessible via "Mais"
const bottomNav = navItems.slice(0, 5)

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState<string[]>([])
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { data: session, status } = useSession()
  const storageKey = `guardian-notifications-read:${session?.user?.schoolId || 'school'}:${session?.user?.id || session?.user?.email || 'user'}`

  const { data, refetch } = useQuery({
    queryKey: ['guardian-notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications')
      if (res.status === 401) return { notifications: [], unreadCount: 0 }
      if (!res.ok) throw new Error('Erro ao carregar notificacoes')
      return res.json()
    },
    enabled: status === 'authenticated',
    refetchInterval: 60_000,
    retry: false,
  })

  const allNotifications: any[] = data?.notifications ?? []
  const notifications = allNotifications.filter(n => !readIds.includes(n.id))
  const unread = notifications.length

  useEffect(() => {
    if (status !== 'authenticated') return
    try {
      const stored = window.localStorage.getItem(storageKey)
      setReadIds(stored ? JSON.parse(stored) : [])
    } catch {
      setReadIds([])
    }
  }, [status, storageKey])

  const saveReadIds = (ids: string[]) => {
    const unique = Array.from(new Set(ids)).slice(-200)
    setReadIds(unique)
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(unique))
    } catch {}
  }

  const markAsRead = (id: string) => saveReadIds([...readIds, id])
  const markAllAsRead = () => saveReadIds([...readIds, ...allNotifications.map(n => n.id)])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) refetch() }}
        className="relative p-2 text-muted-foreground hover:text-primary transition-colors rounded-xl hover:bg-accent"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-card leading-none px-0.5">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden z-[200]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-accent/20">
              <div>
                <p className="font-black text-foreground text-sm tracking-tight">Notificações</p>
                {unread > 0 && (
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">{unread} não lidas</p>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-border custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-12 text-center opacity-40">
                  <CheckCheck className="h-10 w-10 text-primary mx-auto mb-3" />
                  <p className="text-xs font-black uppercase tracking-widest">Tudo em dia!</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = NOTIF_ICONS[n.type] ?? Bell
                  const color = NOTIF_COLORS[n.type] ?? 'text-muted-foreground bg-accent'
                  const isUrgent = n.priority === 'URGENTE'
                  return (
                    <button
                      key={n.id}
                      onClick={() => { markAsRead(n.id); setOpen(false); if (n.href) router.push(n.href) }}
                      className={`w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-accent transition-colors ${isUrgent ? 'bg-rose-500/5' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-[11px] font-black truncate uppercase tracking-widest ${isUrgent ? 'text-rose-500' : 'text-foreground'}`}>{n.title}</p>
                          <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter shrink-0">{timeAgo(n.time)}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-medium mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {allNotifications.length > 0 && (
              <div className="flex items-center justify-between gap-3 border-t border-gray-50 px-5 py-3">
                <Link href="/responsavel/messages" onClick={() => setOpen(false)} className="text-xs font-black text-sky-600 hover:text-sky-700">
                  Ver todos os comunicados →
                </Link>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    Marcar lidas
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function GuardianLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [moreOpen, setMoreOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const firstName = session?.user?.name?.split(' ')[0] ?? 'Responsável'

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20 md:pb-0">
      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 md:px-8 max-w-2xl mx-auto w-full">
          {/* Brand */}
          <Link href="/responsavel" className="flex items-center gap-2.5">
            <Image src="/icon.svg" alt="Mundo Magico" width={36} height={36} className="rounded-xl shadow-sm" />
            <div className="hidden sm:block">
              <p className="text-sm font-black text-foreground leading-none">Mundo Mágico</p>
              <p className="text-[10px] text-muted-foreground font-medium">Olá, {firstName}</p>
            </div>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
            <Link
              href="/responsavel/profile"
              className="ml-1 h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm hover:bg-primary/20 transition-colors"
              aria-label="Perfil"
            >
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? 'R'}
            </Link>
          </div>
        </div>

        {/* Horizontal nav for desktop */}
        <nav className="hidden md:flex items-center gap-1 px-8 pb-3 max-w-2xl mx-auto w-full overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/responsavel' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all ml-auto whitespace-nowrap"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
        </nav>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto p-4 md:p-6 max-w-2xl mx-auto w-full">
        {children}
      </main>

      {/* ── Bottom Navigation (mobile) ───────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden h-16 items-center justify-around bg-card/90 backdrop-blur-md border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        {bottomNav.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/responsavel' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wide ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}

        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
        >
          <div className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-5 w-5" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">Mais</span>
        </button>
      </nav>

      {/* ── "Mais" drawer (mobile) ───────────────────────────────────────── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 bg-gray-900/50 z-40 md:hidden"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 p-6 pb-10 md:hidden border-t border-border"
            >
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Menu completo</p>
              <div className="grid grid-cols-4 gap-3">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || (item.href !== '/responsavel' && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95 ${
                        isActive ? 'bg-primary/10' : 'bg-accent/40'
                      }`}
                    >
                      <div className={`${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`text-[10px] font-black text-center leading-tight ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 bg-destructive/10 text-destructive rounded-2xl font-black text-sm active:scale-95 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <OfflineIndicator />
    </div>
  )
}
