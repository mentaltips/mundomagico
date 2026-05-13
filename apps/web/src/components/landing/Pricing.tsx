'use client'

import { motion } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'

const plans = [
  {
    name: "Essencial",
    price: "197",
    description: "Para começar a organizar a instituição.",
    features: [
      "Alunos e Crianças ilimitados",
      "Gestão de Responsáveis",
      "Comunicados Básicos",
      "Portal dos Pais",
      "Documentos Básicos"
    ],
    cta: "Começar com Essencial",
    highlight: false
  },
  {
    name: "Profissional",
    price: "347",
    description: "Para escolas e creches que querem automação.",
    features: [
      "Tudo do Essencial",
      "WhatsApp Integrado",
      "Diário da Criança Digital",
      "Financeiro Completo",
      "Matrícula Online",
      "Relatórios de Gestão"
    ],
    cta: "Escolher Profissional",
    highlight: true
  },
  {
    name: "Premium",
    price: "597",
    description: "Para operação completa e crescimento.",
    features: [
      "Tudo do Profissional",
      "CRM de Matrículas",
      "Assinatura Digital",
      "Controle de Entrada/Saída",
      "IA para Mensagens",
      "Suporte VIP 24h"
    ],
    cta: "Falar com consultor",
    highlight: false
  }
]

export function Pricing() {
  return (
    <section className="py-24 bg-white" id="pricing">
      <div className="container mx-auto px-4 text-center mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-black text-gray-900 mb-4"
        >
          Planos que crescem com você
        </motion.h2>
        <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto">
          Escolha o plano ideal para a fase atual da sua instituição.
        </p>
      </div>

      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`relative p-8 rounded-[2.5rem] border-2 transition-all hover:translate-y-[-8px] ${
              plan.highlight 
                ? "border-indigo-600 shadow-2xl shadow-indigo-100 z-10 scale-105" 
                : "border-gray-100 shadow-sm"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-1 rounded-full text-sm font-black uppercase tracking-wider">
                Mais Escolhido
              </div>
            )}

            <h3 className="text-2xl font-black text-gray-900 mb-2">{plan.name}</h3>
            <p className="text-gray-500 font-medium text-sm mb-6">{plan.description}</p>
            
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-sm font-bold text-gray-400">R$</span>
              <span className="text-5xl font-black text-gray-900">{plan.price}</span>
              <span className="text-sm font-bold text-gray-400">/mês</span>
            </div>

            <ul className="space-y-4 mb-10">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                  <div className="bg-indigo-50 p-1 rounded-full text-indigo-600">
                    <Check className="w-3 h-3" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <button className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${
              plan.highlight 
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700" 
                : "bg-gray-50 text-gray-900 hover:bg-gray-100"
            }`}>
              {plan.cta}
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export function FinalCTA() {
  return (
    <section className="py-24 container mx-auto px-4">
      <div className="bg-gradient-to-tr from-indigo-900 to-indigo-700 rounded-[3rem] p-8 md:p-20 text-center relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-300 rounded-full blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
            Pronto para organizar sua <br /> escola ou creche?
          </h2>
          <p className="text-indigo-100 text-lg md:text-xl font-medium mb-12 max-w-2xl mx-auto">
            Centralize gestão, comunicação, rotina diária e financeiro em uma plataforma feita para o dia a dia da sua equipe.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto px-10 py-5 bg-white text-indigo-900 rounded-2xl font-black text-xl shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2">
              Agendar demonstração gratuita
              <ArrowRight className="w-6 h-6" />
            </button>
            <button className="w-full sm:w-auto px-10 py-5 bg-indigo-800 text-white border border-indigo-500 rounded-2xl font-bold text-xl hover:bg-indigo-750 transition-all">
              Ver planos e preços
            </button>
          </div>
          <p className="mt-8 text-indigo-300 text-sm font-medium">
            Interface intuitiva • Suporte em português • Sem fidelidade
          </p>
        </motion.div>
      </div>
    </section>
  )
}
