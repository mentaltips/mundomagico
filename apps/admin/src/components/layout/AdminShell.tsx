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
  AlertCircle, Megaphone, BarChart2, CheckCheck, Sparkles, Heart
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
  { icon: <Megaphone size={20} />,      label: 'Comunicados',       href: '/admin/announcements',        group: 'operacional' },
  { icon: <ClipboardCheck size={20} />, label: 'Diário de Rotina',  href: '/admin/daily-routine',        group: 'operacional' },
  { icon: <HeartPulse size={20} />,     label: 'Saúde',             href: '/admin/health',               group: 'operacional' },
  { icon: <CreditCard size={20} />,     label: 'Financeiro',        href: '/admin/finance',              group: 'operacional' },
  { icon: <Calendar size={20} />,       label: 'Calendário',        href: '/admin/calendar',             group: 'operacional' },
  { icon: <Settings size={20} />,       label: 'Configurações',     href: '/admin/settings',             group: 'operacional' },
]

const NOTIF_ICONS: Record<string, any> = {
  announcement: Megaphone,
  alert: AlertCircle,
  report: BarChart2,
  payment: CreditCard,
}

const NOTIF_COLORS: Record<string, string> = {
  announcement: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400',
  alert: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400',
  report: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400',
  payment: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',
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
      <div className="h-20 flex items-center px-6 mb-4">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
            <Heart size={22} className="fill-current" />
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
        </Link>
        {isOpen && (
          <button onClick={() => setIsOpen(false)} className="ml-auto lg:hidden p-2 text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 px-3 space-y-8 overflow-y-auto custom-scrollbar pb-10">
        <div>
          {(!collapsed || isOpen) && (
            <p className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-4">Principal</p>
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
            <p className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-4">Gestão</p>
          )}
          <nav className="space-y-1">
            {menuItems.filter((i) => i.group === 'operacional').map((item) => {
              const active = pathname === item.href
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

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 84 : 280 }}
        className="hidden lg:flex flex-col h-screen sticky top-0 bg-card border-r border-border transition-all duration-300 z-50 overflow-visible shadow-sm"
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-24 h-6 w-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-primary shadow-sm z-50 transition-all hover:scale-110"
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
      <div className={`bg-accent/40 border border-border/50 rounded-2xl p-2.5 shadow-sm ${collapsed ? 'items-center justify-center' : ''} flex gap-3`}>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black shrink-0 text-xs">
          {initials}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-foreground truncate">{user?.name ?? 'Admin'}</p>
              <p className="text-[10px] font-bold text-muted-foreground truncate">{user?.email ?? ''}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-2 text-muted-foreground hover:text-rose-500 transition-colors"
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
      className={`flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all group relative ${
        active
          ? 'bg-primary/10 text-primary shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
    >
      <div className={`${active ? 'text-primary' : 'text-muted-foreground/60 group-hover:text-primary'} transition-colors shrink-0`}>
        {item.icon}
      </div>
      {!collapsed && <span className="text-sm truncate font-black tracking-tight">{item.label}</span>}
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
        />
      )}
    </Link>
  )
}

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden h-20 items-center justify-around bg-card/90 backdrop-blur-md border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-4">
      {bottomNavItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname.startsWith(item.href) && item.href !== '#menu'
        if (item.href === '#menu') {
          return (
            <button
              key="menu"
              onClick={() => setIsOpen(true)}
              className="flex flex-col items-center justify-center gap-1 w-14"
            >
              <div className="p-2 rounded-xl text-muted-foreground">
                <Icon size={22} />
              </div>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</span>
            </button>
          )
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 w-14"
          >
            <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
              <Icon size={22} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

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
        className="relative p-2.5 text-muted-foreground hover:text-primary transition-colors rounded-xl hover:bg-accent"
        aria-label="Notificações"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-2 right-2 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-card leading-none">
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
            className="absolute right-0 top-full mt-2 w-80 bg-card rounded-[2rem] shadow-2xl border border-border overflow-hidden z-[200]"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-accent/20">
              <div>
                <p className="font-black text-foreground text-sm tracking-tight">Notificações</p>
                {unread > 0 && (
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">{unread} não lidas</p>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto divide-y divide-border custom-scrollbar">
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
                      onClick={() => { setOpen(false); if (n.href) router.push(n.href) }}
                      className={`w-full flex items-start gap-4 px-6 py-5 text-left hover:bg-accent transition-colors ${isUrgent ? 'bg-rose-500/5' : ''}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-[11px] font-black truncate uppercase tracking-widest ${isUrgent ? 'text-rose-500' : 'text-foreground'}`}>
                            {n.title}
                          </p>
                          <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter shrink-0">
                            {timeAgo(n.time)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium mt-1 line-clamp-2 leading-relaxed">
                          {n.body}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t border-border px-6 py-4 bg-accent/20">
                <Link
                  href="/admin/announcements"
                  onClick={() => setOpen(false)}
                  className="text-[10px] font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest flex items-center gap-2"
                >
                  Ver todos os comunicados <ChevronRight size={12} />
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function AdminHeader() {
  const { setIsOpen } = useContext(SidebarContext)

  return (
    <header className="h-20 bg-card/80 backdrop-blur-xl border-b border-border px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden p-2 text-muted-foreground hover:text-primary transition-colors bg-accent rounded-xl"
        >
          <Menu size={24} />
        </button>

        <div className="relative max-w-sm w-full hidden md:block group">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={18} />
          <input
            type="text"
            placeholder="Buscar crianças, turmas, faturas..."
            className="w-full pl-11 pr-4 py-3 bg-accent/40 border border-border/50 rounded-2xl focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-xs font-bold transition-all placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3">
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all border border-primary/10">
          <Sparkles size={14} className="fill-primary" />
          Pro
        </div>

        <div className="hidden sm:block h-8 w-px bg-border mx-1" />

        <NotificationDropdown />
        <ThemeToggle />

        <Link
          href="/admin/settings"
          className="p-2.5 text-muted-foreground hover:text-primary transition-colors rounded-xl hover:bg-accent"
          title="Configurações"
        >
          <Settings size={20} />
        </Link>
      </div>
    </header>
  )
}
