'use client'

import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Sparkles, ArrowRight, Lock, Mail, Loader2, AlertCircle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/admin/dashboard'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (res?.error) {
        setError('E-mail ou senha incorretos. Verifique suas credenciais.')
        setLoading(false)
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar entrar. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFE] flex flex-col items-center justify-center p-6 selection:bg-rose-100 selection:text-rose-900 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-rose-100/40 rounded-full blur-[120px] -mr-[10%] -mt-[10%] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-lime-100/40 rounded-full blur-[120px] -ml-[10%] -mb-[10%] pointer-events-none" />
      
      <div className="w-full max-w-[460px] relative z-10">
        {/* Header/Logo */}
        <div className="text-center mb-12">
          <Link href="https://mundomagicocajamar.com.br" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-full text-xs font-black text-gray-400 uppercase tracking-widest mb-10 hover:text-gray-900 transition-colors group">
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Voltar ao Site
          </Link>
          
          <div className="h-20 w-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-6 transform hover:rotate-6 transition-transform">
             <div className="h-12 w-12 bg-gradient-to-tr from-primary to-lime-500 rounded-xl flex items-center justify-center text-white">
                <span className="text-2xl font-black italic">M</span>
             </div>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tightest mb-2">Portal de <span className="text-primary italic">Acesso</span></h1>
          <p className="text-gray-500 font-medium italic text-lg">Mundo Mágico</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-2xl shadow-lime-100/50 border border-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
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
                  className="w-full pl-14 pr-4 py-5 bg-gray-50 border-transparent border-2 rounded-[2rem] focus:bg-white focus:border-primary focus:ring-0 text-gray-900 font-bold transition-all placeholder:text-gray-300 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Senha</label>
                <button type="button" className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest transition-colors">Esqueci a senha</button>
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
                  className="w-full pl-14 pr-4 py-5 bg-gray-50 border-transparent border-2 rounded-[2rem] focus:bg-white focus:border-primary focus:ring-0 text-gray-900 font-bold transition-all placeholder:text-gray-300 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-gray-200 hover:bg-primary hover:-translate-y-1 transition-all disabled:opacity-70 flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  Entrar no Portal
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Help Info */}
        <div className="mt-12 text-center">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Problemas no acesso?</p>
          <Link href="https://wa.me/5511972090986" className="inline-flex items-center gap-2 text-rose-500 font-black text-sm uppercase tracking-widest hover:underline">
            <Sparkles size={16} />
            Falar com a Secretaria
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFE]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
