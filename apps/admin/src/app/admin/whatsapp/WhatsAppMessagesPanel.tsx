'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

type WhatsAppMessageStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED'

interface WhatsAppMessage {
  id: string
  to: string
  recipientName: string | null
  type: string
  content: string
  status: WhatsAppMessageStatus | string
  error: string | null
  attempts: number
  sentAt: string | null
  createdAt: string
  updatedAt: string
}

interface WhatsAppMessagesResponse {
  page: number
  limit: number
  total: number
  totalPages: number
  items: WhatsAppMessage[]
}

const STATUS_OPTIONS = ['ALL', 'PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED']
const TYPE_OPTIONS = ['ALL', 'CHECKIN', 'CHECKOUT', 'INVOICE', 'ANNOUNCEMENT', 'DAILY_REPORT', 'MANUAL']
const PAGE_LIMIT = 20

const statusView: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  PENDING: {
    label: 'Pendente',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    icon: Clock,
  },
  PROCESSING: {
    label: 'Processando',
    className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    icon: Loader2,
  },
  SENT: {
    label: 'Enviada',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    icon: CheckCircle2,
  },
  FAILED: {
    label: 'Falhou',
    className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    icon: AlertCircle,
  },
  CANCELLED: {
    label: 'Cancelada',
    className: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300',
    icon: XCircle,
  },
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function statusLabel(status: string) {
  return statusView[status]?.label ?? status
}

