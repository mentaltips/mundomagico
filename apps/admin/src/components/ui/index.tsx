'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, AlertCircle, CheckCircle2, Info, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'
import { ReactNode, useEffect } from 'react'
import Link from 'next/link'

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  trend?: string
  trendUp?: boolean
  color?: string  // tailwind text+bg class e.g. "text-primary bg-primary/10"
  href?: string
}
export function StatCard({ label, value, icon, trend, trendUp, color = 'text-primary bg-primary/10', href }: StatCardProps) {
  const content = (
    <div className="card-hover p-5 group flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color} group-hover:scale-110 transition-transform shadow-sm`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-black ${trendUp !== false ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trendUp !== false ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-foreground tracking-tight">{value}</p>
      <div className="flex items-center justify-between mt-1">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        {href && <ChevronRight size={12} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>
  }

  return content
}

// ── Page Header ───────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  actions?: ReactNode
}
export function PageHeader({ title, subtitle, icon, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-primary/5">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground font-bold mt-1 opacity-80">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card-hover flex flex-col items-center justify-center py-16 px-8 text-center border-dashed bg-accent/10">
      {icon && (
        <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-muted-foreground/40 mb-4 border border-border">
          {icon}
        </div>
      )}
      <p className="text-base font-black text-foreground mb-1">{title}</p>
      {description && <p className="text-sm text-muted-foreground font-bold max-w-xs leading-relaxed opacity-70">{description}</p>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  )
}

// ── Loading State ─────────────────────────────────────────────────────────────
export function LoadingState({ label = 'Carregando...', size = 'md' }: { label?: string; size?: 'sm' | 'md' | 'lg' }) {
  const iconSize = size === 'sm' ? 20 : size === 'lg' ? 48 : 32
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="text-primary animate-spin" size={iconSize} />
      {label && <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">{label}</p>}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-accent/60 rounded-xl ${className}`} />
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === 0 ? 'w-full' : i === lines - 1 ? 'w-2/3' : 'w-5/6'}`} />
      ))}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'lime' | 'purple' | 'sky' | 'primary'
const BADGE_STYLES: Record<BadgeVariant, string> = {
  green:   'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  amber:   'bg-amber-500/10  text-amber-500  border-amber-500/20',
  red:     'bg-rose-500/10   text-rose-500   border-rose-500/20',
  blue:    'bg-blue-500/10   text-blue-500   border-blue-500/20',
  gray:    'bg-muted         text-muted-foreground border-border',
  lime:    'bg-lime-500/10   text-lime-500   border-lime-500/20',
  purple:  'bg-violet-500/10 text-violet-500 border-violet-500/20',
  sky:     'bg-sky-500/10    text-sky-500    border-sky-500/20',
  primary: 'bg-primary/10    text-primary    border-primary/20',
}
interface BadgeProps {
  label: string
  variant?: BadgeVariant
  dot?: boolean
  size?: 'sm' | 'md'
}
export function Badge({ label, variant = 'gray', dot = false, size = 'md' }: BadgeProps) {
  return (
    <span className={`badge ${BADGE_STYLES[variant]} ${size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-[10px]'}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {label}
    </span>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}
const MODAL_SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) {
      document.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = 'auto'
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="modal-backdrop bg-background/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className={`modal-content w-full ${MODAL_SIZES[size]} relative z-10 flex flex-col bg-card overflow-hidden shadow-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-border/50`}
          >
            {/* Handle bar on mobile */}
            <div className="w-12 h-1.5 bg-accent rounded-full mx-auto mt-4 sm:hidden shrink-0" />
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-border/50 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black text-foreground tracking-tight">{title}</h2>
                {subtitle && <p className="text-xs text-muted-foreground font-bold mt-1 opacity-70 tracking-wide">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="p-2.5 bg-accent hover:bg-accent/80 text-muted-foreground hover:text-foreground rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="px-8 py-8 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              {children}
            </div>

            {/* Footer */}
            {footer && <div className="px-8 py-6 border-t border-border/50 bg-accent/10 flex items-center justify-end gap-3 shrink-0">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ── Alert Banner ──────────────────────────────────────────────────────────────
type AlertVariant = 'info' | 'success' | 'warning' | 'error'
const ALERT_STYLES: Record<AlertVariant, { wrapper: string; icon: ReactNode }> = {
  info:    { wrapper: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400',    icon: <Info size={18} className="text-blue-500 shrink-0" /> },
  success: { wrapper: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400', icon: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> },
  warning: { wrapper: 'bg-amber-500/10 border-amber-100/20 text-amber-700 dark:text-amber-400', icon: <AlertCircle size={18} className="text-amber-500 shrink-0" /> },
  error:   { wrapper: 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400',    icon: <AlertCircle size={18} className="text-rose-500 shrink-0" /> },
}
export function Alert({ variant = 'info', children }: { variant?: AlertVariant; children: ReactNode }) {
  const s = ALERT_STYLES[variant]
  return (
    <div className={`flex items-start gap-3 border rounded-2xl p-5 text-sm font-bold ${s.wrapper}`}>
      {s.icon}
      <div className="leading-relaxed">{children}</div>
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
interface AvatarProps { name?: string; photoUrl?: string | null; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; color?: string }
const AVATAR_SIZES = { 
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-9 h-9 text-xs', 
  md: 'w-12 h-12 text-sm', 
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl'
}
export function Avatar({ name = '?', photoUrl, size = 'md', color = 'bg-primary/10 text-primary' }: AvatarProps) {
  const cls = `${AVATAR_SIZES[size]} rounded-2xl overflow-hidden flex items-center justify-center font-black shrink-0 ${color} border border-border/50 shadow-sm`
  if (photoUrl) {
    return <div className={cls}><img src={photoUrl} alt={name} className="w-full h-full object-cover" /></div>
  }
  return <div className={cls}>{name.charAt(0).toUpperCase()}</div>
}
