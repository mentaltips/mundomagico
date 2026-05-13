'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, AlertCircle, CheckCircle2, Info, TrendingUp, TrendingDown } from 'lucide-react'
import { ReactNode, useEffect } from 'react'

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  trend?: string
  trendUp?: boolean
  color?: string  // tailwind text+bg class e.g. "text-primary bg-lime-50"
  href?: string
}
export function StatCard({ label, value, icon, trend, trendUp, color = 'text-primary bg-primary/10' }: StatCardProps) {
  return (
    <div className="card-hover p-5 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-black ${trendUp !== false ? 'text-emerald-500' : 'text-destructive'}`}>
            {trendUp !== false ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-foreground tracking-tight">{value}</p>
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{label}</p>
    </div>
  )
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
    <div className="page-header">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
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
    <div className="card flex flex-col items-center justify-center py-16 px-8 text-center border-dashed">
      {icon && (
        <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-muted-foreground mb-4">
          {icon}
        </div>
      )}
      <p className="text-base font-black text-foreground mb-1">{title}</p>
      {description && <p className="text-sm text-muted-foreground font-medium max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

// ── Loading State ─────────────────────────────────────────────────────────────
export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="text-primary animate-spin" size={32} />
      <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">{label}</p>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-accent rounded-xl ${className}`} />
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card p-5 space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === 0 ? 'w-3/4' : i === lines - 1 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'lime' | 'purple' | 'sky'
const BADGE_STYLES: Record<BadgeVariant, string> = {
  green:  'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber:  'bg-amber-50  text-amber-700  border-amber-100',
  red:    'bg-rose-50   text-rose-700   border-rose-100',
  blue:   'bg-blue-50   text-blue-700   border-blue-100',
  gray:   'bg-gray-100  text-gray-600   border-gray-200',
  lime:   'bg-lime-50   text-lime-700   border-lime-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-100',
  sky:    'bg-sky-50    text-sky-700    border-sky-100',
}
interface BadgeProps {
  label: string
  variant?: BadgeVariant
  dot?: boolean
}
export function Badge({ label, variant = 'gray', dot = false }: BadgeProps) {
  return (
    <span className={`badge ${BADGE_STYLES[variant]}`}>
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
  size?: 'sm' | 'md' | 'lg'
}
const MODAL_SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="modal-backdrop"
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`modal-content w-full ${MODAL_SIZES[size]} relative z-10`}
          >
            {/* Handle bar on mobile */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-4 sm:hidden" />
            {/* Header */}
            <div className="modal-header">
              <div>
                <h2 className="text-lg font-black text-foreground">{title}</h2>
                {subtitle && <p className="text-xs text-muted-foreground font-medium mt-0.5">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="btn-ghost p-2 rounded-xl ml-4">
                <X size={18} />
              </button>
            </div>
            {/* Body */}
            <div className="modal-body">{children}</div>
            {/* Footer */}
            {footer && <div className="modal-footer">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ── Alert Banner ──────────────────────────────────────────────────────────────
type AlertVariant = 'info' | 'success' | 'warning' | 'error'
const ALERT_STYLES: Record<AlertVariant, { wrapper: string; icon: ReactNode }> = {
  info:    { wrapper: 'bg-blue-50 border-blue-100 text-blue-800',    icon: <Info size={16} className="text-blue-500 shrink-0" /> },
  success: { wrapper: 'bg-emerald-50 border-emerald-100 text-emerald-800', icon: <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> },
  warning: { wrapper: 'bg-amber-50 border-amber-100 text-amber-800', icon: <AlertCircle size={16} className="text-amber-500 shrink-0" /> },
  error:   { wrapper: 'bg-rose-50 border-rose-100 text-rose-800',    icon: <AlertCircle size={16} className="text-rose-500 shrink-0" /> },
}
export function Alert({ variant = 'info', children }: { variant?: AlertVariant; children: ReactNode }) {
  const s = ALERT_STYLES[variant]
  return (
    <div className={`flex items-start gap-3 border rounded-xl p-4 text-sm font-medium ${s.wrapper}`}>
      {s.icon}
      <div>{children}</div>
    </div>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{children}</p>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-gray-100" />
  return (
    <div className="flex items-center gap-3">
      <hr className="flex-1 border-gray-100" />
      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{label}</span>
      <hr className="flex-1 border-gray-100" />
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
interface AvatarProps { name: string; photoUrl?: string | null; size?: 'sm' | 'md' | 'lg'; color?: string }
const AVATAR_SIZES = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
export function Avatar({ name, photoUrl, size = 'md', color = 'bg-lime-100 text-lime-700' }: AvatarProps) {
  const cls = `${AVATAR_SIZES[size]} rounded-xl overflow-hidden flex items-center justify-center font-black shrink-0 ${color}`
  if (photoUrl) {
    return <div className={cls}><img src={photoUrl} alt={name} className="w-full h-full object-cover" /></div>
  }
  return <div className={cls}>{name.charAt(0).toUpperCase()}</div>
}
