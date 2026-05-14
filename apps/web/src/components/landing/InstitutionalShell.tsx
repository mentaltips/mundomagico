'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Instagram, 
  User, 
  Menu, 
  X, 
  MapPin, 
  Phone,
  Calendar,
  MessageSquare,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import { LoginModal } from './LoginModal'
import { ThemeToggle } from '../ThemeToggle'

export function PublicHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Início', href: '#' },
    { name: 'Sobre', href: '#sobre' },
    { name: 'Serviços', href: '#servicos' },
    { name: 'Planos', href: '#planos' },
    { name: 'Galeria', href: '#galeria' },
    { name: 'Contato', href: '#contato' },
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'py-1 md:py-2' : 'py-1.5 md:py-4'}`}>
      <div className="container mx-auto px-2 md:px-6">
        <nav className={`relative flex items-center justify-between px-3 md:px-6 py-1.5 md:py-3 rounded-[1.5rem] md:rounded-[2.5rem] transition-all duration-500 ${isScrolled ? 'bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl shadow-lg border border-zinc-200/50 dark:border-white/10' : 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shadow-md border border-white/40 dark:border-white/5'}`}>
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-lg md:rounded-xl shadow-md flex items-center justify-center group-hover:rotate-6 transition-transform">
              <span className="text-base md:text-xl font-black text-white italic">M</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base md:text-lg font-black tracking-tight leading-none text-zinc-900 dark:text-white transition-colors">Mundo Mágico</span>
              <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] text-lime-600">Escola & Recreação</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className="text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-sky-500 dark:hover:text-sky-400 transition-all hover:scale-105"
              >
                {link.name}
              </Link>
            ))}
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <Link 
              href="https://wa.me/5511972090986"
              className="px-6 py-3 bg-lime-500 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-lg shadow-lime-200 hover:scale-105 hover:bg-lime-600 transition-all flex items-center gap-2"
            >
              <Calendar size={16} />
              Agendar Visita
            </Link>
            <button 
              onClick={() => setLoginModalOpen(true)}
              className={`px-5 h-10 rounded-full flex items-center justify-center gap-2 border transition-all ${isScrolled ? 'border-sky-200 dark:border-sky-900 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-600 hover:text-white' : 'border-sky-400/30 text-sky-500 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md hover:bg-sky-500 hover:text-white shadow-lg shadow-sky-100/20'}`}
            >
              <User size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Portal da Família</span>
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
            <ThemeToggle />
          </div>

          {/* Mobile Toggle */}
          <button 
            className={`lg:hidden w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg md:rounded-xl ${isScrolled ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} className="md:w-7 md:h-7" /> : <Menu size={20} className="md:w-7 md:h-7" />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white/90 dark:bg-zinc-950/95 backdrop-blur-2xl lg:hidden flex flex-col"
          >
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between px-8 h-24 border-b border-zinc-200 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-black text-white italic shadow-lg shadow-primary/20">M</div>
                <span className="text-xl font-black text-zinc-900 dark:text-white">Mundo Mágico</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white"
              >
                <X size={28} />
              </button>
            </div>

            {/* Mobile Menu Links */}
            <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link 
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-2xl font-black text-zinc-400 dark:text-white/40 hover:text-primary dark:hover:text-primary transition-all hover:translate-x-2 flex items-center justify-between group"
                  >
                    <span>{link.name}</span>
                    <ChevronDown className="-rotate-90 opacity-0 group-hover:opacity-100 transition-all text-primary" size={20} />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Mobile Menu Footer */}
            <div className="p-8 pb-24 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-white/5 space-y-6">
              <div className="grid grid-cols-1 gap-3">
                <Link 
                  href="https://wa.me/5511972090986"
                  className="w-full py-4 bg-lime-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest text-center shadow-lg shadow-lime-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <Calendar size={18} />
                  Agendar Visita
                </Link>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setLoginModalOpen(true)
                  }}
                  className="w-full py-4 bg-sky-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest text-center shadow-lg shadow-sky-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <User size={18} />
                  Portal da Família
                </button>
              </div>
              
              <div className="flex justify-start items-center gap-6 text-zinc-500 pt-2">
                <div className="flex gap-4">
                  <Link href="#" className="w-10 h-10 bg-zinc-100 dark:bg-white/5 rounded-xl flex items-center justify-center hover:text-primary dark:hover:text-white transition-colors">
                    <Instagram size={20} />
                  </Link>
                  <Link href="#" className="w-10 h-10 bg-zinc-100 dark:bg-white/5 rounded-xl flex items-center justify-center hover:text-primary dark:hover:text-white transition-colors">
                    <MessageSquare size={20} />
                  </Link>
                </div>
                <div className="w-px h-6 bg-zinc-200 dark:bg-white/5" />
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-white pt-24 pb-12 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-lime-500 to-rose-500" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Brand */}
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center">
                <span className="text-3xl font-black text-primary">M</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-white">Mundo Mágico</span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-400">Cajamar • SP</span>
              </div>
            </div>
            <p className="text-zinc-400 font-medium leading-relaxed">
              O lugar onde o aprendizado e a diversão se encontram em um ambiente seguro e acolhedor para o seu pequeno.
            </p>
            <div className="flex gap-4">
              {[Instagram, MessageSquare].map((Icon, i) => (
                <Link key={i} href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white">
                  <Icon size={20} />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-black mb-8 text-white uppercase tracking-widest">Navegação</h4>
            <ul className="flex flex-col gap-4">
              {['Sobre nós', 'Nossos Planos', 'Galeria de Fotos', 'Portal do Aluno', 'Contato'].map((item) => (
                <li key={item}>
                  <Link 
                    href={item === 'Portal do Aluno' ? 'http://localhost:3001/login' : '#'} 
                    className="text-zinc-400 hover:text-primary transition-colors font-bold text-sm"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-black mb-8 text-white uppercase tracking-widest">Contato</h4>
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <MapPin className="text-lime-400 shrink-0" size={20} />
                <span className="text-zinc-400 text-sm font-bold leading-relaxed">
                  Av. das Palmeiras, 123<br />Portal dos Ipês, Cajamar - SP
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="text-primary shrink-0" size={20} />
                <span className="text-zinc-400 text-sm font-bold">(11) 97209-0986</span>
              </div>
            </div>
          </div>

          {/* Newsletter/CTA */}
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
            <h4 className="text-lg font-black mb-4 text-white">Fale conosco</h4>
            <p className="text-xs text-zinc-400 mb-8 font-bold leading-relaxed">
              Tire suas dúvidas agora mesmo via WhatsApp.
            </p>
            <Link 
              href="https://wa.me/5511972090986"
              className="w-full py-4 bg-lime-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-lime-600 transition-all shadow-lg shadow-lime-900/20"
            >
              CHAMAR NO WHATS
            </Link>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
            © 2024 Mundo Mágico • Todos os direitos reservados.
          </p>
          <div className="flex gap-8">
            <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Privacidade</span>
            <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Termos</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
