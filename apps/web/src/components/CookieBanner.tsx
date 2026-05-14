'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[100] animate-in slide-in-from-bottom-10 duration-1000">
      <div className="max-w-4xl mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center shrink-0">
          <ShieldCheck size={32} />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1">Privacidade & Experiência</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Olá! Usamos cookies para entender como você interage com nosso site e melhorar sua experiência mágica conosco, sempre cuidando dos seus dados conforme a <strong>LGPD</strong>.
          </p>
          <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-4">
            <Link 
              href="/privacy" 
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
            >
              Nossa Política de Privacidade <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleAccept}
            className="flex-1 md:flex-none bg-primary text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
          >
            Entendi, Aceitar
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="w-14 h-14 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-2xl flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
