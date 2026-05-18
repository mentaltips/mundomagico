'use client'

import { Shield, Lock, Eye, Users, FileText } from 'lucide-react'
import { PageHeader } from '@/components/ui'

export default function PrivacyPolicyPage() {
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
    <div className="page max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader 
        title="Política de Privacidade & LGPD" 
        subtitle="Entenda como protegemos as informações da sua instituição e das famílias."
        icon={<FileText size={24} />}
      />

      <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-12">
        <div className="space-y-4">
          <h3 className="text-2xl font-black text-foreground">Compromisso Mundo Mágico</h3>
          <p className="text-muted-foreground leading-relaxed">
            A segurança das crianças é a nossa prioridade número um. Isso se estende ao mundo digital. 
            Nossa plataforma foi construída com &quot;Privacy by Design&quot;, o que significa que a proteção 
            da privacidade está integrada em cada linha de código que escrevemos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sections.map((s, i) => (
            <div key={i} className="p-6 rounded-3xl bg-accent/20 border border-border space-y-4 hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center shadow-sm">
                {s.icon}
              </div>
              <h4 className="font-black text-foreground">{s.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black">
              1.0
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Versão do Documento</p>
              <p className="text-sm font-bold text-foreground">Atualizado em Maio de 2026</p>
            </div>
          </div>
          <button className="btn-primary px-8 py-3 rounded-xl text-sm font-black shadow-lg shadow-primary/10">
            Baixar PDF Completo
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          Dúvidas sobre seus dados? Entre em contato com nosso Encarregado de Dados (DPO) em <span className="text-primary font-bold">dpo@mundomagico.com.br</span>
        </p>
      </div>
    </div>
  )
}
