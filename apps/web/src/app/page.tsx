'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
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

const MotionLink = motion.create(Link)

// ── Rotating Hero Banner ──────────────────────────────────────────────────
const desktopBanners = [
  '/images/banermundomagico.png',
  '/images/banner%20app.png',
]
const mobileBanners = [
  '/images/banne%20rmobile.png',
  '/images/banner%20app%20mobile.png',
]

function RotatingHeroBanner({ current, onSetCurrent }: { current: number; onSetCurrent: (i: number) => void }) {
  return (
    <>
      {desktopBanners.map((src, i) => (
        <motion.img
          key={src + '-desktop'}
          src={src}
          alt={`Banner ${i + 1}`}
          className="absolute inset-0 w-full h-full object-cover object-center hidden md:block"
          initial={false}
          animate={{ opacity: i === current ? 1 : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      ))}
      {mobileBanners.map((src, i) => (
        <motion.img
          key={src + '-mobile-' + i}
          src={src}
          alt={`Banner mobile ${i + 1}`}
          className="absolute inset-0 w-full h-full object-cover md:hidden"
          style={{ objectPosition: 'center 15%' }}
          initial={false}
          animate={{ opacity: i === current ? 1 : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      ))}
      <div className="absolute inset-0 bg-black/5 md:bg-transparent" />
      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {desktopBanners.map((_, i) => (
          <button
            key={i}
            onClick={() => onSetCurrent(i)}
            className="transition-all duration-300 rounded-full border-2 border-white/60"
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              background: i === current ? '#ffffff' : 'rgba(255,255,255,0.4)',
            }}
          />
        ))}
      </div>
    </>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

const heroSubtitles = [
  { text: 'Brinquedoteca Infantil em Cajamar', color: '#5d2a7a' },
  { text: 'Segurança e cuidado', color: '#2196f3' },
  { text: 'Carinho e muita atenção', color: '#e91e63' },
  { text: 'Um lar para o seu pequeno', color: '#3a7d34' },
  { text: 'Diversão que vira aprendizado', color: '#ff9800' },
]

function CyclingSubtitle() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % heroSubtitles.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  const current = heroSubtitles[index]

  return (
    <div className="mb-4 md:mb-8 min-h-[1.8rem] sm:min-h-[2.2rem] md:min-h-[2.8rem]">
      <AnimatePresence mode="wait">
        <motion.h2
          key={index}
          initial={{ opacity: 0, y: 16, filter: 'blur(5px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -16, filter: 'blur(5px)' }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight font-baloo"
          style={{ color: current.color }}
        >
          {current.text}
        </motion.h2>
      </AnimatePresence>
    </div>
  )
}

const featureCards = [
  {
    title: 'Ambiente seguro',
    desc: 'Segurança em cada detalhe',
    icon: <ShieldCheck size={28} className="text-white" />,
    gradient: 'from-blue-400 to-blue-600',
    bar: 'bg-blue-400',
    glow: 'rgba(59,130,246,0.35)',
    ring: 'bg-blue-400',
  },
  {
    title: 'Equipe atenciosa',
    desc: 'Cuidado com amor',
    icon: <Heart size={28} className="text-white" />,
    gradient: 'from-rose-400 to-pink-600',
    bar: 'bg-rose-400',
    glow: 'rgba(244,63,94,0.35)',
    ring: 'bg-rose-400',
  },
  {
    title: 'Atividades lúdicas',
    desc: 'Brincar e aprender',
    icon: <Sparkles size={28} className="text-white" />,
    gradient: 'from-amber-400 to-orange-500',
    bar: 'bg-amber-400',
    glow: 'rgba(251,191,36,0.4)',
    ring: 'bg-amber-400',
  },
  {
    title: 'Espaço acolhedor',
    desc: 'Conforto e carinho',
    icon: <Home size={28} className="text-white" />,
    gradient: 'from-lime-400 to-green-500',
    bar: 'bg-lime-400',
    glow: 'rgba(132,204,22,0.35)',
    ring: 'bg-lime-400',
  },
  {
    title: 'Desenvolvimento',
    desc: 'Crescimento real',
    icon: <Brain size={28} className="text-white" />,
    gradient: 'from-violet-400 to-purple-600',
    bar: 'bg-violet-400',
    glow: 'rgba(167,139,250,0.4)',
    ring: 'bg-violet-400',
  },
  {
    title: 'Humanizado',
    desc: 'Apoio à família',
    icon: <HandHeart size={28} className="text-white" />,
    gradient: 'from-orange-400 to-red-500',
    bar: 'bg-orange-400',
    glow: 'rgba(251,146,60,0.35)',
    ring: 'bg-orange-400',
  },
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
              initial={{ opacity: 0, y: 30, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.92 }}
              transition={{ duration: 0.5, ease: [0.21, 1.11, 0.81, 0.99], delay: i * 0.06 }}
              whileHover={{ y: -8, boxShadow: `0 24px 48px -8px ${card.glow}` }}
              className="bg-white dark:bg-slate-800 rounded-[2rem] border border-gray-100/80 dark:border-slate-700 shadow-lg shadow-gray-100 dark:shadow-black/20 flex flex-col items-center text-center overflow-hidden group cursor-default"
            >
              {/* Barra colorida topo */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${card.gradient}`} />

              <div className="p-5 md:p-6 flex flex-col items-center w-full">
                {/* Ícone com glow pulsante */}
                <div className="relative mb-4">
                  {/* Anel glow */}
                  <motion.div
                    className={`absolute inset-0 rounded-2xl ${card.ring} opacity-30`}
                    animate={{ scale: [1, 1.55, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                  />
                  {/* Container gradiente */}
                  <motion.div
                    className={`relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
                    animate={{ rotate: [0, 3, -3, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                    whileHover={{ scale: 1.12, rotate: 6 }}
                  >
                    {card.icon}
                  </motion.div>
                </div>

                <h3 className="text-sm md:text-base font-black text-gray-900 dark:text-white mb-1.5 tracking-tight leading-tight font-baloo">
                  {card.title}
                </h3>
                <p className="text-[10px] md:text-[11px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-[0.12em] leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-8">
        {cards.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${i === index ? 'w-8 bg-[#e91e63]' : 'w-2 bg-gray-200'
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
    offset: ["start start", "end start"]
  })

  // Banner rotation state
  const [bannerIndex, setBannerIndex] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
    // 15 seconds for main banner (enough for all 5 subtitles to animate), 8 seconds for app banner
    const delay = bannerIndex === 0 ? 15000 : 8000;
    const t = setTimeout(() => {
      setBannerIndex(i => (i + 1) % desktopBanners.length)
    }, delay)
    return () => clearTimeout(t)
  }, [bannerIndex])

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
    <div className="relative min-h-screen bg-white dark:bg-slate-950 selection:bg-lime-100 selection:text-lime-900 font-sans overflow-x-hidden">
      <PublicHeader />
      <WhatsAppButton />

      <main ref={targetRef}>
        {/* HERO SECTION WITH ANIMATED TEXT & LOWERED POSITION */}
        <section className="relative min-h-[720px] md:min-h-[950px] flex items-end md:items-center overflow-hidden bg-[#fffdf9] dark:bg-slate-950">

          {/* Rotating Banner Background */}
          <div className="absolute inset-0 z-0">
            <RotatingHeroBanner current={bannerIndex} onSetCurrent={setBannerIndex} />
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-20 h-full">
            <div className="relative w-full h-full flex items-end md:items-center pb-20 md:pb-0 md:pt-40">
              <AnimatePresence>
                {bannerIndex === 0 ? (
                  /* ── MAIN SLIDE CONTENT (Institutional) ── */
                  <motion.div 
                    key="main-slide" 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="absolute md:relative flex flex-col items-start text-left bg-white/65 backdrop-blur-xl md:bg-transparent md:backdrop-blur-none p-5 md:p-0 rounded-[2rem] md:rounded-none border border-white/40 md:border-none shadow-2xl shadow-black/10 md:shadow-none w-full sm:w-auto max-w-3xl"
                  >
                    {/* LOGO-STYLE ANIMATED TITLE */}
                    <motion.h1
                      variants={itemVariants}
                      className="font-fredoka text-3xl sm:text-5xl md:text-8xl font-black mb-3 md:mb-6 tracking-tight flex flex-wrap gap-x-3 md:gap-x-8 items-center"
                      style={{
                        textShadow: `-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff, 0px 4px 12px rgba(0,0,0,0.12)`
                      }}
                    >
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
                            initial={{ opacity: 0, y: 40, rotate: -8 }}
                            animate={{ opacity: 1, y: 0, rotate: 0 }}
                            whileHover={{ y: -4, scale: 1.15 }}
                            transition={{ delay: i * 0.07 + 0.4, type: 'spring', stiffness: 300 }}
                            className="inline-block relative cursor-default"
                            style={{ color: item.c }}
                          >
                            {item.l}
                            {item.star && (
                              <Star className="absolute inset-0 m-auto text-white fill-white translate-y-[1px] w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                            )}
                          </motion.span>
                        ))}
                      </div>
                      <div className="flex">
                        {[
                          { l: 'M', c: '#2196f3' },
                          { l: 'á', c: '#00bcd4' },
                          { l: 'g', c: '#2196f3' },
                          { l: 'i', c: '#00bcd4', starTop: true },
                          { l: 'c', c: '#2196f3' },
                          { l: 'o', c: '#00bcd4', star: true },
                        ].map((item, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, y: 40, rotate: 8 }}
                            animate={{ opacity: 1, y: 0, rotate: 0 }}
                            whileHover={{ y: -4, scale: 1.15 }}
                            transition={{ delay: (i + 5) * 0.07 + 0.4, type: 'spring', stiffness: 300 }}
                            className="inline-block relative cursor-default"
                            style={{ color: item.c }}
                          >
                            {item.l}
                            {item.star && (
                              <Star className="absolute inset-0 m-auto text-white fill-white translate-y-[1px] w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                            )}
                            {item.starTop && (
                              <motion.div
                                className="absolute -top-1 left-1/2 -translate-x-1/2"
                                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
                                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                              >
                                <Star size={10} className="text-[#e91e63] fill-[#e91e63] md:w-3 md:h-3" />
                              </motion.div>
                            )}
                          </motion.span>
                        ))}
                      </div>
                    </motion.h1>

                    <motion.div variants={itemVariants}>
                      <CyclingSubtitle />
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className="flex items-center gap-3 mb-5 md:mb-10 max-w-lg"
                    >
                      <div className="relative shrink-0">
                        <motion.div
                          className="absolute inset-0 rounded-full bg-amber-300/40"
                          animate={{ scale: [1, 1.7, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <motion.div
                          className="relative w-8 h-8 bg-gradient-to-br from-amber-300 to-orange-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-200"
                          animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <Star size={16} className="text-white fill-white" />
                        </motion.div>
                      </div>
                      <p className="text-sm md:text-xl text-gray-900 font-black leading-snug flex flex-wrap gap-x-[0.28em]">
                        {[
                          { word: 'Um', special: false },
                          { word: 'espaço', special: false },
                          { word: 'seguro,', color: '#e91e63' },
                          { word: 'divertido', special: false },
                          { word: 'e', special: false },
                          { word: 'cheio', special: false },
                          { word: 'de', special: false },
                          { word: 'carinho', color: '#2196f3' },
                          { word: 'para', special: false },
                          { word: 'as', special: false },
                          { word: 'crianças.', special: false },
                        ].map((item, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.6 + i * 0.1, duration: 0.4, ease: 'easeOut' }}
                            style={item.color ? { color: item.color } : undefined}
                          >
                            {item.word}
                          </motion.span>
                        ))}
                      </p>
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className="flex flex-col sm:flex-row gap-4 mb-5 md:mb-12 w-full sm:w-auto"
                    >
                      <MotionLink
                        href="https://wa.me/5511972090986"
                        whileHover={{ scale: 1.05, boxShadow: '0 20px 40px -8px rgba(233,30,99,0.45)' }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-4 md:px-8 md:py-4 bg-[#e91e63] text-white rounded-full font-black text-lg md:text-xl shadow-xl shadow-rose-300/50 flex items-center justify-center gap-3 transition-all w-full sm:w-auto text-center"
                      >
                        <motion.div
                          animate={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <Calendar size={20} className="md:w-6 md:h-6" />
                        </motion.div>
                        Agende uma visita
                      </MotionLink>
                    </motion.div>

                    <motion.div
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: { staggerChildren: 0.15, delayChildren: 1.4 }
                        }
                      }}
                      className="flex flex-row flex-wrap gap-2 md:gap-10"
                    >
                      {[
                        { text: 'Equipe acolhedora', iconColor: 'text-rose-500', bg: 'bg-white', border: 'border-rose-200', textColor: 'text-rose-600', shadow: 'shadow-rose-100', dot: 'bg-rose-400' },
                        { text: 'Ambiente seguro', iconColor: 'text-lime-600', bg: 'bg-white', border: 'border-lime-200', textColor: 'text-lime-700', shadow: 'shadow-lime-100', dot: 'bg-lime-400' }
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          variants={{
                            hidden: { opacity: 0, y: 16, scale: 0.85 },
                            visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, delay: 2.0 + i * 0.15 } }
                          }}
                          whileHover={{ scale: 1.07, y: -2 }}
                          className={`flex items-center gap-1.5 ${item.bg} ${item.border} border px-3 py-2 rounded-2xl shadow-md ${item.shadow} cursor-default`}
                        >
                          <div className="relative shrink-0">
                            <motion.div
                              className={`absolute inset-0 rounded-full ${item.dot} opacity-40`}
                              animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.5 }}
                            />
                            <CheckCircle2 size={14} className={item.iconColor} />
                          </div>
                          <span className={`${item.textColor} font-black text-[10px] uppercase tracking-widest`}>
                            {item.text}
                          </span>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                ) : (
                  /* ── APP BANNER SLIDE CONTENT ── */
                  <motion.div
                    key="app-slide"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="absolute md:relative flex flex-col items-start text-left bg-white/65 backdrop-blur-xl md:bg-transparent md:backdrop-blur-none p-5 md:p-0 rounded-[2rem] md:rounded-none border border-white/40 md:border-none shadow-2xl shadow-black/10 md:shadow-none w-full sm:w-auto max-w-2xl md:max-w-4xl md:pl-8 pt-10 pb-10"
                  >
                    {/* Mundo Mágico Logo */}
                    <motion.div 
                      className="font-fredoka text-2xl sm:text-5xl md:text-8xl font-black mb-2 md:mb-6 tracking-tight flex md:flex-nowrap flex-wrap gap-x-2 md:gap-x-8 items-center"
                      style={{ textShadow: `-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff, 0px 4px 12px rgba(0,0,0,0.12)` }}
                    >
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
                             initial={{ opacity: 0, y: 20, rotate: -5 }}
                             animate={{ opacity: 1, y: 0, rotate: 0 }}
                             transition={{ delay: i * 0.05 + 0.1, type: 'spring', stiffness: 300 }}
                             className="inline-block relative cursor-default" 
                             style={{ color: item.c }}
                           >
                             {item.l}
                             {item.star && <Star className="absolute inset-0 m-auto text-white fill-white translate-y-[1px] w-2.5 h-2.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />}
                           </motion.span>
                         ))}
                       </div>
                       <div className="flex">
                         {[
                           { l: 'M', c: '#2196f3' },
                           { l: 'á', c: '#00bcd4' },
                           { l: 'g', c: '#2196f3' },
                           { l: 'i', c: '#00bcd4', starTop: true },
                           { l: 'c', c: '#2196f3' },
                           { l: 'o', c: '#00bcd4', star: true },
                         ].map((item, i) => (
                           <motion.span 
                             key={i} 
                             initial={{ opacity: 0, y: 20, rotate: 5 }}
                             animate={{ opacity: 1, y: 0, rotate: 0 }}
                             transition={{ delay: (i + 5) * 0.05 + 0.1, type: 'spring', stiffness: 300 }}
                             className="inline-block relative cursor-default" 
                             style={{ color: item.c }}
                           >
                             {item.l}
                             {item.star && <Star className="absolute inset-0 m-auto text-white fill-white translate-y-[1px] w-2.5 h-2.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />}
                             {item.starTop && (
                                <motion.div
                                  className="absolute -top-0.5 left-1/2 -translate-x-1/2"
                                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
                                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                  <Star size={8} className="text-[#e91e63] fill-[#e91e63] md:w-3 md:h-3" />
                                </motion.div>
                             )}
                           </motion.span>
                         ))}
                       </div>
                    </motion.div>

                    <div className="relative">
                      <div className="absolute -left-5 md:-left-12 top-1 md:top-8 flex flex-col gap-1.5 md:gap-2.5">
                        {[
                          { w: 'w-2.5 md:w-3', c: 'bg-[#8bc34a]', r: 'rotate-45' },
                          { w: 'w-4 md:w-5', c: 'bg-[#8bc34a]', r: 'rotate-12', tx: '-translate-x-1 md:-translate-x-2' },
                          { w: 'w-2.5 md:w-3', c: 'bg-[#8e529d]', r: '-rotate-12' }
                        ].map((line, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10, scale: 0 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ delay: 0.6 + i * 0.08, type: 'spring' }}
                            className={`${line.w} h-1 md:h-1.5 ${line.c} rounded-full ${line.r} ${line.tx || ''}`}
                          />
                        ))}
                      </div>
                      
                      <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                        className="text-3xl sm:text-5xl md:text-[4.2rem] font-black mb-3 md:mb-6 leading-[1.1] font-baloo tracking-tight"
                      >
                        <span className="text-[#17345e]">Acompanhe</span><br />
                        <span className="text-[#8e529d]">o dia do seu filho</span><br />
                        <span className="text-[#e53869]">pelo app</span>
                      </motion.h2>
                    </div>

                    <div className="flex flex-wrap gap-x-[0.25em] mb-6 md:mb-10 max-w-sm">
                      {[
                        'Recados,', 'fotos,', 'agenda,',
                        'refeições', 'e', 'muito', 'mais',
                        'na', 'palma', 'da', 'sua', 'mão.'
                      ].map((word, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.1 + i * 0.04, duration: 0.3 }}
                          className="text-[#17345e] font-bold text-base md:text-xl leading-tight"
                        >
                          {word}
                        </motion.span>
                      ))}
                    </div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 1.6 }}
                      className="w-full sm:w-auto"
                    >
                      <a
                        href="#planos"
                        className="inline-flex items-center justify-center gap-3 px-8 py-3 md:py-4 rounded-full font-black text-white text-lg shadow-xl shadow-[#8e529d]/30 hover:scale-105 transition-all duration-200 border-4 border-white w-full sm:w-auto text-center"
                        style={{ background: '#8e529d' }}
                      >
                        <Users size={24} />
                        Área dos Pais
                      </a>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* REFINED FLOATING FEATURE CARDS - Subtle Floating Overlay */}
        <section className="relative z-30 -mt-12 md:-mt-20 bg-transparent">
          <div className="container mx-auto px-6">
            {/* Dark mode cards handled via featureCards data or styles below */}
            <FeatureCarousel cards={featureCards} />
          </div>
        </section>

        {/* STATS STRIP — redesigned */}
        <section className="relative py-14 md:py-16 overflow-hidden" style={{ background: 'linear-gradient(135deg, #2d6228 0%, #3a7d34 50%, #4a9640 100%)' }}>
          {/* Decorative blobs */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-lime-400/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

          <div className="container mx-auto px-6 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { icon: <Users size={26} />, value: 'Equipe', label: 'Especialista', sub: 'Profissionais dedicados', gradient: 'from-emerald-400 to-green-600', delay: 0 },
                { icon: <Clock size={26} />, value: '07h às 19h', label: 'Funcionamento', sub: 'Segunda a sexta', gradient: 'from-lime-400 to-emerald-500', delay: 0.1 },
                { icon: <MapPin size={26} />, value: 'Portal dos Ipês', label: 'Localização', sub: 'Cajamar — SP', gradient: 'from-teal-400 to-green-600', delay: 0.2 },
                { icon: <Award size={26} />, value: 'Betta', label: 'Diretora', sub: 'Especialista infantil', gradient: 'from-green-400 to-lime-500', delay: 0.3 },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: item.delay, ease: 'easeOut' }}
                  whileHover={{ y: -4, scale: 1.03 }}
                  className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-[1.75rem] p-5 md:p-6 flex flex-col items-center text-center gap-3 cursor-default hover:bg-white/15 transition-all duration-300"
                >
                  <motion.div
                    className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center shadow-lg shadow-black/20`}
                    animate={{ rotate: [0, 4, -4, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
                    whileHover={{ scale: 1.15, rotate: 8 }}
                  >
                    <span className="text-white">{item.icon}</span>
                  </motion.div>
                  <div>
                    <div className="text-white font-black text-base md:text-lg leading-tight tracking-tight font-baloo">{item.value}</div>
                    <div className="text-lime-300 font-black text-[10px] uppercase tracking-[0.18em] mt-0.5">{item.label}</div>
                    <div className="text-white/50 font-medium text-[10px] mt-1 hidden md:block">{item.sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section className="py-20 md:py-28 bg-white dark:bg-zinc-950 overflow-hidden" id="sobre">
          <div className="container mx-auto px-6">

            {/* Header badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center mb-16 md:mb-20"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-lime-50 border border-lime-200 rounded-full mb-4">
                <div className="w-1.5 h-1.5 bg-lime-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-lime-700 uppercase tracking-[0.3em]">Sobre Nós</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.05] font-baloo">
                Um lugar feito com{' '}
                <span className="text-rose-500 italic">muito carinho.</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">

              {/* Image side */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="relative"
              >
                {/* Glow bg */}
                <div className="absolute -inset-8 bg-gradient-to-br from-lime-100/60 to-rose-100/40 rounded-[4rem] blur-2xl" />

                <div className="relative z-10">
                  <Image
                    src="/images/bannersobrenos.png"
                    width={900}
                    height={675}
                    className="w-full aspect-[4/3] md:aspect-auto md:h-[580px] object-cover rounded-[3rem] shadow-2xl border-[6px] border-white"
                    style={{ objectPosition: '80% center' }}
                    alt="Sobre a Mundo Mágico"
                  />

                  {/* Floating badge top-left */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 260 }}
                    className="absolute -top-4 -left-4 md:-top-6 md:-left-6 bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-100 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 bg-lime-100 rounded-xl flex items-center justify-center">
                      <ShieldCheck size={18} className="text-lime-600" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-gray-900 leading-none">100% Seguro</div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Ambiente monitorado</div>
                    </div>
                  </motion.div>

                  {/* Floating badge bottom-right */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, type: 'spring', stiffness: 260 }}
                    className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 bg-[#e91e63] text-white rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3"
                  >
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                      <Heart size={18} className="text-white fill-white" />
                    </div>
                    <div>
                      <div className="text-xs font-black leading-none">Equipe Amorosa</div>
                      <div className="text-[9px] font-bold text-white/70 uppercase tracking-wider mt-0.5">Sempre presente</div>
                    </div>
                  </motion.div>

                  {/* Decorative square */}
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-lime-400 rounded-3xl -rotate-12 z-[-1] hidden md:block opacity-60" />
                </div>
              </motion.div>

              {/* Text side */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
              >
                <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed font-medium">
                  A <strong className="text-gray-900 dark:text-white">Mundo Mágico</strong> é um espaço pensado para oferecer experiências de desenvolvimento, socialização, criatividade e diversão em um ambiente seguro e acolhedor. Nosso objetivo é proporcionar tranquilidade para as famílias e momentos inesquecíveis para as crianças.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { title: 'Ambiente seguro',    desc: 'Segurança total',         icon: <ShieldCheck size={22} className="text-white" />, gradient: 'from-lime-400 to-green-500',    bg: 'bg-lime-50',   glow: 'shadow-lime-100' },
                    { title: 'Equipe atenciosa',   desc: 'Cuidado com amor',        icon: <Heart size={22} className="text-white" />,        gradient: 'from-rose-400 to-pink-500',     bg: 'bg-rose-50',   glow: 'shadow-rose-100' },
                    { title: 'Atividades lúdicas', desc: 'Brincar e aprender',      icon: <Sparkles size={22} className="text-white" />,     gradient: 'from-amber-400 to-orange-500',  bg: 'bg-amber-50',  glow: 'shadow-amber-100' },
                    { title: 'Espaço acolhedor',   desc: 'Conforto e descanso',     icon: <Home size={22} className="text-white" />,         gradient: 'from-sky-400 to-blue-500',      bg: 'bg-sky-50',    glow: 'shadow-sky-100' },
                    { title: 'Desenvolvimento',    desc: 'Fases de descoberta',     icon: <Brain size={22} className="text-white" />,        gradient: 'from-violet-400 to-purple-600', bg: 'bg-violet-50', glow: 'shadow-violet-100' },
                    { title: 'Humanizado',         desc: 'Respeito e empatia',      icon: <HandHeart size={22} className="text-white" />,    gradient: 'from-teal-400 to-cyan-500',     bg: 'bg-teal-50',   glow: 'shadow-teal-100' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20, scale: 0.92 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.08, duration: 0.4, type: 'spring', stiffness: 260 }}
                      whileHover={{ y: -4, boxShadow: '0 12px 28px -6px rgba(0,0,0,0.1)' }}
                      className={`flex flex-col items-center text-center gap-3 p-4 rounded-2xl ${item.bg} border border-white shadow-md ${item.glow} cursor-default transition-all duration-200`}
                    >
                      <motion.div
                        className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
                        animate={{ rotate: [0, 4, -4, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
                        whileHover={{ scale: 1.12, rotate: 8 }}
                      >
                        {item.icon}
                      </motion.div>
                      <div>
                        <h4 className="font-black text-gray-900 text-sm leading-tight font-baloo">{item.title}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* PRICING SECTION */}
        <section className="py-16 md:py-24 bg-rose-50/30 dark:bg-zinc-950 overflow-hidden w-full" id="planos">

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 md:mb-14 px-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-100 border border-rose-200 rounded-full mb-4">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.3em]">Planos e valores</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight font-baloo">
                Escolha o plano <span className="text-rose-500 italic">ideal</span>
              </h2>
              <p className="text-sm text-gray-400 font-medium mt-3 md:hidden">Arraste para ver todos os planos →</p>
            </motion.div>

            {/* === MOBILE: Draggable Carousel === */}
            <div className="relative w-full overflow-hidden md:hidden">
              {/* Fade edges */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-rose-50/60 to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-rose-50/60 to-transparent z-10 pointer-events-none" />

              <motion.div
                drag="x"
                dragConstraints={{ right: 0, left: -900 }}
                dragElastic={0.1}
                whileDrag={{ cursor: 'grabbing' }}
                className="flex gap-5 pb-6 cursor-grab active:cursor-grabbing select-none px-6"
                style={{ width: 'max-content' }}
              >
                {[
                  {
                    title: 'Diária Meio Período',
                    price: 'R$ 50',
                    period: '/dia',
                    color: 'bg-orange-400',
                    gradient: 'from-orange-400 to-amber-500',
                    features: ['Acolhimento por dia avulso', 'Atividades inclusas', 'Sem fidelidade', 'Lanchinho + Frutinha'],
                    badge: null,
                  },
                  {
                    title: 'Diária Integral',
                    price: 'R$ 70',
                    period: '/dia',
                    color: 'bg-sky-400',
                    gradient: 'from-sky-400 to-blue-500',
                    features: ['Período completo', 'Atividades lúdicas', 'Acompanhamento individual', 'Relatório diário'],
                    badge: null,
                  },
                  {
                    title: 'Pacote Mensal Integral',
                    price: 'R$ 850',
                    period: '/mês',
                    color: 'bg-violet-500',
                    gradient: 'from-violet-500 to-purple-600',
                    features: ['Período completo', 'Refeições inclusas', 'Atividades + descanso', 'Relatórios e fotos'],
                    badge: 'Mais procurado',
                  },
                  {
                    title: 'Pacote Mensal Meio Período',
                    price: 'R$ 550',
                    period: '/mês',
                    color: 'bg-lime-500',
                    gradient: 'from-lime-500 to-green-600',
                    features: ['5 dias por semana', 'Atividades inclusas', 'Lanchinho + Frutinha', 'Sem burocracia'],
                    badge: null,
                  },
                ].map((plan, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.5, type: 'spring', stiffness: 220 }}
                    className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden flex-shrink-0 w-[260px] flex flex-col"
                    style={{ pointerEvents: 'none' }}
                  >
                    {/* Top gradient bar */}
                    <div className={`h-2 w-full bg-gradient-to-r ${plan.gradient}`} />

                    {/* Badge */}
                    {plan.badge && (
                      <div className="absolute top-5 right-5">
                        <div className={`bg-gradient-to-r ${plan.gradient} text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg`}>
                          <Award size={11} className="fill-white" />
                          <span className="text-[9px] font-black uppercase tracking-widest">{plan.badge}</span>
                        </div>
                      </div>
                    )}

                    <div className="p-6 flex flex-col flex-1">
                      <div className={`w-11 h-11 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                        <Gift size={20} className="text-white" />
                      </div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1 leading-tight font-baloo">
                        {plan.title}
                      </h3>
                      <div className="flex items-baseline gap-1 mt-3 mb-5">
                        <span className="text-3xl font-black text-rose-500 tracking-tighter">{plan.price}</span>
                        <span className="text-xs font-bold text-gray-400">{plan.period}</span>
                      </div>
                      <ul className="space-y-2.5 mb-6 flex-1">
                        {plan.features.map((f, j) => (
                          <li key={j} className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-zinc-400">
                            <div className={`w-4 h-4 bg-gradient-to-br ${plan.gradient} rounded-full flex items-center justify-center shrink-0`}>
                              <CheckCircle2 size={10} className="text-white" />
                            </div>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <a
                        href="https://wa.me/5511972090986"
                        style={{ pointerEvents: 'auto' }}
                        className={`w-full py-3.5 bg-gradient-to-r ${plan.gradient} text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity`}
                      >
                        <MessageSquare size={16} />
                        Tenho interesse
                      </a>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Scroll indicator dots — mobile only */}
            <div className="flex justify-center gap-2 mt-6 px-6 md:hidden">
              {[0,1,2,3].map(i => (
                <div key={i} className={`h-1.5 rounded-full bg-rose-300 transition-all ${i === 0 ? 'w-6 bg-rose-500' : 'w-2'}`} />
              ))}
            </div>

            {/* === DESKTOP: 4-column grid === */}
            <div className="hidden md:grid md:grid-cols-4 gap-6 container mx-auto px-6">
              {[
                {
                  title: 'Diária Meio Período',
                  price: 'R$ 50',
                  period: '/dia',
                  gradient: 'from-orange-400 to-amber-500',
                  features: ['Acolhimento por dia avulso', 'Atividades inclusas', 'Sem fidelidade', 'Lanchinho + Frutinha'],
                  badge: null,
                },
                {
                  title: 'Diária Integral',
                  price: 'R$ 70',
                  period: '/dia',
                  gradient: 'from-sky-400 to-blue-500',
                  features: ['Período completo', 'Atividades lúdicas', 'Acompanhamento individual', 'Relatório diário'],
                  badge: null,
                },
                {
                  title: 'Pacote Mensal Integral',
                  price: 'R$ 850',
                  period: '/mês',
                  gradient: 'from-violet-500 to-purple-600',
                  features: ['Período completo', 'Refeições inclusas', 'Atividades + descanso', 'Relatórios e fotos'],
                  badge: 'Mais procurado',
                },
                {
                  title: 'Pacote Mensal Meio Período',
                  price: 'R$ 550',
                  period: '/mês',
                  gradient: 'from-lime-500 to-green-600',
                  features: ['5 dias por semana', 'Atividades inclusas', 'Lanchinho + Frutinha', 'Sem burocracia'],
                  badge: null,
                },
              ].map((plan, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5, type: 'spring', stiffness: 220 }}
                  className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col"
                >
                  {/* Top gradient bar */}
                  <div className={`h-2 w-full bg-gradient-to-r ${plan.gradient}`} />

                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute top-5 right-5">
                      <div className={`bg-gradient-to-r ${plan.gradient} text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg`}>
                        <Award size={11} className="fill-white" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{plan.badge}</span>
                      </div>
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    <div className={`w-11 h-11 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                      <Gift size={20} className="text-white" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1 leading-tight font-baloo">
                      {plan.title}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-3 mb-5">
                      <span className="text-3xl font-black text-rose-500 tracking-tighter">{plan.price}</span>
                      <span className="text-xs font-bold text-gray-400">{plan.period}</span>
                    </div>
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-zinc-400">
                          <div className={`w-4 h-4 bg-gradient-to-br ${plan.gradient} rounded-full flex items-center justify-center shrink-0`}>
                            <CheckCircle2 size={10} className="text-white" />
                          </div>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <a
                      href="https://wa.me/5511972090986"
                      className={`w-full py-3.5 bg-gradient-to-r ${plan.gradient} text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity`}
                    >
                      <MessageSquare size={16} />
                      Tenho interesse
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
        </section>


        {/* BETTA / TEAM SECTION */}
        <section className="py-16 md:py-24 bg-white dark:bg-zinc-950" id="equipe">
          <div className="container mx-auto px-6">
            {/* DIRECTION & TEAM SECTION */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="mt-20 md:mt-28"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-[3rem] overflow-hidden shadow-2xl shadow-green-900/15">

                {/* LEFT — Photo full height */}
                <div className="relative min-h-[380px] md:min-h-[560px]">
                  <Image
                    src="/images/betta.png"
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover object-center"
                    alt="Diretora Betta"
                  />
                  {/* Gradient overlay bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2d6228]/80 via-transparent to-transparent" />

                  {/* Name badge over photo */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="inline-flex flex-col bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-xl">
                      <span className="font-black text-gray-900 text-lg leading-tight">Betta</span>
                      <span className="text-[10px] font-black text-[#e91e63] uppercase tracking-[0.25em]">Diretora & Fundadora</span>
                    </div>
                  </div>

                  {/* Top badge */}
                  <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, type: 'spring' }}
                    className="absolute top-6 left-6 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg"
                  >
                    <div className="w-2 h-2 bg-lime-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">Direção e Equipe</span>
                  </motion.div>
                </div>

                {/* RIGHT — Content on green */}
                <div
                  className="relative flex flex-col justify-center p-8 md:p-14 text-white overflow-hidden"
                  style={{ background: 'linear-gradient(160deg, #2d6228 0%, #3a7d34 55%, #4a9640 100%)' }}
                >
                  {/* Decorative blobs */}
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-lime-300/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Floating dots */}
                  {[
                    { top:'12%', right:'10%', size:8,  color:'#a5d6a7' },
                    { top:'35%', right:'5%',  size:5,  color:'#fff59d' },
                    { bottom:'20%', right:'15%', size:7, color:'#f48fb1' },
                  ].map((d,i) => (
                    <motion.div key={i}
                      animate={{ y:[0,-10,0], opacity:[0.4,0.9,0.4] }}
                      transition={{ duration:3+i, repeat:Infinity, ease:'easeInOut', delay:i*0.7 }}
                      className="absolute rounded-full pointer-events-none"
                      style={{ width:d.size, height:d.size, background:d.color, top:(d as any).top, right:(d as any).right, bottom:(d as any).bottom }}
                    />
                  ))}

                  <div className="relative z-10">
                    <h3 className="text-3xl md:text-4xl font-black mb-5 tracking-tight leading-tight font-baloo">
                      Pessoas que{' '}
                      <span className="text-lime-300 italic">cuidam de verdade.</span>
                    </h3>

                    <p className="text-white/85 text-base leading-relaxed mb-6 font-medium">
                      Apaixonada pelo desenvolvimento infantil, a{' '}
                      <strong className="text-white">Diretora Betta</strong> acompanha de perto a rotina da brinquedoteca e o bem-estar das crianças. Possui formação na área, incluindo atuação com crianças dentro do espectro autista.
                    </p>

                    {/* Quote */}
                    <div className="relative bg-white/10 border border-white/20 rounded-2xl p-5 mb-8">
                      <div className="text-lime-300 text-4xl font-serif leading-none mb-1 opacity-60">&quot;</div>
                      <p className="text-white/90 text-sm leading-relaxed italic font-medium">
                        Nossa equipe atua com carinho, responsabilidade e dedicação no cuidado diário com as crianças.
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label:'Monitoramento Constante', color:'bg-lime-400'  },
                        { label:'Equipe Treinada',          color:'bg-[#e91e63]' },
                        { label:'Ambiente Seguro',          color:'bg-sky-400'   },
                      ].map((tag, i) => (
                        <motion.div key={i}
                          initial={{ opacity:0, scale:0.85 }}
                          whileInView={{ opacity:1, scale:1 }}
                          viewport={{ once:true }}
                          transition={{ delay:0.3 + i*0.1, type:'spring', stiffness:250 }}
                          className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/15 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors"
                        >
                          <div className={`w-2 h-2 ${tag.color} rounded-full`} />
                          <span className="text-white font-black text-xs">{tag.label}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* GALLERY SECTION - Momentos Mágicos */}
        <section className="py-16 md:py-24 bg-zinc-50/50 dark:bg-zinc-900/50" id="galeria">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <span className="text-lime-600 font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">Nossa Brinquedoteca</span>
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tightest">
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
                className="relative col-span-2 row-span-2 overflow-hidden rounded-[2.5rem] group shadow-xl"
              >
                <Image
                  src="/images/galeria/1.webp"
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  alt="Galeria 1"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative overflow-hidden rounded-[2.5rem] group shadow-xl h-[250px] md:h-full"
              >
                <Image
                  src="/images/galeria/2.webp"
                  fill
                  sizes="(min-width: 768px) 25vw, 100vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  alt="Galeria 2"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative overflow-hidden rounded-[2.5rem] group shadow-xl h-[250px] md:h-full"
              >
                <Image
                  src="/images/galeria/3.webp"
                  fill
                  sizes="(min-width: 768px) 25vw, 100vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  alt="Galeria 3"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative col-span-2 overflow-hidden rounded-[2.5rem] group shadow-xl h-[250px]"
              >
                <Image
                  src="/images/galeria/4.webp"
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  alt="Galeria 4"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="relative overflow-hidden rounded-[2.5rem] group shadow-xl h-[250px]"
              >
                <Image
                  src="/images/galeria/5.webp"
                  fill
                  sizes="(min-width: 768px) 25vw, 100vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  alt="Galeria 5"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="relative overflow-hidden rounded-[2.5rem] group shadow-xl h-[250px]"
              >
                <Image
                  src="/images/galeria/6.webp"
                  fill
                  sizes="(min-width: 768px) 25vw, 100vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  alt="Galeria 6"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section id="contato" className="relative w-full overflow-hidden bg-[#fffdf9] dark:bg-zinc-950 py-24 md:py-36">

          {/* Animated blobs with brand colours */}
          <motion.div animate={{ x:[0,40,0], y:[0,-30,0] }} transition={{ duration:9, repeat:Infinity, ease:'easeInOut' }}
            className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full blur-3xl pointer-events-none" style={{ background:'#f06292' , opacity: 0.18 }} />
          <motion.div animate={{ x:[0,-30,0], y:[0,30,0] }} transition={{ duration:11, repeat:Infinity, ease:'easeInOut', delay:1 }}
            className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full blur-3xl pointer-events-none" style={{ background:'#29b6f6', opacity: 0.18 }} />
          <motion.div animate={{ x:[0,20,0], y:[0,-20,0] }} transition={{ duration:13, repeat:Infinity, ease:'easeInOut', delay:2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-56 rounded-full blur-3xl pointer-events-none" style={{ background:'#ffb300', opacity: 0.12 }} />

          {/* Floating brand-coloured confetti dots */}
          {([
            { top:'10%',  left:'6%',   s:14, c:'#e91e63', d:0   },
            { top:'15%',  right:'8%',  s:10, c:'#2196f3', d:0.4 },
            { top:'40%',  left:'3%',   s:8,  c:'#ff9800', d:0.8 },
            { top:'65%',  right:'4%',  s:12, c:'#4a9640', d:0.3 },
            { bottom:'20%',left:'10%', s:9,  c:'#29b6f6', d:1.2 },
            { bottom:'12%',right:'12%',s:11, c:'#f06292', d:0.6 },
            { top:'50%',  left:'15%',  s:6,  c:'#9c27b0', d:1.6 },
            { top:'30%',  right:'18%', s:7,  c:'#ff9800', d:2   },
          ] as any[]).map((dot, i) => (
            <motion.div key={i}
              animate={{ y:[0,-18,0], scale:[1,1.2,1], opacity:[0.6,1,0.6] }}
              transition={{ duration:3+i*0.5, repeat:Infinity, ease:'easeInOut', delay:dot.d }}
              className="absolute rounded-full pointer-events-none"
              style={{ width:dot.s, height:dot.s, background:dot.c,
                top:dot.top, left:dot.left, right:dot.right, bottom:dot.bottom }} />
          ))}

          {/* Floating stars */}
          {([
            { top:'8%',   right:'20%', size:28, c:'#fdd835', d:0   },
            { bottom:'15%',left:'22%', size:20, c:'#29b6f6', d:1   },
            { top:'55%',  right:'14%', size:16, c:'#f06292', d:1.8 },
          ] as any[]).map((s, i) => (
            <motion.div key={i}
              animate={{ rotate:[0,20,-20,0], y:[0,-10,0] }}
              transition={{ duration:4+i, repeat:Infinity, ease:'easeInOut', delay:s.d }}
              className="absolute pointer-events-none select-none font-black"
              style={{ fontSize:s.size, color:s.c, top:s.top, bottom:s.bottom, left:s.left, right:s.right, opacity:0.35 }}
            >★</motion.div>
          ))}

          {/* Content */}
          <div className="relative z-10 container mx-auto px-6 text-center">

            {/* Colorful brand badge */}
            <motion.div initial={{ opacity:0, scale:0.8 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }} transition={{ duration:0.5, type:'spring' }}
              className="inline-flex items-center gap-2 px-5 py-2 bg-white dark:bg-zinc-800 rounded-full mb-8 shadow-md border border-gray-100 dark:border-zinc-700"
            >
              {(['#e91e63','#2196f3','#ff9800','#4a9640'] as string[]).map((c,i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background:c }} />
              ))}
              <span className="text-[11px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-[0.25em] ml-1">Cajamar, SP</span>
            </motion.div>

            {/* Headline */}
            <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.7, delay:0.1 }}>
              <h2 className="text-5xl md:text-7xl font-black mb-5 tracking-tight font-baloo leading-tight">
                <span style={{ color:'#e91e63' }}>O </span>
                <span style={{ color:'#2196f3' }}>Mundo </span>
                <span style={{ color:'#ff9800' }}>Mágico</span>
                <br />
                <span className="text-gray-800 dark:text-white italic">espera por </span>
                <span style={{ color:'#4a9640' }} className="italic">você.</span>
              </h2>
            </motion.div>

            {/* Subtext */}
            <motion.p initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6, delay:0.2 }}
              className="text-gray-500 dark:text-zinc-400 text-base md:text-lg font-medium mb-12 max-w-xl mx-auto leading-relaxed"
            >
              Venha conhecer nosso espaço. Agende uma visita ou fale com a gente agora mesmo pelo WhatsApp.
            </motion.p>

            {/* Buttons */}
            <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6, delay:0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Link href="https://wa.me/5511972090986"
                className="inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-lg text-white shadow-xl hover:scale-105 transition-all duration-200"
                style={{ background:'linear-gradient(135deg,#3a7d34,#4a9640)' }}
              >
                <MessageSquare size={22} />
                Falar no WhatsApp
              </Link>
              <Link href="https://www.google.com/maps/search/Mundo+Magico+Cajamar"
                className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-2xl font-black text-lg shadow-md transition-all duration-200"
              >
                <MapPin size={22} />
                Ver no Mapa
              </Link>
            </motion.div>

            {/* Trust pills */}
            <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} transition={{ duration:0.6, delay:0.4 }}
              className="flex items-center justify-center gap-3 flex-wrap"
            >
              {[
                { label:'Equipe especializada',      bg:'#e91e63' },
                { label:'Ambiente seguro',            bg:'#2196f3' },
                { label:'Atendimento personalizado',  bg:'#ff9800' },
              ].map((item, i) => (
                <motion.div key={i}
                  initial={{ opacity:0, y:10 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                  transition={{ duration:0.4, delay:0.5 + i*0.1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border"
                  style={{ borderColor: item.bg+'33', background: item.bg+'11' }}
                >
                  <CheckCircle2 size={14} style={{ color: item.bg }} />
                  <span className="text-gray-700 dark:text-zinc-200 text-xs font-bold">{item.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
