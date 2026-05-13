'use client'

import { useState, useEffect } from 'react'
import { UserCheck, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'

type Group = {
  id: string
  name: string
  shift: string
  _count: { children: number }
}

export default function TeacherAttendanceGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch('/api/teacher/classes')
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
      <header>
        <h1 className="text-2xl font-black text-foreground">Chamada Digital</h1>
        <p className="text-muted-foreground font-medium">Selecione uma turma para registrar entrada ou saída.</p>
      </header>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-accent border border-border shadow-sm"></div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <Link 
              key={group.id} 
              href={`/teacher/attendance/${group.id}`}
              className="card-interactive p-5 flex flex-col justify-between group active:scale-95 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div className="text-[10px] font-black text-muted-foreground flex items-center gap-1.5 uppercase tracking-widest bg-accent px-2 py-1 rounded-lg">
                  <Clock className="h-3 w-3" />
                  {group.shift}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{group.name}</h3>
                <p className="text-sm text-muted-foreground font-medium mt-0.5">{group._count.children} alunos</p>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-black text-primary uppercase tracking-widest opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                Fazer Chamada
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
