'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash, Edit, Phone, Mail, Key, Copy, CheckCircle2, UserPlus, Loader2, Users, Search } from 'lucide-react'
import { PageHeader, EmptyState, SkeletonCard, Badge, Modal, Alert, Avatar } from '@/components/ui'
import toast from 'react-hot-toast'

type Guardian = {
  id: string
  fullName: string
  cpf: string | null
  phone: string | null
  email: string | null
  userId: string | null
}

export default function GuardiansPage() {
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [credentials, setCredentials] = useState<{ email: string, password: string } | null>(null)
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)

  const [formData, setFormData] = useState({ fullName: '', cpf: '', phone: '', email: '' })

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
        fullName: guardian.fullName, 
        cpf: guardian.cpf || '',
        phone: guardian.phone || '',
        email: guardian.email || ''
      })
    } else {
      setEditingGuardian(null)
      setFormData({ fullName: '', cpf: '', phone: '', email: '' })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const payload = {
      fullName: formData.fullName,
      cpf: formData.cpf || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined
    }

    try {
      const url = editingGuardian ? `/api/guardians/${editingGuardian.id}` : '/api/guardians'
      const method = editingGuardian ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success(editingGuardian ? 'Responsável atualizado!' : 'Responsável cadastrado!')
        setShowModal(false)
        fetchGuardians()
      } else {
        toast.error('Erro ao salvar responsável.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro inesperado.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este responsável?')) return

    try {
      const res = await fetch(`/api/guardians/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Responsável excluído')
        fetchGuardians()
      } else {
        toast.error('Erro ao excluir.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleGenerateAccess = async (guardian: Guardian) => {
    if (!guardian.email) {
      toast.error('O responsável precisa ter um e-mail cadastrado.')
      return
    }
    
    if (!confirm(`Deseja gerar um acesso para ${guardian.fullName}?`)) return
    
    setGeneratingFor(guardian.id)
    try {
      const res = await fetch(`/api/guardians/${guardian.id}/create-user`, { method: 'POST' })
      const data = await res.json()
      
      if (res.ok) {
        setCredentials({ email: data.email, password: data.password })
        toast.success('Acesso gerado com sucesso!')
        fetchGuardians()
      } else {
        toast.error(data.error || 'Erro ao gerar acesso')
      }
    } catch (err) {
      toast.error('Erro de conexão')
    } finally {
      setGeneratingFor(null)
    }
  }

  const copyCredentials = () => {
    if (!credentials) return
    const text = `Olá! Seu acesso ao Painel dos Pais foi criado.\n\nLogin: ${credentials.email}\nSenha provisória: ${credentials.password}\n\nAcesse pelo site da escola e utilize esses dados.`
    navigator.clipboard.writeText(text)
    toast.success('Copiado para a área de transferência!')
  }

  const filteredGuardians = guardians.filter(g => 
    g.fullName.toLowerCase().includes(search.toLowerCase()) ||
    g.email?.toLowerCase().includes(search.toLowerCase()) ||
    g.phone?.includes(search)
  )

  return (
    <div className="page animate-in">
      <PageHeader 
        title="Responsáveis" 
        subtitle="Gerencie os pais e responsáveis legais dos alunos e libere acessos."
        icon={<Users size={24} />}
        actions={
          <button onClick={() => handleOpenModal()} className="btn-primary">
            <Plus size={18} /> Novo Responsável
          </button>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      ) : filteredGuardians.length === 0 ? (
        <EmptyState 
          icon={<Users size={32} />}
          title="Nenhum responsável encontrado"
          description={search ? "Tente buscar com outro termo." : "Você ainda não cadastrou nenhum pai ou responsável."}
          action={!search && (
            <button onClick={() => handleOpenModal()} className="btn-primary">
              Cadastrar Agora
            </button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuardians.map(g => (
            <div key={g.id} className="card-hover p-6 flex flex-col group">
              <div className="flex items-center gap-4 mb-6">
                <Avatar name={g.fullName} size="md" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-foreground leading-tight truncate">{g.fullName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {g.userId ? (
                      <Badge label="Acesso Ativo" variant="green" size="sm" dot />
                    ) : (
                      <Badge label="Sem Acesso" variant="gray" size="sm" />
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => handleOpenModal(g)}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(g.id)}
                    className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <Phone size={14} className="text-primary" />
                  </div>
                  <span className="truncate">{g.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-primary" />
                  </div>
                  <span className="truncate">{g.email || '—'}</span>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-border/50">
                {!g.userId ? (
                  <button 
                    onClick={() => handleGenerateAccess(g)}
                    disabled={generatingFor === g.id}
                    className="w-full btn-secondary py-2.5 text-xs gap-2"
                  >
                    {generatingFor === g.id ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    Liberar Acesso
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 py-2 rounded-xl border border-emerald-500/10">
                    <CheckCircle2 size={12} /> Portal da Família Ativo
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Forms Modal */}
      <Modal 
        open={showModal} 
        onClose={() => !saving && setShowModal(false)}
        title={editingGuardian ? 'Editar Responsável' : 'Novo Responsável'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Nome Completo *</label>
            <input 
              type="text" 
              required
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className="input"
              placeholder="Ex: Maria da Silva"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">CPF</label>
              <input 
                type="text" 
                value={formData.cpf}
                onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                className="input"
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="label">Telefone *</label>
              <input 
                type="text" 
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="input"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          <div>
            <label className="label">E-mail (Login do Responsável)</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="input"
              placeholder="maria@email.com"
            />
            <p className="text-[10px] text-muted-foreground mt-2 font-medium italic">* O e-mail é obrigatório para liberar acesso ao Painel dos Pais.</p>
          </div>
          <div className="pt-4 flex gap-3 border-t border-border">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 gap-2">
              {saving ? <Loader2 size={18} className="animate-spin" /> : 'Salvar Dados'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Credentials Modal */}
      <Modal
        open={!!credentials}
        onClose={() => setCredentials(null)}
        title="Acesso Liberado! 🎉"
        subtitle="O responsável agora pode acessar o Portal da Família."
      >
        {credentials && (
          <div className="space-y-6">
            <Alert variant="success">
              O usuário foi criado com sucesso. Utilize os dados abaixo para o primeiro acesso.
            </Alert>
            
            <div className="bg-accent/40 p-6 rounded-[2rem] border border-border/50 space-y-4 shadow-inner">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">E-mail de Login</p>
                <p className="text-sm font-black text-foreground">{credentials.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Senha Temporária</p>
                <p className="text-3xl font-black text-primary tracking-[0.2em]">{credentials.password}</p>
              </div>
            </div>

            <button onClick={copyCredentials} className="w-full btn-primary py-4 gap-3">
              <Copy size={18} /> Copiar Dados para Enviar
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
