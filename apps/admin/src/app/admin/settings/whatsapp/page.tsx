'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle2, QrCode, LogOut, RefreshCw, Smartphone } from 'lucide-react'
import { PageHeader } from '@/components/ui'
import toast from 'react-hot-toast'

export default function WhatsAppSettingsPage() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status')
      if (res.ok) {
        const data = await res.json()
        setStatus(data.status)
        setQrCode(data.qr)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Poll for updates every 3 seconds Se não estiver conectado
  useEffect(() => {
    fetchStatus()
    const interval = setInterval(() => {
      fetchStatus()
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/logout', { method: 'POST' })
      if (res.ok) {
        toast.success('WhatsApp desconectado com sucesso!')
      } else {
        toast.error('Erro ao desconectar WhatsApp')
      }
      await fetchStatus()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao desconectar WhatsApp')
    }
    setLoading(false)
  }

  return (
    <div className="page animate-in">
      <PageHeader 
        title="WhatsApp (Baileys)" 
        subtitle="Conecte o celular da escola para enviar notificações automáticas gratuitamente."
        icon={<Smartphone size={24} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        {/* Lado Esquerdo - Status */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-accent text-foreground rounded-xl flex items-center justify-center">
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </div>
            <h3 className="font-black text-foreground text-sm uppercase tracking-widest">Status da Conexão</h3>
          </div>

          <div className="bg-card rounded-[2.5rem] border border-border p-6 sm:p-8 space-y-6 shadow-sm">
            <div className={`p-5 rounded-[2rem] border-2 text-left transition-all ${
              status === 'connected' ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10' :
              status === 'connecting' ? 'border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/10' :
              'border-red-500 bg-red-500/5 shadow-lg shadow-red-500/10'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  status === 'connected' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                  status === 'connecting' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                  'bg-red-500/20 text-red-600 dark:text-red-400'
                }`}>
                  {status === 'connected' && <CheckCircle2 size={24} />}
                  {status === 'connecting' && <RefreshCw size={24} className="animate-spin" />}
                  {status === 'disconnected' && <AlertCircle size={24} />}
                </div>
                
                <div>
                  <p className={`font-black uppercase tracking-widest text-xs ${
                    status === 'connected' ? 'text-emerald-600 dark:text-emerald-400' :
                    status === 'connecting' ? 'text-amber-600 dark:text-amber-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {status === 'connected' ? 'Conectado' : status === 'connecting' ? 'Conectando...' : 'Desconectado'}
                  </p>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {status === 'connected' ? 'O sistema está pronto para enviar mensagens.' :
                     status === 'connecting' ? 'Aguardando inicialização do WhatsApp...' :
                     'Leia o QR Code ao lado para conectar.'}
                  </p>
                </div>
              </div>
            </div>

            {status === 'connected' && (
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-4">
                  Se você precisa conectar outro número ou o celular atual não está enviando mensagens, você pode forçar a desconexão abaixo.
                </p>
                <button 
                  onClick={handleLogout} 
                  disabled={loading}
                  className="flex items-center justify-center w-full gap-2 p-4 rounded-2xl bg-red-500/10 text-red-600 hover:bg-red-500/20 font-black uppercase tracking-widest text-xs transition-colors"
                >
                  <LogOut size={16} />
                  Desconectar Aparelho
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito - QR Code */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-accent text-foreground rounded-xl flex items-center justify-center">
              <QrCode size={18} />
            </div>
            <h3 className="font-black text-foreground text-sm uppercase tracking-widest">Aparelho</h3>
          </div>

          <div className="bg-card rounded-[2.5rem] border border-border p-6 sm:p-8 flex flex-col items-center justify-center min-h-[350px] shadow-sm text-center">
            {status === 'connected' ? (
              <div className="space-y-4 max-w-sm">
                <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h4 className="font-black text-lg">Tudo Certo!</h4>
                <p className="text-sm text-muted-foreground font-medium">
                  Seu WhatsApp está conectado e o sistema Mundo Mágico já pode enviar notificações aos pais automaticamente.
                </p>
              </div>
            ) : qrCode ? (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-border inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 object-contain rounded-xl" />
                </div>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[280px] mx-auto">
                  Abra o WhatsApp no celular da escola, vá em <strong>Aparelhos conectados</strong> {'>'} <strong>Conectar um aparelho</strong> e aponte a câmera para este código.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-muted-foreground opacity-50 grayscale">
                <QrCode size={64} className="mx-auto" />
                <p className="text-sm font-bold uppercase tracking-widest">Aguardando QR Code...</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
