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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'py-2' : 'py-4'}`}>
      <div className="container mx-auto px-6">
        <nav className={`relative flex items-center justify-between px-6 py-3 rounded-[2rem] transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-xl shadow-lg border border-white/20' : 'bg-white/80 backdrop-blur-md shadow-md border border-white/40'}`}>
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-xl shadow-md flex items-center justify-center group-hover:rotate-6 transition-transform">
              <span className="text-xl font-black text-white italic">M</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight leading-none text-gray-900">Mundo Mágico</span>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-lime-600">Escola & Recreação</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className="text-[11px] font-black uppercase tracking-widest text-gray-600 hover:text-sky-500 transition-all hover:scale-105"
              >
                {link.name}
              </Link>
            ))}
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
              className={`px-5 h-10 rounded-full flex items-center justify-center gap-2 border transition-all ${isScrolled ? 'border-sky-200 text-sky-600 bg-sky-50 hover:bg-sky-600 hover:text-white' : 'border-sky-400/30 text-sky-500 bg-white/60 backdrop-blur-md hover:bg-sky-500 hover:text-white shadow-lg shadow-sky-100/20'}`}
            >
              <User size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Portal da Família</span>
            </button>
          </div>

          {/* Mobile Toggle */}
          <button 
            className={`lg:hidden w-10 h-10 flex items-center justify-center rounded-xl ${isScrolled ? 'text-gray-900' : 'text-white'}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-gray-100 shadow-2xl p-8 lg:hidden"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl font-black text-gray-900 hover:text-sky-500 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <hr className="border-gray-100" />
              <div className="flex flex-col gap-4">
                <Link 
                  href="https://wa.me/5511972090986"
                  className="w-full py-5 bg-lime-500 text-white rounded-2xl font-black text-center shadow-xl shadow-lime-100"
                >
                  AGENDAR VISITA AGORA
                </Link>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setLoginModalOpen(true)
                  }}
                  className="w-full py-5 bg-sky-500 text-white rounded-2xl font-black text-center shadow-xl shadow-sky-100 flex items-center justify-center gap-3"
                >
                  <User size={20} />
                  PORTAL DA FAMÍLIA
                </button>
                <div className="flex justify-center gap-6 text-gray-400">
                  <Instagram size={24} />
                  <MessageSquare size={24} />
                </div>
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
            <p className="text-gray-400 font-medium leading-relaxed">
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
                    className="text-gray-400 hover:text-primary transition-colors font-bold text-sm"
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
                <span className="text-gray-400 text-sm font-bold leading-relaxed">
                  Av. das Palmeiras, 123<br />Portal dos Ipês, Cajamar - SP
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="text-primary shrink-0" size={20} />
                <span className="text-gray-400 text-sm font-bold">(11) 97209-0986</span>
              </div>
            </div>
          </div>

          {/* Newsletter/CTA */}
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
            <h4 className="text-lg font-black mb-4 text-white">Fale conosco</h4>
            <p className="text-xs text-gray-400 mb-8 font-bold leading-relaxed">
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
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            © 2024 Mundo Mágico • Todos os direitos reservados.
          </p>
          <div className="flex gap-8">
            <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Privacidade</span>
            <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Termos</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
