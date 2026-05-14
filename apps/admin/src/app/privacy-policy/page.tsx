'use client'

import React from 'react'
import { Shield, Lock, Eye, FileText, ChevronLeft, Clock, Users } from 'lucide-react'
import Link from 'next/link'

export default function PublicPrivacyPolicyPage() {
  const lastUpdate = 'Maio de 2026'

  const sections = [
    {
      icon: <Shield className="text-primary" />,
      title: "Proteção de Dados",
      content: "Todos os dados de alunos, pais e colaboradores são criptografados e armazenados em servidores seguros. Seguimos rigorosamente as diretrizes da LGPD (Lei Geral de Proteção de Dados)."
    },
    {
      icon: <Eye className="text-primary" />,
      title: "Transparência",
      content: "Coletamos apenas os dados necessários para a gestão escolar, como histórico de saúde, frequência e informações financeiras. Você tem o direito de solicitar a exclusão de seus dados a qualquer momento."
    },
    {
      icon: <Users className="text-primary" />,
      title: "Uso das Informações",
      content: "As informações são utilizadas exclusivamente para a comunicação entre escola e família, segurança na entrada/saída e relatórios pedagógicos. Jamais vendemos seus dados para terceiros."
    }
  ]

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-primary/20 p-6 md:p-12">
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Style Admin */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
                <FileText size={24} />
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
                Política de <span className="text-primary">Privacidade</span>
              </h1>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl">
              Entenda como protegemos as informações da sua instituição e das famílias, em conformidade com a LGPD.
            </p>
          </div>
          
          <Link href="/login" className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors font-bold text-sm bg-white dark:bg-zinc-900 px-6 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm self-start md:self-center">
            <ChevronLeft size={18} /> Voltar ao Login
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-zinc-200/50 dark:shadow-black/40 space-y-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white">Compromisso Mundo Mágico</h3>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
              A segurança das crianças é a nossa prioridade número um. Isso se estende ao mundo digital. 
              Nossa plataforma foi construída com "Privacy by Design", o que significa que a proteção 
              da privacidade está integrada em cada linha de código que escrevemos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sections.map((s, i) => (
              <div key={i} className="p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 space-y-4 hover:border-primary/30 transition-all group">
                <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  {s.icon}
                </div>
                <h4 className="font-black text-zinc-900 dark:text-white">{s.title}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{s.content}</p>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black">
                1.0
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Versão do Documento</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Atualizado em {lastUpdate}</p>
              </div>
            </div>
            <button className="bg-primary text-white px-8 py-3 rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all">
              Baixar PDF Completo
            </button>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Dúvidas sobre seus dados? Entre em contato com nosso Encarregado de Dados (DPO) em <span className="text-primary font-bold">dpo@mundomagico.com.br</span>
          </p>
        </div>
      </div>
    </div>
  )
}
