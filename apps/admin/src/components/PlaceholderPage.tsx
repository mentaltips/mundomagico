'use client'

import { motion } from 'framer-motion'
import { Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description: string
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="p-8 md:p-12 h-full flex flex-col items-center justify-center text-center animate-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md"
      >
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-100/50">
          <Construction size={40} />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
          Página em <span className="text-indigo-600">Construção</span>
        </h1>
        <p className="text-gray-500 font-medium mb-8">
          Estamos trabalhando no módulo de <span className="font-bold text-gray-900">{title}</span>. 
          {description}
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
            Me avise quando pronto
          </button>
          <button className="px-8 py-3 bg-white border border-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-50 transition-all">
            Voltar
          </button>
        </div>
      </motion.div>
    </div>
  )
}
