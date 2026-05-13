'use client'

import { motion } from 'framer-motion'
import { 
  AlertCircle, MessageSquare, ClipboardCheck, Users, 
  CreditCard, Smartphone, CheckCircle2, ShieldCheck, 
  LayoutDashboard, Zap, Clock, HeartPulse
} from 'lucide-react'

const problems = [
  {
    icon: <Users className="w-8 h-8 text-red-500" />,
    title: "Grupos de WhatsApp bagunçados",
    description: "Recados importantes se perdem em meio a centenas de mensagens dos pais."
  },
  {
    icon: <ClipboardCheck className="w-8 h-8 text-red-500" />,
    title: "Excesso de papel e burocracia",
    description: "Controle de presença, alimentação e rotina em agendas físicas é lento e ineficiente."
  },
  {
    icon: <AlertCircle className="w-8 h-8 text-red-500" />,
    title: "Pais ansiosos por notícias",
    description: "Sua equipe perde tempo respondendo individualmente como cada criança está."
  },
  {
    icon: <CreditCard className="w-8 h-8 text-red-500" />,
    title: "Financeiro fora de controle",
    description: "Inadimplência alta e dificuldade para gerenciar mensalidades e taxas extras."
  }
]

const solutions = [
  {
    icon: <Users className="w-6 h-6" />,
    title: "Gestão de Alunos",
    description: "Fichas completas com histórico, documentos e contatos de emergência."
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Comunicados & WhatsApp",
    description: "Envie avisos individuais ou para toda a turma com templates prontos."
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Diário da Criança",
    description: "Registre sono, alimentação e higiene em segundos pelo celular."
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Entrada & Saída",
    description: "Controle rigoroso de quem retira a criança, com foto e autorização."
  },
  {
    icon: <HeartPulse className="w-6 h-6" />,
    title: "Saúde & Medicação",
    description: "Alertas automáticos para horários de remédios e alergias cadastradas."
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "Financeiro Inteligente",
    description: "Emissão de boletos, controle de caixa e relatórios de inadimplência."
  },
  {
    icon: <LayoutDashboard className="w-6 h-6" />,
    title: "Dashboard em Tempo Real",
    description: "Visão completa da sua instituição em um painel moderno e intuitivo."
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Matrícula Online",
    description: "Digitalize o processo de entrada e reduza a papelada na secretaria."
  }
]

export function ProblemSection() {
  return (
    <section className="py-24 bg-gray-50/50">
      <div className="container mx-auto px-4 text-center mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-black text-gray-900 mb-4"
        >
          Chega de planilhas, grupos bagunçados <br /> <span className="text-indigo-600">e recados perdidos.</span>
        </motion.h2>
        <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto">
          Sabemos que gerenciar uma instituição de ensino infantil é um desafio constante. 
          O Gestão Kids & School foi feito para resolver suas maiores dores.
        </p>
      </div>

      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {problems.map((problem, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="mb-6 p-4 bg-red-50 rounded-2xl w-fit group-hover:scale-110 transition-transform">
              {problem.icon}
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-3">{problem.title}</h3>
            <p className="text-gray-500 font-medium leading-relaxed">{problem.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export function SolutionSection() {
  return (
    <section className="py-24 overflow-hidden">
      <div className="container mx-auto px-4 text-center mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-black text-gray-900 mb-4"
        >
          Tudo que sua instituição precisa, <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">em uma plataforma centralizada.</span>
        </motion.h2>
      </div>

      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {solutions.map((solution, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col items-start p-6 rounded-3xl hover:bg-indigo-50/50 transition-colors group cursor-default"
          >
            <div className="mb-4 p-3 bg-indigo-100 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
              {solution.icon}
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">{solution.title}</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">{solution.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
