'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Hash, Send, Loader2 } from 'lucide-react'
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

interface BroadcastPanelProps {
  items: Child[]
  isConnected: boolean
  targetStatus: string
  setTargetStatus: (status: string) => void
  customMessage: string
  setCustomMessage: React.Dispatch<React.SetStateAction<string>>
}

export function BroadcastPanel({
  items,
  isConnected,
  targetStatus,
  setTargetStatus,
  customMessage,
  setCustomMessage
}: BroadcastPanelProps) {
  // Predefined variables for the editor
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
  }, [targetStatus, setCustomMessage])

  // Count target children in this filter
  const targetCount = items.filter((child) => {
    return targetStatus === 'ALL' || child.status === targetStatus
  }).length

  // React Query mutation to trigger a broadcast enqueing
  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/whatsapp/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetStatus,
          message: customMessage
        })
      })
      if (!res.ok) throw new Error('Falha ao enviar transmissão')
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(`Transmissão enfileirada: ${data.queued}/${data.total} contatos.`)
    },
    onError: () => {
      toast.error('Erro ao disparar mensagens.')
    }
  })

  return (
    <div className="bg-card p-6 md:p-8 rounded-[2.5rem] border border-border/50 shadow-sm space-y-6">
      <h3 className="text-lg font-black text-foreground">Disparador de Mensagens</h3>

      {/* Filter Targets */}
      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
          Público-alvo (Responsáveis)
        </label>
        <select 
          value={targetStatus}
          onChange={(e) => setTargetStatus(e.target.value)}
          className="w-full px-4 py-3.5 bg-accent/40 border border-border/50 rounded-2xl font-bold text-foreground outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ALL">Todos os Responsáveis ({items.length})</option>
          <option value="ATIVO">Responsáveis - Alunos Ativos ({items.filter(c => c.status === 'ATIVO').length})</option>
          <option value="ADAPTACAO">Responsáveis - Em Adaptação ({items.filter(c => c.status === 'ADAPTACAO').length})</option>
          <option value="AGUARDANDO_VAGA">Responsáveis - Aguardando Vaga ({items.filter(c => c.status === 'AGUARDANDO_VAGA').length})</option>
          <option value="PENDENTE_PAGAMENTO">Responsáveis - Pendente de Pagamento ({items.filter(c => c.status === 'PENDENTE_PAGAMENTO').length})</option>
          <option value="INATIVO">Responsáveis - Inativos/Cancelados ({items.filter(c => c.status === 'INATIVO' || c.status === 'CANCELADO').length})</option>
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
        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
          Escreva sua Mensagem
        </label>
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
            onClick={() => broadcastMutation.mutate()}
            disabled={broadcastMutation.isPending || targetCount === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 text-white rounded-2xl font-black text-base shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-50"
          >
            {broadcastMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Enviando...
              </>
            ) : (
              <>
                <Send size={18} />
                Disparar Transmissão ({targetCount} contatos)
              </>
            )}
          </button>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Enviar para todos os responsáveis do grupo filtrado usando o WhatsApp conectado.
          </p>
        </div>
      )}
    </div>
  )
}
