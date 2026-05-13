'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { 
  PublicHeader, 
  PublicFooter 
} from '../components/landing/InstitutionalShell'
import { WhatsAppButton } from '../components/landing/WhatsAppButton'
import { 
  Heart, ShieldCheck, Sparkles, 
  Star, Users, MapPin, MessageSquare, 
  ChevronRight, CheckCircle2, Clock,
  Gift, Palette, Award,
  ArrowRight, Baby, Shield, 
  Utensils, Calendar, Home, Brain, 
  HandHeart, Smile
} from 'lucide-react'
import Link from 'next/link'

const MotionLink = motion(Link)

const featureCards = [
  { 
    title: 'Ambiente seguro', 
    desc: 'Segurança total.', 
    icon: <ShieldCheck size={24} className="text-blue-600" />, 
    color: 'bg-blue-50',
    glowColor: 'rgba(59, 130, 246, 0.3)'
  },
  { 
    title: 'Equipe atenciosa', 
    desc: 'Cuidado amoroso.', 
    icon: <Heart size={24} className="text-rose-600" />, 
    color: 'bg-rose-50',
    glowColor: 'rgba(225, 29, 72, 0.3)'
  },
  { 
    title: 'Atividades lúdicas', 
    desc: 'Brincar e aprender.', 
    icon: <Sparkles size={24} className="text-amber-600" />, 
    color: 'bg-amber-50',
    glowColor: 'rgba(217, 119, 6, 0.3)'
  },
  { 
    title: 'Espaço acolhedor', 
    desc: 'Conforto total.', 
    icon: <Home size={24} className="text-lime-600" />, 
    color: 'bg-lime-50',
    glowColor: 'rgba(101, 163, 13, 0.3)'
  },
  { 
    title: 'Desenvolvimento', 
    desc: 'Crescimento real.', 
    icon: <Brain size={24} className="text-purple-600" />, 
    color: 'bg-purple-50',
    glowColor: 'rgba(147, 51, 234, 0.3)'
  },
  { 
    title: 'Humanizado', 
    desc: 'Apoio à família.', 
    icon: <HandHeart size={24} className="text-orange-600" />, 
    color: 'bg-orange-50',
    glowColor: 'rgba(234, 88, 12, 0.3)'
  }
]

