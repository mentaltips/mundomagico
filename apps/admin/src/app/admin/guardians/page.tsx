'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash, Edit, Phone, Mail } from 'lucide-react'

type Guardian = {
  id: string
  name: string
  document: string | null
  phone: string | null
  email: string | null
}

export default function GuardiansPage() {
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null)
  
  const [formData, setFormData] = useState({ name: '', document: '', phone: '', email: '' })

  const fetchGuardians = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/guardians')
      if (res.ok) {
        const data = await res.json()
        setGuardians(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGuardians()
  }, [])

  const handleOpenModal = (guardian?: Guardian) => {
    if (guardian) {
      setEditingGuardian(guardian)
      setFormData({ 
        name: guardian.name, 
        document: guardian.document || '',
        phone: guardian.phone || '',
        email: guardian.email || ''
      })
    } else {
      setEditingGuardian(null)
      setFormData({ name: '', document: '', phone: '', email: '' })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload = {
      name: formData.name,
      phone: formData.phone || undefined,
      email: formData.email || undefined
    }

    try {
      const url = editingGuardian ? `/api/guardians/${editingGuardian.id}` : '/api/guardians'
      const method = editingGuardian ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setShowModal(false)
        fetchGuardians()
      } else {
        alert('Erro ao salvar responsável.')
      }
    } catch (err) {
      console.error(err)
      alert('Erro inesperado.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este responsável?')) return

    try {
      const res = await fetch(`/api/guardians/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchGuardians()
      } else {
        alert('Erro ao excluir.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Responsáveis</h1>
          <p className="text-gray-500">Pais e responsáveis legais dos alunos.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Novo Responsável
        </button>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : guardians.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhum responsável cadastrado.</div>
        ) : (
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900">
              <tr>
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">Contato</th>
                <th className="px-6 py-4 font-medium">Documento</th>
                <th className="px-6 py-4 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {guardians.map(g => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{g.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {g.phone && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Phone className="h-3 w-3" /> {g.phone}
                        </span>
                      )}
                      {g.email && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Mail className="h-3 w-3" /> {g.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">{g.document || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleOpenModal(g)}
                      className="text-gray-400 hover:text-green-600 mr-3"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4 inline" />
                    </button>
                    <button 
                      onClick={() => handleDelete(g.id)}
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
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">{editingGuardian ? 'Editar Responsável' : 'Novo Responsável'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento (CPF/RG)</label>
                <input 
                  type="text" 
                  value={formData.document}
                  onChange={(e) => setFormData({...formData, document: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone (WhatsApp)</label>
                <input 
                  type="text" 
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
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
