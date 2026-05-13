'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, Barcode, QrCode, CheckCircle2, Clock,
  AlertCircle, X, Copy, ExternalLink, ChevronRight,
  DollarSign, Loader2, Check
} from 'lucide-react'
import toast from 'react-hot-toast'

type Invoice = {
  id: string
  description: string
  amount: number
  dueDate: string
  status: 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO'
  referenceMonth?: string
  boletoUrl?: string
  boletoBarcode?: string
  pixQrCode?: string
  pixCopyPaste?: string
  checkoutUrl?: string
  paidAt?: string
  child?: { fullName: string }
  student?: { fullName: string }
}

type PaymentResult = {
  method: string
  boletoUrl?: string
  barcode?: string
  qrCodeBase64?: string
  copyPaste?: string
  checkoutUrl?: string
  status: string
}

const STATUS_CONFIG = {
  PENDENTE: { label: 'Pendente', class: 'badge-amber', icon: Clock },
  PAGO: { label: 'Pago ✓', class: 'badge-green', icon: CheckCircle2 },
  VENCIDO: { label: 'Vencido', class: 'badge-red', icon: AlertCircle },
  CANCELADO: { label: 'Cancelado', class: 'badge-gray', icon: X },
}

function PaymentsContent() {
  const searchParams = useSearchParams()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [paying, setPaying] = useState<string | null>(null) // 'BOLETO' | 'PIX' | 'CARTAO'
  const [payerCpf, setPayerCpf] = useState('')
  const [showPayModal, setShowPayModal] = useState(false)

  // Feedback de retorno do Checkout Pro
  const statusParam = searchParams.get('status')
  const invoiceParam = searchParams.get('invoice')

  useEffect(() => {
    if (statusParam === 'success') toast.success('Pagamento aprovado! 🎉')
    else if (statusParam === 'pending') toast('Pagamento em análise. Aguarde a confirmação.', { icon: '⏳' })
    else if (statusParam === 'failure') toast.error('Pagamento não aprovado. Tente novamente.')
  }, [statusParam])

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/finance/invoices')
      if (res.ok) {
        const data = await res.json()
        setInvoices(data)
      }
    } catch { console.error('Erro ao buscar faturas') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const handlePay = async (method: 'BOLETO' | 'PIX' | 'CARTAO') => {
    if (!selectedInvoice) return
    if ((method === 'BOLETO' || method === 'PIX') && !payerCpf.replace(/\D/g, '')) {
      toast.error('Informe seu CPF para gerar ' + (method === 'BOLETO' ? 'o boleto' : 'o PIX'))
      return
    }
    setPaying(method)
    try {
      const res = await fetch(`/api/finance/invoices/${selectedInvoice.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, payerCpf }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Erro ao processar pagamento'); return }

      setPaymentResult(data)

      // Cartão → redirecionar
      if (method === 'CARTAO' && data.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank')
      }
      if (method === 'BOLETO') toast.success('Boleto gerado! Clique para imprimir.')
      if (method === 'PIX') toast.success('PIX gerado! Escaneie o QR Code.')

      fetchInvoices()
    } catch { toast.error('Erro ao processar pagamento') }
    finally { setPaying(null) }
  }

  const openPayModal = (inv: Invoice) => {
    setSelectedInvoice(inv)
    setPaymentResult(null)
    setPayerCpf('')
    setShowPayModal(true)
  }

  const pending = invoices.filter(i => i.status === 'PENDENTE' || i.status === 'VENCIDO')
  const paid = invoices.filter(i => i.status === 'PAGO')

  return (
    <div className="max-w-lg mx-auto pb-28 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <DollarSign className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Financeiro</h1>
          <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Mensalidades e faturas</p>
        </div>
      </div>

      {/* Resumo rápido */}
      {!loading && pending.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-5">
          <div className="flex items-center gap-3 mb-1">
            <AlertCircle className="text-amber-500 shrink-0" size={18} />
            <p className="font-black text-amber-500 text-sm uppercase tracking-tight">
              {pending.length} fatura{pending.length > 1 ? 's' : ''} pendente{pending.length > 1 ? 's' : ''}
            </p>
          </div>
          <p className="text-xs text-amber-500/80 font-black ml-7 uppercase tracking-widest">
            Total: {formatBRL(pending.reduce((s, i) => s + i.amount, 0))}
          </p>
        </div>
      )}

      {/* Listagem de Faturas */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-24 animate-pulse rounded-3xl bg-card border border-border" />)}
        </div>
      ) : pending.length === 0 && paid.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-primary/20 mx-auto mb-3" />
          <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Nenhuma fatura em aberto.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 px-1">Faturas em Aberto</h2>
              <div className="space-y-4">
                {pending.map(inv => {
                  const cfg = STATUS_CONFIG[inv.status]
                  const Icon = cfg.icon
                  const name = inv.child?.fullName || inv.student?.fullName
                  return (
                    <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="card p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          {name && <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">{name}</p>}
                          <h3 className="font-black text-foreground text-base leading-tight">{inv.description}</h3>
                          <p className="text-xs text-muted-foreground font-medium mt-1">
                            Vence em {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="font-black text-xl text-foreground">{formatBRL(inv.amount)}</p>
                          <div className={`mt-2 ${cfg.class}`}>
                            <Icon size={10} className="mr-1" />
                            {cfg.label}
                          </div>
                        </div>
                      </div>

                      {(inv.boletoUrl || inv.pixCopyPaste) ? (
                        <div className="flex gap-2 mt-2">
                          {inv.boletoUrl && (
                            <a href={inv.boletoUrl} target="_blank" rel="noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary/10 text-primary rounded-2xl font-black text-xs hover:bg-primary hover:text-primary-foreground transition-all">
                              <Barcode size={14} />
                              Ver Boleto
                            </a>
                          )}
                          {inv.pixCopyPaste && (
                            <button onClick={() => { navigator.clipboard.writeText(inv.pixCopyPaste!); toast.success('PIX copiado!') }}
                              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-500/10 text-emerald-500 rounded-2xl font-black text-xs hover:bg-emerald-500 hover:text-white transition-all">
                              <Copy size={14} />
                              Copiar PIX
                            </button>
                          )}
                          <button onClick={() => openPayModal(inv)}
                            className="px-4 py-3.5 bg-muted text-muted-foreground rounded-2xl hover:bg-accent hover:text-foreground transition-all">
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => openPayModal(inv)}
                          className="w-full py-4 bg-foreground text-background rounded-2xl font-black text-sm hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2">
                          <CreditCard size={16} />
                          Escolher forma de pagamento
                        </button>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </section>
          )}

          {paid.length > 0 && (
            <section>
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 px-1">Faturas Pagas</h2>
              <div className="space-y-3">
                {paid.map(inv => (
                  <div key={inv.id} className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-foreground text-sm truncate">{inv.description}</p>
                      <p className="text-xs text-muted-foreground font-medium">Pago em {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('pt-BR') : '—'}</p>
                    </div>
                    <p className="font-black text-emerald-500 shrink-0">{formatBRL(inv.amount)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Modal de Pagamento ── */}
      <AnimatePresence>
        {showPayModal && selectedInvoice && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowPayModal(false); setPaymentResult(null) }}
              className="modal-backdrop" />
            <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
              className="bg-card w-full rounded-t-[2.5rem] shadow-2xl relative z-[101] p-7 max-h-[92vh] overflow-y-auto border-t border-border">
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8" />
 
              {/* Título */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Pagamento Online</p>
                  <h2 className="text-2xl font-black text-foreground leading-tight">{selectedInvoice.description}</h2>
                  <p className="text-3xl font-black text-primary mt-2">{formatBRL(selectedInvoice.amount)}</p>
                </div>
                <button onClick={() => { setShowPayModal(false); setPaymentResult(null) }} className="p-2.5 text-muted-foreground hover:bg-accent rounded-xl transition-all"><X size={24} /></button>
              </div>

              {/* Resultado: Boleto */}
              {paymentResult?.method === 'BOLETO' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mb-6">
                  <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Boleto Bancário Gerado</p>
                    {paymentResult.barcode && (
                      <div className="bg-background rounded-2xl p-4 mb-4 border border-border">
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-2">Linha digitável:</p>
                        <p className="text-xs font-mono text-foreground break-all leading-relaxed">{paymentResult.barcode}</p>
                        <button onClick={() => { navigator.clipboard.writeText(paymentResult.barcode!); toast.success('Código copiado!') }}
                          className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest">
                          <Copy size={12} /> Copiar código
                        </button>
                      </div>
                    )}
                    {paymentResult.boletoUrl && (
                      <a href={paymentResult.boletoUrl} target="_blank" rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-4.5 bg-primary text-primary-foreground rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:brightness-110 transition-all">
                        <ExternalLink size={18} />
                        Abrir e Imprimir Boleto
                      </a>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Resultado: PIX */}
              {paymentResult?.method === 'PIX' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mb-6">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6 text-center">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6">Pagamento via PIX</p>
                    {paymentResult.qrCodeBase64 && (
                      <div className="bg-white p-4 rounded-3xl inline-block shadow-xl mb-6">
                        <img
                          src={`data:image/png;base64,${paymentResult.qrCodeBase64}`}
                          alt="QR Code PIX"
                          className="w-48 h-48 mx-auto"
                        />
                      </div>
                    )}
                    {paymentResult.copyPaste && (
                      <button onClick={() => { navigator.clipboard.writeText(paymentResult.copyPaste!); toast.success('PIX copiado!') }}
                        className="w-full flex items-center justify-center gap-2 py-4.5 bg-emerald-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/20 hover:brightness-110 transition-all">
                        <Copy size={18} />
                        Copiar Código PIX
                      </button>
                    )}
                    <p className="text-[10px] text-emerald-500/70 font-black uppercase tracking-widest mt-6">
                      A confirmação é instantânea após o pagamento.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Formulário de escolha */}
              {!paymentResult && (
                <>
                  {/* CPF */}
                  <div className="mb-8">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-3 ml-1">CPF do Pagador (Obrigatório para Boleto/PIX)</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={payerCpf}
                      maxLength={14}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 11)
                        const fmt = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                        setPayerCpf(fmt)
                      }}
                      className="input-lg"
                    />
                  </div>
 
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 ml-1">Selecione o Método</p>
 
                  <div className="space-y-4">
                    {/* Boleto */}
                    <button onClick={() => handlePay('BOLETO')} disabled={!!paying}
                      className="w-full flex items-center gap-5 p-5 bg-card border-2 border-border rounded-3xl hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50 group">
                      <div className="w-14 h-14 bg-accent text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                        {paying === 'BOLETO' ? <Loader2 className="animate-spin" size={24} /> : <Barcode size={24} />}
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-black text-foreground">Boleto Bancário</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5 leading-relaxed">Vence em 3 dias · Compensação em até 48h</p>
                      </div>
                    </button>
 
                    {/* PIX */}
                    <button onClick={() => handlePay('PIX')} disabled={!!paying}
                      className="w-full flex items-center gap-5 p-5 bg-card border-2 border-border rounded-3xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all disabled:opacity-50 group">
                      <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0">
                        {paying === 'PIX' ? <Loader2 className="animate-spin" size={24} /> : <QrCode size={24} />}
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-black text-foreground">PIX Instantâneo</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5 leading-relaxed">Aprovação imediata · Disponível 24/7</p>
                      </div>
                    </button>
 
                    {/* Cartão */}
                    <button onClick={() => handlePay('CARTAO')} disabled={!!paying}
                      className="w-full flex items-center gap-5 p-5 bg-card border-2 border-border rounded-3xl hover:border-rose-500/50 hover:bg-rose-500/5 transition-all disabled:opacity-50 group">
                      <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all shrink-0">
                        {paying === 'CARTAO' ? <Loader2 className="animate-spin" size={24} /> : <CreditCard size={24} />}
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-black text-foreground">Cartão de Crédito</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5 leading-relaxed">Até 12x via Mercado Pago · Visa, Master, Elo</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
 
              {/* Botão de fechar após resultado */}
              {paymentResult && (
                <button onClick={() => { setShowPayModal(false); setPaymentResult(null) }}
                  className="w-full py-4 mt-2 rounded-2xl border border-border font-black text-sm text-muted-foreground hover:bg-accent transition-all">
                  Fechar
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function GuardianPaymentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Carregando...</div>}>
      <PaymentsContent />
    </Suspense>
  )
}
