'use client'

import { motion } from 'framer-motion'
import {
  Users, ClipboardCheck, MessageSquare, Calendar,
  Plus, CheckCircle2, Clock, AlertCircle,
  Smile, BookOpen, UserCheck
} from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const user = session?.user
  const firstName = user?.name?.split(' ')[0] ?? 'Professor(a)'
  const initials = user?.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? 'PR'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-5 pt-10">
        <div className="container mx-auto max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{greeting}, <span className="text-indigo-600">{firstName}</span>! 🍎</h1>
              <p className="text-gray-500 font-medium text-sm">Bem-vindo(a) ao seu painel do dia.</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm shrink-0">
              {initials}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl p-6 space-y-8">
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/daily-routine" className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100 hover:scale-105 transition-all group">
            <ClipboardCheck className="mb-4" size={32} />
            <h3 className="text-xl font-black mb-1">Diário de Rotina</h3>
            <p className="text-indigo-100 text-xs font-medium opacity-80">Registrar sono, comida e higiene.</p>
          </Link>
          <Link href="/teacher/attendance" className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <UserCheck className="mb-4 text-emerald-500" size={32} />
            <h3 className="text-xl font-black text-gray-900 mb-1">Frequência</h3>
            <p className="text-gray-400 text-xs font-medium">Chamada rápida do dia.</p>
          </Link>
          <Link href="/admin/announcements" className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <MessageSquare className="mb-4 text-violet-500" size={32} />
            <h3 className="text-xl font-black text-gray-900 mb-1">Avisos</h3>
            <p className="text-gray-400 text-xs font-medium">Enviar recados para a turma.</p>
          </Link>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="text-amber-500" size={24} />
            Pendências para hoje
          </h2>
          
          <div className="space-y-4">
            {[
              { title: 'Finalizar diários do G1', status: 'pendente', info: '12 de 18 crianças restantes' },
              { title: 'Medicação 10h: Lucas Silva', status: 'urgente', info: 'Dar 5ml de antitérmico' },
              { title: 'Planejamento Semanal', status: 'pendente', info: 'Entregar até amanhã' },
            ].map((task, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex gap-4">
                  <div className={`w-1 rounded-full ${task.status === 'urgente' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <div>
                    <div className="text-sm font-black text-gray-900">{task.title}</div>
                    <div className="text-xs font-medium text-gray-400">{task.info}</div>
                  </div>
                </div>
                <button className="text-xs font-black text-indigo-600 hover:underline">Resolver</button>
              </div>
            ))}
          </div>
        </div>

        {/* Class Overview */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Users className="text-indigo-600" size={24} />
              Minha Turma
            </h2>
            <Link href="/teacher/classes" className="text-sm font-bold text-indigo-600">Ver todos</Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {['LS', 'AO', 'PS', 'MC', 'JV', 'AF'].map((init, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm border-2 border-transparent hover:border-indigo-600 transition-all cursor-pointer">
                  {init}
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Fab */}
      <button className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-200 flex items-center justify-center hover:scale-110 transition-all">
        <Plus size={32} />
      </button>
    </div>
  )
}
