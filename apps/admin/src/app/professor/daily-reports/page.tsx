'use client'

import { useState, useEffect } from 'react'
import { Users, Clock, ArrowRight, ArrowLeft, ClipboardList } from 'lucide-react'
import Link from 'next/link'

type Group = {
  id: string
  name: string
  shift: string
  _count: { children: number; students: number }
}

export default function DailyReportsIndexPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch('/api/professor/classes')
        if (res.ok) {
          const data = await res.json()
          setGroups(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchGroups()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/professor" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-foreground">Diário de Rotina</h1>
          <p className="text-muted-foreground font-medium text-sm">Selecione uma turma para preencher os relatórios diários.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-accent shadow-sm border border-border" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="card flex flex-col items-center justify-center p-12 text-center border-dashed">
          <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-black text-foreground">Sem turmas vinculadas</p>
          <p className="text-xs text-muted-foreground font-medium mt-1">
            Você não está vinculada a nenhuma turma no momento. Fale com a coordenação para vincular suas turmas.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/professor/classes/${group.id}`}
              className="card-interactive p-5 flex flex-col justify-between group active:scale-95 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-accent px-2 py-1 rounded-lg">
                  <Clock className="h-3 w-3" />
                  {group.shift}
                </div>
              </div>

              <div className="mt-5">
                <h3 className="text-lg font-black text-foreground">{group.name}</h3>
                <p className="text-sm text-muted-foreground font-medium mt-0.5">
                  {group._count.children + group._count.students} alunos matriculados
                </p>
              </div>

              <div className="mt-5 flex items-center gap-1.5 text-xs font-black text-primary uppercase tracking-widest opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                Selecionar Aluno
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
