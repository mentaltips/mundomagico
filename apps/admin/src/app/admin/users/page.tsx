'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash, Edit, UserCircle, Phone, Mail } from 'lucide-react'

type User = {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  active: boolean
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  DIRECTOR: 'Diretor',
  TEACHER: 'Professor',
  CAREGIVER: 'Cuidador',
  STAFF: 'Equipe/Staff'
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    role: 'STAFF',
    password: '',
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
        password: '',
        active: user.active
      })
    } else {
      setEditingUser(null)
      setFormData({ name: '', email: '', phone: '', role: 'STAFF', password: '', active: true })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload: any = {
      name: formData.name,
      phone: formData.phone || undefined,
      role: formData.role,
      active: formData.active
    }

    if (!editingUser) {
      payload.email = formData.email
      payload.password = formData.password || undefined
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setShowModal(false)
        fetchUsers()
      } else {
        const error = await res.json()
        alert(error.error || 'Erro ao salvar usuário.')
      }
    } catch (err) {
      console.error(err)
      alert('Erro inesperado.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este usuário?')) return

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchUsers()
      } else {
        const error = await res.json()
        alert(error.error || 'Erro ao excluir.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Equipe</h1>
          <p className="text-gray-500">Gerencie professores, direção e funcionários.</p>
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
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
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
                      onClick={() => handleOpenModal(u)}
                      className="text-gray-400 hover:text-violet-600 mr-3"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4 inline" />
                    </button>
                    <button 
                      onClick={() => handleDelete(u.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Excluir"
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>
              
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (Login)</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo / Função</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="TEACHER">Professor(a)</option>
                    <option value="CAREGIVER">Cuidador(a)</option>
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
                          onChange={(e) => setFormData({...formData, active: e.target.checked})}
                          className="rounded text-violet-600 focus:ring-violet-500"
                        />
                        <span className="text-sm text-gray-700">Acesso Ativo</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha (Padrão: 123456)</label>
                  <input 
                    type="password" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="Deixe em branco para usar 123456"
                  />
                </div>
              )}

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
                  className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
