'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash, Edit, Phone, Mail, Key, Copy, CheckCircle2, Loader2, Users, Search, MessageCircle } from 'lucide-react'
import { PageHeader, EmptyState, SkeletonCard, Badge, Modal, Alert, Avatar } from '@/components/ui'
import { ImageUpload } from '@/components/ui/ImageUpload'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/utils'


type Guardian = {
  id: string
  fullName: string
  cpf: string | null
  phone: string | null
  email: string | null
  userId: string | null
  status: string // ATIVO | INATIVO | AUSENTE | INADIMPLENTE
}

export default function GuardiansPage() {
  const [guardians, setGuardians] = useState<Guardian[]>([])
  
  const handleWhatsAppRedirect = (guardian: Guardian) => {
    if (!guardian.phone) {
      toast.error('Este responsável não possui telefone cadastrado.')
      return
    }
    const phone = guardian.phone.replace(/\D/g, '')
    const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`
    
    let message = ''
    switch (guardian.status) {
      case 'INADIMPLENTE':
        message = `Olá ${guardian.fullName.split(' ')[0]}! Tudo bem? Gostaríamos de conversar de forma amigável sobre algumas pendências financeiras em aberto na Escola Mundo Mágico. Como podemos te ajudar a regularizar? 💸`
        break
      case 'AUSENTE':
        message = `Olá ${guardian.fullName.split(' ')[0]}! Tudo bem? Sentimos a sua falta em nossas atividades na Escola Mundo Mágico. Gostaríamos de conversar para alinhar o retorno. Como podemos te ajudar? ❤️`
        break
      case 'INATIVO':
        message = `Olá ${guardian.fullName.split(' ')[0]}! Tudo bem? Sentimos saudades de vocês aqui na Escola Mundo Mágico. Preparamos uma condição super especial com taxa de matrícula zero para o retorno este semestre. Vamos conversar? 🏫✨`
        break
      default:
        message = `Olá ${guardian.fullName.split(' ')[0]}! Tudo bem? Entramos em contato da Escola Mundo Mágico para trazer atualizações e nos colocar à disposição para qualquer dúvida. Tenha um excelente dia! 🏫`
        break
    }
    
    const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [credentials, setCredentials] = useState<{ email: string, password: string } | null>(null)
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)

  const [formData, setFormData] = useState({ 
    fullName: '', 
    cpf: '', 
    phone: '', 
    email: '', 
    relationship: 'Mae', 
    photoUrl: '',
    status: 'ATIVO'
  })

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ATIVO' | 'INATIVO' | 'AUSENTE' | 'INADIMPLENTE'>('ALL')

  const fetchGuardians = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/guardians?t=${Date.now()}`)
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
        email: guardian.email || '',
        relationship: (guardian as any).relationship || 'Mae',
        photoUrl: (guardian as any).photoUrl || '',
        status: guardian.status || 'ATIVO',
      })
    } else {
      setEditingGuardian(null)
      setFormData({ 
        fullName: '', 
        cpf: '', 
        phone: '', 
        email: '', 
        relationship: 'Mae', 
        photoUrl: '',
        status: 'ATIVO'
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const payload = {
      fullName: formData.fullName,
      relationship: formData.relationship,
      photoUrl: formData.photoUrl || undefined,
      cpf: formData.cpf || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      status: formData.status,
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
      // Remover imediatamente do estado local para feedback visual instantâneo (evita cliques duplos / 404)
      setGuardians(prev => prev.filter(g => g.id !== id))
      
      const res = await fetch(`/api/guardians/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Responsável excluído')
        fetchGuardians()
      } else {
        toast.error('Erro ao excluir.')
        fetchGuardians() // restaura a lista caso o backend tenha falhado
      }
    } catch (err) {
      console.error(err)
      fetchGuardians()
    }
  }

  const handleBulkDelete = async (status: 'INATIVO' | 'AUSENTE') => {
    const targets = guardians.filter(g => g.status === status)
    const count = targets.length
    if (count === 0) return

    const label = status === 'INATIVO' ? 'Inativo' : 'Ausente'
    if (!confirm(`Deseja realmente excluir TODOS os ${count} responsáveis com status "${label}"? Esta ação é definitiva e apagará também as contas vinculadas.`)) return
    
    setSaving(true)
    let successCount = 0
    
    try {
      for (const t of targets) {
        const res = await fetch(`/api/guardians/${t.id}`, { method: 'DELETE' })
        if (res.ok) successCount++
      }
      toast.success(`${successCount} de ${count} responsáveis excluídos com sucesso.`)
      fetchGuardians()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao realizar exclusão em lote.')
      fetchGuardians()
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateAccess = async (guardian: Guardian) => {
    if (!guardian.email) {
      toast.error('O responsável precisa ter um e-mail cadastrado.')
      return
    }
    
    const isReset = !!guardian.userId
    const message = isReset 
      ? `Deseja resetar a senha de ${guardian.fullName}? Uma nova senha de 6 dígitos será gerada e a atual deixará de funcionar.`
      : `Deseja gerar um acesso para ${guardian.fullName}?`

    if (!confirm(message)) return
    
    setGeneratingFor(guardian.id)
    try {
      const res = await fetch(`/api/guardians/${guardian.id}/create-user`, { method: 'POST' })
      const data = await res.json()
      
      if (res.ok) {
        setCredentials({ email: data.email, password: data.password })
        toast.success('Acesso gerado com sucesso!')
        fetchGuardians()
      } else {
        toast.error(getErrorMessage(data, 'Erro ao gerar acesso'))
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

  const filteredGuardians = guardians.filter(g => {
    const matchesSearch = (g.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (g.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (g.phone || '').includes(search)
    
    const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

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
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-12 w-full bg-accent/30 border-transparent focus:bg-accent/50 focus:border-primary/30 h-14 text-sm font-bold"
          />
        </div>
      </div>

      {/* Tabs de Filtro por Status Administrativo */}
      <div className="flex flex-wrap gap-2 mb-8 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setStatusFilter('ALL')} 
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
              statusFilter === 'ALL' 
                ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/10' 
                : 'bg-accent/40 text-muted-foreground border-border/40 hover:bg-accent/60'
            }`}
          >
            Todos ({guardians.length})
          </button>
          <button 
            onClick={() => setStatusFilter('ATIVO')} 
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
              statusFilter === 'ATIVO' 
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10' 
                : 'bg-accent/40 text-muted-foreground border-border/40 hover:bg-accent/60'
            }`}
          >
            Ativo ({guardians.filter(g => g.status === 'ATIVO').length})
          </button>
          <button 
            onClick={() => setStatusFilter('INATIVO')} 
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
              statusFilter === 'INATIVO' 
                ? 'bg-gray-500 text-white border-gray-500 shadow-md shadow-gray-500/10' 
                : 'bg-accent/40 text-muted-foreground border-border/40 hover:bg-accent/60'
            }`}
          >
            Inativo ({guardians.filter(g => g.status === 'INATIVO').length})
          </button>
          <button 
            onClick={() => setStatusFilter('AUSENTE')} 
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
              statusFilter === 'AUSENTE' 
                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/10' 
                : 'bg-accent/40 text-muted-foreground border-border/40 hover:bg-accent/60'
            }`}
          >
            Ausente ({guardians.filter(g => g.status === 'AUSENTE').length})
          </button>
          <button 
            onClick={() => setStatusFilter('INADIMPLENTE')} 
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
              statusFilter === 'INADIMPLENTE' 
                ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/10' 
                : 'bg-accent/40 text-muted-foreground border-border/40 hover:bg-accent/60'
            }`}
          >
            Falta de Pagamento ({guardians.filter(g => g.status === 'INADIMPLENTE').length})
          </button>
        </div>

        {/* Botões de Ação em Lote (Remarketing / Limpeza) */}
        <div className="flex gap-2">
          {statusFilter === 'INATIVO' && guardians.filter(g => g.status === 'INATIVO').length > 0 && (
            <button 
              onClick={() => handleBulkDelete('INATIVO')}
              disabled={saving}
              className="bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Trash size={14} /> Excluir Todos Inativos
            </button>
          )}
          {statusFilter === 'AUSENTE' && guardians.filter(g => g.status === 'AUSENTE').length > 0 && (
            <button 
              onClick={() => handleBulkDelete('AUSENTE')}
              disabled={saving}
              className="bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Trash size={14} /> Excluir Todos Ausentes (Limpar Mkt)
            </button>
          )}
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
          description={search ? "Tente buscar com outro termo ou filtro." : "Você ainda não cadastrou nenhum pai ou responsável."}
          action={!search && (
            <button onClick={() => handleOpenModal()} className="btn-primary">
              Cadastrar Agora
            </button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuardians.map(g => (
            <div key={g.id} className="card-hover p-6 flex flex-col group border border-border/40 hover:border-primary/20">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar name={g.fullName} photoUrl={(g as any).photoUrl} size="md" />
                  <div className="min-w-0">
                    <h3 className="font-black text-foreground leading-tight truncate text-base">{g.fullName}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {/* Badge de Status Administrativo */}
                      {g.status === 'ATIVO' && <Badge label="Ativo" variant="green" size="sm" dot />}
                      {g.status === 'INATIVO' && <Badge label="Inativo" variant="gray" size="sm" />}
                      {g.status === 'AUSENTE' && <Badge label="Ausente" variant="amber" size="sm" />}
                      {g.status === 'INADIMPLENTE' && <Badge label="Falta de Pagamento" variant="red" size="sm" />}
                      
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{(g as any).relationship || 'Responsável'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(g)}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(g.id)}
                    className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                    title="Excluir"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-8 bg-accent/20 p-4 rounded-2xl border border-border/20">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 shadow-sm">
                      <Phone size={14} className="text-primary" />
                    </div>
                    <span className="truncate">{g.phone || '—'}</span>
                  </div>
                  {g.phone && (
                    <button
                      onClick={() => handleWhatsAppRedirect(g)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-500/20 shrink-0"
                      title="Enviar WhatsApp"
                    >
                      <MessageCircle size={13} className="fill-white/10" />
                      <span>WhatsApp</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 shadow-sm">
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
                    className="w-full btn-primary py-3 text-xs font-black gap-2 shadow-lg shadow-primary/10 active:scale-95 transition-transform"
                  >
                    {generatingFor === g.id ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                    Liberar Acesso Portal
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 py-3 rounded-xl border border-emerald-500/10">
                      <CheckCircle2 size={12} /> Portal da Família Ativo
                    </div>
                    <button 
                      onClick={() => handleGenerateAccess(g)}
                      disabled={generatingFor === g.id}
                      className="w-full bg-white text-gray-400 hover:text-primary hover:bg-primary/5 py-2.5 text-[10px] font-black gap-2 rounded-xl border border-dashed border-gray-200 hover:border-primary/30 transition-all flex items-center justify-center"
                    >
                      {generatingFor === g.id ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
                      Resetar e Enviar Nova Senha
                    </button>
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
          <ImageUpload
            label="Foto do Responsável"
            size="md"
            value={formData.photoUrl}
            onChange={(url) => setFormData({ ...formData, photoUrl: url })}
          />
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
              <label className="label">Parentesco *</label>
              <select
                required
                value={formData.relationship}
                onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                className="input"
              >
                <option value="Mae">Mãe</option>
                <option value="Pai">Pai</option>
                <option value="Avo">Avó / Avô</option>
                <option value="Tio">Tio / Tia</option>
                <option value="Responsavel">Responsável Legal</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="label">Status Administrativo *</label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="input"
              >
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
                <option value="AUSENTE">Ausente (Remarketing)</option>
                <option value="INADIMPLENTE">Falta de Pagamento</option>
              </select>
            </div>
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
