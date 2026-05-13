'use client'

import { MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'

export function WhatsAppButton() {
  const whatsappUrl = "https://wa.me/5511972090986"

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-[999] flex items-center gap-3 bg-[#25D366] text-white px-6 py-4 rounded-full shadow-2xl shadow-green-200 group"
    >
      <div className="relative">
        <MessageSquare size={24} />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#25D366] animate-pulse" />
      </div>
      <span className="font-black text-sm uppercase tracking-widest">WhatsApp</span>
      
      {/* Pulse Effect */}
      <div className="absolute inset-0 bg-[#25D366] rounded-full -z-10 animate-ping opacity-20" />
    </motion.a>
  )
}
