import Link from 'next/link'
import { Shield, Lock, Eye, FileText, ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidade | Mundo Mágico',
  description: 'Saiba como cuidamos dos seus dados e garantimos a segurança da sua família.',
}

export default function PrivacyPage() {
  const lastUpdate = '14 de Maio de 2026'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary/20">
      {/* Header Fixo */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors font-bold text-sm">
            <ChevronLeft size={20} /> Voltar ao Site
          </Link>
          <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
            <Shield className="text-primary" size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Ambiente Seguro</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        {/* Hero Section */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6">
            Política de <span className="text-primary">Privacidade</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">
            Na Mundo Mágico, a segurança dos seus filhos e a proteção dos seus dados são nossas prioridades absolutas. 
            Esta política explica como coletamos, usamos e protegemos suas informações conforme a LGPD.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-slate-400 font-bold uppercase tracking-wider">
            <Clock size={16} /> Última atualização: {lastUpdate}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-12">
          <Section 
            icon={<Eye size={24} />} 
            title="1. Quais dados coletamos?"
            content="Coletamos apenas as informações essenciais para a prestação de nossos serviços educacionais e de segurança, incluindo: nomes dos responsáveis e alunos, dados de contato, registros de entrada/saída (check-in) e informações de saúde relevantes para o cuidado diário."
          />

          <Section 
            icon={<Lock size={24} />} 
            title="2. Como usamos seus dados?"
            content="Seus dados são utilizados exclusivamente para: garantir a segurança no controle de acesso, enviar comunicados importantes via portal e WhatsApp, gerenciar faturas e mensalidades, e manter o histórico pedagógico e de saúde do aluno."
          />

          <Section 
            icon={<Shield size={24} />} 
            title="3. Segurança e Armazenamento"
            content="Utilizamos criptografia de ponta a ponta e servidores seguros para armazenar todas as informações. O acesso é restrito apenas a funcionários autorizados e aos respectivos responsáveis legais através de autenticação segura."
          />

          <Section 
            icon={<FileText size={24} />} 
            title="4. Seus Direitos (LGPD)"
            content="Você tem o direito de acessar, corrigir ou solicitar a exclusão de seus dados pessoais a qualquer momento através do nosso portal administrativo ou enviando um e-mail para nossa equipe de suporte."
          />
        </div>

        {/* Footer info */}
        <div className="mt-24 p-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
          <h3 className="font-black text-slate-900 mb-4">Dúvidas sobre seus dados?</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Se você tiver qualquer pergunta sobre como lidamos com a sua privacidade, entre em contato com nosso Encarregado de Dados (DPO).
          </p>
          <Link href="mailto:contato@mundomagicocajamar.com.br" className="btn-primary inline-flex">
            Contatar Suporte
          </Link>
        </div>
      </main>

      <footer className="py-12 border-t border-slate-200 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          &copy; 2026 Mundo Mágico Cajamar - Todos os direitos reservados.
        </p>
      </footer>
    </div>
  )
}

function Section({ icon, title, content }: { icon: any, title: string, content: string }) {
  return (
    <div className="flex gap-6 group">
      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-300 text-slate-400 group-hover:text-primary">
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{title}</h2>
        <p className="text-slate-600 font-medium leading-relaxed italic border-l-2 border-slate-100 pl-4">
          {content}
        </p>
      </div>
    </div>
  )
}

function Clock({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  )
}
