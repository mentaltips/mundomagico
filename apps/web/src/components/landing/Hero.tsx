'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, CheckCircle2, MessageSquare, Users, TrendingUp } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative pt-24 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-violet-100/50 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm mb-6 border border-indigo-100"
            >
              <Sparkles className="w-4 h-4" />
              Para escolas, creches e espaços infantis
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6"
            >
              Gestão escolar e rotina infantil em um <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">só sistema inteligente.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-600 font-medium mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              Organize alunos, responsáveis, comunicados, financeiro, presença, rotina diária e WhatsApp em uma plataforma simples, moderna e segura.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <button className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all group flex items-center justify-center gap-2">
                Agendar demonstração
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border-2 border-gray-100 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all">
                Ver recursos
              </button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6 text-sm text-gray-400 font-medium"
            >
              Sem instalação. Interface simples. Pronto para escola, creche ou berçário.
            </motion.p>
          </div>

          {/* Visual Mockup */}
          <div className="flex-1 relative w-full max-w-[600px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative bg-white rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.1)] border border-gray-100 p-6 overflow-hidden"
            >
              {/* Fake Sidebar / Dashboard Header */}
              <div className="flex items-center justify-between mb-8 pb-4 border-bottom border-gray-50">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="h-4 w-32 bg-gray-100 rounded-full" />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                  <Users className="w-6 h-6 text-indigo-600 mb-2" />
                  <div className="text-2xl font-black text-indigo-900">42</div>
                  <div className="text-xs font-bold text-indigo-600 uppercase">Crianças presentes</div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <MessageSquare className="w-6 h-6 text-emerald-600 mb-2" />
                  <div className="text-2xl font-black text-emerald-900">128</div>
                  <div className="text-xs font-bold text-emerald-600 uppercase">Mensagens enviadas</div>
                </div>
              </div>

              {/* Daily Reports Progress */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-bold text-gray-700">Diários finalizados</span>
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">85% concluído</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
                </div>
              </div>

              {/* Revenue Card (Mini) */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase mb-1">Receita Mensal</div>
                  <div className="text-xl font-black text-gray-900">R$ 24.850</div>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              </div>

              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 z-20"
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-black text-gray-900 leading-none">Pagamento</div>
                  <div className="text-[10px] font-bold text-emerald-600 uppercase mt-1">Confirmado</div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 z-20"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                  💊
                </div>
                <div>
                  <div className="text-sm font-black text-gray-900 leading-none">Medicação</div>
                  <div className="text-[10px] font-bold text-amber-600 uppercase mt-1">Pendente</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
