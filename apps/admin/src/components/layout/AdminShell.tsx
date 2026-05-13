'use client'

import { useState, createContext, useContext, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signOut, useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, Users, MessageSquare, ClipboardCheck,
  CreditCard, Settings, LogOut, Menu, X, Bell,
  Search, ChevronLeft, ChevronRight, GraduationCap,
  HeartPulse, Calendar, FileText, ShieldAlert,
  SearchIcon, Command, Camera, ClipboardList, Package, ShieldCheck,
  AlertCircle, Megaphone, BarChart2, CheckCheck,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { OfflineIndicator } from '@/components/OfflineIndicator'

const menuItems = [
  { icon: <LayoutDashboard size={20} />, label: 'Dashboard',        href: '/admin/dashboard',            group: 'principal' },
  { icon: <GraduationCap size={20} />,  label: 'Crianças',          href: '/admin/children',             group: 'principal' },
  { icon: <Users size={20} />,          label: 'Responsáveis',      href: '/admin/guardians',            group: 'principal' },
  { icon: <Users size={20} />,          label: 'Turmas',            href: '/admin/groups',               group: 'principal' },
  { icon: <MessageSquare size={20} />,  label: 'Comunicados',       href: '/admin/announcements',        group: 'operacional' },
  { icon: <ClipboardCheck size={20} />, label: 'Diário de Rotina',  href: '/admin/daily-routine',        group: 'operacional' },
  { icon: <HeartPulse size={20} />,     label: 'Saúde',             href: '/admin/health',               group: 'operacional' },
  { icon: <Package size={20} />,        label: 'Itens',             href: '/admin/child-items',          group: 'operacional' },
  { icon: <Camera size={20} />,         label: 'Fotos',             href: '/admin/photos',               group: 'operacional' },
  { icon: <ClipboardList size={20} />,  label: 'Desenvolvimento',   href: '/admin/development-reports',  group: 'operacional' },
  { icon: <CreditCard size={20} />,     label: 'Financeiro',        href: '/admin/finance',              group: 'operacional' },
  { icon: <Calendar size={20} />,       label: 'Calendário',        href: '/admin/calendar',             group: 'operacional' },
  { icon: <FileText size={20} />,       label: 'Relatórios',        href: '/admin/reports',              group: 'operacional' },
  { icon: <Settings size={20} />,       label: 'Configurações',     href: '/admin/settings',             group: 'operacional' },
]

const NOTIF_ICONS: Record<string, any> = {
  announcement: Megaphone,
  alert: AlertCircle,
  report: BarChart2,
  payment: CreditCard,
}

const NOTIF_COLORS: Record<string, string> = {
  announcement: 'text-sky-600 bg-sky-50',
  alert: 'text-rose-600 bg-rose-50',
  report: 'text-violet-600 bg-violet-50',
  payment: 'text-amber-600 bg-amber-50',
}

// Context for mobile menu
const SidebarContext = createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({ isOpen: false, setIsOpen: () => {} })

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { isOpen, setIsOpen } = useContext(SidebarContext)
  const pathname = usePathname()

  const SidebarContent = () => (
    <>
      {/* Brand Area */}
      <div className="h-20 flex items-center px-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-lime-100 shrink-0">
            <Command size={22} />
          </div>
          {(!collapsed || isOpen) && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-black text-foreground tracking-tight"
            >
              Mundo<span className="text-primary">Mágico</span>
            </motion.span>
          )}
        </div>
        {isOpen && (
          <button onClick={() => setIsOpen(false)} className="ml-auto lg:hidden p-2 text-gray-400">
            <X size={24} />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar pb-10">
        <div>
          {(!collapsed || isOpen) && (
            <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Principal</p>
          )}
          <nav className="space-y-1">
            {menuItems.filter((i) => i.group === 'principal').map((item) => {
              const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
              return (
                <SidebarItem key={item.href} item={item} active={active} collapsed={collapsed && !isOpen} />
              )
            })}
          </nav>
        </div>

        <div>
          {(!collapsed || isOpen) && (
            <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Operacional</p>
          )}
          <nav className="space-y-1">
            {menuItems.filter((i) => i.group === 'operacional').map((item) => {
              const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <SidebarItem key={item.href} item={item} active={active} collapsed={collapsed && !isOpen} />
              )
            })}
          </nav>
        </div>
      </div>

      {/* User Profile Area */}
      <UserProfileArea collapsed={collapsed && !isOpen} />
    </>
  )

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-[70] lg:hidden flex flex-col"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        className="hidden lg:flex flex-col h-screen sticky top-0 bg-card border-r border-border transition-all duration-300 z-50 overflow-visible"
      >
        <SidebarContent />
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-24 h-6 w-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-primary shadow-sm z-50 transition-all"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </motion.aside>
      <OfflineIndicator />
    </>
  )
}

