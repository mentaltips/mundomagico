'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, History, Settings as SettingsIcon, 
  AlertTriangle, Loader2, Sparkles, CheckCircle2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'

import { WhatsAppMessagesPanel } from './WhatsAppMessagesPanel'
import { ConnectionWidget } from './_components/ConnectionWidget'
import { DirectActionList } from './_components/DirectActionList'
import { BroadcastPanel } from './_components/BroadcastPanel'

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

interface ConnectionStatus {
  status: 'connecting' | 'connected' | 'disconnected'
  qr: string | null
}

export default function WhatsAppDashboardPage() {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'logs' | 'config'>('broadcast')
  
  // Broadcast Panel State
  const [targetStatus, setTargetStatus] = useState<string>('ALL')
  const [customMessage, setCustomMessage] = useState('Olá {{nome_responsavel}}, tudo bem? Gostaríamos de falar sobre o(a) {{nome_aluno}}... 🏫✨')

  // React Query to poll the WhatsApp connection status
  const { data: connectionData } = useQuery<ConnectionStatus>({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const res = await fetch('/api/whatsapp/status')
      if (!res.ok) throw new Error('Falha ao obter status do WhatsApp')
      return res.json()
    },
    refetchInterval: 3000,
  })

  // React Query to fetch the children database
  const { data: children = [], isLoading: isLoadingChildren } = useQuery<Child[]>({
    queryKey: ['children'],
    queryFn: async () => {
      const res = await fetch('/api/children')
      if (!res.ok) throw new Error('Erro ao carregar crianças')
      return res.json()
    }
  })

  const whatsappStatus = connectionData?.status ?? 'disconnected'
  const isConnected = whatsappStatus === 'connected'

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

  if (isLoadingChildren) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground font-black text-sm uppercase tracking-widest animate-pulse">
          Carregando Central do WhatsApp...
        </p>
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
            key="broadcast"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Editor Column */}
            <div className="lg:col-span-7 space-y-6">
              <BroadcastPanel 
                items={children}
                isConnected={isConnected}
                targetStatus={targetStatus}
                setTargetStatus={setTargetStatus}
                customMessage={customMessage}
                setCustomMessage={setCustomMessage}
              />
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

              {/* Direct Actions List */}
              <DirectActionList 
                items={children}
                targetStatus={targetStatus}
                customMessage={customMessage}
                triggerDirectLink={triggerDirectLink}
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <WhatsAppMessagesPanel />
          </motion.div>
        )}

        {activeTab === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <ConnectionWidget />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
