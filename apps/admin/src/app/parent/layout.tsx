'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { signOut, useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, History, MessageSquare, User, LogOut, DollarSign,
  Calendar, Camera, FileText, Bell, X, AlertCircle,
  Megaphone, BarChart2, CreditCard, CheckCheck, ChevronRight, Sun, Moon
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
  announcement: 'text-sky-600 bg-sky-50',
  alert:        'text-rose-600 bg-rose-50',
  report:       'text-violet-600 bg-violet-50',
  payment:      'text-amber-600 bg-amber-50',
}

const navItems = [
  { label: 'Início',      href: '/parent',           icon: Home },
  { label: 'Histórico',   href: '/parent/history',   icon: History },
  { label: 'Recados',     href: '/parent/messages',  icon: MessageSquare },
  { label: 'Agenda',      href: '/parent/calendar',  icon: Calendar },
  { label: 'Fotos',       href: '/parent/photos',    icon: Camera },
  { label: 'Docs',        href: '/parent/documents', icon: FileText },
  { label: 'Pagamentos',  href: '/parent/payments',  icon: DollarSign },
  { label: 'Perfil',      href: '/parent/profile',   icon: User },
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
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const { data, refetch } = useQuery({
    queryKey: ['guardian-notifications'],
    queryFn: () => fetch('/api/notifications').then((r) => r.json()),
    refetchInterval: 60_000,
  })

  const notifications: any[] = data?.notifications ?? []
  const unread: number = data?.unreadCount ?? 0

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
        className="relative p-2 text-gray-500 hover:text-sky-600 transition-colors rounded-xl hover:bg-sky-50"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white leading-none px-0.5">
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
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[200]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="font-black text-foreground text-sm">Notificações</p>
                {unread > 0 && (
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">{unread} não lidas</p>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCheck className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 font-medium">Tudo em dia!</p>
                  <p className="text-xs text-gray-300 mt-0.5">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = NOTIF_ICONS[n.type] ?? Bell
                  const color = NOTIF_COLORS[n.type] ?? 'text-gray-500 bg-gray-50'
                  const isUrgent = n.priority === 'URGENTE'
                  return (
                    <button
                      key={n.id}
                      onClick={() => { setOpen(false); if (n.href) router.push(n.href) }}
                      className={`w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors ${isUrgent ? 'bg-rose-50/40' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-black truncate ${isUrgent ? 'text-rose-700' : 'text-gray-900'}`}>{n.title}</p>
                          <span className="text-[10px] text-gray-300 font-medium shrink-0">{timeAgo(n.time)}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t border-gray-50 px-5 py-3">
                <Link href="/parent/messages" onClick={() => setOpen(false)} className="text-xs font-black text-sky-600 hover:text-sky-700">
                  Ver todos os comunicados →
                </Link>
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

  const firstName = session?.user?.name?.split(' ')[0] ?? 'Responsável'

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20 md:pb-0">
      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 md:px-8 max-w-2xl mx-auto w-full">
          {/* Brand */}
          <Link href="/parent" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-sm">
              MM
            </div>
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
              href="/parent/profile"
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
            const isActive = pathname === item.href || (item.href !== '/parent' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                  isActive ? 'bg-sky-100 text-sky-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            )
          })}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all ml-auto whitespace-nowrap"
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
          const isActive = pathname === item.href || (item.href !== '/parent' && pathname.startsWith(item.href))
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

        {/* "Mais" button */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
        >
          <div className="p-1.5 rounded-xl text-gray-400">
            <ChevronRight className="h-5 w-5" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-wide text-gray-400">Mais</span>
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
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 pb-10 md:hidden"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Menu completo</p>
              <div className="grid grid-cols-4 gap-3">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || (item.href !== '/parent' && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95"
                      style={{ background: isActive ? '#e0f2fe' : '#f8fafc' }}
                    >
                      <div className={`${isActive ? 'text-sky-600' : 'text-gray-500'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`text-[10px] font-black text-center leading-tight ${isActive ? 'text-sky-700' : 'text-gray-600'}`}>
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
