'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Calendar,
  Bell,
  Clock,
  CheckCircle2,
  Sparkles,
  Users,
  ShieldCheck,
  MessageSquare,
  Smartphone,
  Send,
  AlertCircle,
  Plus,
  Heart,
  Baby,
  Coffee,
  Check,
  UserCheck,
  Volume2,
  Lock,
  Camera,
  Coins,
  BarChart3,
  TrendingUp,
  HelpCircle
} from 'lucide-react'

import { PublicFooter, PublicHeader } from '../../components/landing/InstitutionalShell'
import { WhatsAppButton } from '../../components/landing/WhatsAppButton'

// =========================================================
// DATA STRUCTURES & MOCKS
// =========================================================

const highlights = [
  'Disparos automatizados de entrada e saída',
  'Diário de bordo digital completo por WhatsApp',
  'Agendamento de avisos segmentado por sala',
  'Galeria de fotos com controle de imagem da LGPD',
]

const whatsappSimulations = {
  checkin: {
    label: 'Check-in (Entrada)',
    icon: UserCheck,
    title: 'Confirmação de Entrada',
    color: 'border-emerald-500/30 text-emerald-500 hover:border-emerald-500 bg-emerald-500/5',
    bubbles: [
      { sender: 'school', text: 'Olá, Ana! 🌟 Informamos que o(a) pequeno(a) *Leo* acaba de entrar na escola às *07:45*.', time: '07:45' },
      { sender: 'school', text: '• Entregue por: *Ana Santos (Mãe)*\n• Status: Portaria Liberada 🔐\n\nTenha um excelente dia! 🎒🪄', time: '07:46' }
    ],
    interactiveOptions: [
      { label: 'Simular resposta da mãe: "Obrigada!"', replyText: 'Perfeito! Muito obrigada pelo aviso. 🥰', botReaction: 'Imaginamos que você gostaria de saber! Tenha um ótimo dia de trabalho! ❤️' }
    ]
  },
  checkout: {
    label: 'Check-out (Saída)',
    icon: ShieldCheck,
    title: 'Aviso de Saída Seguro',
    color: 'border-sky-500/30 text-sky-500 hover:border-sky-500 bg-sky-500/5',
    bubbles: [
      { sender: 'school', text: 'Olá, Ana! 👋 Informamos que o(a) pequeno(a) *Leo* saiu da escola às *17:30*.', time: '17:30' },
      { sender: 'school', text: '• Retirado por: *Carlos Santos (Pai)*\n• Autorização: Conferida via QR Code 🔒\n\nTenha uma ótima noite e nos vemos amanhã!', time: '17:31' }
    ],
    interactiveOptions: [
      { label: 'Simular resposta: "Chegaram bem?"', replyText: 'Obrigada! Eles já chegaram em casa? 🏡', botReaction: 'Sim! Carlos nos confirmou a saída tranquila. Qualquer dúvida estamos à disposição. ✨' }
    ]
  },
  diary: {
    label: 'Diário de Rotina',
    icon: Coffee,
    title: 'Diário de Bordo Digital',
    color: 'border-amber-500/30 text-amber-500 hover:border-amber-500 bg-amber-500/5',
    bubbles: [
      { sender: 'school', text: 'Olá, Ana! 📝 O diário de bordo do(a) *Leo* já está disponível!', time: '17:05' },
      { sender: 'school', text: '• Alimentação: Comeu tudo (Excelente) 🥣\n• Sono: Dormiu 1h30m (Tranquilo) 😴\n• Humor: Alegre e comunicativo 😊\n• Atividades: Pintura com tinta guache 🎨\n\nVer detalhes completos no portal:\n👉 _mundomagico.com/portal/leo_', time: '17:05' }
    ],
    interactiveOptions: [
      { label: 'Simular resposta: "Lindo desenho!"', replyText: 'Que lindo! Ele amou pintar hoje? 🎨🎨', botReaction: 'Sim! Ele se divertiu muito misturando as cores azul e amarelo para fazer verde! 🪄' }
    ]
  },
  photos: {
    label: 'Fotos do Dia',
    icon: Sparkles,
    title: 'Galeria Mágica de Fotos',
    color: 'border-pink-500/30 text-pink-500 hover:border-pink-500 bg-pink-500/5',
    bubbles: [
      { sender: 'school', text: 'Olá, Ana! 📸 A equipe de educadores postou novas fotos da rotina de hoje!', time: '15:20' },
      { sender: 'school', text: 'Dê uma olhada nos momentos especiais do(a) *Leo*:\n👉 _mundomagico.com/portal/leo/fotos_\n\n_Apenas responsáveis autorizados têm acesso à nossa galeria privada. 🔒_', time: '15:21' }
    ],
    interactiveOptions: [
      { label: 'Simular resposta: "Amei as fotos!"', replyText: 'Estou apaixonada pelas fotos dele brincando! 😍', botReaction: 'Ficamos extremamente felizes! A professora Fernanda tirou com muito carinho. ❤️' }
    ]
  },
  replenish: {
    label: 'Aviso de Higiene',
    icon: AlertCircle,
    title: 'Reposição Inteligente',
    color: 'border-rose-500/30 text-rose-500 hover:border-rose-500 bg-rose-500/5',
    bubbles: [
      { sender: 'school', text: 'Atenção, Ana! ⚠️', time: '16:15' },
      { sender: 'school', text: 'Identificamos que o estoque de *Fraldas G* do(a) *Leo* está chegando ao fim (restam apenas 2 unidades na mochila).\n\nPedimos a gentileza de enviar um novo pacote amanhã. Obrigado! 🎒👶', time: '16:16' }
    ],
    interactiveOptions: [
      { label: 'Simular resposta: "Vou levar!"', replyText: 'Pode deixar, amanhã mesmo levo na mochila! 👍', botReaction: 'Combinado! Muito obrigado pela parceria e apoio rápido de sempre. ❤️' }
    ]
  }
}

const initialEvents = [
  { id: 1, title: 'Reunião de Pais: Desenvolvimento', target: 'Maternal A & B', date: '19/05/2026', time: '19:00', type: 'EVENTO', status: 'AGENDADO' },
  { id: 2, title: 'Piquenique da Primavera no Bosque', target: 'Toda a Escola', date: '22/05/2026', time: '09:00', type: 'ATIVIDADE', status: 'AGENDADO' },
  { id: 3, title: 'Aviso Importante: Recesso Escolar', target: 'Toda a Escola', date: '28/05/2026', time: '08:00', type: 'AVISO', status: 'ENVIADO' }
]

