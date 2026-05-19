'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, Send, Save, Clock, Smartphone, 
  Users, CheckCircle2, Info, AlertCircle, Hash,
  History, Settings as SettingsIcon, Activity, Check, 
  AlertTriangle, ExternalLink, Loader2, Sparkles, Search,
  QrCode, LogOut, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Guardian {
  id: string
  fullName: string
  phone: string | null
}

interface Child {
  id: string
  fullName: string
  nickname: string | null
  status: string
  group: {
    id: string
    name: string
  } | null
  guardians: Array<{
    guardian: Guardian
  }>
}

export default function WhatsAppDashboardPage() {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'logs' | 'config'>('broadcast')
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  
  // Baileys Connection State
  const [isConnected, setIsConnected] = useState(false)
  const [whatsappStatus, setWhatsappStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [whatsappQr, setWhatsappQr] = useState<string | null>(null)
  const [whatsappLoading, setWhatsappLoading] = useState(true)

  // Broadcast Panel State
  const [targetStatus, setTargetStatus] = useState<string>('ALL')
  const [customMessage, setCustomMessage] = useState('Olá {{nome_responsavel}}, tudo bem? Gostaríamos de falar sobre o(a) {{nome_aluno}}... 🏫✨')
  const [sendingBroadcast, setSendingBroadcast] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchWhatsappStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status')
      if (res.ok) {
        const data = await res.json()
        setWhatsappStatus(data.status)
        setWhatsappQr(data.qr)
        setIsConnected(data.status === 'connected')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setWhatsappLoading(false)
    }
  }

  // Poll for connection status
  useEffect(() => {
    fetchWhatsappStatus()
    const interval = setInterval(() => {
      fetchWhatsappStatus()
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Fetch children
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const res = await fetch('/api/children')
        if (res.ok) {
          const childrenData = await res.json()
          setChildren(childrenData)
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
        toast.error('Erro ao conectar com o servidor.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Filtered list of targets for direct broadcast
  const targetChildren = children.filter((child) => {
    const statusMatch = targetStatus === 'ALL' || child.status === targetStatus
    if (!statusMatch) return false
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const childNameMatch = child.fullName.toLowerCase().includes(q)
      const guardianNameMatch = child.guardians?.some(g => g.guardian.fullName.toLowerCase().includes(q)) ?? false
      return childNameMatch || guardianNameMatch
    }
    return true
  })

  // Variables helpers
  const variables = [
    { key: 'nome_responsavel', label: 'Nome do Responsável' },
    { key: 'nome_aluno', label: 'Nome do Aluno' },
    { key: 'status_aluno', label: 'Status da Matrícula' },
    { key: 'escola', label: 'Nome da Escola' },
  ]

  const insertVariable = (key: string) => {
    setCustomMessage(prev => `${prev}{{${key}}}`)
  }

  // Pre-load default message templates when target status changes
  useEffect(() => {
    if (targetStatus === 'PENDENTE_PAGAMENTO') {
      setCustomMessage('Olá {{nome_responsavel}}! Tudo bem? Gostaríamos de conversar sobre as pendências financeiras em aberto do(a) {{nome_aluno}} na Escola Mundo Mágico. Como podemos te ajudar a regularizar? 💸')
    } else if (targetStatus === 'AGUARDANDO_VAGA') {
      setCustomMessage('Olá {{nome_responsavel}}! Tudo bem? Temos ótimas notícias! Uma vaga para o(a) {{nome_aluno}} está prestes a se abrir em nossa turma. Vamos agendar uma visita para garantir a matrícula? 🏫✨')
    } else if (targetStatus === 'INATIVO' || targetStatus === 'CANCELADO') {
      setCustomMessage('Olá {{nome_responsavel}}! Tudo bem? Sentimos saudades do(a) {{nome_aluno}} aqui na Mundo Mágico. Preparamos uma condição exclusiva com taxa de matrícula zero para o retorno dele este semestre. Vamos conversar? ❤️')
    } else if (targetStatus === 'ADAPTACAO') {
      setCustomMessage('Olá {{nome_responsavel}}! Tudo bem? Gostaríamos de falar sobre o processo de adaptação do(a) {{nome_aluno}} esta semana. Como ele(a) tem se sentido em casa? 👶')
    } else {
      setCustomMessage('Olá {{nome_responsavel}}, tudo bem? Entramos em contato para trazer novidades sobre o(a) {{nome_aluno}} e a Escola Mundo Mágico... 🏫')
    }
  }, [targetStatus])



  // Format dynamic previews for individual click-to-chat links
  const getIndividualMessage = (child: Child, rawMessage: string) => {
    const guardian = child.guardians?.[0]?.guardian
    const guardianName = guardian ? guardian.fullName.split(' ')[0] : 'Responsável'
    const studentName = child.fullName
    const studentStatus = child.status === 'PENDENTE_PAGAMENTO' ? 'Pendente de Pagamento' :
                          child.status === 'AGUARDANDO_VAGA' ? 'Aguardando Vaga' :
                          child.status === 'ATIVO' ? 'Ativo' :
                          child.status === 'ADAPTACAO' ? 'Em Adaptação' : 'Inativo'
    
    return rawMessage
      .replace(/{{nome_responsavel}}/g, guardianName)
      .replace(/{{nome_aluno}}/g, studentName)
      .replace(/{{status_aluno}}/g, studentStatus)
      .replace(/{{escola}}/g, 'Escola Mundo Mágico')
  }

  const triggerDirectLink = (child: Child) => {
    const guardian = child.guardians?.[0]?.guardian
    if (!guardian || !guardian.phone) {
      toast.error('Nenhum telefone de responsável cadastrado para esta criança.')
      return
    }
    const phone = guardian.phone.replace(/\D/g, '')
    const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`
    const text = getIndividualMessage(child, customMessage)
    const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  // Simulated queue & sending log data
  const simulatedLogs = [
    { id: '1', date: 'Hoje, 10:14', type: 'Rotina', child: 'Enzo Gabriel Santos Lima', parent: 'Vanessa Santos', phone: '(11) 98765-4321', status: 'delivered', method: 'Oficial Meta' },
    { id: '2', date: 'Hoje, 09:30', type: 'Entrada', child: 'Enzo Gabriel Santos Lima', parent: 'Vanessa Santos', phone: '(11) 98765-4321', status: 'delivered', method: 'Oficial Meta' },
    { id: '3', date: 'Ontem, 16:45', type: 'Rotina', child: 'Lucas Mendes', parent: 'Bruno Mendes', phone: '(11) 99123-4567', status: 'delivered', method: 'Oficial Meta' },
    { id: '4', date: 'Ontem, 14:22', type: 'Cobrança', child: 'Mariana Costa', parent: 'Aline Costa', phone: '(11) 98888-7777', status: 'failed', method: 'Oficial Meta', error: 'Token Expirado' },
    { id: '5', date: '15 Mai, 11:00', type: 'Comunicado', child: 'Todos os Alunos', parent: 'Múltiplos', phone: '32 contatos', status: 'delivered', method: 'Oficial Meta' }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground font-black text-sm uppercase tracking-widest">Carregando Central do WhatsApp...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border/50 p-6 md:p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 h-40 w-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-500/10">
              <Sparkles size={12} className="fill-emerald-500/20" /> WhatsApp Hub
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Central do <span className="text-emerald-500">WhatsApp</span></h1>
          <p className="text-muted-foreground font-medium text-sm">Gerencie disparos, logs de envios, notificações diárias e remarketing com os pais.</p>
        </div>

        {/* Connection Status widget */}
        <div className="flex items-center gap-4 bg-accent/40 border border-border/50 p-4 rounded-2xl shrink-0">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${isConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {isConnected ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Status da Integração</p>
            <p className="text-sm font-black text-foreground mt-0.5">{isConnected ? 'API Oficial Conectada' : 'Sem Credenciais Meta'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50 p-1 bg-accent/30 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'broadcast'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Send size={14} /> Disparo
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'logs'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <History size={14} /> Logs & Fila
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'config'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <SettingsIcon size={14} /> Ajustes
        </button>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'broadcast' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Editor Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-card p-6 md:p-8 rounded-[2rem] border border-border/50 shadow-sm space-y-6">
                <h3 className="text-lg font-black text-foreground">Disparador de Mensagens</h3>

                 {/* Filter Targets */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Público-alvo (Responsáveis)</label>
                  <select 
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full px-4 py-3.5 bg-accent/40 border border-border/50 rounded-2xl font-bold text-foreground outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">Todos os Responsáveis ({children.length})</option>
                    <option value="ATIVO">Responsáveis - Alunos Ativos ({children.filter(c => c.status === 'ATIVO').length})</option>
                    <option value="ADAPTACAO">Responsáveis - Em Adaptação ({children.filter(c => c.status === 'ADAPTACAO').length})</option>
                    <option value="AGUARDANDO_VAGA">Responsáveis - Aguardando Vaga ({children.filter(c => c.status === 'AGUARDANDO_VAGA').length})</option>
                    <option value="PENDENTE_PAGAMENTO">Responsáveis - Pendente de Pagamento ({children.filter(c => c.status === 'PENDENTE_PAGAMENTO').length})</option>
                    <option value="INATIVO">Responsáveis - Inativos/Cancelados ({children.filter(c => c.status === 'INATIVO' || c.status === 'CANCELADO').length})</option>
                  </select>
                </div>

                {/* Variables */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    <Hash size={14} className="text-emerald-500" />
                    Campos Dinâmicos (Substituição Automática)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variables.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => insertVariable(v.key)}
                        className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-xs font-black rounded-lg border border-emerald-500/10 hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Escreva sua Mensagem</label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={6}
                    className="w-full p-4 bg-accent/40 border border-border/50 rounded-2xl font-medium text-foreground outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    placeholder="Escreva a mensagem..."
                  />
                </div>

                {/* Broadcast Send Button */}
                {isConnected && (
                  <div className="pt-4 border-t border-border/50">
                    <button 
                      onClick={async () => {
                        setSendingBroadcast(true)
                        try {
                          const res = await fetch('/api/whatsapp/broadcast', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              targetStatus,
                              message: customMessage
                            })
                          })
                          if (res.ok) {
                            const data = await res.json()
                            toast.success(`Transmissão enviada: ${data.success}/${data.total} contatos.`)
                          } else {
                            toast.error('Erro ao disparar mensagens.')
                          }
                        } catch (err) {
                          toast.error('Erro de conexão com o servidor.')
                        } finally {
                          setSendingBroadcast(false)
                        }
                      }}
                      disabled={sendingBroadcast || targetChildren.length === 0}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 text-white rounded-2xl font-black text-base shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-50"
                    >
                      {sendingBroadcast ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Disparar Transmissão ({targetChildren.length} contatos)
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-muted-foreground mt-2 text-center">Enviar para todos os responsáveis do grupo filtrado usando o WhatsApp conectado.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview & Direct Action Column */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              {/* WhatsApp Smartphone Live Preview */}
              <div className="bg-card p-6 rounded-[2rem] border border-border/50 shadow-sm flex flex-col items-center">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Pré-visualização em Tempo Real</p>
                <div className="relative w-full max-w-[280px] h-[480px] bg-zinc-950 rounded-[2.5rem] border-[6px] border-zinc-800 shadow-2xl p-1.5 overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-zinc-800 rounded-b-2xl z-20" />
                  <div className="h-full w-full bg-[#E5DDD5] dark:bg-zinc-900 rounded-[2rem] overflow-hidden flex flex-col relative">
                    <div className="bg-[#075E54] dark:bg-zinc-800 p-3 pt-6 text-white flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-xs">M</div>
                      <div>
                        <div className="text-xs font-black leading-none">Mundo Mágico</div>
                        <div className="text-[9px] opacity-70">Online</div>
                      </div>
                    </div>
                    <div className="flex-1 p-3 space-y-4 overflow-y-auto custom-scrollbar">
                      <div className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 p-3 rounded-xl rounded-tl-none shadow-sm max-w-[90%] relative">
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">
                          {customMessage
                            .replace(/{{nome_responsavel}}/g, 'Vanessa')
                            .replace(/{{nome_aluno}}/g, 'Enzo Gabriel')
                            .replace(/{{status_aluno}}/g, 'Ativo')
                            .replace(/{{escola}}/g, 'Mundo Mágico')}
                        </p>
                        <div className="text-[9px] text-muted-foreground text-right mt-1">10:15 ✓✓</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Actions Links list (Free fallback!) */}
              <div className="bg-card p-6 rounded-[2rem] border border-border/50 shadow-sm space-y-4">
                <div>
                  <h4 className="text-sm font-black text-foreground">Disparo Direto Manual (Sem Custo)</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Clique para falar diretamente com cada pai pelo seu WhatsApp, já carregando a mensagem.</p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar responsável ou aluno..."
                    className="w-full pl-9 pr-4 py-2.5 bg-accent/40 border border-border/50 rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
                </div>

                <div className="max-h-[220px] overflow-y-auto divide-y divide-border/50 custom-scrollbar pr-1">
                  {targetChildren.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-6">Nenhum responsável encontrado para este filtro.</p>
                  ) : (
                    targetChildren.map((child) => {
                      const guardian = child.guardians?.[0]?.guardian
                      return (
                        <div key={child.id} className="py-2.5 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{guardian?.fullName ?? 'Responsável'}</p>
                            <p className="text-[10px] text-muted-foreground truncate">Pai/Mãe de: <span className="font-semibold text-foreground/80">{child.fullName}</span> • {guardian?.phone ?? '—'}</p>
                          </div>
                          <button
                            onClick={() => triggerDirectLink(child)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0"
                          >
                            <ExternalLink size={10} /> Enviar
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Real-time stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border/50 p-6 rounded-2xl flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <Activity size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fila de Disparos</p>
                  <p className="text-xl font-black text-foreground mt-0.5">0 pendentes</p>
                </div>
              </div>
              <div className="bg-card border border-border/50 p-6 rounded-2xl flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Check size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Enviadas com Sucesso</p>
                  <p className="text-xl font-black text-foreground mt-0.5">147 mensagens</p>
                </div>
              </div>
              <div className="bg-card border border-border/50 p-6 rounded-2xl flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Falhas de Envio</p>
                  <p className="text-xl font-black text-foreground mt-0.5">1 falha</p>
                </div>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-card rounded-[2rem] border border-border/50 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-border/50 bg-accent/10">
                <h4 className="text-sm font-black text-foreground uppercase tracking-widest">Histórico Recente de Notificações e Envios</h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Data / Horário</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tipo</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Aluno / Destinatário</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Telefone</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Método</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {simulatedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-accent/10">
                        <td className="px-6 py-4 text-xs font-bold text-foreground">{log.date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            log.type === 'Rotina' ? 'bg-amber-500/10 text-amber-500' :
                            log.type === 'Entrada' ? 'bg-emerald-500/10 text-emerald-500' :
                            log.type === 'Cobrança' ? 'bg-rose-500/10 text-rose-500' : 'bg-sky-500/10 text-sky-500'
                          }`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-foreground">{log.child}</p>
                          <p className="text-[10px] text-muted-foreground">{log.parent}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground font-medium">{log.phone}</td>
                        <td className="px-6 py-4 text-xs text-muted-foreground font-medium">{log.method}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            log.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {log.status === 'delivered' ? '✓✓ Enviado' : `❌ Falhou: ${log.error}`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'config' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="bg-card p-6 md:p-8 rounded-[2.5rem] border border-border/50 shadow-sm max-w-4xl mx-auto space-y-6"
          >
            <div>
              <h3 className="text-lg font-black text-foreground">Conexão do Aparelho (WhatsApp Baileys)</h3>
              <p className="text-xs text-muted-foreground mt-1">Conecte o WhatsApp da sua instituição para enviar comunicados, notificações de rotina e cobranças automaticamente.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              {/* Lado Esquerdo - Status */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw size={14} className={whatsappLoading ? "animate-spin text-emerald-500" : "text-muted-foreground"} />
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Status da Conexão</span>
                </div>

                <div className={`p-6 rounded-3xl border-2 text-left transition-all ${
                  whatsappStatus === 'connected' ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10' :
                  whatsappStatus === 'connecting' ? 'border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/10' :
                  'border-red-500 bg-red-500/5 shadow-lg shadow-red-500/10'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      whatsappStatus === 'connected' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                      whatsappStatus === 'connecting' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                      'bg-red-500/20 text-red-600 dark:text-red-400'
                    }`}>
                      {whatsappStatus === 'connected' && <CheckCircle2 size={24} />}
                      {whatsappStatus === 'connecting' && <RefreshCw size={24} className="animate-spin" />}
                      {whatsappStatus === 'disconnected' && <AlertCircle size={24} />}
                    </div>
                    
                    <div>
                      <p className={`font-black uppercase tracking-widest text-xs ${
                        whatsappStatus === 'connected' ? 'text-emerald-600 dark:text-emerald-400' :
                        whatsappStatus === 'connecting' ? 'text-amber-600 dark:text-amber-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {whatsappStatus === 'connected' ? 'Conectado' : whatsappStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
                      </p>
                      <p className="text-xs font-bold text-foreground mt-1 leading-relaxed">
                        {whatsappStatus === 'connected' ? 'O sistema está pronto para enviar mensagens gratuitamente.' :
                         whatsappStatus === 'connecting' ? 'Aguardando inicialização do WhatsApp...' :
                         'Leia o QR Code ao lado usando seu WhatsApp para estabelecer a conexão.'}
                      </p>
                    </div>
                  </div>
                </div>

                {whatsappStatus === 'connected' && (
                  <div className="p-5 bg-card border border-border rounded-3xl space-y-3">
                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                      Se você deseja trocar o aparelho conectado ou o número atual, clique no botão abaixo para deslogar a sessão atual.
                    </p>
                    <button 
                      onClick={async () => {
                        setWhatsappLoading(true)
                        try {
                          const res = await fetch('/api/whatsapp/logout', { method: 'POST' })
                          if (res.ok) {
                            toast.success('WhatsApp desconectado!')
                          } else {
                            toast.error('Erro ao desconectar')
                          }
                          await fetchWhatsappStatus()
                        } catch (err) {
                          toast.error('Erro de conexão')
                        } finally {
                          setWhatsappLoading(false)
                        }
                      }}
                      disabled={whatsappLoading}
                      className="flex items-center justify-center w-full gap-2 p-3 rounded-2xl bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 font-black uppercase tracking-widest text-[10px] transition-colors"
                    >
                      <LogOut size={14} />
                      Desconectar Aparelho
                    </button>
                  </div>
                )}
              </div>

              {/* Lado Direito - QR Code */}
              <div className="flex flex-col items-center justify-center bg-accent/20 border border-border p-6 rounded-3xl text-center min-h-[300px]">
                {whatsappStatus === 'connected' ? (
                  <div className="space-y-3 py-6">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={32} />
                    </div>
                    <h4 className="font-black text-sm text-foreground">Conectado com Sucesso!</h4>
                    <p className="text-[11px] text-muted-foreground font-medium max-w-[240px] mx-auto leading-relaxed">
                      Seu WhatsApp está autenticado e pronto para disparos.
                    </p>
                  </div>
                ) : whatsappQr ? (
                  <div className="space-y-4">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-border inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={whatsappQr} alt="WhatsApp QR Code" className="w-48 h-48 object-contain rounded-lg" />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed max-w-[240px] mx-auto">
                      Abra o WhatsApp no celular da escola, vá em <strong>Aparelhos conectados</strong> &gt; <strong>Conectar um aparelho</strong> e aponte para este código.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 text-muted-foreground opacity-50 grayscale py-10">
                    <QrCode size={48} className="mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Aguardando QR Code...</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
