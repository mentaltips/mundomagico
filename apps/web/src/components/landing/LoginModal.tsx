'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Mail, Lock, Loader2, 
  AlertCircle, ArrowRight, Sparkles,
  ChevronLeft
} from 'lucide-react'
import { signIn } from 'next-auth/react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('E-mail ou senha incorretos.')
        setLoading(false)
      } else {
        // Successful login - Redirect to the admin portal
        window.location.href = 'http://localhost:3001/admin'
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar entrar. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[70] p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-[460px] bg-white rounded-[3.5rem] shadow-2xl relative overflow-hidden pointer-events-auto"
            >
              {/* Background Decor */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-rose-100/40 rounded-full blur-[80px] -mr-10 -mt-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-lime-100/40 rounded-full blur-[80px] -ml-10 -mb-10 pointer-events-none" />

              <button 
                onClick={onClose}
                className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-900 transition-colors z-20"
              >
                <X size={24} />
              </button>

              <div className="p-10 md:p-14 relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
                  <div className="h-16 w-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-6 transform hover:rotate-6 transition-transform border border-gray-50">
                    <div className="h-10 w-10 bg-gradient-to-tr from-primary to-secondary rounded-lg flex items-center justify-center text-white">
                      <span className="text-xl font-black italic">M</span>
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tightest mb-2">Portal da <span className="text-primary italic">Família</span></h2>
                  <p className="text-gray-500 font-medium italic text-sm">Acompanhe cada descoberta.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-xs flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span className="font-bold leading-tight">{error}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">E-mail</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-300 group-focus-within:text-primary transition-colors">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-14 pr-4 py-4 bg-gray-50 border-transparent border-2 rounded-[1.5rem] focus:bg-white focus:border-primary/20 focus:text-primary transition-all placeholder:text-gray-300 outline-none text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Senha</label>
                      <button type="button" className="text-[10px] font-black text-secondary hover:text-primary uppercase tracking-widest transition-colors">Esqueci</button>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-300 group-focus-within:text-primary transition-colors">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-14 pr-4 py-4 bg-gray-50 border-transparent border-2 rounded-[1.5rem] focus:bg-white focus:border-primary/20 focus:text-primary transition-all placeholder:text-gray-300 outline-none text-sm font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 text-white py-4 rounded-[1.5rem] font-black text-lg shadow-xl shadow-gray-100 hover:bg-primary hover:-translate-y-1 transition-all disabled:opacity-70 flex items-center justify-center gap-3 group mt-4"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Entrar no Portal
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                {/* Help Info */}
                <div className="mt-10 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Problemas no acesso?</p>
                  <a href="https://wa.me/5511972090986" className="inline-flex items-center gap-2 text-secondary font-black text-xs uppercase tracking-widest hover:text-primary transition-colors">
                    <Sparkles size={14} />
                    Falar com a Secretaria
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
