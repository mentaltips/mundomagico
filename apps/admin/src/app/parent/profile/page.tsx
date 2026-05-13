'use client'

import { useSession, signOut } from 'next-auth/react'
import { User, Mail, LogOut, ChevronRight, Shield, Bell, HelpCircle, DollarSign, Settings } from 'lucide-react'
import { SectionLabel } from '@/components/ui/index'

export default function GuardianProfilePage() {
  const { data: session } = useSession()
  const user = session?.user

  const menuItems = [
    { icon: DollarSign, label: 'Financeiro',     desc: 'Faturas, boletos e pagamentos',  href: '/parent/payments' },
    { icon: Bell,       label: 'Comunicados',     desc: 'Mensagens da escola',            href: '/parent/messages' },
    { icon: Shield,     label: 'Privacidade',    desc: 'Dados e segurança',              href: '/parent/documents' },
    { icon: HelpCircle, label: 'Ajuda e Suporte', desc: 'Entre em contato com a escola', href: 'mailto:contato@mundomagico.com' },
  ]

  return (
    <div className="animate-in space-y-5 pb-28 max-w-lg mx-auto">
      {/* Avatar + nome */}
      <div className="card flex items-center gap-4 p-6 border-sky-100">
        <div className="h-16 w-16 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 font-black text-2xl shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() ?? 'R'}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-black text-gray-900">{user?.name ?? 'Responsável'}</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1">
            <Mail className="h-3 w-3" />
            {user?.email ?? '—'}
          </p>
          <span className="inline-block mt-2.5 badge badge-blue">
            Responsável
          </span>
        </div>
      </div>

      {/* Menu de opções */}
      <div className="space-y-3">
        <SectionLabel>Configurações</SectionLabel>
        <div className="card overflow-hidden">
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
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
              </a>
            )
          })}
        </div>
      </div>

      {/* Sair */}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl py-4 font-black text-sm hover:bg-rose-100 active:scale-[0.98] transition-all"
      >
        <LogOut className="h-4 w-4" />
        Sair da conta
      </button>

      <p className="text-center text-[10px] text-gray-300 font-medium mt-8">
        Mundo Mágico — Portal do Responsável v1.0
      </p>
    </div>
  )
}
