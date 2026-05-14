'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Delay para não aparecer de cara e "assustar" o usuário
      const timer = setTimeout(() => setIsVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[100] animate-in slide-in-from-bottom-10 duration-700">
      <div className="max-w-4xl mx-auto bg-card/80 backdrop-blur-xl border border-primary/20 shadow-2xl shadow-primary/10 rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center shrink-0">
          <ShieldCheck size={32} />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-lg font-black text-foreground mb-1">Privacidade & Cookies</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nós utilizamos cookies e tecnologias semelhantes para melhorar sua experiência, analisar o tráfego e garantir a segurança dos dados das crianças e alunos, tudo em conformidade com a <strong>LGPD</strong>.
          </p>
          <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-4">
            <Link 
              href="/privacy-policy" 
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
            >
              Política de Privacidade <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleAccept}
            className="flex-1 md:flex-none btn-primary px-10 py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            Aceitar e Continuar
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="w-14 h-14 bg-muted hover:bg-muted/80 text-muted-foreground rounded-2xl flex items-center justify-center transition-colors"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
