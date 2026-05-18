'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Copy,
  Edit,
  Key,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  Alert,
  Avatar,
  Badge,
  EmptyState,
  Modal,
  PageHeader,
  SkeletonCard,
  StatCard,
} from '@/components/ui'
import type { BadgeVariant } from '@/components/ui'

type User = {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  active: boolean
}

type Credentials = {
  name: string
  email: string
  password: string
}

type RoleFilter = 'ALL' | 'ADMIN' | 'DIRECTOR' | 'TEACHER' | 'CAREGIVER' | 'STAFF'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  DIRECTOR: 'Diretor(a)',
  TEACHER: 'Professor(a)',
  CAREGIVER: 'Cuidador(a)',
  STAFF: 'Equipe',
}

const ROLE_BADGES: Record<string, BadgeVariant> = {
  ADMIN: 'red',
  DIRECTOR: 'purple',
  TEACHER: 'blue',
  CAREGIVER: 'green',
  STAFF: 'gray',
}

const ROLE_OPTIONS = [
  { value: 'TEACHER', label: 'Professor(a)' },
  { value: 'CAREGIVER', label: 'Cuidador(a) / Monitora' },
  { value: 'STAFF', label: 'Equipe Geral' },
  { value: 'DIRECTOR', label: 'Diretor(a)' },
  { value: 'ADMIN', label: 'Administrador' },
]

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  role: 'TEACHER',
  active: true,
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState(emptyForm)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users?t=${Date.now()}`)
      if (res.ok) {
        setUsers(await res.json())
      } else {
        toast.error('Erro ao carregar equipe.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro de conexão ao carregar equipe.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        active: user.active,
      })
    } else {
      setEditingUser(null)
      setFormData(emptyForm)
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Informe um e-mail válido.')
      return
    }

    setSaving(true)

    const payload: Record<string, unknown> = {
      name: formData.name,
      phone: formData.phone || undefined,
      role: formData.role,
      active: formData.active,
    }

    if (!editingUser) {
      payload.email = formData.email
      payload.password = Math.floor(100000 + Math.random() * 900000).toString()
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(editingUser ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado!')
        setShowModal(false)
        fetchUsers()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Erro ao salvar usuário.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateAccess = async (user: User) => {
    if (!user.email) {
      toast.error('Este usuário não possui e-mail cadastrado.')
      return
    }

    const message = user.active
      ? `Deseja resetar a senha de ${user.name}? Uma nova senha de 6 dígitos será gerada.`
      : `Deseja gerar acesso para ${user.name}?`

    if (!confirm(message)) return

    setGeneratingFor(user.id)
    try {
      const res = await fetch(`/api/users/${user.id}/reset-password`, { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        setCredentials({ name: data.name, email: data.email, password: data.password })
        setCopied(false)
        toast.success('Acesso gerado com sucesso!')
        fetchUsers()
      } else {
        toast.error(data.error || 'Erro ao gerar acesso.')
      }
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setGeneratingFor(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente desativar este usuário?')) return

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Usuário desativado.')
        fetchUsers()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Erro ao desativar.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao desativar usuário.')
    }
  }

  const copyCredentials = async () => {
    if (!credentials) return

    const text = [
      `Olá, ${credentials.name.split(' ')[0]}!`,
      '',
      'Seu acesso ao sistema Mundo Mágico foi criado.',
      '',
      `Login: ${credentials.email}`,
      `Senha provisória: ${credentials.password}`,
      '',
      'Ao entrar pela primeira vez, você poderá alterar sua senha nas configurações do perfil.',
    ].join('\n')

    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Credenciais copiadas para a área de transferência!')
    setTimeout(() => setCopied(false), 3000)
  }

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim()

    return users.filter((user) => {
      const matchesSearch =
        !term ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.phone || '').toLowerCase().includes(term)

      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [roleFilter, search, users])

  const activeUsers = users.filter((user) => user.active).length
  const inactiveUsers = users.length - activeUsers
  const teachers = users.filter((user) => ['TEACHER', 'CAREGIVER'].includes(user.role)).length

  return (
    <div className="page animate-in">
      <PageHeader
        title="Equipe"
        subtitle="Gerencie usuários internos, cargos, status e acessos ao sistema."
        icon={<Users size={24} />}
        actions={
          <button onClick={() => handleOpenModal()} className="btn-primary">
            <Plus size={18} /> Novo Usuário
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total da Equipe" value={users.length} icon={<Users size={20} />} color="text-primary bg-primary/10" />
        <StatCard label="Acessos Ativos" value={activeUsers} icon={<UserCheck size={20} />} color="text-emerald-500 bg-emerald-500/10" />
        <StatCard label="Professoras e Cuidadores" value={teachers} icon={<ShieldCheck size={20} />} color="text-blue-500 bg-blue-500/10" />
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-12 w-full bg-accent/30 border-transparent focus:bg-accent/50 focus:border-primary/30 h-14 text-sm font-bold"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'ADMIN', 'DIRECTOR', 'TEACHER', 'CAREGIVER', 'STAFF'] as RoleFilter[]).map((role) => {
            const active = roleFilter === role
            const count = role === 'ALL' ? users.length : users.filter((user) => user.role === role).length

            return (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/10'
                    : 'bg-accent/40 text-muted-foreground border-border/40 hover:bg-accent/60'
                }`}
              >
                {role === 'ALL' ? 'Todos' : ROLE_LABELS[role]} ({count})
              </button>
            )
          })}
        </div>

        {inactiveUsers > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-black text-amber-600 dark:text-amber-400">
            <UserX size={14} />
            {inactiveUsers} inativo{inactiveUsers > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title="Nenhum usuário encontrado"
          description={search ? 'Tente buscar com outro termo ou limpar os filtros.' : 'Cadastre o primeiro usuário da equipe.'}
          action={!search && roleFilter === 'ALL' && (
            <button onClick={() => handleOpenModal()} className="btn-primary">
              Cadastrar Usuário
            </button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div key={user.id} className="card-hover p-6 flex flex-col group border border-border/40 hover:border-primary/20">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar name={user.name} size="md" color="bg-primary/10 text-primary" />
                  <div className="min-w-0">
                    <h3 className="font-black text-foreground leading-tight truncate text-base">{user.name}</h3>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge label={ROLE_LABELS[user.role] || user.role} variant={ROLE_BADGES[user.role] || 'gray'} size="sm" />
                      <Badge label={user.active ? 'Ativo' : 'Inativo'} variant={user.active ? 'green' : 'red'} size="sm" dot={user.active} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenModal(user)}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                    title="Desativar"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-8 bg-accent/20 p-4 rounded-2xl border border-border/20">
                <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 shadow-sm">
                    <Mail size={14} className="text-primary" />
                  </div>
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 shadow-sm">
                    <Phone size={14} className="text-primary" />
                  </div>
                  <span className="truncate">{user.phone || 'Telefone não informado'}</span>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-border/50">
                <button
                  onClick={() => handleGenerateAccess(user)}
                  disabled={generatingFor === user.id}
                  className="w-full btn-primary py-3 text-xs font-black gap-2 shadow-lg shadow-primary/10 active:scale-95 transition-transform"
                >
                  {generatingFor === user.id
                    ? <Loader2 size={14} className="animate-spin" />
                    : user.active
                      ? <RefreshCw size={14} />
                      : <Key size={14} />
                  }
                  {user.active ? 'Resetar Senha' : 'Gerar Acesso'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => !saving && setShowModal(false)}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        subtitle={editingUser ? 'Atualize cargo, telefone e status do acesso.' : 'Cadastre um membro da equipe e gere o acesso em seguida.'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {!editingUser && (
            <Alert variant="info">
              Após cadastrar, use o botão de acesso no card do usuário para gerar e copiar as credenciais de login.
            </Alert>
          )}

          <div>
            <label className="label">Nome Completo *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Ex: Ana Paula Santos"
            />
          </div>

          <div>
            <label className="label">E-mail de Login *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!editingUser}
              className="input disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="email@escola.com.br"
            />
            {editingUser && (
              <p className="mt-2 text-[10px] text-muted-foreground font-medium italic">
                O e-mail não pode ser alterado. Use &quot;Resetar Senha&quot; para gerar nova senha.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Telefone / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="label">Cargo / Função *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="select"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
          </div>

          {editingUser && (
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-accent/20 p-4 cursor-pointer">
              <div>
                <span className="block text-sm font-black text-foreground">Acesso ativo</span>
                <span className="block text-xs font-bold text-muted-foreground mt-0.5">Usuários inativos não conseguem acessar o sistema.</span>
              </div>
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
              />
            </label>
          )}

          <div className="pt-4 flex gap-3 border-t border-border">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 gap-2">
              {saving ? <Loader2 size={18} className="animate-spin" /> : 'Salvar Dados'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!credentials}
        onClose={() => setCredentials(null)}
        title="Acesso Gerado"
        subtitle={credentials ? `Credenciais provisórias para ${credentials.name.split(' ')[0]}.` : undefined}
      >
        {credentials && (
          <div className="space-y-6">
            <Alert variant="success">
              O acesso foi gerado com sucesso. Copie os dados abaixo e envie pelo canal combinado com a equipe.
            </Alert>

            <div className="bg-accent/40 p-6 rounded-[2rem] border border-border/50 space-y-4 shadow-inner">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">E-mail de Login</p>
                <p className="text-sm font-black text-foreground break-all">{credentials.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Senha Temporária</p>
                <p className="text-3xl font-black text-primary tracking-[0.2em]">{credentials.password}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={copyCredentials} className="btn-primary flex-1 py-4 gap-3">
                <Copy size={18} /> {copied ? 'Copiado!' : 'Copiar Mensagem'}
              </button>
              <button onClick={() => setCredentials(null)} className="btn-ghost sm:w-32">
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
