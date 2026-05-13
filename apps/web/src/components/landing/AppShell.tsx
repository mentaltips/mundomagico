'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Menu, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Soluções', href: '#solutions' },
    { name: 'Recursos', href: '#features' },
    { name: 'Planos', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
  ]

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-lg border-b border-gray-100 py-3' : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-10 w-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center text-white transform group-hover:rotate-6 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black text-gray-900 tracking-tight">Gestão<span className="text-indigo-600">Kids</span></span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              className="text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <Link 
            href="/login" 
            className="px-6 py-2 text-sm font-black text-gray-700 hover:text-indigo-600 transition-colors"
          >
            Entrar
          </Link>
          <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all">
            Agendar demonstração
          </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden p-2 text-gray-900"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-8 flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className="text-xl font-black text-gray-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="border-gray-100" />
              <Link href="/login" className="text-xl font-black text-gray-900">Entrar</Link>
              <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl">
                Agendar demonstração
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-gray-900 tracking-tight">Gestão<span className="text-indigo-600">Kids</span></span>
            </Link>
            <p className="text-gray-500 font-medium leading-relaxed mb-6">
              A plataforma definitiva para gestão de escolas, creches e espaços infantis. 
              Organização, transparência e cuidado em cada detalhe.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Produto</h4>
            <ul className="space-y-4">
              <li><Link href="#features" className="text-gray-500 font-bold hover:text-indigo-600 transition-colors">Recursos</Link></li>
              <li><Link href="#solutions" className="text-gray-500 font-bold hover:text-indigo-600 transition-colors">Soluções</Link></li>
              <li><Link href="#pricing" className="text-gray-500 font-bold hover:text-indigo-600 transition-colors">Preços</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Empresa</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-gray-500 font-bold hover:text-indigo-600 transition-colors">Sobre nós</Link></li>
              <li><Link href="#" className="text-gray-500 font-bold hover:text-indigo-600 transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-gray-500 font-bold hover:text-indigo-600 transition-colors">Contato</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-gray-500 font-bold hover:text-indigo-600 transition-colors">Privacidade</Link></li>
              <li><Link href="#" className="text-gray-500 font-bold hover:text-indigo-600 transition-colors">Termos</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400 font-medium">
          <p>© 2026 Gestão Kids & School. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-gray-600 transition-colors">Instagram</Link>
            <Link href="#" className="hover:text-gray-600 transition-colors">LinkedIn</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