export default function ApresentacaoPage() {
  const [activeWppTab, setActiveWppTab] = useState<keyof typeof whatsappSimulations>('checkin')
  const [currentBubbles, setCurrentBubbles] = useState<any[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [tickerStats, setTickerStats] = useState(statsInitial)
  const [activeOptionUsed, setActiveOptionUsed] = useState<number | null>(null)

  // Interactive Dashboard Switcher States
  const [dashboardRole, setDashboardRole] = useState<'admin' | 'teacher' | 'parent'>('admin')
  const [teacherLogs, setTeacherLogs] = useState<any[]>([])
  const [parentPaid, setParentPaid] = useState(false)

  // Notices scheduler state
  const [eventsList, setEventsList] = useState(initialEvents)
  const [newTitle, setNewTitle] = useState('')
  const [newTarget, setNewTarget] = useState('Maternal A')
  const [newDate, setNewDate] = useState('19/05/2026')
  const [newTime, setNewTime] = useState('09:00')
  const [newType, setNewType] = useState('AVISO')
  const [animateSuccess, setAnimateSuccess] = useState(false)

  // Dynamic counter animation for stats
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerStats(prev =>
        prev.map(stat => {
          if (stat.label === 'Notificações Hoje') {
            return { ...stat, value: Math.min(stat.value + Math.floor(Math.random() * 3), 950) }
          }
          return stat
        })
      )
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Trigger conversational flow when WhatsApp tab changes
  useEffect(() => {
    setIsTyping(true)
    setCurrentBubbles([])
    setActiveOptionUsed(null)
    const timer = setTimeout(() => {
      setIsTyping(false)
      setCurrentBubbles(whatsappSimulations[activeWppTab].bubbles)
    }, 800)
    return () => clearTimeout(timer)
  }, [activeWppTab])

  // Simulate conversational exchange (parent clicks response, bot replies)
  const handleSimulateReply = (replyText: string, botReaction: string, index: number) => {
    if (activeOptionUsed !== null) return

    setActiveOptionUsed(index)
    
    // 1. Push user reply
    const newBubbles = [
      ...currentBubbles,
      { sender: 'user', text: replyText, time: '17:35' }
    ]
    setCurrentBubbles(newBubbles)

    // 2. Trigger typing for bot reaction
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setCurrentBubbles([
        ...newBubbles,
        { sender: 'school', text: botReaction, time: '17:36' }
      ])
    }, 1200)
  }

  // Handle Event Creation Simulation
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const newEvent = {
      id: Date.now(),
      title: newTitle,
      target: newTarget,
      date: newDate,
      time: newTime,
      type: newType,
      status: 'AGENDADO' as const
    }

    setEventsList([newEvent, ...eventsList])
    setNewTitle('')
    setAnimateSuccess(true)
    setTimeout(() => setAnimateSuccess(false), 2200)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-zinc-800 dark:text-zinc-100 transition-colors duration-300 selection:bg-primary/20 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]">
      <PublicHeader />
      <WhatsAppButton />

      <main className="pt-24 overflow-hidden">
        {/* =========================================================
            1. HERO SECTION (ULTRA PREMIUM SAAS INTERFACE)
           ========================================================= */}
        <section className="relative pt-16 pb-24 md:py-32 overflow-hidden">
          {/* Institutional Banner Background Image */}
          <div className="absolute inset-0 -z-20 pointer-events-none">
            <Image
              src="/images/banermundomagico.png"
              fill
              priority
              sizes="100vw"
              alt="Mundo Mágico Banner"
              className="absolute inset-0 w-full h-full object-cover object-center hidden md:block opacity-35 dark:opacity-20 select-none pointer-events-none"
            />
            <Image
              src="/images/banne%20rmobile.png"
              fill
              priority
              sizes="100vw"
              alt="Mundo Mágico Banner Mobile"
              className="absolute inset-0 w-full h-full object-cover md:hidden opacity-35 dark:opacity-20 select-none pointer-events-none"
              style={{ objectPosition: 'center 15%' }}
            />
            {/* Elegant glassmorphism and overlay cover for outstanding text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50/70 via-slate-50/90 to-slate-50 dark:from-[#07090e]/80 dark:via-[#07090e]/95 dark:to-[#07090e] backdrop-blur-[3px] md:backdrop-blur-[1px]" />
          </div>

          {/* Neon Floating Blur Backgrounds */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-lime-500/10 via-primary/5 to-sky-500/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute -top-12 right-10 w-80 h-80 bg-pink-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

          {/* Floating Commercial Credibility Badges */}
          <div className="absolute left-[5%] top-[25%] hidden xl:flex items-center gap-3 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 p-3.5 rounded-2xl shadow-xl hover:-translate-y-1 transition-all duration-300 pointer-events-none animate-bounce" style={{ animationDuration: '4s' }}>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-lg">💬</span>
            <div>
              <span className="text-[10px] font-black text-zinc-400 block uppercase tracking-wider">Engajamento Escolar</span>
              <span className="text-xs font-black text-foreground block">98% de adesão dos pais</span>
            </div>
          </div>
          <div className="absolute right-[5%] top-[28%] hidden xl:flex items-center gap-3 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 p-3.5 rounded-2xl shadow-xl hover:-translate-y-1 transition-all duration-300 pointer-events-none animate-bounce" style={{ animationDuration: '6s' }}>
            <span className="p-2 rounded-xl bg-primary/10 text-primary text-lg">⚡</span>
            <div>
              <span className="text-[10px] font-black text-zinc-400 block uppercase tracking-wider">Produtividade Escolar</span>
              <span className="text-xs font-black text-foreground block">10x mais rápido que papel</span>
            </div>
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              {/* Premium Top Announcement Ribbon Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 dark:bg-primary/5 px-4.5 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)] animate-fade-in">
                <Sparkles size={13} className="text-primary animate-pulse" />
                Novidade: Versão 2.0 • Diário de Bordo & Pix Inteligente
              </div>

              {/* Ultra-Premium Headings & Copywriting */}
              <h1 className="mt-8 text-4xl sm:text-6xl md:text-7.5xl font-black tracking-tight leading-[0.95] font-fredoka text-slate-900 dark:text-white">
                Conecte sua Escola com as Famílias do <span className="bg-gradient-to-r from-primary via-lime-500 to-sky-500 bg-clip-text text-transparent">Jeito Certo</span>.
              </h1>

              <p className="mt-6 max-w-2.8xl text-base sm:text-xl text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
                Mundo Mágico integra a segurança da portaria de alunos, o controle financeiro completo com cobrança via Pix e a comunicação instantânea por WhatsApp. Tudo em um painel profissional que as diretoras, professoras e pais adoram usar.
              </p>

              {/* High-End Double Layer Glowing CTA Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center">
                <a
                  href="#whatsapp-tour"
                  className="w-full sm:w-auto px-8 py-5 bg-gradient-to-r from-emerald-500 to-primary hover:from-emerald-400 hover:to-primary text-white dark:text-zinc-950 font-black rounded-2xl text-sm uppercase tracking-widest shadow-2xl hover:shadow-[0_20px_50px_rgba(16,185,129,0.35)] hover:scale-[1.04] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-emerald-400/20"
                >
                  <Smartphone size={18} />
                  Simulador de WhatsApp
                </a>
                <a
                  href="#admin-tour"
                  className="w-full sm:w-auto px-8 py-5 bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-white font-black rounded-2xl text-sm uppercase tracking-widest shadow-lg hover:scale-[1.04] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-zinc-700/40 backdrop-blur-md"
                >
                  <BarChart3 size={18} />
                  Tour do Painel de Controle
                </a>
              </div>

              {/* Trust Indicator Label */}
              <div className="mt-6.5 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <span>⭐ Classificação 4.9/5 estrelas pelas Diretoras</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span>🏢 +100 escolas transformadas</span>
              </div>
            </div>

            {/* HERO HIGHLIGHTS STUNNING GLASS PILLED CARDS */}
            <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
              {highlights.map((item, index) => {
                const colors = [
                  'hover:border-emerald-500/50 hover:shadow-emerald-500/10 hover:text-emerald-500 dark:hover:text-emerald-400',
                  'hover:border-amber-500/50 hover:shadow-amber-500/10 hover:text-amber-500 dark:hover:text-amber-400',
                  'hover:border-indigo-500/50 hover:shadow-indigo-500/10 hover:text-indigo-500 dark:hover:text-indigo-400',
                  'hover:border-pink-500/50 hover:shadow-pink-500/10 hover:text-pink-500 dark:hover:text-pink-400'
                ]
                return (
                  <div
                    key={item}
                    className={`flex items-start gap-3.5 rounded-[1.5rem] border border-zinc-200/80 dark:border-white/5 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-md p-5 shadow-lg hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300 group ${colors[index]}`}
                  >
                    <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <CheckCircle2 size={16} className="text-inherit" />
                    </div>
                    <span className="text-sm font-black leading-snug transition-colors">{item}</span>
                  </div>
                )
              })}
            </div>

            {/* Dashboard Mockup (Floating Glass Window with stunning card layout and role switcher) */}
            <div id="admin-tour" className="mt-20 relative max-w-5xl mx-auto rounded-[2.5rem] border border-zinc-200/60 dark:border-white/10 bg-white/40 dark:bg-[#0c101b]/80 backdrop-blur-2xl shadow-3xl overflow-hidden p-2 md:p-3 hover:border-primary/20 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-sky-500/5 pointer-events-none" />
              
              {/* Window Header */}
              <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-200/60 dark:border-white/5 bg-zinc-50/50 dark:bg-black/30 rounded-t-[2.2rem]">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-500/80 shadow-[0_0_10px_rgba(239,68,68,0.2)]" />
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]" />
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]" />
                </div>
                <div className="px-4 py-1.5 rounded-full bg-zinc-200/60 dark:bg-white/5 border border-zinc-300/40 dark:border-white/5 text-[9px] font-black tracking-widest text-zinc-500 dark:text-zinc-400 uppercase">
                  Mundo Mágico • Tour do Painel de Controle
                </div>
                <div className="w-12" />
              </div>

              {/* Dynamic Interactive Role Switcher Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-zinc-200/60 dark:border-white/5 bg-zinc-50/30 dark:bg-black/10 px-5 py-3.5">
                <button
                  onClick={() => setDashboardRole('admin')}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    dashboardRole === 'admin'
                      ? 'bg-primary text-white dark:text-zinc-950 shadow-md shadow-primary/20 scale-[1.01]'
                      : 'text-zinc-500 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/5'
                  }`}
                >
                  🏢 Diretoria (Admin)
                </button>
                <button
                  onClick={() => setDashboardRole('teacher')}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    dashboardRole === 'teacher'
                      ? 'bg-primary text-white dark:text-zinc-950 shadow-md shadow-primary/20 scale-[1.01]'
                      : 'text-zinc-500 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/5'
                  }`}
                >
                  👩‍🏫 Professora
                </button>
                <button
                  onClick={() => setDashboardRole('parent')}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    dashboardRole === 'parent'
                      ? 'bg-primary text-white dark:text-zinc-950 shadow-md shadow-primary/20 scale-[1.01]'
                      : 'text-zinc-500 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/5'
                  }`}
                >
                  👪 Responsável (Pais)
                </button>
              </div>

              {/* Mock Admin Layout */}
              {dashboardRole === 'admin' && (
                <div className="grid lg:grid-cols-[200px_1fr] min-h-[460px] bg-white dark:bg-[#07090e]/60 rounded-b-[2.2rem] animate-in fade-in duration-300">
                  {/* Sidebar */}
                  <div className="hidden lg:block border-r border-zinc-200/60 dark:border-white/5 p-5 space-y-2">
                    <div className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400 tracking-widest">Geral</div>
                    <button className="w-full text-left px-4 py-3 rounded-xl bg-primary text-white dark:text-zinc-950 font-black text-xs flex items-center gap-2.5 shadow-lg shadow-primary/20 transition-all">
                      <BarChart3 size={14} /> Dashboard
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-foreground font-black text-xs flex items-center gap-2.5 transition-all">
                      <Users size={14} /> Alunos
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-foreground font-black text-xs flex items-center gap-2.5 transition-all">
                      <Coins size={14} /> Financeiro
                    </button>
                    <div className="pt-5 px-3 py-2 text-[9px] font-black uppercase text-zinc-400 tracking-widest">Config</div>
                    <button className="w-full text-left px-4 py-3 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-foreground font-black text-xs flex items-center gap-2.5 transition-all">
                      <AlertCircle size={14} /> Avisos
                    </button>
                  </div>

                  {/* Dashboard Core Content */}
                  <div className="p-6 md:p-8 space-y-8">
                    {/* Grid of stats */}
                    <div className="grid gap-5 sm:grid-cols-3">
                      <div className="p-6 rounded-3xl border border-zinc-200/60 dark:border-white/5 bg-zinc-50/50 dark:bg-[#0c101b]/50 shadow-md relative group overflow-hidden hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Presenças de Hoje</span>
                        <div className="mt-3.5 flex items-baseline gap-2">
                          <span className="text-3xl sm:text-4xl font-black font-fredoka text-slate-900 dark:text-white">42</span>
                          <span className="text-xs font-bold text-zinc-400">de 45 crianças</span>
                        </div>
                        <div className="mt-4.5 w-full bg-zinc-200 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full w-[93%]" />
                        </div>
                      </div>

                      <div className="p-6 rounded-3xl border border-zinc-200/60 dark:border-white/5 bg-zinc-50/50 dark:bg-[#0c101b]/50 shadow-md relative group overflow-hidden hover:border-emerald-500/30 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Faturamento Mensal</span>
                        <div className="mt-3.5 flex items-baseline gap-1.5">
                          <span className="text-3xl sm:text-4xl font-black font-fredoka text-slate-900 dark:text-white">R$ 48.500</span>
                          <span className="text-[10px] font-black text-emerald-500 flex items-center gap-0.5">
                            <TrendingUp size={11} /> +12%
                          </span>
                        </div>
                        <div className="mt-4 text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Meta mensal atingida! 🚀</div>
                      </div>

                      <div className="p-6 rounded-3xl border border-zinc-200/60 dark:border-white/5 bg-zinc-50/50 dark:bg-[#0c101b]/50 shadow-md relative group overflow-hidden hover:border-pink-500/30 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Galeria de Fotos</span>
                        <div className="mt-3.5 flex items-baseline gap-2">
                          <span className="text-3xl sm:text-4xl font-black font-fredoka text-slate-900 dark:text-white">124</span>
                          <span className="text-xs font-bold text-zinc-400">fotos postadas</span>
                        </div>
                        <div className="mt-4 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                          <span className="text-[9px] font-black text-pink-500 uppercase tracking-widest">Sincronizado</span>
                        </div>
                      </div>
                    </div>

                    {/* Pupil portaria check-ins list inside Admin view */}
                    <div className="rounded-3xl border border-zinc-200/60 dark:border-white/5 bg-zinc-50/30 dark:bg-black/20 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-black">Portaria Recente (Crianças Presentes)</h4>
                          <p className="text-[10px] text-muted-foreground font-semibold">Monitoramento em tempo real do fluxo de entrada</p>
                        </div>
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                      </div>
                      <div className="space-y-2.5">
                        {[
                          { name: 'Leo Santos', room: 'Berçário A', time: '07:45', parent: 'Ana Santos (Mãe)' },
                          { name: 'Sophia Lima', room: 'Maternal B', time: '08:12', parent: 'Henrique Lima (Pai)' },
                          { name: 'Miguel Souza', room: 'Maternal A', time: '08:30', parent: 'Juliana Souza (Mãe)' }
                        ].map((pupil, i) => (
                          <div key={i} className="p-3.5 rounded-xl border border-zinc-200/60 dark:border-white/5 bg-white/80 dark:bg-zinc-900/60 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-black text-foreground block">{pupil.name}</span>
                              <span className="text-[9px] text-muted-foreground font-semibold block">{pupil.room} • {pupil.parent}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold block text-zinc-500">Entrada: {pupil.time}</span>
                              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider flex items-center gap-1 justify-end">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Presente
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic Interactive Chart Preview */}
                    <div className="p-6 md:p-8 rounded-[2rem] border border-zinc-200/60 dark:border-white/5 bg-zinc-50/30 dark:bg-black/20 hover:border-primary/20 transition-all duration-300">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h4 className="text-sm sm:text-base font-black text-foreground">Frequência Escolar Semanal</h4>
                          <p className="text-xs text-muted-foreground font-medium">Fluxo diário de check-in monitorado na portaria</p>
                        </div>
                        <span className="text-[9px] font-black bg-primary/10 text-primary px-3.5 py-1.5 rounded-full uppercase tracking-widest border border-primary/20">
                          Painel Ativo
                        </span>
                      </div>

                      {/* Bars Grid with gorgeous card glows on hover */}
                      <div className="h-44 flex items-end justify-between gap-4 px-2 pt-4 border-b border-zinc-200 dark:border-white/5">
                        {[
                          { label: 'Segunda', val: '75%', color: 'bg-primary/90 hover:bg-primary shadow-emerald-500/10' },
                          { label: 'Terça', val: '92%', color: 'bg-primary/90 hover:bg-primary shadow-emerald-500/10' },
                          { label: 'Quarta', val: '88%', color: 'bg-primary/90 hover:bg-primary shadow-emerald-500/10' },
                          { label: 'Quinta', val: '95%', color: 'bg-gradient-to-t from-primary to-lime-400 shadow-lime-500/25' },
                          { label: 'Sexta', val: '65%', color: 'bg-amber-500/80 hover:bg-amber-500 shadow-amber-500/10' }
                        ].map((item, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                            {/* Value bubble on hover */}
                            <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-zinc-800 dark:bg-zinc-700 text-white text-[9px] font-black px-2 py-1 rounded-md mb-2 shadow-md relative -top-1">
                              {item.val}
                            </span>
                            <div 
                              className={`w-full max-w-[44px] rounded-t-xl transition-all duration-500 ${item.color} shadow-lg group-hover:scale-x-105 group-hover:shadow-2xl`} 
                              style={{ height: item.val }} 
                            />
                            <span className="mt-3 text-[9px] text-zinc-400 font-bold uppercase tracking-wider text-center block">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mock Teacher Layout */}
              {dashboardRole === 'teacher' && (
                <div className="grid lg:grid-cols-[200px_1fr] min-h-[460px] bg-white dark:bg-[#07090e]/60 rounded-b-[2.2rem] animate-in fade-in duration-300">
                  {/* Sidebar */}
                  <div className="hidden lg:block border-r border-zinc-200/60 dark:border-white/5 p-5 space-y-2">
                    <div className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400 tracking-widest">Minhas Salas</div>
                    <button className="w-full text-left px-4 py-3 rounded-xl bg-primary text-white dark:text-zinc-950 font-black text-xs flex items-center gap-2.5 shadow-lg shadow-primary/20 transition-all">
                      <Baby size={14} /> Maternal A 🎨
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-foreground font-black text-xs flex items-center gap-2.5 transition-all">
                      <Baby size={14} /> Berçário B
                    </button>
                    <div className="pt-5 px-3 py-2 text-[9px] font-black uppercase text-zinc-400 tracking-widest">Lançamentos</div>
                    <button className="w-full text-left px-4 py-3 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-foreground font-black text-xs flex items-center gap-2.5 transition-all">
                      <CheckCircle2 size={14} /> Chamada
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-foreground font-black text-xs flex items-center gap-2.5 transition-all">
                      <MessageSquare size={14} /> Diários
                    </button>
                  </div>

                  {/* Teacher Core Panel */}
                  <div className="p-6 md:p-8 space-y-6">
                    <div className="p-5 rounded-2.5xl bg-zinc-50 dark:bg-black/30 border border-zinc-200/60 dark:border-white/5">
                      <h4 className="text-base font-black text-foreground">Professora Fernanda • Maternal A 🎨</h4>
                      <p className="text-xs text-muted-foreground font-semibold mt-1">Lançamento de atividades diárias e acompanhamento pedagógico.</p>
                    </div>

                    {/* Interactive Action Launcher */}
                    <div className="p-6 rounded-3xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-[#0c101b] shadow-md relative overflow-hidden">
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-sky-500" />
                      <h4 className="text-sm font-black block mb-2.5">Registrar Evento de Rotina da Classe</h4>
                      <p className="text-xs text-muted-foreground font-semibold mb-4">
                        Clique nos botões rápidos de rotina para simular a postagem imediata de registros pedagógicos no feed!
                      </p>
                      
                      <div className="flex flex-wrap gap-2.5">
                        {[
                          { label: '🥣 Refeição', log: '🥣 [Alimentação] Leo Santos almoçou toda a refeição de legumes com frango. (Excelente aceitação!)' },
                          { label: '😴 Sono', log: '😴 [Sono] Leo Santos dormiu por 1h30m no repouso da tarde de forma tranquila.' },
                          { label: '🧻 Higiene', log: '🧻 [Higiene] Realizada troca de fraldas do Leo Santos. Tudo limpinho!' },
                          { label: '🎨 Atividades', log: '🎨 [Pedagógico] Leo Santos participou ativamente da atividade de pintura com guache de hoje.' }
                        ].map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              const newLog = {
                                id: Date.now() + idx,
                                text: action.log,
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              }
                              setTeacherLogs([newLog, ...teacherLogs])
                            }}
                            className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white dark:hover:text-zinc-950 transition-all flex items-center gap-1.5"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Classroom Feed List */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-black">Feed Pedagógico da Turma</h4>
                      
                      <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                        {/* Dynamic Logs */}
                        {teacherLogs.map((log) => (
                          <div key={log.id} className="p-4 rounded-2xl border border-primary/30 dark:border-primary/20 bg-primary/5 text-xs font-semibold leading-relaxed animate-in slide-in-from-top-4 flex justify-between items-start gap-4">
                            <span>{log.text}</span>
                            <span className="text-[9px] font-black text-primary uppercase shrink-0">{log.time} • LANÇADO</span>
                          </div>
                        ))}

                        {/* Static Logs */}
                        <div className="p-4 rounded-2xl border border-zinc-200/60 dark:border-white/5 bg-zinc-50/50 dark:bg-[#0c101b]/50 text-xs font-semibold leading-relaxed text-zinc-500 flex justify-between items-start gap-4">
                          <span>Soneca da Tarde: Todos os alunos do Maternal A realizaram o repouso. Clima calmo.</span>
                          <span className="text-[9px] font-bold text-zinc-400 shrink-0">13:30</span>
                        </div>
                        <div className="p-4 rounded-2xl border border-zinc-200/60 dark:border-white/5 bg-zinc-50/50 dark:bg-[#0c101b]/50 text-xs font-semibold leading-relaxed text-zinc-500 flex justify-between items-start gap-4">
                          <span>Refeição de Almoço: Servido purê de batatas com carne moída. Ótima aceitação de 92%.</span>
                          <span className="text-[9px] font-bold text-zinc-400 shrink-0">12:00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mock Parent Layout */}
              {dashboardRole === 'parent' && (
                <div className="grid lg:grid-cols-[200px_1fr] min-h-[460px] bg-white dark:bg-[#07090e]/60 rounded-b-[2.2rem] animate-in fade-in duration-300">
                  {/* Sidebar */}
                  <div className="hidden lg:block border-r border-zinc-200/60 dark:border-white/5 p-5 space-y-2">
                    <div className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400 tracking-widest">Meu Filho</div>
                    <button className="w-full text-left px-4 py-3 rounded-xl bg-primary text-white dark:text-zinc-950 font-black text-xs flex items-center gap-2.5 shadow-lg shadow-primary/20 transition-all">
                      <Baby size={14} /> Leo Santos 🌟
                    </button>
                    <div className="pt-5 px-3 py-2 text-[9px] font-black uppercase text-zinc-400 tracking-widest">Serviços</div>
                    <button className="w-full text-left px-4 py-3 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-foreground font-black text-xs flex items-center gap-2.5 transition-all">
                      <Clock size={14} /> Diário de Hoje
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-foreground font-black text-xs flex items-center gap-2.5 transition-all">
                      <Coins size={14} /> Mensalidades
                    </button>
                  </div>

                  {/* Parent Core Panel */}
                  <div className="p-6 md:p-8 space-y-6">
                    <div className="p-5 rounded-2.5xl bg-zinc-50 dark:bg-black/30 border border-zinc-200/60 dark:border-white/5 flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-black text-foreground">Leo Santos • Berçário A 🌟</h4>
                        <p className="text-xs text-muted-foreground font-semibold mt-1">Acompanhe a rotina diária e atividades do seu filho.</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black text-xs">
                        LS
                      </div>
                    </div>

                    {/* Financial Status Panel */}
                    <div className="p-5 rounded-3xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-[#0c101b] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Mensalidade de Maio</span>
                        <h4 className="text-base font-black mt-1">Valor Escolar: R$ 1.200,00</h4>
                      </div>
                      
                      {parentPaid ? (
                        <div className="flex items-center gap-3">
                          <span className="px-4 py-2 rounded-xl text-xs font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            🟢 PAGO VIA PIX
                          </span>
                          <button
                            onClick={() => alert('Recibo Digital #4829\nCliente: Ana Santos\nAluno: Leo Santos\nValor: R$ 1.200,00\nData: 18/05/2026\nAutenticação Pix: MM3829038290X')}
                            className="px-3.5 py-2 rounded-xl text-[10px] font-black uppercase bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-500"
                          >
                            Ver Recibo
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="px-4 py-2 rounded-xl text-xs font-black uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            🔴 PENDENTE
                          </span>
                          <button
                            onClick={() => setParentPaid(true)}
                            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase bg-primary hover:bg-primary/95 text-white dark:text-zinc-950 shadow-md shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            ⚡ Pagar com Pix Simulado
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Real-time pupil feed */}
                    <div className="space-y-4.5">
                      <h4 className="text-sm font-black">Mural de Atividades do Leo</h4>
                      
                      <div className="space-y-3.5">
                        <div className="p-4 rounded-2xl border border-zinc-200/60 dark:border-white/5 bg-zinc-50/50 dark:bg-[#0c101b]/50 text-xs font-semibold leading-relaxed flex items-start gap-3">
                          <span className="mt-1 shrink-0 p-1.5 rounded-lg bg-pink-500/10 text-pink-500">📸</span>
                          <div>
                            <span className="font-black text-foreground block">Nova foto postada na galeria privada</span>
                            <span className="text-[10px] text-muted-foreground font-semibold block mt-0.5">A professora Fernanda adicionou uma foto da atividade de pintura com guache de hoje.</span>
                            <span className="text-[9px] font-bold text-zinc-400 block mt-2">15:20</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl border border-zinc-200/60 dark:border-white/5 bg-zinc-50/50 dark:bg-[#0c101b]/50 text-xs font-semibold leading-relaxed flex items-start gap-3">
                          <span className="mt-1 shrink-0 p-1.5 rounded-lg bg-amber-500/10 text-amber-500">😴</span>
                          <div>
                            <span className="font-black text-foreground block">Registro de Sono</span>
                            <span className="text-[10px] text-muted-foreground font-semibold block mt-0.5">Leo dormiu 1h30m de sono tranquilo de repouso após o almoço.</span>
                            <span className="text-[9px] font-bold text-zinc-400 block mt-2">14:00</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl border border-zinc-200/60 dark:border-white/5 bg-zinc-50/50 dark:bg-[#0c101b]/50 text-xs font-semibold leading-relaxed flex items-start gap-3">
                          <span className="mt-1 shrink-0 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">🔐</span>
                          <div>
                            <span className="font-black text-foreground block">Entrada Autorizada na Portaria</span>
                            <span className="text-[10px] text-muted-foreground font-semibold block mt-0.5">Leo Santos deu entrada na escola. Recebido por Prof. Fernanda. Entregue por Ana Santos.</span>
                            <span className="text-[9px] font-bold text-zinc-400 block mt-2">07:45</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================
            2. LIVE STATISTICS TICKER
           ========================================================= */}
        <section className="bg-white/40 dark:bg-[#0b0e17] border-y border-zinc-200/60 dark:border-white/5 py-12">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
              {tickerStats.map((stat, i) => (
                <div key={i} className="text-center group">
                  <p className="text-[10px] md:text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-[0.25em] mb-2">
                    {stat.label}
                  </p>
                  <p className="text-3xl md:text-5xl font-black font-fredoka text-primary bg-gradient-to-r from-primary to-lime-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                    {stat.prefix}
                    {typeof stat.value === 'number' 
                      ? (Number.isInteger(stat.value) 
                          ? stat.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") 
                          : stat.value.toString().replace('.', ',')) 
                      : stat.value}
                    {stat.suffix}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            3. INTERACTIVE WHATSAPP CONVERSATIONAL MOCKUP
           ========================================================= */}
        <section id="whatsapp-tour" className="py-24 relative bg-zinc-100/30 dark:bg-black/10">
          <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2.5xl mx-auto mb-16 md:mb-20">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 dark:bg-primary/5 px-4 py-1.5 rounded-full border border-primary/20">
                <Smartphone size={13} /> Demonstração Interativa
              </span>
              <h2 className="mt-4 text-3xl sm:text-5xl font-black font-fredoka tracking-tight text-slate-900 dark:text-white leading-tight">
                Notificações Inteligentes no WhatsApp
              </h2>
              <p className="mt-4 text-base sm:text-lg text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto">
                Clique nos gatilhos da esquerda para ver como o sistema se comunica de maneira humana com a família. Experimente simular uma resposta dos pais!
              </p>
            </div>

            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-start max-w-5.5xl mx-auto">
              {/* Trigger Options (Premium Card Design) */}
              <div className="space-y-4">
                {Object.entries(whatsappSimulations).map(([key, config]) => {
                  const Icon = config.icon
                  const isSelected = activeWppTab === key
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveWppTab(key as any)}
                      className={`w-full text-left p-6 rounded-[2rem] border transition-all duration-500 flex items-start gap-4 hover:-translate-y-1 ${
                        isSelected
                          ? 'bg-white dark:bg-[#0c101b] border-primary shadow-[0_15px_40px_-15px_rgba(34,197,94,0.18)] scale-[1.02]'
                          : 'bg-white/40 dark:bg-zinc-950/10 border-zinc-200/60 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 hover:shadow-md'
                      }`}
                    >
                      <div className={`p-4 rounded-2xl shrink-0 transition-transform ${isSelected ? 'bg-primary text-white dark:text-zinc-950 scale-110' : 'bg-zinc-100 dark:bg-white/5 text-zinc-400'}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <h4 className="font-black text-base text-foreground transition-colors group-hover:text-primary">{config.label}</h4>
                          {isSelected && (
                            <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-ping" />
                          )}
                        </div>
                        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground font-semibold leading-relaxed">
                          {whatsappSimulations[key as keyof typeof whatsappSimulations].title} — Disparo automático imediato.
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Glowing Phone Mockup */}
              <div className="relative justify-self-center w-full max-w-[365px]">
                {/* Neon shadow backing the phone */}
                <div className="absolute inset-0 bg-primary/10 rounded-[3rem] blur-3xl -z-10 animate-pulse" />
                
                <div className="relative border-[11px] border-slate-900 rounded-[3rem] h-[640px] w-full shadow-3xl bg-[#0b141a] overflow-hidden flex flex-col">
                  {/* Phone Notch */}
                  <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 z-50 flex justify-center items-center">
                    <div className="w-16 h-3 bg-black rounded-full" />
                  </div>

                  {/* Header */}
                  <div className="bg-[#075e54] text-white px-4 pt-8 pb-3.5 shrink-0 flex items-center gap-3 shadow-md z-40">
                    <div className="w-8 h-8 rounded-full bg-teal-800 flex items-center justify-center text-xs font-black text-teal-100 border border-teal-600">
                      MM
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black">Escola Mundo Mágico</span>
                        <span className="w-3.5 h-3.5 bg-sky-500 rounded-full flex items-center justify-center text-[7px] font-black text-white">✓</span>
                      </div>
                      <span className="text-[9px] text-teal-200 block -mt-0.5">Comunicação Oficial • Online</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  {/* Chat Content Panel */}
                  <div 
                    className="flex-1 p-4 overflow-y-auto space-y-4 relative flex flex-col justify-end"
                    style={{
                      backgroundImage: "url('/images/wpp-bg.png')",
                      backgroundSize: 'cover',
                      backgroundColor: '#0b141a'
                    }}
                  >
                    <div className="mx-auto bg-[#182229] border border-slate-700/40 rounded-xl px-4 py-2 text-center max-w-[90%] mb-auto">
                      <span className="text-[10px] text-slate-400 font-bold block leading-relaxed">
                        🔒 Este chat oficial é integrado às regras de privacidade da escola e dos alunos.
                      </span>
                    </div>

                    {isTyping ? (
                      <div className="self-start bg-[#1f2c34] text-slate-300 rounded-2xl rounded-tl-none px-4 py-3.5 shadow-md max-w-[85%] flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mundo Mágico</span>
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </div>
                    ) : (
                      currentBubbles.map((bubble, i) => {
                        const isSchool = bubble.sender === 'school'
                        return (
                          <div
                            key={i}
                            className={`self-start rounded-2xl px-4 py-3 shadow-md text-xs font-semibold leading-relaxed max-w-[85%] whitespace-pre-line animate-in relative ${
                              isSchool 
                                ? 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-800/40' 
                                : 'bg-[#005c4b] text-[#e9edef] rounded-tr-none border border-teal-900/30 self-end'
                            }`}
                          >
                            {bubble.text}
                            <span className="text-[8px] text-slate-400/90 float-right mt-2 ml-3 block">
                              {bubble.time}
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Interactive Reply Simulator Panel inside mock phone */}
                  {whatsappSimulations[activeWppTab].interactiveOptions && (
                    <div className="bg-[#121b22] px-3.5 py-3 border-t border-slate-800/80 shrink-0 z-40">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2 text-center">Gatilho Interativo</p>
                      {whatsappSimulations[activeWppTab].interactiveOptions.map((opt, i) => (
                        <button
                          key={i}
                          disabled={activeOptionUsed !== null}
                          onClick={() => handleSimulateReply(opt.replyText, opt.botReaction, i)}
                          className={`w-full py-2.5 px-3.5 rounded-xl text-[10px] font-black text-center border transition-all flex items-center justify-center gap-2 ${
                            activeOptionUsed === i
                              ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'
                              : 'bg-primary/20 hover:bg-primary/30 border-primary/30 text-primary hover:scale-[1.01] active:scale-95'
                          }`}
                        >
                          {activeOptionUsed === i ? (
                            <>Mensagem Enviada! ✓</>
                          ) : (
                            <>{opt.label}</>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Bottom input */}
                  <div className="bg-[#101f20] p-2.5 flex items-center gap-2 shrink-0 border-t border-slate-800/40">
                    <div className="flex-1 bg-[#2a3942] rounded-full px-4.5 py-2 text-[10px] text-slate-400 font-semibold">
                      Comunicação oficial do Leo
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white shrink-0">
                      <Send size={11} className="rotate-45 -mr-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            4. BENTO GRID OF PREMIUM SYSTEM BENEFITS
           ========================================================= */}
        <section id="servicos" className="py-24 border-y border-zinc-200/50 dark:border-white/5 relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(#ffffff04_1px,transparent_1px)]">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Tecnologia Confiável</span>
              <h2 className="mt-4 text-3xl sm:text-5xl font-black font-fredoka tracking-tight text-slate-900 dark:text-white leading-tight">
                Desenvolvido para Escolas Modernas
              </h2>
              <p className="mt-3 text-base text-zinc-500 dark:text-zinc-400 font-medium font-semibold">
                Estrutura pensada para acabar com retrabalhos administrativos, garantindo faturamento em dia e proximidade pedagógica com os responsáveis.
              </p>
            </div>

            {/* Bento Grid with gorgeous card scales and custom gradient glow borders */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              <article className="p-8 rounded-[2rem] border border-zinc-200/60 dark:border-white/5 bg-white/80 dark:bg-[#0c101b] relative group hover:shadow-2xl hover:border-emerald-500/30 hover:-translate-y-1.5 transition-all duration-500 lg:col-span-2">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-[2rem]" />
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="mt-6 text-xl font-black">Portaria Blindada & Check-in Seguro</h3>
                <p className="mt-3.5 text-sm sm:text-base text-muted-foreground font-semibold leading-relaxed">
                  Os disparos automáticos de portaria registram a entrada e a saída da criança na escola e geram relatórios de presença diária. O sistema cruza os dados do responsável que retirou a criança, garantindo tranquilidade máxima para os pais.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 px-3 py-1.5 rounded-full text-zinc-500">QR Code Integrado</span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 px-3 py-1.5 rounded-full text-zinc-500">Notificação Imediata</span>
                </div>
              </article>

              <article className="p-8 rounded-[2rem] border border-zinc-200/60 dark:border-white/5 bg-white/80 dark:bg-[#0c101b] relative group hover:shadow-2xl hover:border-indigo-500/30 hover:-translate-y-1.5 transition-all duration-500">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-t-[2rem]" />
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Coins size={24} />
                </div>
                <h3 className="mt-6 text-xl font-black">Financeiro em Dia</h3>
                <p className="mt-3.5 text-sm text-muted-foreground font-semibold leading-relaxed">
                  Crie faturas, fature mensalidades, anote extras e gere o holerite da equipe no mesmo ambiente. Alertas amigáveis de pagamento evitam esquecimentos.
                </p>
                <div className="mt-6">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-500/20">Faturamento Automatizado</span>
                </div>
              </article>

              <article className="p-8 rounded-[2rem] border border-zinc-200/60 dark:border-white/5 bg-white/80 dark:bg-[#0c101b] relative group hover:shadow-2xl hover:border-amber-500/30 hover:-translate-y-1.5 transition-all duration-500">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-[2rem]" />
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Camera size={24} />
                </div>
                <h3 className="mt-6 text-xl font-black">Privacidade de Imagem</h3>
                <p className="mt-3.5 text-sm text-muted-foreground font-semibold leading-relaxed">
                  Assegure a total conformidade com a LGPD. O sistema barra o compartilhamento de imagens de crianças cujos pais optaram por não divulgar fotos.
                </p>
                <div className="mt-6">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 px-3 py-1.5 rounded-full border border-amber-500/20">Validação Automática</span>
                </div>
              </article>

              <article className="p-8 rounded-[2rem] border border-zinc-200/60 dark:border-white/5 bg-white/80 dark:bg-[#0c101b] relative group hover:shadow-2xl hover:border-pink-500/30 hover:-translate-y-1.5 transition-all duration-500 lg:col-span-2">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-t-[2rem]" />
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Bell size={24} />
                </div>
                <h3 className="mt-6 text-xl font-black">Agenda & Comunicados por Sala</h3>
                <p className="mt-3.5 text-sm sm:text-base text-muted-foreground font-semibold leading-relaxed">
                  Evite ruídos. Agende comunicados gerais ou direcionados para turmas específicas (ex: *Maternal A*). O sistema cuida da distribuição por e-mail e app móvel instantaneamente para os responsáveis cadastrados.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 px-3 py-1.5 rounded-full text-zinc-500">Notificação Interna</span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 px-3 py-1.5 rounded-full text-zinc-500">Agendamento Futuro</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* =========================================================
            5. INTERACTIVE NOTICES & EVENTS SCHEDULER
           ========================================================= */}
        <section id="scheduler-section" className="py-24 relative bg-zinc-100/30 dark:bg-black/10">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2.5xl mx-auto mb-16 md:mb-20">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 dark:bg-primary/5 px-4 py-1.5 rounded-full border border-primary/20 animate-pulse">
                <Calendar size={13} /> Painel Administrativo Ativo
              </span>
              <h2 className="mt-4 text-3xl sm:text-5xl font-black font-fredoka tracking-tight text-slate-900 dark:text-white leading-tight">
                Central de Comunicados & Agenda
              </h2>
              <p className="mt-4 text-base sm:text-lg text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto">
                Crie um comunicado, selecione a sala de aula e defina a data de disparo. Acompanhe a entrega multicanal no painel de eventos abaixo.
              </p>
            </div>

            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] items-start max-w-5.5xl mx-auto">
              {/* Form Input Simulator with Premium Glassmorphism Card Effect */}
              <div className="bg-white dark:bg-[#0c101b] border border-zinc-200/60 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden hover:border-primary/20 hover:shadow-3xl transition-all duration-500">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary to-lime-500" />
                {animateSuccess && (
                  <div className="absolute inset-0 bg-primary/95 dark:bg-primary/90 backdrop-blur-sm rounded-[2.5rem] flex flex-col items-center justify-center text-white dark:text-zinc-950 p-6 z-50 text-center animate-in fade-in duration-300">
                    <CheckCircle2 size={48} className="text-white dark:text-zinc-950 animate-bounce mb-4" />
                    <h3 className="text-xl font-black font-fredoka">Comunicado Agendado!</h3>
                    <p className="mt-2 text-sm opacity-90 font-semibold max-w-xs mx-auto">
                      O sistema enviará e-mails, alertas no app e mensagens formatadas no WhatsApp para o público alvo na data e hora selecionadas.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3.5 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-primary">Operação do Painel</span>
                    <h3 className="text-base font-black leading-none mt-0.5">Criar Evento ou Aviso</h3>
                  </div>
                </div>

                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                      Título do Comunicado
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Piquenique Integrado"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-black/20 px-4 py-3.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                        Público Alvo
                      </label>
                      <select
                        value={newTarget}
                        onChange={(e) => setNewTarget(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-black/20 px-3.5 py-3.5 text-xs sm:text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      >
                        <option value="Berçário A">Berçário A</option>
                        <option value="Maternal A">Maternal A</option>
                        <option value="Maternal B">Maternal B</option>
                        <option value="Toda a Escola">Toda a Escola</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                        Tipo de Notificação
                      </label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-black/20 px-3.5 py-3.5 text-xs sm:text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      >
                        <option value="AVISO">🔔 Comunicado Normal</option>
                        <option value="EVENTO">📅 Evento do Calendário</option>
                        <option value="ATIVIDADE">🎨 Atividade Especial</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                        Data de Disparo
                      </label>
                      <input
                        type="text"
                        required
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-black/20 px-4 py-3.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                        Horário de Envio
                      </label>
                      <input
                        type="text"
                        required
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-black/20 px-4 py-3.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 text-sm font-black text-white dark:text-zinc-950 shadow-md hover:bg-primary/95 hover:scale-[1.01] active:scale-95 transition-all mt-2"
                  >
                    <Plus size={18} />
                    Agendar & Disparar Avisos
                  </button>
                </form>
              </div>

              {/* Event Timeline (Premium card shadow rows) */}
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Cronograma da Escola</p>
                  <h3 className="mt-1.5 text-2xl md:text-3.5xl font-black tracking-tight text-foreground font-fredoka">Painel de Eventos da Diretoria</h3>
                  <p className="mt-2 text-sm text-muted-foreground font-semibold leading-relaxed">
                    Veja os avisos salvos no painel da diretoria. O sistema dispara em todos os canais integrados de forma transparente.
                  </p>
                </div>

                <div className="grid gap-4.5 max-h-[460px] overflow-y-auto pr-2">
                  {eventsList.map((event) => {
                    const isSent = event.status === 'ENVIADO'
                    return (
                      <article
                        key={event.id}
                        className="flex flex-col sm:flex-row gap-4 p-5.5 rounded-2.5xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-[#0c101b] hover:shadow-xl hover:border-zinc-300 dark:hover:border-white/10 hover:-translate-y-1 transition-all duration-300 animate-in"
                      >
                        <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center font-black text-[10px] ${
                          event.type === 'EVENTO'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : event.type === 'ATIVIDADE'
                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {event.type}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                              Turma: {event.target}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                            <span className="text-[9px] font-bold text-zinc-400 flex items-center gap-1">
                              <Clock size={10} /> {event.date} às {event.time}
                            </span>
                          </div>
                          <h4 className="mt-1.5 text-sm sm:text-base font-black text-foreground">{event.title}</h4>
                        </div>
                        <div className="self-start sm:self-center shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            isSent
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isSent ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                            {event.status}
                          </span>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            6. PREMIUM BENEFITS SECTION (3 FROSTED GLASS CARDS)
           ========================================================= */}
        <section className="container mx-auto px-4 md:px-6 py-24">
          <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
            <article className="p-8 rounded-[2.5rem] border border-zinc-200/60 dark:border-white/5 bg-white/70 dark:bg-[#0c101b]/70 backdrop-blur-xl shadow-lg flex flex-col justify-between hover:-translate-y-2 hover:shadow-2xl hover:border-primary/30 transition-all duration-500 group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:rotate-6 transition-transform">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="mt-6 text-xl font-black">Controle de Foto da LGPD</h3>
                <p className="mt-3 text-sm text-muted-foreground font-semibold leading-relaxed">
                  O sistema respeita rigorosamente as autorizações dos pais. Se uma criança não possui permissão para divulgação de imagem, o sistema bloqueia o upload de suas fotos na galeria privada.
                </p>
              </div>
              <span className="mt-8 text-xs text-primary font-black uppercase tracking-[0.2em] flex items-center gap-1">
                Segurança em Primeiro Lugar <Check size={14} />
              </span>
            </article>

            <article className="p-8 rounded-[2.5rem] border border-zinc-200/60 dark:border-white/5 bg-white/70 dark:bg-[#0c101b]/70 backdrop-blur-xl shadow-lg flex flex-col justify-between hover:-translate-y-2 hover:shadow-2xl hover:border-primary/30 transition-all duration-500 group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:rotate-6 transition-transform">
                  <Bell size={28} />
                </div>
                <h3 className="mt-6 text-xl font-black">Lembretes Multicanal</h3>
                <p className="mt-3 text-sm text-muted-foreground font-semibold leading-relaxed">
                  Os comunicados são automaticamente despachados via notificação interna no aplicativo móvel dos pais, lembrete por correio eletrônico corporativo e mensagens formatadas no WhatsApp.
                </p>
              </div>
              <span className="mt-8 text-xs text-primary font-black uppercase tracking-[0.2em] flex items-center gap-1">
                Comunicação Garantida <Check size={14} />
              </span>
            </article>

            <article className="p-8 rounded-[2.5rem] border border-zinc-200/60 dark:border-white/5 bg-white/70 dark:bg-[#0c101b]/70 backdrop-blur-xl shadow-lg flex flex-col justify-between hover:-translate-y-2 hover:shadow-2xl hover:border-primary/30 transition-all duration-500 group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:rotate-6 transition-transform">
                  <Volume2 size={28} />
                </div>
                <h3 className="mt-6 text-xl font-black">Presença Ativa & Alertas</h3>
                <p className="mt-3 text-sm text-muted-foreground font-semibold leading-relaxed">
                  Caso a criança não compareça até às 09:30 da manhã, o sistema dispara um aviso afetuoso perguntando se está tudo bem, garantindo proximidade e cuidado com a família.
                </p>
              </div>
              <span className="mt-8 text-xs text-primary font-black uppercase tracking-[0.2em] flex items-center gap-1">
                Zelo e Acolhimento Diário <Check size={14} />
              </span>
            </article>
          </div>
        </section>

        {/* =========================================================
            7. PREMIUM CTA CARD (REDESIGNED ULTRA PREMIUM GLASSMORPHIC BENTO LAYOUT)
           ========================================================= */}
        <section id="contato" className="container mx-auto px-4 md:px-6 pb-24 relative">
          <div className="rounded-[3rem] border-2 border-emerald-500/10 dark:border-white/5 bg-gradient-to-br from-white via-slate-50/50 to-emerald-500/5 dark:from-[#0c101b] dark:via-[#090b14] dark:to-zinc-950 p-8 md:p-16 shadow-2xl relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-500">
            {/* Massive Glowing Neon Spheres in the background for a modern SaaS vibe */}
            <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-primary/20 dark:bg-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute -left-24 -top-24 w-80 h-80 bg-lime-500/15 dark:bg-lime-500/5 rounded-full blur-[80px] pointer-events-none group-hover:scale-110 transition-transform duration-700" />

            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center relative z-10">
              <div className="space-y-6">
                {/* Glowing Premium Top Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/5 animate-pulse">
                  <Sparkles size={13} className="fill-emerald-500/20" /> IMPLANTE O MUNDO MÁGICO NA SUA ESCOLA
                </div>
                
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black font-fredoka tracking-tight text-slate-900 dark:text-white leading-[1.05]">
                  Deseja implantar o{' '}
                  <span className="bg-gradient-to-r from-emerald-600 via-primary to-lime-500 bg-clip-text text-transparent dark:from-white dark:via-slate-100 dark:to-emerald-400">
                    Mundo Mágico
                  </span>{' '}
                  na sua brinquedoteca?
                </h2>
                
                <p className="max-w-3xl text-sm sm:text-base text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                  Ofereça uma experiência inovadora para as famílias, acabe com o uso de papéis nos diários escolares e tenha o controle absoluto dos faturamentos mensais da sua brinquedoteca ou escola infantil.
                </p>
                
                {/* Added trust badges at the bottom of description */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs font-bold text-zinc-400 dark:text-zinc-500">
                  <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> Teste grátis por 14 dias</span>
                  <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> Sem taxa de adesão</span>
                  <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> Suporte premium via WhatsApp</span>
                </div>
              </div>

              {/* Enhanced Action Buttons with double layered glow and active scales */}
              <div className="flex flex-col gap-4 sm:flex-row lg:flex-col shrink-0 w-full sm:w-auto">
                <Link
                  href="https://wa.me/5511972090986"
                  className="px-8 py-5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] text-center flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95 transition-all duration-300 w-full sm:w-60 lg:w-64"
                >
                  <MessageSquare size={16} />
                  Falar no WhatsApp
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-5 bg-slate-900/10 dark:bg-white/5 text-slate-800 dark:text-white hover:bg-slate-900/20 dark:hover:bg-white/10 font-black rounded-2xl text-xs uppercase tracking-widest text-center border border-slate-900/15 dark:border-white/10 flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95 transition-all duration-300 w-full sm:w-60 lg:w-64 backdrop-blur-md"
                >
                  Acessar Sistema
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}

const statsInitial = [
  { label: 'Notificações Hoje', value: 840, prefix: '', suffix: '+' },
  { label: 'Presenças Registradas', value: 98.4, prefix: '', suffix: '%' },
  { label: 'Faturamento Auditado', value: 48500, prefix: 'R$ ', suffix: '' },
  { label: 'Famílias Felizes', value: 340, prefix: '', suffix: '+' }
]
