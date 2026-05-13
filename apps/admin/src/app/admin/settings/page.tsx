'use client'

import { useState, useEffect } from 'react'
import { Settings, Save, Loader2, Building2, MessageCircle, Mail, CreditCard, Download } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Link from 'next/link'

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
}

type Tab = 'institution' | 'whatsapp' | 'email' | 'payments' | 'export'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('institution')
  const [saving, setSaving]       = useState(false)
  const [exporting, setExporting] = useState(false)
  const [form, setForm]           = useState<Partial<SchoolSettings>>({})

  const { data: settings, isLoading } = useQuery<SchoolSettings>({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then((r) => r.json()),
  })

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
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
    <div>
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{label}</label>
      <input
        type={type}
        value={(form[fieldKey] as string) ?? ''}
        onChange={(e) => setForm((p) => ({ ...p, [fieldKey]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
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
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Settings className="text-primary" size={28} />
            Configurações
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie as configurações da sua instituição</p>
        </div>
        {activeTab !== 'export' && (
          <button
            onClick={handleSave}
            disabled={saving || isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black shadow-lg shadow-lime-100 hover:bg-lime-600 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Salvar
          </button>
        )}
      </div>

      {/* Atalho: tipo de instituição */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-black text-amber-900 text-sm">Tipo de Instituição</p>
          <p className="text-xs text-amber-700">Altere o tipo para adaptar toda a terminologia do sistema</p>
        </div>
        <Link
          href="/admin/settings/institution-type"
          className="px-4 py-2 bg-amber-100 text-amber-800 rounded-xl font-black text-sm hover:bg-amber-200 transition-colors shrink-0"
        >
          Configurar →
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="text-primary animate-spin" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          {activeTab === 'institution' && (
            <div className="space-y-5">
              <h2 className="font-black text-gray-900 text-lg mb-6">Dados da Instituição</h2>
              <InputField fieldKey="name" label="Nome da Instituição *" placeholder="Ex: Creche Mundo Mágico" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField fieldKey="cnpj" label="CNPJ" placeholder="00.000.000/0001-00" />
                <InputField fieldKey="phone" label="Telefone" type="tel" placeholder="(11) 3000-0000" />
              </div>
              <InputField fieldKey="email" label="E-mail" type="email" placeholder="contato@escola.com.br" />
              <InputField fieldKey="address" label="Endereço" placeholder="Rua das Flores, 123" />
              <div className="grid grid-cols-3 gap-4">
                <InputField fieldKey="city" label="Cidade" placeholder="São Paulo" />
                <InputField fieldKey="state" label="Estado" placeholder="SP" />
                <InputField fieldKey="zipCode" label="CEP" placeholder="00000-000" />
              </div>
              <InputField fieldKey="logoUrl" label="URL do Logotipo" type="url" placeholder="https://..." />
              {form.logoUrl && (
                <img
                  src={form.logoUrl}
                  alt="Logo preview"
                  className="h-16 w-auto rounded-xl object-contain bg-gray-50 p-2 border border-gray-100"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-5">
              <h2 className="font-black text-gray-900 text-lg mb-2">Integração WhatsApp</h2>
              <p className="text-sm text-gray-500 mb-6">Configure o token da API do WhatsApp Business para envio de mensagens automáticas aos responsáveis.</p>
              <InputField fieldKey="whatsappPhone" label="Número WhatsApp Business" type="tel" placeholder="+55 11 90000-0000" />
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Token de Acesso</label>
                <input
                  type="password"
                  defaultValue={form.whatsappToken ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, whatsappToken: e.target.value }))}
                  placeholder="EAAxxxx..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                />
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-5">
              <h2 className="font-black text-gray-900 text-lg mb-2">Configurações de E-mail SMTP</h2>
              <p className="text-sm text-gray-500 mb-6">Configure o servidor SMTP para envio de notificações e relatórios por e-mail.</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <InputField fieldKey="smtpHost" label="Host SMTP" placeholder="smtp.gmail.com" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Porta</label>
                  <input
                    type="number"
                    value={form.smtpPort ?? 587}
                    onChange={(e) => setForm((p) => ({ ...p, smtpPort: Number(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                  />
                </div>
              </div>
              <InputField fieldKey="smtpUser" label="Usuário SMTP" type="email" placeholder="conta@gmail.com" />
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Senha / App Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  onChange={(e) => setForm((p) => ({ ...p, smtpPass: e.target.value } as Partial<SchoolSettings>))}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                />
              </div>
              <InputField fieldKey="smtpFrom" label="E-mail remetente" type="email" placeholder="noreply@escola.com.br" />
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-5">
              <h2 className="font-black text-gray-900 text-lg mb-2">Mercado Pago</h2>
              <p className="text-sm text-gray-500 mb-6">Configure as credenciais do Mercado Pago para cobrança online via PIX, boleto e cartão.</p>
              <InputField fieldKey="mpPublicKey" label="Public Key" placeholder="APP_USR-..." />
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Access Token</label>
                <input
                  type="password"
                  placeholder="APP_USR-..."
                  onChange={(e) => setForm((p) => ({ ...p, mpAccessToken: e.target.value } as Partial<SchoolSettings>))}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-200"
                />
              </div>
              <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-800 font-medium">
                💡 Configure o webhook do Mercado Pago para:{' '}
                <code className="font-black text-blue-900">/api/webhooks/mercadopago</code>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              <h2 className="font-black text-gray-900 text-lg mb-2">Exportação de Dados</h2>
              <p className="text-sm text-gray-500 mb-6">Exporte dados em CSV ou JSON para análise externa.</p>
              <div className="space-y-4">
                {[
                  { type: 'children',   label: 'Crianças cadastradas',    desc: 'Nome, turma, turno, responsáveis e saúde' },
                  { type: 'finance',    label: 'Faturas e pagamentos',     desc: 'Histórico financeiro do período' },
                  { type: 'attendance', label: 'Frequência do mês atual',  desc: 'Registros de entrada e saída' },
                ].map(({ type, label, desc }) => (
                  <div key={type} className="flex items-center justify-between bg-gray-50 rounded-2xl p-5">
                    <div>
                      <p className="font-black text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleExport(type, 'csv')}
                        disabled={exporting}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-black text-xs hover:bg-gray-50 transition-all disabled:opacity-50"
                      >
                        {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        CSV
                      </button>
                      <button
                        onClick={() => handleExport(type, 'json')}
                        disabled={exporting}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl font-black text-xs hover:bg-lime-600 transition-all disabled:opacity-50"
                      >
                        {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
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
