'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { User, Mail, LogOut, ChevronRight, Shield, Bell, HelpCircle, DollarSign, Settings, Loader2 } from 'lucide-react'
import { SectionLabel, Modal } from '@/components/ui/index'
import toast from 'react-hot-toast'

export default function GuardianProfilePage() {
  const { data: session } = useSession()
  const user = session?.user

  const menuItems = [
    { icon: DollarSign, label: 'Financeiro',     desc: 'Faturas, boletos e pagamentos',  href: '/responsavel/payments' },
    { icon: Bell,       label: 'Comunicados',     desc: 'Mensagens da escola',            href: '/responsavel/messages' },
    { icon: Shield,     label: 'Privacidade',    desc: 'Dados e segurança',              href: '/responsavel/documents' },
    { icon: HelpCircle, label: 'Ajuda e Suporte', desc: 'Entre em contato com a escola', href: 'mailto:contato@mundomagico.com' },
  ]

  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) {
      return toast.error('As senhas não coincidem')
    }
    if (passwords.new.length < 6) {
      return toast.error('A nova senha deve ter pelo menos 6 caracteres')
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar senha')

      toast.success('Senha alterada com sucesso!')
      setIsChangingPassword(false)
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

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
          
          {/* Opção de Trocar Senha */}
          <button
            onClick={() => setIsChangingPassword(true)}
            className="w-full flex items-center gap-4 px-5 py-4 active:bg-gray-50 transition-colors text-left"
          >
            <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
              <Settings className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Alterar Senha</p>
              <p className="text-xs text-gray-400 mt-0.5">Mudar sua senha de acesso</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
          </button>
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

      {/* Modal de Alterar Senha */}
      <Modal
        open={isChangingPassword}
        onClose={() => setIsChangingPassword(false)}
        title="Alterar Senha"
        subtitle="Escolha uma senha segura para seu acesso"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Senha Atual</label>
            <input
              type="password"
              required
              className="input-field"
              placeholder="Digite a senha de 6 dígitos"
              value={passwords.current}
              onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nova Senha</label>
            <input
              type="password"
              required
              className="input-field"
              placeholder="Mínimo 6 caracteres"
              value={passwords.new}
              onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirmar Nova Senha</label>
            <input
              type="password"
              required
              className="input-field"
              placeholder="Repita a nova senha"
              value={passwords.confirm}
              onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsChangingPassword(false)}
              className="btn-ghost flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Salvar Senha'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
