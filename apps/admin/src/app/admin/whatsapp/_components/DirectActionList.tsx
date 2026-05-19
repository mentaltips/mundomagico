'use client'

import { useState } from 'react'
import { Search, ExternalLink } from 'lucide-react'

interface Guardian {
  id: string
  fullName: string
  phone: string | null
}

interface Child {
  id: string
  fullName: string
  nickname: string | null
  status: string
  group: {
    id: string
    name: string
  } | null
  guardians: Array<{
    guardian: Guardian
  }>
}

interface DirectActionListProps {
  items: Child[]
  targetStatus: string
  customMessage: string
  triggerDirectLink: (child: Child) => void
}

export function DirectActionList({ 
  items, 
  targetStatus, 
  customMessage, 
  triggerDirectLink 
}: DirectActionListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filtered list of targets for direct broadcast
  const targetChildren = items.filter((child) => {
    const statusMatch = targetStatus === 'ALL' || child.status === targetStatus
    if (!statusMatch) return false
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const childNameMatch = child.fullName.toLowerCase().includes(q)
      const guardianNameMatch = child.guardians?.some(g => g.guardian.fullName.toLowerCase().includes(q)) ?? false
      return childNameMatch || guardianNameMatch
    }
    return true
  })

  return (
    <div className="bg-card p-6 rounded-[2rem] border border-border/50 shadow-sm space-y-4">
      <div>
        <h4 className="text-sm font-black text-foreground">Disparo Direto Manual (Sem Custo)</h4>
        <p className="text-xs text-muted-foreground mt-0.5">
          Clique para falar diretamente com cada pai pelo seu WhatsApp, já carregando a mensagem.
        </p>
      </div>

      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar responsável ou aluno..."
          className="w-full pl-9 pr-4 py-2.5 bg-accent/40 border border-border/50 rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
      </div>

      <div className="max-h-[220px] overflow-y-auto divide-y divide-border/50 custom-scrollbar pr-1">
        {targetChildren.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-6">
            Nenhum responsável encontrado para este filtro.
          </p>
        ) : (
          targetChildren.map((child) => {
            const guardian = child.guardians?.[0]?.guardian
            return (
              <div key={child.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{guardian?.fullName ?? 'Responsável'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Pai/Mãe de: <span className="font-semibold text-foreground/80">{child.fullName}</span> • {guardian?.phone ?? '—'}
                  </p>
                </div>
                <button
                  onClick={() => triggerDirectLink(child)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0"
                >
                  <ExternalLink size={10} /> Enviar
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
