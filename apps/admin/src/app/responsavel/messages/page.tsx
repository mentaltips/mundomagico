'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Bell, Clock, ChevronRight, Megaphone } from 'lucide-react'
import Link from 'next/link'

export default function GuardianMessagesPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/announcements')
      .then(r => r.json())
      .then(data => { setAnnouncements(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-lg mx-auto pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Comunicados</h1>
          <p className="text-xs text-gray-400 font-medium">Mensagens da escola</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white border border-gray-100" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <Bell className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium text-sm">Nenhum comunicado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => {
            const date = new Date(ann.createdAt)
            const isRecent = Date.now() - date.getTime() < 1000 * 60 * 60 * 24 * 2 // < 2 dias
            return (
              <div
                key={ann.id}
                className={`bg-white rounded-2xl p-4 border shadow-sm transition-all ${
                  isRecent ? 'border-sky-100' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isRecent ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{ann.title}</h3>
                      {isRecent && (
                        <span className="shrink-0 text-[9px] font-black bg-sky-500 text-white px-1.5 py-0.5 rounded-full uppercase">novo</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{ann.content}</p>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400 font-medium">
                      <Clock className="h-3 w-3" />
                      {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
