'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Send, Save, Clock, Smartphone, 
  Users, Type, Paperclip, CheckCircle2, 
  Info, AlertCircle, ChevronRight, Hash
} from 'lucide-react'

export default function MessageBuilderPage() {
  const [message, setMessage] = useState('Olá {{nome_responsavel}}, informamos que seu filho(a) {{nome_aluno}} já está pronto para a saída! 🏫✨')
  const [targetType, setTargetType] = useState('turma')
  const [selectedGroup, setSelectedGroup] = useState('Jardim II')

  const variables = [
    { key: 'nome_responsavel', label: 'Nome do Responsável' },
    { key: 'nome_aluno', label: 'Nome do Aluno' },
    { key: 'horario', label: 'Horário Atual' },
    { key: 'instituicao', label: 'Nome da Instituição' },
  ]

  const insertVariable = (key: string) => {
    setMessage(prev => `${prev}{{${key}}}`)
  }

  return (
    <div className="p-4 md:p-8 animate-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Criador de <span className="text-indigo-600">Comunicados</span></h1>
        <p className="text-gray-500 font-medium">Envie mensagens profissionais via WhatsApp de forma massiva e personalizada.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            {/* Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Público-alvo</label>
                <select 
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="turma">Por Turma</option>
                  <option value="individual">Individual</option>
                  <option value="todos">Toda a Instituição</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Seleção</label>
                <select 
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Jardim II">Jardim II</option>
                  <option value="Berçário 1">Berçário 1</option>
                  <option value="Maternal">Maternal</option>
                </select>
              </div>
            </div>

            {/* Variables */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                <Hash size={16} className="text-indigo-600" />
                Variáveis Mágicas
              </label>
              <div className="flex flex-wrap gap-2">
                {variables.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => insertVariable(v.key)}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-black rounded-lg border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Sua Mensagem</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full p-4 bg-gray-50 border-none rounded-2xl font-medium text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Digite sua mensagem aqui..."
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4">
              <button className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all group">
                <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                Enviar Agora
              </button>
              <button className="px-6 py-4 bg-white border-2 border-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
                <Clock size={20} />
                Agendar
              </button>
              <button className="px-6 py-4 bg-white border-2 border-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
                <Save size={20} />
                Template
              </button>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex gap-4">
            <Info className="text-blue-500 shrink-0" size={24} />
            <div>
              <div className="text-sm font-black text-blue-900 mb-1">Dica de Especialista</div>
              <p className="text-xs font-medium text-blue-700 leading-relaxed">
                Mensagens com emojis têm 40% mais taxa de leitura. Use as variáveis para criar proximidade com os responsáveis!
              </p>
            </div>
          </div>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-5 sticky top-28 flex flex-col items-center">
          <div className="relative w-full max-w-[320px] h-[640px] bg-gray-900 rounded-[3rem] border-[8px] border-gray-800 shadow-2xl p-2 overflow-hidden">
            {/* Phone Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20" />
            
            {/* Phone Screen */}
            <div className="h-full w-full bg-[#E5DDD5] rounded-[2rem] overflow-hidden flex flex-col relative">
              {/* WhatsApp Header */}
              <div className="bg-[#075E54] p-4 pt-8 text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div>
                  <div className="text-sm font-black leading-none">Mundo Mágico</div>
                  <div className="text-[10px] opacity-70">Online</div>
                </div>
              </div>

              {/* Chat Content */}
              <div className="flex-1 p-3 space-y-4 overflow-y-auto">
                <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm max-w-[85%] relative">
                  <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {message
                      .replace(/{{nome_responsavel}}/g, 'Maria')
                      .replace(/{{nome_aluno}}/g, 'Lucas')
                      .replace(/{{horario}}/g, '17:30')
                      .replace(/{{instituicao}}/g, 'Mundo Mágico')}
                  </p>
                  <div className="text-[10px] text-gray-400 text-right mt-1">17:31 ✓✓</div>
                </div>
              </div>

              {/* WhatsApp Input */}
              <div className="p-3 bg-[#F0F0F0] flex items-center gap-2">
                <div className="flex-1 bg-white h-8 rounded-full" />
                <div className="w-8 h-8 bg-[#128C7E] rounded-full flex items-center justify-center text-white">
                  <Send size={14} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-2 text-emerald-500 font-black text-sm mb-2">
              <CheckCircle2 size={16} />
              Preview em Tempo Real
            </div>
            <p className="text-xs text-gray-400 font-medium">Assim é como o responsável verá a mensagem.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
