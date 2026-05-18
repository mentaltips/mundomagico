'use client'

import { UserPlus, X } from 'lucide-react'

export type NewStaffForm = {
  name: string
  email: string
  phone: string
  whatsapp: string
  cpf: string
  birthDate: string
  roleType: string
  baseSalary: string
  paymentDay: string
  pixKey: string
  bankName: string
  bankAgency: string
  bankAccount: string
  financialNotes: string
}

type Props = {
  form: NewStaffForm
  setForm: (val: NewStaffForm) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function ModalNewStaff({ form, setForm, onClose, onSubmit }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl rounded-[2rem] bg-card p-6 shadow-2xl border border-border my-8">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <UserPlus className="text-primary" />
            Cadastrar Novo Perfil Profissional
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 mt-4 text-sm">
          <div className="p-4 bg-muted/40 border border-border rounded-2xl space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Dados Pessoais & Contato</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-foreground mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Ana Paula de Souza"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ana@escola.com.br"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">CPF</label>
                <input
                  type="text"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">WhatsApp / Telefone</label>
                <input
                  type="text"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/40 border border-border rounded-2xl space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Configurações Financeiras</p>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Função / Cargo *</label>
                <select
                  value={form.roleType}
                  onChange={(e) => setForm({ ...form, roleType: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none"
                >
                  <option value="TEACHER">Professor(a)</option>
                  <option value="MONITOR">Monitor(a)</option>
                  <option value="CAREGIVER">Cuidador(a)</option>
                  <option value="COORDINATOR">Coordenador(a)</option>
                  <option value="ASSISTANT">Auxiliar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Salário Base (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.baseSalary}
                  onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
                  placeholder="Ex: 2500.00"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Dia Vencimento</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="28"
                  value={form.paymentDay}
                  onChange={(e) => setForm({ ...form, paymentDay: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Chave PIX</label>
                <input
                  type="text"
                  value={form.pixKey}
                  onChange={(e) => setForm({ ...form, pixKey: e.target.value })}
                  placeholder="E-mail, CPF ou Aleatória"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Banco Principal</label>
                <input
                  type="text"
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  placeholder="Nubank, Itaú, etc."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none"
                />
              </div>
            </div>
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
              Cadastrar Colaborador
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
