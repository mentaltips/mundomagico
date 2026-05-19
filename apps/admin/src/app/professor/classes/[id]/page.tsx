'use client'

import { useState, useEffect } from 'react'
import NextImage from 'next/image'
import { useParams } from 'next/navigation'
import { Baby, ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import Link from 'next/link'
import { getSafeUrl } from '@/lib/utils'

type Child = {
  id: string
  fullName: string
  nickname: string | null
  photoUrl: string | null
}

type Group = {
  id: string
  name: string
  children: Child[]
}

export default function TeacherClassPage() {
  const { id } = useParams()
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGroup() {
      try {
        const res = await fetch(`/api/professor/classes/${id}`)
        if (res.ok) {
          const data = await res.json()
          setGroup(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchGroup()
  }, [id])

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando turma...</div>
  if (!group) return <div className="p-8 text-center text-red-500">Turma não encontrada.</div>

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
        <p className="text-gray-500">{group.children.length} alunos presentes hoje</p>
      </header>

      <div className="grid gap-3">
        {group.children.map((child) => (
          <Link 
            key={child.id} 
            href={`/professor/daily-reports/new?childId=${child.id}`}
            className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-violet-200"
          >
            <div className="flex items-center gap-4">
              <div className="relative h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 overflow-hidden">
                {child.photoUrl ? (
                  <NextImage
                    src={getSafeUrl(child.photoUrl) || child.photoUrl}
                    alt={child.fullName}
                    fill
                    sizes="48px"
                    unoptimized={(getSafeUrl(child.photoUrl) || '').startsWith('/api/uploads/')}
                    className="object-cover"
                  />
                ) : (
                  <Baby className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{child.nickname || child.fullName.split(' ')[0]}</h3>
                <p className="text-xs text-gray-400 truncate max-w-[150px]">{child.fullName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* No futuro mostraríamos um ícone se o diário já foi preenchido hoje */}
              <ChevronRight className="h-5 w-5 text-gray-300" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
