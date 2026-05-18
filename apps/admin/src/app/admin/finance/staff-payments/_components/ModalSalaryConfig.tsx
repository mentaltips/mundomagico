'use client'

import { Landmark, X } from 'lucide-react'
import { Staff } from './types'

type Props = {
  staff: Staff
  onClose: () => void
  onSave: (e: React.FormEvent) => void
}

export function ModalSalaryConfig({ staff, onClose, onSave }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-[2rem] bg-card p-6 shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Landmark className="text-primary" />
            Dados Financeiros de {staff.name}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 mt-4">
          <input type="hidden" name="name" value={staff.name} />
          <input type="hidden" name="email" value={staff.email || ''} />
          <input type="hidden" name="phone" value={staff.phone || ''} />
          <input type="hidden" name="whatsapp" value={staff.whatsapp || ''} />
          <input type="hidden" name="cpf" value={staff.cpf || ''} />
          <input type="hidden" name="birthDate" value={staff.birthDate ? staff.birthDate.split('T')[0] : ''} />
          <input type="hidden" name="roleType" value={staff.roleType} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5">Salário Base (R$)</label>
              <input
                type="number"
                step="0.01"
                name="baseSalary"
                required
                defaultValue={staff.baseSalary || ''}
                placeholder="Ex: 2500.00"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5">Dia de Vencimento</label>
              <input
                type="number"
                name="paymentDay"
                required
                min="1"
                max="28"
                defaultValue={staff.paymentDay || 5}
                placeholder="Ex: 5"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5">Chave PIX</label>
            <input
              type="text"
              name="pixKey"
              defaultValue={staff.pixKey || ''}
              placeholder="E-mail, CPF, Telefone ou Chave Aleatória"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none"
            />
          </div>

          <div className="p-4 bg-muted/40 border border-border rounded-2xl space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Dados Bancários Alternativos</p>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Nome do Banco</label>
                <input
                  type="text"
                  name="bankName"
                  defaultValue={staff.bankName || ''}
                  placeholder="Itaú, Bradesco, etc."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Agência</label>
                <input
                  type="text"
                  name="bankAgency"
                  defaultValue={staff.bankAgency || ''}
                  placeholder="0001"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Conta Corrente</label>
              <input
                type="text"
                name="bankAccount"
                defaultValue={staff.bankAccount || ''}
                placeholder="12345-6"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5">Observações Financeiras</label>
            <textarea
              name="financialNotes"
              defaultValue={staff.financialNotes || ''}
              placeholder="Informações contratuais, detalhes adicionais de bônus, etc."
              rows={3}
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
              className="rounded-xl bg-primary text-primary-foreground px-5 py-2 text-sm font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
