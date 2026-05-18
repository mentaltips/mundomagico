'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash, Edit, UserCircle, Phone, Mail, Key, Copy, Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

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

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  DIRECTOR: 'Diretor(a)',
  TEACHER: 'Professor(a)',
  CAREGIVER: 'Cuidador(a)',
  STAFF: 'Equipe/Staff'
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-50 text-red-700',
  DIRECTOR: 'bg-violet-50 text-violet-700',
  TEACHER: 'bg-blue-50 text-blue-700',
  CAREGIVER: 'bg-emerald-50 text-emerald-700',
  STAFF: 'bg-gray-100 text-gray-600'
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'TEACHER',
    active: true
  })

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        active: user.active
      })
    } else {
      setEditingUser(null)
      setFormData({ name: '', email: '', phone: '', role: 'TEACHER', active: true })
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
      active: formData.active
    }

    if (!editingUser) {
      payload.email = formData.email
      // Sem senha no payload — o admin usará "Gerar Acesso" após cadastro
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PATCH' : 'POST'

      if (!editingUser) {
        // No cadastro novo, gera uma senha temporária aleatória que será trocada via "Gerar Acesso"
        payload.password = Math.floor(100000 + Math.random() * 900000).toString()
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success(editingUser ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado! Use "Gerar Acesso" para enviar as credenciais.')
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

    const isReset = user.active
    const message = isReset
      ? `Deseja resetar a senha de ${user.name}? Uma nova senha de 6 dígitos será gerada e a atual deixará de funcionar.`
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
    } catch (err) {
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
    }
  }

  const copyCredentials = () => {
    if (!credentials) return
    const roleName = ROLE_LABELS[users.find(u => u.email === credentials.email)?.role || ''] || 'Membro da equipe'
    const text = `Olá, ${credentials.name.split(' ')[0]}! 👋\n\nSeu acesso ao sistema foi criado.\n\n🔑 Login: ${credentials.email}\n🔒 Senha provisória: ${credentials.password}\n\nAo entrar pela primeira vez, você poderá alterar sua senha nas configurações do perfil.`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Credenciais copiadas para a área de transferência!')
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Equipe</h1>
          <p className="text-gray-500">Gerencie professoras, monitoras, direção e funcionários.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          Novo Usuário
        </button>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhum funcionário cadastrado.</div>
        ) : (
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900">
              <tr>
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">Contato</th>
                <th className="px-6 py-4 font-medium">Cargo</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                        <UserCircle className="h-5 w-5" />
                      </div>
                      <div className="font-medium text-gray-900">{u.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {u.phone && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Phone className="h-3 w-3" /> {u.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-gray-500">
                        <Mail className="h-3 w-3" /> {u.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${u.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {u.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleGenerateAccess(u)}
                      disabled={generatingFor === u.id}
                      className="text-gray-400 hover:text-emerald-600 mr-3 disabled:opacity-40"
                      title={u.active ? 'Resetar senha de acesso' : 'Gerar acesso ao sistema'}
                    >
                      {generatingFor === u.id
                        ? <Loader2 className="h-4 w-4 inline animate-spin" />
                        : u.active
                          ? <RefreshCw className="h-4 w-4 inline" />
                          : <Key className="h-4 w-4 inline" />
                      }
                    </button>
                    <button
                      onClick={() => handleOpenModal(u)}
                      className="text-gray-400 hover:text-violet-600 mr-3"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Desativar"
                    >
                      <Trash className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de cadastro / edição */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-1">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            {!editingUser && (
              <p className="text-sm text-gray-500 mb-4">Após cadastrar, use o botão <strong>Gerar Acesso</strong> na tabela para enviar as credenciais de login.</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  placeholder="Ex: Ana Paula Santos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (Login) *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingUser}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="email@escola.com.br"
                />
                {editingUser && (
                  <p className="mt-1 text-xs text-gray-400">O e-mail não pode ser alterado. Use &quot;Gerar Acesso&quot; para resetar a senha.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo / Função *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="TEACHER">Professor(a)</option>
                    <option value="CAREGIVER">Cuidador(a) / Monitora</option>
                    <option value="STAFF">Equipe Geral</option>
                    <option value="DIRECTOR">Diretor(a)</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                {editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="flex items-center h-[42px]">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.active}
                          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                          className="rounded text-violet-600 focus:ring-violet-500"
                        />
                        <span className="text-sm text-gray-700">Acesso Ativo</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de credenciais geradas */}
      {credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Key className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Acesso gerado!</h2>
                <p className="text-sm text-gray-500">Compartilhe as credenciais abaixo com {credentials.name.split(' ')[0]}.</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200 mb-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Login (E-mail)</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{credentials.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Senha provisória</p>
                <p className="text-2xl font-black text-violet-600 tracking-[0.3em] mt-0.5">{credentials.password}</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              Esta senha é temporária. A professora/monitora poderá alterá-la nas configurações do perfil após o primeiro acesso.
            </p>

            <div className="flex gap-3">
              <button
                onClick={copyCredentials}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'}`}
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copiado!' : 'Copiar mensagem de acesso'}
              </button>
              <button
                onClick={() => setCredentials(null)}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
