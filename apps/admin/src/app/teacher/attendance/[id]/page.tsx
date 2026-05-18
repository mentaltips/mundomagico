'use client'

import { useState, useEffect } from 'react'
import NextImage from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { Baby, ArrowLeft, LogIn, LogOut, CheckCircle2 } from 'lucide-react'
import { getSafeUrl } from '@/lib/utils'

type Child = {
  id: string
  fullName: string
  nickname: string | null
  photoUrl: string | null
  attendanceStatus?: 'AUSENTE' | 'PRESENTE' | 'SAIU_MAIS_CEDO'
  checkInTime?: string
  checkOutTime?: string
}

export default function AttendanceListPage() {
  const { id } = useParams()
  const router = useRouter()
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [groupName, setGroupName] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/teacher/attendance?groupId=${id}`)
        if (res.ok) {
          const data = await res.json()
          setChildren(data.children)
          setGroupName(data.groupName)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleAttendance = async (childId: string, type: 'IN' | 'OUT') => {
    try {
      const res = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, type })
      })

      if (res.ok) {
        const updated = await res.json()
        setChildren(children.map(c => c.id === childId ? { ...c, ...updated } : c))
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando chamada...</div>

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{groupName}</h1>
          <p className="text-xs text-gray-500">Registro de Presença - {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </header>

      <div className="grid gap-3">
        {children.map((child) => (
          <div 
            key={child.id} 
            className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {child.photoUrl ? (
                  <NextImage
                    src={getSafeUrl(child.photoUrl) || child.photoUrl}
                    alt={child.fullName}
                    fill
                    sizes="40px"
                    unoptimized={(getSafeUrl(child.photoUrl) || '').startsWith('/api/uploads/')}
                    className="object-cover"
                  />
                ) : (
                  <Baby className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{child.nickname || child.fullName.split(' ')[0]}</h3>
                <p className="text-[10px] text-gray-400 font-medium uppercase">{child.attendanceStatus || 'AUSENTE'}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {!child.checkInTime ? (
                <button 
                  onClick={() => handleAttendance(child.id, 'IN')}
                  className="flex items-center gap-1 rounded-xl bg-green-50 px-3 py-2 text-xs font-bold text-green-600 border border-green-100"
                >
                  <LogIn className="h-4 w-4" /> Entrada
                </button>
              ) : !child.checkOutTime ? (
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white shadow-sm">
                    <CheckCircle2 className="h-4 w-4" /> {child.checkInTime.split('T')[1].substring(0, 5)}
                  </div>
                  <button 
                    onClick={() => handleAttendance(child.id, 'OUT')}
                    className="flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 border border-red-100"
                  >
                    <LogOut className="h-4 w-4" /> Saída
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 opacity-60">
                  <div className="text-[10px] font-bold text-gray-400 text-right">
                    <div>Ent: {child.checkInTime.split('T')[1].substring(0, 5)}</div>
                    <div>Sai: {child.checkOutTime.split('T')[1].substring(0, 5)}</div>
                  </div>
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 text-gray-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
