'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, Filter, Plus, MoreVertical, 
  Calendar, UserPlus, Download, 
  CheckCircle2, XCircle, Loader2, Users
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageHeader, Avatar, Badge, LoadingState } from '@/components/ui'

interface Student {
  id: string
  fullName: string
  photoUrl?: string
  group?: {
    name: string
  }
  registrationNumber?: string
  createdAt: string
  status: string
}

export default function StudentsPage() {
  const [search, setSearch] = useState('')
  const [filterGroup, setFilterGroup] = useState('Todas as Turmas')
  const [filterStatus, setFilterStatus] = useState('Todos os Status')

  const { data: students, isLoading, error } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => fetch('/api/students').then(r => r.json())
  })

  const groups = Array.from(new Set(students?.map(s => s.group?.name).filter(Boolean)))

  const filteredStudents = students?.filter(s => {
    const matchesSearch = (s.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
                         (s.registrationNumber || '').toLowerCase().includes(search.toLowerCase())
    const matchesGroup = filterGroup === 'Todas as Turmas' || s.group?.name === filterGroup
    const matchesStatus = filterStatus === 'Todos os Status' || s.status === filterStatus

    return matchesSearch && matchesGroup && matchesStatus
  })

  return (
    <div className="page animate-in">
      <PageHeader 
        title="Gestão de Alunos" 
        subtitle="Cadastre e gerencie a ficha completa dos seus pequenos."
        icon={<Users size={24} />}
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary hidden sm:flex">
              <Download size={18} /> Exportar
            </button>
            <button className="btn-primary">
              <UserPlus size={18} /> Novo Aluno
            </button>
          </div>
        }
      />

      {/* Summary Row */}
      {!isLoading && students && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
          <div className="card p-5">
            <p className="text-2xl font-black">{students.length}</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Total de Alunos</p>
          </div>
          <div className="card p-5">
            <p className="text-2xl font-black text-emerald-500">{students.filter(s => s.status === 'ATIVO').length}</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Alunos Ativos</p>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, turma ou registro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="select py-2 h-11 text-xs"
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
          >
            <option>Todas as Turmas</option>
            {groups.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select 
            className="select py-2 h-11 text-xs"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option>Todos os Status</option>
            <option value="ATIVO">Ativos</option>
            <option value="INATIVO">Inativos</option>
          </select>
          <button className="btn-secondary px-3" onClick={() => { setSearch(''); setFilterGroup('Todas as Turmas'); setFilterStatus('Todos os Status'); }}>
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* States */}
      {isLoading ? (
        <LoadingState label="Carregando Alunos..." />
      ) : error ? (
        <div className="card p-12 text-center border-rose-500/20 bg-rose-500/5">
          <p className="font-black text-rose-500">Ocorreu um erro ao carregar os dados.</p>
          <p className="text-sm text-muted-foreground mt-1">Certifique-se de que o backend está rodando.</p>
        </div>
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="table-header px-8">Aluno</th>
                  <th className="table-header">Turma</th>
                  <th className="table-header">Matrícula</th>
                  <th className="table-header">Início</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right px-8"></th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents?.map((student, i) => (
                  <motion.tr 
                    key={student.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="table-row group"
                  >
                    <td className="table-cell px-8">
                      <div className="flex items-center gap-4">
                        <Avatar name={student.fullName} photoUrl={student.photoUrl} size="sm" />
                        <div className="font-black text-foreground group-hover:text-primary transition-colors">
                          {student.fullName}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <Badge 
                        label={student.group?.name || 'Sem Turma'} 
                        variant={student.group?.name ? 'blue' : 'gray'} 
                      />
                    </td>
                    <td className="table-cell">
                      <div className="text-xs font-bold text-muted-foreground">{student.registrationNumber || '-'}</div>
                    </td>
                    <td className="table-cell">
                      <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar size={14} />
                        {format(new Date(student.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </td>
                    <td className="table-cell">
                      <Badge 
                        label={student.status} 
                        variant={student.status === 'ATIVO' ? 'green' : 'gray'} 
                        dot={student.status === 'ATIVO'}
                      />
                    </td>
                    <td className="table-cell text-right px-8">
                      <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all">
                        <MoreVertical size={20} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {filteredStudents?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-muted-foreground font-bold">
                      Nenhum aluno encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-8 py-5 border-t border-border flex justify-between items-center bg-accent/10">
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              {filteredStudents?.length} alunos listados
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary px-4 py-2 text-xs" disabled>Anterior</button>
              <button className="btn-secondary px-4 py-2 text-xs">Próximo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