function UserProfileArea({ collapsed }: { collapsed: boolean }) {
  const { data: session } = useSession()
  const user = session?.user
  const initials = user?.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? 'AD'

  return (
    <div className="p-4 mt-auto">
      <div className={`bg-accent/50 border border-border rounded-2xl p-3 shadow-sm ${collapsed ? 'items-center' : ''} flex gap-3`}>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black shrink-0 text-sm">
          {initials}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-foreground truncate">{user?.name ?? 'Admin'}</p>
              <p className="text-[10px] font-bold text-muted-foreground truncate">{user?.email ?? ''}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: 'http://localhost:3000' })}
              className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function SidebarItem({ item, active, collapsed }: any) {
  const { setIsOpen } = useContext(SidebarContext)

  return (
    <Link
      href={item.href}
      onClick={() => setIsOpen(false)}
      className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all group relative ${
        active
          ? 'bg-primary/10 text-primary shadow-sm border border-primary/5'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
    >
      <div className={`${active ? 'text-primary' : 'text-gray-400 group-hover:text-primary'} transition-colors shrink-0`}>
        {item.icon}
      </div>
      {!collapsed && <span className="text-sm truncate">{item.label}</span>}
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
        />
      )}
    </Link>
  )
}

// Bottom nav items para mobile (5 principais)
const bottomNavItems = [
  { icon: LayoutDashboard, label: 'Início',   href: '/admin/dashboard' },
  { icon: GraduationCap,   label: 'Crianças', href: '/admin/children' },
  { icon: ClipboardCheck,  label: 'Rotina',   href: '/admin/daily-routine' },
  { icon: MessageSquare,   label: 'Avisos',   href: '/admin/announcements' },
  { icon: Menu,            label: 'Mais',     href: '#menu' },
]

export function AdminBottomNav() {
  const pathname = usePathname()
  const { setIsOpen } = useContext(SidebarContext)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden h-16 items-center justify-around bg-card/90 backdrop-blur-md border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
      {bottomNavItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname.startsWith(item.href) && item.href !== '#menu'
        if (item.href === '#menu') {
          return (
            <button
              key="menu"
              onClick={() => setIsOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 w-12"
            >
              <div className="p-1.5 rounded-xl text-gray-400">
                <Icon size={20} />
              </div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wide">{item.label}</span>
            </button>
          )
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-0.5 w-12"
          >
            <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-lime-100 text-primary' : 'text-gray-400'}`}>
              <Icon size={20} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-wide ${isActive ? 'text-primary' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

// ── Notification Dropdown ─────────────────────────────────────────────────────
function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const { data, refetch } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => fetch('/api/notifications').then((r) => r.json()),
    refetchInterval: 30_000,
  })

  const notifications: any[] = data?.notifications ?? []
  const unread: number = data?.unreadCount ?? 0

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function timeAgo(date: string | Date) {
    const diff = Date.now() - new Date(date).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return 'agora'
    if (min < 60) return `${min}min`
    const h = Math.floor(min / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}d`
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) refetch() }}
        className="relative p-2 text-gray-400 hover:text-primary transition-colors rounded-xl hover:bg-gray-50"
        aria-label="Notificações"
      >
        <Bell size={20} />
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
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div>
                <p className="font-black text-gray-900 text-sm">Notificações</p>
                {unread > 0 && (
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">{unread} não lidas</p>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCheck className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 font-medium">Tudo em dia!</p>
                  <p className="text-xs text-gray-300 mt-0.5">Nenhuma notificação no momento</p>
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
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-black truncate ${isUrgent ? 'text-rose-700' : 'text-gray-900'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-gray-300 font-medium shrink-0">
                            {timeAgo(n.time)}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5 line-clamp-2 leading-relaxed">
                          {n.body}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-gray-50 px-5 py-3">
                <Link
                  href="/admin/announcements"
                  onClick={() => setOpen(false)}
                  className="text-xs font-black text-primary hover:text-lime-700 transition-colors"
                >
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

// ── Admin Header ──────────────────────────────────────────────────────────────
export function AdminHeader() {
  const { setIsOpen } = useContext(SidebarContext)

  return (
    <header className="h-20 bg-card/80 backdrop-blur-md border-b border-border px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden p-2 text-muted-foreground hover:text-primary transition-colors bg-accent rounded-xl"
        >
          <Menu size={24} />
        </button>

        <div className="relative max-w-sm w-full hidden md:block">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Buscar crianças, turmas, comunicados…"
            className="w-full pl-10 pr-4 py-2.5 bg-accent/50 border border-border rounded-xl focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-xs font-bold transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-accent text-muted-foreground rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-accent/80 transition-all">
          <ShieldAlert size={14} />
          Feedback
        </button>

        <div className="hidden sm:block h-8 w-px bg-border" />

        {/* Notification bell with dropdown */}
        <NotificationDropdown />

        <ThemeToggle />

        <Link
          href="/admin/settings"
          className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-xl hover:bg-accent"
          title="Configurações"
        >
          <Settings size={20} />
        </Link>
      </div>
    </header>
  )
}
