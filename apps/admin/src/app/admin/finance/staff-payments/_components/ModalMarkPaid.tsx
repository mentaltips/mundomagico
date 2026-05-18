'use client'

import { BookmarkCheck, X } from 'lucide-react'
import { StaffPayment } from './types'

type StatusForm = {
  status: string
  paymentMethod: string
  paymentDate: string
  notes: string
}

type Props = {
  payment: StaffPayment
  statusForm: StatusForm
  setStatusForm: (val: StatusForm) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function ModalMarkPaid({ payment, statusForm, setStatusForm, onClose, onSubmit }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-[2rem] bg-card p-6 shadow-2xl border border-border">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <BookmarkCheck className="text-primary" />
            Registrar Pagamento — {payment.staff.name}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5">Status do Pagamento</label>
            <select
              value={statusForm.status}
              onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none"
            >
              <option value="PAID">Pago (Liquidado)</option>
              <option value="PENDING">Pendente (Aguardando)</option>
              <option value="DRAFT">Rascunho</option>
              <option value="CANCELED">Cancelado</option>
            </select>
          </div>

          {statusForm.status === 'PAID' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5">Data do Pagamento</label>
                  <input
                    type="date"
                    required
                    value={statusForm.paymentDate}
                    onChange={(e) => setStatusForm({ ...statusForm, paymentDate: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5">Meio de Pagamento</label>
                  <select
                    value={statusForm.paymentMethod}
                    onChange={(e) => setStatusForm({ ...statusForm, paymentMethod: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none"
                  >
                    <option value="PIX">PIX</option>
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="TRANSFERENCIA">Conta Bancária / DOC / TED</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
              </div>

              {payment.staff.pixKey && statusForm.paymentMethod === 'PIX' && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl text-xs font-bold dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-none">
                  Chave PIX Cadastrada: {payment.staff.pixKey}
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5">Notas / Comprovantes</label>
            <textarea
              value={statusForm.notes}
              onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
              placeholder="Código de transação PIX, banco emissor, etc."
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary text-primary-foreground px-5 py-2 text-sm font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              Confirmar Status
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
