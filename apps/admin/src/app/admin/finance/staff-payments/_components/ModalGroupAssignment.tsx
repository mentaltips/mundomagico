'use client'

import { ClipboardList, Trash2, X } from 'lucide-react'
import { Staff, Group, ASSIGNMENT_LABELS } from './types'

type NewAssignment = { groupId: string; assignmentType: string }

type Props = {
  staff: Staff
  groups: Group[]
  newAssignment: NewAssignment
  setNewAssignment: (val: NewAssignment) => void
  onClose: () => void
  onAddAssignment: (e: React.FormEvent) => void
  onRemoveAssignment: (assignmentId: string) => void
}

export function ModalGroupAssignment({
  staff,
  groups,
  newAssignment,
  setNewAssignment,
  onClose,
  onAddAssignment,
  onRemoveAssignment,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-[2rem] bg-card p-6 shadow-2xl border border-border">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <ClipboardList className="text-indigo-600" />
            Vínculos de Turmas — {staff.name}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current assignments */}
        <div className="my-4 space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Turmas Vinculadas Ativas</h3>

          {staff.groupAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">Nenhuma turma associada a este profissional.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {staff.groupAssignments.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-muted/40 p-2.5 rounded-xl border border-border/50">
                  <div>
                    <span className="text-sm font-bold text-foreground">{a.group.name}</span>
                    <span className="text-[10px] uppercase font-black tracking-widest text-primary ml-2 bg-primary/10 px-1.5 py-0.5 rounded">
                      {ASSIGNMENT_LABELS[a.assignmentType] || a.assignmentType}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveAssignment(a.id)}
                    className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg"
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add new assignment */}
        <form onSubmit={onAddAssignment} className="border-t border-border pt-4 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Adicionar Novo Vínculo</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Turma *</label>
              <select
                value={newAssignment.groupId}
                required
                onChange={(e) => setNewAssignment({ ...newAssignment, groupId: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none"
              >
                <option value="">Selecione...</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Função na Sala *</label>
              <select
                value={newAssignment.assignmentType}
                onChange={(e) => setNewAssignment({ ...newAssignment, assignmentType: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none"
              >
                <option value="MAIN_TEACHER">Regente principal</option>
                <option value="ASSISTANT">Auxiliar de sala</option>
                <option value="MONITOR">Monitor(a)</option>
                <option value="CAREGIVER">Cuidador(a)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-accent"
            >
              Fechar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary text-primary-foreground px-5 py-2 text-sm font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              Adicionar Vínculo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
