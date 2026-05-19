'use client'

import { useSession, signOut } from 'next-auth/react'
import { Mail, LogOut, ChevronRight, Bell, Shield, HelpCircle, BookOpen } from 'lucide-react'

export default function TeacherProfilePage() {
  const { data: session } = useSession()
  const user = session?.user

  const roleLabel: Record<string, string> = {
    PROFESSOR: 'Professor(a)',
    CUIDADOR: 'Cuidador(a)',
    ADMIN: 'Administrador',
    DIRETOR: 'Diretor(a)',
  }

  const menuItems = [
    { icon: BookOpen, label: 'Minhas turmas',   desc: 'Ver turmas atribuídas',          href: '/professor/classes' },
    { icon: Bell,     label: 'Notificações',     desc: 'Comunicados da escola',          href: '/admin/announcements' },
    { icon: Shield,   label: 'Privacidade',      desc: 'Dados e segurança da conta',     href: '/admin/settings' },
    { icon: HelpCircle, label: 'Ajuda e Suporte', desc: 'Entre em contato com a escola', href: 'mailto:contato@mundomagico.com' },
  ]

  return (
    <div className="max-w-lg mx-auto pb-28 space-y-6">
      {/* Avatar + nome */}
      <div className="bg-white rounded-3xl border border-violet-100 p-6 flex items-center gap-4 shadow-sm">
        <div className="h-16 w-16 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 font-black text-2xl shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() ?? 'P'}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{user?.name ?? 'Professor(a)'}</h2>
          <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5">
            <Mail className="h-3 w-3" />
            {user?.email ?? '—'}
          </p>
          <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-600 px-2.5 py-1 rounded-full">
            {roleLabel[user?.role ?? ''] ?? 'Equipe'}
          </span>
        </div>
      </div>

      {/* Menu de opções */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {menuItems.map((item, i) => {
          const Icon = item.icon
          return (
            <a
              key={i}
              href={item.href}
              className={`flex items-center gap-4 px-5 py-4 active:bg-gray-50 transition-colors ${
                i < menuItems.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </a>
          )
        })}
      </div>

      {/* Sair */}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 rounded-2xl py-4 font-bold text-sm active:bg-red-100 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Sair da conta
      </button>

      <p className="text-center text-[10px] text-gray-300 font-medium">
        Mundo Mágico — Portal do Professor
      </p>
    </div>
  )
}
