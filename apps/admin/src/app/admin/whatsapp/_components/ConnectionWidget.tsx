'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  CheckCircle2, RefreshCw, AlertCircle, LogOut, QrCode 
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ConnectionStatus {
  status: 'connecting' | 'connected' | 'disconnected'
  qr: string | null
}

export function ConnectionWidget() {
  const queryClient = useQueryClient()

  // React Query to poll the WhatsApp connection status
  const { data, isLoading } = useQuery<ConnectionStatus>({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const res = await fetch('/api/whatsapp/status')
      if (!res.ok) throw new Error('Falha ao obter status do WhatsApp')
      return res.json()
    },
    refetchInterval: 3000, // Poll every 3 seconds for active QR/auth status updates
  })

  // Mutation to disconnect/logout the WhatsApp device
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/whatsapp/logout', { method: 'POST' })
      if (!res.ok) throw new Error('Erro ao desconectar WhatsApp')
      return res.json()
    },
    onSuccess: () => {
      toast.success('WhatsApp desconectado!')
      queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao desconectar')
    }
  })

  const whatsappStatus = data?.status ?? 'disconnected'
  const whatsappQr = data?.qr ?? null
  const isConnected = whatsappStatus === 'connected'

  return (
    <div className="bg-card p-6 md:p-8 rounded-[2.5rem] border border-border/50 shadow-sm max-w-4xl mx-auto space-y-6">
      <div>
        <h3 className="text-lg font-black text-foreground">Conexão do Aparelho (WhatsApp Baileys)</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Conecte o WhatsApp da sua instituição para enviar comunicados, notificações de rotina e cobranças automaticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        {/* Connection Status Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw size={14} className={isLoading ? "animate-spin text-emerald-500" : "text-muted-foreground"} />
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

          {isConnected && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-card border border-border rounded-3xl space-y-3"
            >
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                Se você deseja trocar o aparelho conectado ou o número atual, clique no botão abaixo para deslogar a sessão atual.
              </p>
              <button 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="flex items-center justify-center w-full gap-2 p-3 rounded-2xl bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 font-black uppercase tracking-widest text-[10px] transition-colors disabled:opacity-50"
              >
                <LogOut size={14} />
                Desconectar Aparelho
              </button>
            </motion.div>
          )}
        </div>

        {/* QR Code Column */}
        <div className="flex flex-col items-center justify-center bg-accent/20 border border-border p-6 rounded-3xl text-center min-h-[300px]">
          {whatsappStatus === 'connected' ? (
            <div className="space-y-3 py-6">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
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
              <QrCode size={48} className="mx-auto animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-widest">Aguardando QR Code...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
