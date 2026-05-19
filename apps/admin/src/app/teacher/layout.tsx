'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, UserCheck, Settings, LogOut, Sun, Moon } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { OfflineIndicator } from '@/components/OfflineIndicator'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { label: 'Início', href: '/professor', icon: LayoutDashboard },
    { label: 'Diários', href: '/professor/daily-reports', icon: ClipboardList },
    { label: 'Chamada', href: '/professor/attendance', icon: UserCheck },
    { label: 'Perfil', href: '/professor/profile', icon: Settings },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20 md:pb-0">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur-md border-border px-4 shadow-sm md:px-8">
        <div className="flex items-center gap-2 font-black text-primary">
          <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">MM</div>
          <span className="hidden sm:inline">Mundo Mágico</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 text-sm font-black text-muted-foreground hover:text-destructive active:scale-95 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Sair</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-8">
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t bg-card/90 backdrop-blur-md border-border md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full active:scale-95 transition-all ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <OfflineIndicator />

      {/* Sidebar for Desktop (optional, but keep it simple for now) */}
    </div>
  )
}