// COMPONENT: Feature Carousel (Shows 4 at a time, transitions others)
function FeatureCarousel({ cards }: { cards: any[] }) {
  const [index, setIndex] = useState(0);
  const displayCount = 4; // Number of cards visible on desktop
  
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % cards.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [cards.length]);

  // Logic to get circular array slice
  const getVisibleCards = () => {
    let visible = [];
    for (let i = 0; i < displayCount; i++) {
      visible.push(cards[(index + i) % cards.length]);
    }
    return visible;
  };

  return (
    <div className="relative overflow-hidden py-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <AnimatePresence mode="popLayout" initial={false}>
          {getVisibleCards().map((card, i) => (
            <motion.div
              key={`${card.title}-${index}-${i}`}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.9 }}
              transition={{ 
                duration: 0.6,
                ease: [0.21, 1.11, 0.81, 0.99]
              }}
              whileHover={{ 
                y: -10,
                boxShadow: `0 30px 60px -12px ${card.glowColor.replace('0.3', '0.4')}`,
                borderColor: card.glowColor.replace('0.3', '0.5')
              }}
              className="bg-white p-6 md:p-7 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col items-center text-center group transition-all duration-300"
            >
              <div className={`w-11 h-11 md:w-12 md:h-12 ${card.color} rounded-xl flex items-center justify-center mb-4 shadow-inner group-hover:rotate-3 transition-all duration-500`}>
                {React.cloneElement(card.icon as React.ReactElement, { size: 20 })}
              </div>
              <h3 className="text-xs md:text-sm font-black text-gray-900 mb-1 tracking-tight leading-tight px-1">
                {card.title}
              </h3>
              <p className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-[0.15em] leading-relaxed">
                {card.desc}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-8">
        {cards.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === index ? 'w-8 bg-[#e91e63]' : 'w-2 bg-gray-200'
            }`} 
          />
        ))}
      </div>
    </div>
  );
}

export default function InstitutionalHomePage() {
  const targetRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.98])

  // Animation variants for text
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.5
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" as const }
    }
  }

  return (
    <div className="min-h-screen bg-white selection:bg-lime-100 selection:text-lime-900 font-sans overflow-x-hidden">
      <PublicHeader />
      <WhatsAppButton />
      
      <main ref={targetRef}>
        {/* HERO SECTION WITH ANIMATED TEXT & LOWERED POSITION */}
        <section className="relative min-h-[700px] md:min-h-[950px] flex items-center overflow-hidden bg-[#fffdf9]">
          
          {/* Main Banner Image Background */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/images/banermundomagico.png" 
              className="w-full h-full object-cover object-right md:object-center"
              alt="Mundo Mágico Banner"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=2000&auto=format&fit=crop';
              }}
            />
            {/* Soft overlay for mobile readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/10 to-transparent md:hidden" />
          </div>
          
          <div className="container mx-auto px-6 relative z-20 pt-24 md:pt-40">
            <div className="max-w-3xl">
              <motion.div 
                style={{ opacity, scale }}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-start"
              >
                {/* LOGO-STYLE ANIMATED TITLE */}
                <motion.h1 
                  variants={itemVariants}
                  className="font-fredoka text-5xl md:text-8xl font-black mb-6 tracking-tight flex flex-wrap gap-x-8 items-center"
                  style={{
                    textShadow: `
                      -4px -4px 0 #fff,  
                       4px -4px 0 #fff,
                      -4px  4px 0 #fff,
                       4px  4px 0 #fff,
                       0px 8px 15px rgba(0,0,0,0.1)
                    `
                  }}
                >
                  {/* Word: Mundo */}
                  <div className="flex">
                    {[
                      { l: 'M', c: '#e91e63' },
                      { l: 'u', c: '#ff9800' },
                      { l: 'n', c: '#e91e63' },
                      { l: 'd', c: '#ff9800' },
                      { l: 'o', c: '#e91e63', star: true },
                    ].map((item, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 + 0.5 }}
                        className="inline-block relative"
                        style={{ color: item.c }}
                      >
                        {item.l}
                        {item.star && (
                          <Star 
                            size={20} 
                            className="absolute inset-0 m-auto text-white fill-white translate-y-[2px]" 
                          />
                        )}
                      </motion.span>
                    ))}
                  </div>

                  {/* Word: Mágico */}
                  <div className="flex">
                    {[
                      { l: 'M', c: '#2196f3' },
                      { l: 'a', c: '#00bcd4' },
                      { l: 'g', c: '#2196f3' },
                      { l: 'i', c: '#00bcd4', starTop: true },
                      { l: 'c', c: '#2196f3' },
                      { l: 'o', c: '#00bcd4', star: true },
                    ].map((item, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (i + 5) * 0.05 + 0.5 }}
                        className="inline-block relative"
                        style={{ color: item.c }}
                      >
                        {item.l}
                        {item.star && (
                          <Star 
                            size={20} 
                            className="absolute inset-0 m-auto text-white fill-white translate-y-[2px]" 
                          />
                        )}
                        {item.starTop && (
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                             <Star size={12} className="text-[#e91e63] fill-[#e91e63]" />
                          </div>
                        )}
                      </motion.span>
                    ))}
                  </div>
                </motion.h1>
                
                <motion.h2 
                  variants={itemVariants}
                  className="text-2xl md:text-3xl font-black text-[#5d2a7a] mb-8 tracking-tight"
                >
                  Brinquedoteca Infantil em Cajamar
                </motion.h2>
                
                <motion.div 
                  variants={itemVariants}
                  className="flex items-start gap-4 mb-10 max-w-lg"
                >
                   <motion.div 
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 1.2, type: "spring" }}
                    className="mt-1 p-1.5 bg-amber-50 rounded-full"
                   >
                     <Star size={20} className="text-amber-400 fill-amber-400" />
                   </motion.div>
                   <p className="text-lg md:text-xl text-gray-700 font-bold leading-snug">
                     Um espaço seguro, divertido e cheio de carinho para as crianças.
                   </p>
                </motion.div>

                <motion.div 
                  variants={itemVariants}
                  className="flex flex-col sm:flex-row gap-4 mb-12"
                >
                  <MotionLink 
                    href="https://wa.me/5511972090986" 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-[#e91e63] text-white rounded-full font-black text-xl shadow-xl shadow-rose-200 flex items-center justify-center gap-3 transition-all"
                  >
                    <Calendar size={24} />
                    Agende uma visita
                  </MotionLink>
                </motion.div>

                <motion.div 
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { 
                      opacity: 1,
                      transition: { staggerChildren: 0.1, delayChildren: 1.5 }
                    }
                  }}
                  className="flex items-center gap-10"
                >
                   {[
                     { text: 'Equipe acolhedora', color: 'text-lime-600' },
                     { text: 'Ambiente seguro', color: 'text-lime-600' }
                   ].map((item, i) => (
                     <motion.div 
                       key={i}
                       variants={{
                         hidden: { opacity: 0, x: -20 },
                         visible: { opacity: 1, x: 0 }
                       }}
                       className="flex items-center gap-3 text-gray-500 font-black text-xs uppercase tracking-widest"
                     >
                       <div className="w-7 h-7 bg-lime-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={14} className="text-lime-600" />
                       </div>
                       {item.text}
                     </motion.div>
                   ))}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* REFINED FLOATING FEATURE CARDS - Subtle Floating Overlay */}
        <section className="relative z-30 -mt-12 md:-mt-20 bg-transparent">
          <div className="container mx-auto px-6">
            <FeatureCarousel cards={featureCards} />
          </div>
        </section>

        {/* STATS STRIP - Lighter Vibrant Green */}
        <section className="py-12 bg-[#3a7d34] text-white">
          <div className="container mx-auto px-6">
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-24">
               {[
                { icon: <Users size={28} />, label: 'Equipe Especialista' },
                { icon: <Clock size={28} />, label: '07h às 19h' },
                { icon: <MapPin size={28} />, label: 'Portal dos Ipês' },
                { icon: <Award size={28} />, label: 'Diretora Betta' },
               ].map((item, i) => (
                 <div key={i} className="flex items-center gap-4 group">
                   <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                     {item.icon}
                   </div>
                   <span className="font-black tracking-tight text-sm md:text-base">{item.label}</span>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* ABOUT SECTION - Um lugar feito com muito carinho */}
        <section className="py-16 md:py-24 bg-white" id="sobre">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
              <div className="relative">
                <div className="absolute -inset-10 bg-lime-100/30 rounded-full blur-[80px]" />
                <div className="relative z-10">
                  <img 
                    src="/images/bannersobrenos.png" 
                    className="w-full h-[500px] md:h-[650px] object-cover object-right rounded-[3.5rem] shadow-2xl border-8 border-white group-hover:scale-[1.02] transition-transform duration-700" 
                    alt="Sobre a Mundo Mágico" 
                  />
                  {/* Decorative element */}
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#e91e63] rounded-3xl -rotate-6 z-[-1] hidden md:block" />
                </div>
              </div>

              <div>
                <span className="text-lime-600 font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">Sobre Nós</span>
                <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-8 tracking-tightest leading-[1.05]">
                  Um lugar feito com <br />
                  <span className="text-rose-500 italic">muito carinho.</span>
                </h2>
                <p className="text-lg text-gray-600 mb-10 leading-relaxed font-medium">
                  A Mundo Mágico é um espaço pensado para oferecer experiências de desenvolvimento, socialização, criatividade e diversão em um ambiente seguro e acolhedor. Nosso objetivo é proporcionar tranquilidade para as famílias e momentos inesquecíveis para as crianças.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                  {[
                    { title: 'Ambiente seguro', desc: 'Segurança em cada detalhe.', color: 'text-lime-600 bg-lime-50' },
                    { title: 'Equipe atenciosa', desc: 'Profissionais apaixonadas.', color: 'text-rose-600 bg-rose-50' },
                    { title: 'Atividades lúdicas', desc: 'Brincadeiras criativas.', color: 'text-amber-600 bg-amber-50' },
                    { title: 'Espaço acolhedor', desc: 'Conforto e descanso.', color: 'text-sky-600 bg-sky-50' },
                    { title: 'Desenvolvimento', desc: 'Fases de descoberta.', color: 'text-indigo-600 bg-indigo-50' },
                    { title: 'Humanizado', desc: 'Respeito e empatia.', color: 'text-teal-600 bg-teal-50' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 items-start p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                      <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 text-sm tracking-tight">{item.title}</h4>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DIRECTION & TEAM SECTION - Brand Green Version */}
            <div className="mt-20 md:mt-28 bg-[#3a7d34] rounded-[4rem] p-10 md:p-20 relative overflow-hidden text-white shadow-2xl shadow-green-900/20">
              {/* Abstract decorative shapes - subtle adjustments for green background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-lime-400/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
                <div className="lg:col-span-5">
                  <div className="relative inline-block mb-10 group">
                    <img 
                      src="/images/betta.png" 
                      className="w-full aspect-square object-cover object-center rounded-[3rem] shadow-2xl border-4 border-white/20 rotate-2 group-hover:rotate-0 transition-transform duration-500" 
                      alt="Diretora Betta" 
                    />
                    <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-3xl shadow-xl">
                      <h4 className="font-black text-gray-900">Betta</h4>
                      <p className="text-rose-500 font-bold text-xs uppercase tracking-widest">Diretora</p>
                    </div>
                  </div>
                </div>
                
                <div className="lg:col-span-7">
                  <span className="text-lime-300 font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">Direção e Equipe</span>
                  <h3 className="text-3xl md:text-5xl font-black mb-8 tracking-tightest leading-tight">
                    Pessoas que <span className="text-lime-300 italic">cuidam de verdade.</span>
                  </h3>
                  <p className="text-lg text-white/90 mb-8 leading-relaxed font-medium">
                    Apaixonada pelo desenvolvimento infantil, a <strong>Diretora Betta</strong> acompanha de perto a rotina da brinquedoteca e o bem-estar das crianças. Possui formação na área e conhecimentos aprofundados no desenvolvimento infantil, incluindo atuação com crianças dentro do espectro autista, proporcionando um olhar atento, acolhedor e individualizado para cada criança.
                  </p>
                  <p className="text-lg text-white/80 leading-relaxed italic font-medium">
                    "Nossa equipe é formada por profissionais atenciosos e preparados, que atuam com carinho, responsabilidade e dedicação no cuidado diário com as crianças."
                  </p>
                  
                  <div className="mt-12 flex flex-wrap gap-4">
                    <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center gap-3">
                      <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse" />
                      <span className="font-black text-white text-sm">Monitoramento Constante</span>
                    </div>
                    <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center gap-3">
                      <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
                      <span className="font-black text-white text-sm">Equipe Treinada</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section className="py-16 md:py-24 bg-rose-50/20" id="planos">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-100 border border-rose-200 rounded-full mb-6">
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Planos e valores</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tightest">
                Escolha o plano <span className="text-rose-500">ideal</span> para sua família
              </h2>
              <p className="text-lg text-gray-500 font-medium">Opções flexíveis para cada rotina, sempre com muito carinho e qualidade.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Diária Meio Período */}
              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-100 border border-gray-100 overflow-hidden flex flex-col relative">
                <div className="h-2 w-full bg-orange-400" />
                <div className="p-10 flex flex-col flex-1">
                  <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight">Diária Meio Período</h3>
                  <p className="text-sm text-gray-400 font-medium mb-10">Ideal para necessidades pontuais</p>
                  
                  <div className="flex items-baseline gap-1 mb-10">
                    <span className="text-4xl font-black text-rose-500 tracking-tighter">R$ 50</span>
                    <span className="text-sm font-bold text-gray-400">/dia</span>
                  </div>

                  <ul className="space-y-4 mb-12">
                    {[
                      'Acolhimento por dia avulso',
                      'Atividades inclusas',
                      'Sem fidelidade',
                      'Lanchinho + Frutinha'
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-600">
                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <Link href="https://wa.me/5511972090986" className="w-full py-5 bg-emerald-500 text-white rounded-3xl font-black text-sm flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100">
                      <MessageSquare size={20} />
                      Tenho interesse
                    </Link>
                  </div>
                </div>
              </div>

              {/* Diária Integral */}
              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-100 border border-gray-100 overflow-hidden flex flex-col relative">
                <div className="h-2 w-full bg-sky-400" />
                <div className="p-10 flex flex-col flex-1">
                  <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight">Diária Integral</h3>
                  <p className="text-sm text-gray-400 font-medium mb-10">Rotina completa com acolhimento e diversão</p>
                  
                  <div className="flex items-baseline gap-1 mb-10">
                    <span className="text-4xl font-black text-rose-500 tracking-tighter">R$ 70</span>
                    <span className="text-sm font-bold text-gray-400">/dia</span>
                  </div>

                  <ul className="space-y-4 mb-12">
                    {[
                      'Período completo',
                      'Atividades lúdicas',
                      'Acompanhamento individual',
                      'Relatório diário'
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-600">
                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <Link href="https://wa.me/5511972090986" className="w-full py-5 bg-emerald-500 text-white rounded-3xl font-black text-sm flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100">
                      <MessageSquare size={20} />
                      Tenho interesse
                    </Link>
                  </div>
                </div>
              </div>

              {/* Pacote Mensal/Integral */}
              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-purple-100 border-2 border-purple-100 overflow-hidden flex flex-col relative">
                <div className="h-2 w-full bg-purple-500" />
                
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                   <div className="bg-indigo-600 text-white px-5 py-1.5 rounded-full flex items-center gap-2 shadow-xl">
                     <Award size={14} className="fill-white" />
                     <span className="text-[9px] font-black uppercase tracking-widest">Mais procurado</span>
                   </div>
                </div>

                <div className="p-10 pt-16 flex flex-col flex-1">
                  <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight">Pacote Mensal/Integral</h3>
                  <p className="text-sm text-gray-400 font-medium mb-10">Mais comodidade para a rotina da família</p>
                  
                  <div className="flex items-baseline gap-1 mb-10">
                    <span className="text-4xl font-black text-rose-500 tracking-tighter">R$ 850</span>
                    <span className="text-sm font-bold text-gray-400">/mês</span>
                  </div>

                  <ul className="space-y-4 mb-12">
                    {[
                      'Período completo',
                      'Refeições inclusas',
                      'Atividades + descanso',
                      'Relatórios e fotos'
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-600">
                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <Link href="https://wa.me/5511972090986" className="w-full py-5 bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-3xl font-black text-sm flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl shadow-amber-200">
                      <MessageSquare size={20} />
                      Tenho interesse
                    </Link>
                  </div>
                </div>
              </div>

              {/* Pacote Mensal/Meio Período */}
              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-100 border border-gray-100 overflow-hidden flex flex-col relative">
                <div className="h-2 w-full bg-lime-400" />
                <div className="p-10 flex flex-col flex-1">
                  <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight">Pacote Mensal/Meio Período</h3>
                  <p className="text-sm text-gray-400 font-medium mb-10">Flexibilidade com ótimo custo-benefício</p>
                  
                  <div className="flex items-baseline gap-1 mb-10">
                    <span className="text-4xl font-black text-rose-500 tracking-tighter">R$ 550</span>
                    <span className="text-sm font-bold text-gray-400">/mês</span>
                  </div>

                  <ul className="space-y-4 mb-12">
                    {[
                      '5 dias por semana',
                      'Atividades inclusas',
                      'Lanchinho + Frutinha',
                      'Sem burocracia'
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-600">
                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <Link href="https://wa.me/5511972090986" className="w-full py-5 bg-emerald-500 text-white rounded-3xl font-black text-sm flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100">
                      <MessageSquare size={20} />
                      Tenho interesse
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GALLERY SECTION - Momentos Mágicos */}
        <section className="py-16 md:py-24 bg-slate-50/50" id="galeria">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <span className="text-lime-600 font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">Nossa Brinquedoteca</span>
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tightest">
                Conheça nosso <span className="text-sky-500 italic">espaço</span>
              </h2>
              <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">Cada cantinho da Mundo Mágico foi pensado para proporcionar conforto, segurança e experiências especiais para as crianças.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {/* Mosaic Grid Layout */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="col-span-2 row-span-2 overflow-hidden rounded-[2.5rem] group shadow-xl"
              >
                <img 
                  src="/images/galeria/1.webp" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt="Galeria 1" 
                />
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="overflow-hidden rounded-[2.5rem] group shadow-xl h-[250px] md:h-full"
              >
                <img 
                  src="/images/galeria/2.webp" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt="Galeria 2" 
                />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="overflow-hidden rounded-[2.5rem] group shadow-xl h-[250px] md:h-full"
              >
                <img 
                  src="/images/galeria/3.webp" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt="Galeria 3" 
                />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="col-span-2 overflow-hidden rounded-[2.5rem] group shadow-xl h-[250px]"
              >
                <img 
                  src="/images/galeria/4.webp" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt="Galeria 4" 
                />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="overflow-hidden rounded-[2.5rem] group shadow-xl h-[250px]"
              >
                <img 
                  src="/images/galeria/5.webp" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt="Galeria 5" 
                />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="overflow-hidden rounded-[2.5rem] group shadow-xl h-[250px]"
              >
                <img 
                  src="/images/galeria/6.webp" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt="Galeria 6" 
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-16 md:py-24 bg-white" id="contato">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-5xl mx-auto bg-gradient-to-tr from-[#2d5a27] to-sky-950 rounded-[4rem] p-16 md:p-28 text-white relative overflow-hidden shadow-2xl">
               <h2 className="text-4xl md:text-6xl font-black mb-10 tracking-tight">O Mundo Mágico <br /><span className="text-lime-400 italic">espera por você.</span></h2>
               <div className="flex flex-col sm:flex-row gap-5 justify-center">
                  <Link href="https://wa.me/5511972090986" className="px-12 py-6 bg-lime-500 text-white rounded-3xl font-black text-xl shadow-2xl shadow-lime-900/40 hover:scale-105 transition-all flex items-center justify-center gap-4">
                    <MessageSquare size={24} />
                    WhatsApp
                  </Link>
                  <Link href="https://www.google.com/maps" className="px-12 py-6 bg-white/10 text-white border border-white/20 rounded-3xl font-black text-xl flex items-center justify-center gap-4">
                    <MapPin size={24} />
                    Ver Mapa
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