export function WhatsAppMessagesPanel() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<WhatsAppMessage | null>(null)

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_LIMIT),
      })

      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (typeFilter !== 'ALL') params.set('type', typeFilter)
      if (search.trim()) params.set('to', search.trim())

      const res = await fetch(`/api/whatsapp/messages?${params.toString()}`)
      if (!res.ok) throw new Error('Falha ao carregar mensagens')

      const data = (await res.json()) as WhatsAppMessagesResponse
      setMessages(data.items ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(Math.max(data.totalPages ?? 1, 1))
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar historico do WhatsApp.')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, typeFilter])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const pageStats = useMemo(() => {
    return messages.reduce(
      (acc, message) => {
        acc.total += 1
        if (message.status === 'PENDING' || message.status === 'PROCESSING') acc.queue += 1
        if (message.status === 'SENT') acc.sent += 1
        if (message.status === 'FAILED') acc.failed += 1
        return acc
      },
      { total: 0, queue: 0, sent: 0, failed: 0 },
    )
  }, [messages])

  async function runMessageAction(message: WhatsAppMessage, action: 'retry' | 'cancel') {
    setActionId(`${action}:${message.id}`)
    try {
      const res = await fetch(`/api/whatsapp/messages/${message.id}/${action}`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Acao nao concluida')
      }

      toast.success(action === 'retry' ? 'Mensagem reenfileirada.' : 'Mensagem cancelada.')
      await fetchMessages()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao executar acao.'
      toast.error(message)
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border/50 p-6 rounded-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fila</p>
            <p className="text-xl font-black text-foreground mt-0.5">{pageStats.queue} nesta pagina</p>
          </div>
        </div>

        <div className="bg-card border border-border/50 p-6 rounded-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Enviadas</p>
            <p className="text-xl font-black text-foreground mt-0.5">{pageStats.sent} nesta pagina</p>
          </div>
        </div>

        <div className="bg-card border border-border/50 p-6 rounded-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <AlertCircle size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Falhas</p>
            <p className="text-xl font-black text-foreground mt-0.5">{pageStats.failed} nesta pagina</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-[2rem] border border-border/50 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50 bg-accent/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-black text-foreground uppercase tracking-widest">Historico real de envios</h4>
            <p className="text-xs text-muted-foreground mt-1">{total} registros encontrados</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setPage(1)
                  setSearch(event.target.value)
                }}
                placeholder="Telefone"
                className="w-full sm:w-36 pl-9 pr-3 py-2.5 bg-background border border-border/60 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1)
                setStatusFilter(event.target.value)
              }}
              className="px-3 py-2.5 bg-background border border-border/60 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'Todos status' : statusLabel(status)}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(event) => {
                setPage(1)
                setTypeFilter(event.target.value)
              }}
              className="px-3 py-2.5 bg-background border border-border/60 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type === 'ALL' ? 'Todos tipos' : type}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchMessages}
              className="h-10 w-10 rounded-xl bg-background border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent transition-all flex items-center justify-center"
              title="Atualizar"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[920px]">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Criada em</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Destinatario</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tentativas</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading && messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-emerald-500" size={24} />
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-xs font-bold text-muted-foreground">
                    Nenhuma mensagem encontrada.
                  </td>
                </tr>
              ) : (
                messages.map((message) => {
                  const meta = statusView[message.status] ?? statusView.PENDING
                  const StatusIcon = meta.icon
                  const retrying = actionId === `retry:${message.id}`
                  const cancelling = actionId === `cancel:${message.id}`

                  return (
                    <tr key={message.id} className="hover:bg-accent/10">
                      <td className="px-6 py-4 text-xs font-bold text-foreground whitespace-nowrap">
                        {formatDate(message.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-foreground truncate max-w-[220px]">
                          {message.recipientName ?? 'Destinatario'}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">{message.to}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {message.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground font-bold">{message.attempts}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${meta.className}`}>
                          <StatusIcon size={12} className={message.status === 'PROCESSING' ? 'animate-spin' : ''} />
                          {meta.label}
                        </span>
                        {message.error && (
                          <p className="text-[10px] text-rose-500 mt-1 max-w-[240px] truncate">{message.error}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedMessage(message)}
                            className="h-8 w-8 rounded-lg bg-accent/60 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"
                            title="Ver detalhes"
                          >
                            <Eye size={14} />
                          </button>

                          {(message.status === 'FAILED' || message.status === 'CANCELLED') && (
                            <button
                              type="button"
                              onClick={() => runMessageAction(message, 'retry')}
                              disabled={Boolean(actionId)}
                              className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white disabled:opacity-50 transition-all flex items-center justify-center"
                              title="Reenfileirar"
                            >
                              {retrying ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                            </button>
                          )}

                          {(message.status === 'PENDING' || message.status === 'FAILED') && (
                            <button
                              type="button"
                              onClick={() => runMessageAction(message, 'cancel')}
                              disabled={Boolean(actionId)}
                              className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white disabled:opacity-50 transition-all flex items-center justify-center"
                              title="Cancelar"
                            >
                              {cancelling ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs font-bold text-muted-foreground">
            Pagina {page} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-2 rounded-lg bg-accent/60 text-xs font-black text-foreground disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              disabled={page >= totalPages || loading}
              className="px-3 py-2 rounded-lg bg-accent/60 text-xs font-black text-foreground disabled:opacity-40"
            >
              Proxima
            </button>
          </div>
        </div>
      </div>

      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-card border border-border/60 rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Detalhes da mensagem</h4>
                <p className="text-xs text-muted-foreground mt-1">{selectedMessage.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="h-9 w-9 rounded-xl bg-accent/60 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"
                title="Fechar"
              >
                <XCircle size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
                  <p className="text-sm font-bold text-foreground">{statusLabel(selectedMessage.status)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Enviada em</p>
                  <p className="text-sm font-bold text-foreground">{formatDate(selectedMessage.sentAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Telefone</p>
                  <p className="text-sm font-bold text-foreground">{selectedMessage.to}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo</p>
                  <p className="text-sm font-bold text-foreground">{selectedMessage.type}</p>
                </div>
              </div>

              {selectedMessage.error && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-600 dark:text-rose-300">
                  {selectedMessage.error}
                </div>
              )}

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Conteudo</p>
                <pre className="whitespace-pre-wrap break-words rounded-xl bg-accent/40 border border-border/50 p-4 text-xs font-medium text-foreground">
                  {selectedMessage.content}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
