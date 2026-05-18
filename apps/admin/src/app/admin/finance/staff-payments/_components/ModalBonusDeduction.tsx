'use client'

import { ArrowUpRight, ArrowDownRight, X } from 'lucide-react'
import { StaffPayment } from './types'

type AdjustmentForm = {
  title: string
  amount: string
  description: string
  type: string
}

type Props = {
  payment: StaffPayment
  adjustmentType: 'bonus' | 'deduction'
  adjustmentForm: AdjustmentForm
  setAdjustmentForm: (val: AdjustmentForm) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function ModalBonusDeduction({
  payment,
  adjustmentType,
  adjustmentForm,
  setAdjustmentForm,
  onClose,
  onSubmit,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-[2rem] bg-card p-6 shadow-2xl border border-border">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 className="text-lg font-black text-foreground flex items-center gap-1.5">
            {adjustmentType === 'bonus' ? (
              <>
                <ArrowUpRight className="text-emerald-600" />
                Lançar Bônus — {payment.staff.name}
              </>
            ) : (
              <>
                <ArrowDownRight className="text-rose-600" />
                Lançar Desconto — {payment.staff.name}
              </>
            )}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5">Título / Motivo *</label>
            <input
              type="text"
              required
              value={adjustmentForm.title}
              onChange={(e) => setAdjustmentForm({ ...adjustmentForm, title: e.target.value })}
              placeholder={adjustmentType === 'bonus' ? 'Horas Extras, Substituição, etc.' : 'Falta injustificada, Adiantamento, etc.'}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={adjustmentForm.amount}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5">Tipo</label>
              <select
                value={adjustmentForm.type}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, type: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none"
              >
                {adjustmentType === 'bonus' ? (
                  <>
                    <option value="MANUAL">Avulso</option>
                    <option value="BONUS">Bonificação</option>
                    <option value="EXTRA_HOURS">Horas Extras</option>
                    <option value="PERFORMANCE">Performance</option>
                  </>
                ) : (
                  <>
                    <option value="DISCOUNT">Desconto Comum</option>
                    <option value="ABSENCE">Faltas</option>
                    <option value="ADVANCE">Adiantamento de Salário</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5">Descrição Adicional</label>
            <textarea
              value={adjustmentForm.description}
              onChange={(e) => setAdjustmentForm({ ...adjustmentForm, description: e.target.value })}
              placeholder="Opcional. Ex: Referente a 4 horas adicionais no evento do dia 12."
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
              Lançar Ajuste
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
