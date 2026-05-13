'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, Filter, Plus, MoreVertical, 
  Calendar, UserPlus, Download, 
  CheckCircle2, XCircle, Loader2
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Student {
  id: string
  fullName: string
  group?: {
    name: string
  }
  registrationNumber?: string
  createdAt: string
  status: string
}

export default function StudentsPage() {
  const [search, setSearch] = useState('')

  const { data: students, isLoading, error } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => fetch('/api/students').then(r => r.json())
  })

  const filteredStudents = students?.filter(s => 
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.group?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 md:p-8 animate-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestão de <span className="text-indigo-600">Alunos</span></h1>
          <p className="text-gray-500 font-medium">Cadastre e gerencie a ficha completa dos seus pequenos.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all">
            <Download size={18} />
            Exportar
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
            <UserPlus size={18} />
            Novo Aluno
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, turma ou registro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 outline-none">
            <option>Todas as Turmas</option>
          </select>
          <select className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 outline-none">
            <option>Status: Todos</option>
            <option>Ativos</option>
            <option>Inativos</option>
          </select>
          <button className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-all">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
          <Loader2 className="text-indigo-600 animate-spin mb-4" size={40} />
          <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Carregando Alunos...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-12 text-center bg-rose-50 rounded-[2rem] border border-rose-100 text-rose-600">
          <p className="font-black">Ocorreu um erro ao carregar os dados.</p>
          <p className="text-sm">Certifique-se de que o backend está rodando.</p>
        </div>
      )}

      {/* Students Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Aluno</th>
                  <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Turma</th>
                  <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Matrícula</th>
                  <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Início</th>
                  <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStudents?.map((student, i) => (
                  <motion.tr 
                    key={student.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm uppercase">
                          {student.fullName.charAt(0)}
                        </div>
                        <div className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{student.fullName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">
                        {student.group?.name || 'Sem Turma'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-gray-600">{student.registrationNumber || '-'}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <Calendar size={14} />
                        {format(new Date(student.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        student.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {student.status === 'ATIVO' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {student.status}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-gray-300 hover:text-gray-600 hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm">
                        <MoreVertical size={20} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {filteredStudents?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-gray-400 font-bold">
                      Nenhum aluno encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 border-t border-gray-50 flex justify-between items-center bg-gray-50/30">
            <div className="text-xs font-bold text-gray-400">Mostrando {filteredStudents?.length} alunos</div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white border border-gray-100 rounded-lg text-xs font-black text-gray-400" disabled>Anterior</button>
              <button className="px-4 py-2 bg-white border border-gray-100 rounded-lg text-xs font-black text-indigo-600 hover:bg-indigo-50 transition-all">Próximo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
