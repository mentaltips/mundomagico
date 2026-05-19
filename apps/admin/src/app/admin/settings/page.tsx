'use client'

import { useState, useEffect } from 'react'
import NextImage from 'next/image'
import { Settings as SettingsIcon, Save, Loader2, Building2, MessageCircle, Mail, CreditCard, Download, ArrowRight, AlertCircle, QrCode, LogOut, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { PageHeader } from '@/components/ui'

type SchoolSettings = {
  id: string
  name: string
  cnpj: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  logoUrl: string | null
  institutionType: string
  whatsappToken: string | null
  whatsappPhone: string | null
  smtpHost: string | null
  smtpPort: number | null
  smtpUser: string | null
  smtpFrom: string | null
  mpPublicKey: string | null
  autoGenerateInvoices: boolean
  billingGenerationDay: number
  invoiceDescription: string
}

type Tab = 'institution' | 'whatsapp' | 'email' | 'payments' | 'export'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('institution')
  const [saving, setSaving]       = useState(false)
  const [exporting, setExporting] = useState(false)
  const [form, setForm]           = useState<Partial<SchoolSettings>>({})

  const [whatsappStatus, setWhatsappStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [whatsappQr, setWhatsappQr] = useState<string | null>(null)
  const [whatsappLoading, setWhatsappLoading] = useState(true)

  const fetchWhatsappStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status')
      if (res.ok) {
        const data = await res.json()
        setWhatsappStatus(data.status)
        setWhatsappQr(data.qr)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setWhatsappLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'whatsapp') {
      fetchWhatsappStatus()
      const interval = setInterval(() => {
        fetchWhatsappStatus()
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [activeTab])

  const { data: settings, isLoading } = useQuery<SchoolSettings>({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then((r) => r.json()),
  })

  const { data: pendingData } = useQuery<{ pending: any[] }>({
    queryKey: ['pending-config'],
    queryFn: () => fetch('/api/stats/pending-config').then((r) => r.json()),
    enabled: activeTab === 'payments'
  })

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Configurações salvas!')
      } else {
        toast.error('Erro ao salvar configurações')
      }
    } catch { toast.error('Erro ao salvar') }
    finally { setSaving(false) }
  }

  const handleExport = async (type: string, fmt: string) => {
    setExporting(true)
    try {
      const res = await fetch(`/api/reports/export?type=${type}&format=${fmt}`)
      if (fmt === 'csv') {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_export.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Exportação concluída!')
      } else {
        const json = await res.json()
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_export.json`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Exportação concluída!')
      }
    } catch { toast.error('Erro ao exportar') }
    finally { setExporting(false) }
  }

  const InputField = ({ fieldKey, label, type = 'text', placeholder = '' }: {
    fieldKey: keyof SchoolSettings
    label: string
    type?: string
    placeholder?: string
  }) => (
    <div className="space-y-1.5">
      <label className="label">{label}</label>
      <input
        type={type}
        value={(form[fieldKey] as string) ?? ''}
        onChange={(e) => setForm((p) => ({ ...p, [fieldKey]: e.target.value }))}
        placeholder={placeholder}
        className="input"
      />
    </div>
  )

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'institution', label: 'Instituição',  icon: <Building2 size={16} /> },
    { key: 'whatsapp',    label: 'WhatsApp',     icon: <MessageCircle size={16} /> },
    { key: 'email',       label: 'E-mail SMTP',  icon: <Mail size={16} /> },
    { key: 'payments',    label: 'Pagamentos',   icon: <CreditCard size={16} /> },
    { key: 'export',      label: 'Exportações',  icon: <Download size={16} /> },
  ]

  return (
    <div className="page animate-in">
      <PageHeader 
        title="Configurações" 
        subtitle="Ajustes globais, integrações e exportação de dados da escola."
        icon={<SettingsIcon size={24} />}
        actions={
          activeTab !== 'export' && activeTab !== 'whatsapp' && (
            <button
              onClick={handleSave}
              disabled={saving || isLoading}
              className="btn-primary"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Salvar Alterações
            </button>
          )
        }
      />

      {/* Institution Type Alert */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-[2rem] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/20 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <h4 className="font-black text-amber-900 text-sm uppercase tracking-widest">Tipo de Instituição</h4>
            <p className="text-xs text-amber-700/80 font-medium">Adapte toda a terminologia do sistema (Alunos vs Crianças, etc.)</p>
          </div>
        </div>
        <Link
          href="/admin/settings/institution-type"
          className="btn-ghost bg-white/50 border-amber-200 text-amber-900 px-6 py-2.5 rounded-xl text-xs flex items-center gap-2"
        >
          Configurar Agora <ArrowRight size={14} />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-card text-muted-foreground border border-border hover:border-primary/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 bg-card rounded-[2.5rem] border border-border">
          <Loader2 className="text-primary animate-spin" size={32} />
        </div>
      ) : (
        <div className="bg-card rounded-[2.5rem] border border-border shadow-sm p-8 md:p-10">
          {activeTab === 'institution' && (
            <div className="space-y-8 max-w-3xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">Dados da Instituição</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Informações cadastrais e contato</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <InputField fieldKey="name" label="Nome da Instituição *" placeholder="Ex: Creche Mundo Mágico" />
                </div>
                <InputField fieldKey="cnpj" label="CNPJ" placeholder="00.000.000/0001-00" />
                <InputField fieldKey="phone" label="Telefone" type="tel" placeholder="(11) 3000-0000" />
                <div className="md:col-span-2">
                  <InputField fieldKey="email" label="E-mail Principal" type="email" placeholder="contato@escola.com.br" />
                </div>
                <div className="md:col-span-2">
                  <InputField fieldKey="address" label="Endereço Completo" placeholder="Rua das Flores, 123" />
                </div>
                <InputField fieldKey="city" label="Cidade" placeholder="São Paulo" />
                <div className="grid grid-cols-2 gap-4">
                  <InputField fieldKey="state" label="Estado" placeholder="SP" />
                  <InputField fieldKey="zipCode" label="CEP" placeholder="00000-000" />
                </div>
                <div className="md:col-span-2">
                  <InputField fieldKey="logoUrl" label="URL do Logotipo" type="url" placeholder="https://..." />
                  {form.logoUrl && (
                    <div className="mt-4 p-4 rounded-2xl bg-accent/20 border border-border inline-block">
                      <NextImage
                        src={form.logoUrl}
                        alt="Logo preview"
                        width={160}
                        height={48}
                        unoptimized
                        className="h-12 w-auto object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">Conexão do WhatsApp (Baileys)</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Notificações gratuitas e ilimitadas</p>
                </div>
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
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-8 max-w-3xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">E-mail SMTP</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Configuração de disparo de e-mails</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-1">
                  <InputField fieldKey="smtpHost" label="Host SMTP" placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="label">Porta</label>
                  <input
                    type="number"
                    value={form.smtpPort ?? 587}
                    onChange={(e) => setForm((p) => ({ ...p, smtpPort: Number(e.target.value) }))}
                    className="input"
                  />
                </div>
                <div className="md:col-span-2">
                  <InputField fieldKey="smtpUser" label="Usuário / E-mail Autenticação" type="email" placeholder="conta@gmail.com" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="label">Senha / App Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    onChange={(e) => setForm((p) => ({ ...p, smtpPass: e.target.value } as Partial<SchoolSettings>))}
                    className="input"
                  />
                </div>
                <div className="md:col-span-2">
                  <InputField fieldKey="smtpFrom" label="E-mail de Remetente (From)" type="email" placeholder="noreply@escola.com.br" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-8 max-w-3xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">Gateway de Pagamentos</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Integração com Mercado Pago</p>
                </div>
              </div>

              <div className="space-y-6">
                <InputField fieldKey="mpPublicKey" label="Public Key" placeholder="APP_USR-..." />
                <div className="space-y-1.5">
                  <label className="label">Access Token</label>
                  <input
                    type="password"
                    placeholder="APP_USR-..."
                    onChange={(e) => setForm((p) => ({ ...p, mpAccessToken: e.target.value } as Partial<SchoolSettings>))}
                    className="input"
                  />
                </div>
                <div className="bg-blue-500/10 rounded-2xl p-5 border border-blue-500/20">
                  <p className="text-xs text-blue-800 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    Webhook URL para notificações:
                  </p>
                  <code className="block mt-2 text-[11px] font-black text-blue-900 bg-white/50 p-2 rounded-lg border border-blue-200">
                    /api/webhooks/mercadopago
                  </code>
                </div>

                <div className="pt-8 border-t border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-foreground">Automação de Mensalidades</h4>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Geração automática de faturas recorrentes</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 rounded-3xl bg-accent/20 border border-border">
                      <div>
                        <h4 className="font-black text-sm text-foreground">Ativar Geração Automática</h4>
                        <p className="text-xs text-muted-foreground">O sistema criará as faturas mensalmente para alunos ativos</p>
                      </div>
                      <button
                        onClick={() => setForm(p => ({ ...p, autoGenerateInvoices: !p.autoGenerateInvoices }))}
                        className={`w-12 h-6 rounded-full transition-colors relative ${form.autoGenerateInvoices ? 'bg-primary' : 'bg-muted'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.autoGenerateInvoices ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    {form.autoGenerateInvoices && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-1.5">
                          <label className="label">Dia de Geração</label>
                          <input
                            type="number"
                            min="1"
                            max="28"
                            value={form.billingGenerationDay ?? 25}
                            onChange={(e) => setForm(p => ({ ...p, billingGenerationDay: parseInt(e.target.value) }))}
                            className="input"
                            placeholder="Ex: 25"
                          />
                          <p className="text-[10px] text-muted-foreground">Dia do mês em que o sistema criará as faturas</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="label">Descrição Padrão</label>
                          <input
                            type="text"
                            value={form.invoiceDescription ?? ''}
                            onChange={(e) => setForm(p => ({ ...p, invoiceDescription: e.target.value }))}
                            className="input"
                            placeholder="Ex: Mensalidade {month}/{year}"
                          />
                          <p className="text-[10px] text-muted-foreground">Use {'{month}'} e {'{year}'} para preenchimento dinâmico</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {pendingData?.pending && pendingData.pending.length > 0 && (
                  <div className="pt-8 border-t border-border animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center">
                        <AlertCircle size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-foreground">Atenção: Alunos sem Mensalidade</h4>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Estes alunos não terão faturas geradas automaticamente</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {pendingData.pending.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-foreground">{p.name}</span>
                            <span className="text-[10px] font-bold text-rose-500/60 uppercase tracking-widest">{p.type}</span>
                          </div>
                          <Link 
                            href={p.type === 'Criança' ? `/admin/children` : `/admin/children`} 
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                          >
                            <ArrowRight size={16} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Download size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">Backup & Exportação</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Baixe seus dados para segurança ou auditoria</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { type: 'children',   label: 'Alunos',    desc: 'Cadastros, turmas e saúde' },
                  { type: 'finance',    label: 'Financeiro', desc: 'Histórico de mensalidades' },
                  { type: 'attendance', label: 'Frequência', desc: 'Registros de entrada/saída' },
                ].map(({ type, label, desc }) => (
                  <div key={type} className="p-6 rounded-3xl border border-border bg-accent/20 hover:bg-accent/40 transition-colors flex flex-col group">
                    <h4 className="font-black text-foreground mb-1">{label}</h4>
                    <p className="text-[10px] text-muted-foreground font-medium mb-6 flex-1 uppercase tracking-widest">{desc}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExport(type, 'csv')}
                        disabled={exporting}
                        className="flex-1 btn-ghost py-2 rounded-xl text-[10px] gap-1.5"
                      >
                        {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                        CSV
                      </button>
                      <button
                        onClick={() => handleExport(type, 'json')}
                        disabled={exporting}
                        className="flex-1 btn-primary py-2 rounded-xl text-[10px] gap-1.5"
                      >
                        {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                        JSON
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
