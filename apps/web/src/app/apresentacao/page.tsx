import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GalleryVerticalEnd,
  Heart,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react'

import { PublicFooter, PublicHeader } from '../../components/landing/InstitutionalShell'
import { WhatsAppButton } from '../../components/landing/WhatsAppButton'

export const metadata: Metadata = {
  title: 'Apresentação | Mundo Mágico',
  description: 'Página de apresentação do sistema Mundo Mágico para escolas e brinquedotecas.',
}

const highlights = [
  'Cadastro de alunos, responsáveis e turmas',
  'Rotina diária, presença e comunicados',
  'Financeiro, folha de pagamentos e relatórios',
  'Fotos, registros e histórico centralizado',
]

const modules = [
  {
    icon: Users,
    title: 'Gestão de pessoas',
    description: 'Alunos, responsáveis, professores, monitores e acessos organizados por perfil.',
  },
  {
    icon: Workflow,
    title: 'Operação do dia a dia',
    description: 'Turmas, presença, rotina, comunicados e acompanhamento rápido da equipe.',
  },
  {
    icon: FileText,
    title: 'Financeiro e controle',
    description: 'Mensalidades, folha de pagamentos, taxas, relatórios e histórico financeiro.',
  },
  {
    icon: GalleryVerticalEnd,
    title: 'Fotos e registros',
    description: 'Envio e organização de imagens para mostrar a rotina com segurança e clareza.',
  },
]

const benefits = [
  {
    title: 'Menos retrabalho',
    text: 'Tudo fica centralizado, evitando planilhas soltas, mensagens perdidas e tarefas repetidas.',
  },
  {
    title: 'Mais organização',
    text: 'A equipe enxerga o que precisa em poucos cliques, com fluxo claro de cadastro, edição e consulta.',
  },
  {
    title: 'Experiência moderna',
    text: 'Interface limpa, responsiva e pronta para celular, tablet e computador.',
  },
  {
    title: 'Melhor percepção da escola',
    text: 'O cliente vê uma operação profissional, cuidada e confiável desde o primeiro contato.',
  },
]

const steps = [
  {
    n: '01',
    title: 'A escola cadastra',
    text: 'Turmas, alunos, responsáveis, equipe e regras básicas do funcionamento.',
  },
  {
    n: '02',
    title: 'A equipe opera',
    text: 'Presença, rotina, fotos, comunicados e financeiro no mesmo ambiente.',
  },
  {
    n: '03',
    title: 'A gestão acompanha',
    text: 'Relatórios e visão consolidada para decidir com mais rapidez e menos ruído.',
  },
]

export default function ApresentacaoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <WhatsAppButton />

      <main className="pt-24">
        <section id="galeria" className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/images/bannersobrenos.png"
              alt="Mundo Mágico"
              fill
              priority
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/96 via-background/82 to-background/55 dark:from-background dark:via-background/92 dark:to-transparent" />
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-10 py-16 md:py-24">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.9fr] items-center">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                  <Sparkles size={14} />
                  Apresentação comercial
                </div>

                <h1 className="mt-5 text-4xl md:text-6xl font-black tracking-tight leading-[0.95]">
                  Sistema para escolas e brinquedotecas que precisam de organização real.
                </h1>

                <p className="mt-5 max-w-2xl text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
                  O Mundo Mágico centraliza alunos, responsáveis, turmas, rotina, financeiro, fotos e comunicação em uma
                  plataforma pensada para a operação diária de escolas infantis e brinquedotecas.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="https://wa.me/5511972090986"
                    className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-black"
                  >
                    <MessageSquare size={18} />
                    Solicitar demonstração
                  </Link>
                  <Link
                    href="#funcionalidades"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-4 text-sm font-black text-foreground shadow-sm hover:bg-accent transition-colors"
                  >
                    Ver funcionalidades
                    <ArrowRight size={18} />
                  </Link>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {highlights.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
                      <CheckCircle2 className="mt-0.5 text-emerald-500 shrink-0" size={18} />
                      <span className="text-sm font-bold leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src="/images/banermundomagico.png"
                      alt="Tela de apresentação do Mundo Mágico"
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-px bg-border">
                    {[
                      ['Alunos', 'Gestão completa'],
                      ['Equipe', 'Acessos por perfil'],
                      ['Rotina', 'Presença e relatórios'],
                      ['Financeiro', 'Controle e folha'],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-card p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                        <p className="mt-1 text-sm font-black">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="servicos" className="container mx-auto px-4 md:px-6 py-16 md:py-20">
          <div className="flex items-end justify-between gap-6 mb-8">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Funcionalidades</p>
              <h2 className="mt-2 text-2xl md:text-3xl font-black tracking-tight">O que a escola ganha com o sistema</h2>
            </div>
            <p className="hidden md:block max-w-xl text-sm text-muted-foreground font-medium">
              Estrutura pronta para operação, atendimento à família e gestão interna.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {modules.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="card-hover p-6 border border-border/60">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-4 text-lg font-black">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground font-medium leading-relaxed">{item.description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section id="sobre" className="bg-accent/20 border-y border-border/60">
          <div className="container mx-auto px-4 md:px-6 py-16 md:py-20 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Para quem é</p>
              <h2 className="mt-2 text-2xl md:text-3xl font-black tracking-tight">
                Ideal para escolas infantis, centros de recreação e brinquedotecas
              </h2>
              <p className="mt-4 text-sm md:text-base text-muted-foreground font-medium leading-relaxed">
                O sistema foi desenhado para negócios que precisam de controle, atendimento humanizado e visão clara
                da operação, sem depender de soluções genéricas.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((item) => (
                <article key={item.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-primary" size={18} />
                    <h3 className="text-sm font-black uppercase tracking-widest">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground font-medium leading-relaxed">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="planos" className="container mx-auto px-4 md:px-6 py-16 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] items-start">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Fluxo</p>
              <h2 className="mt-2 text-2xl md:text-3xl font-black tracking-tight">
                Simples para cadastrar, operar e apresentar para o cliente final
              </h2>
              <p className="mt-4 text-sm md:text-base text-muted-foreground font-medium leading-relaxed">
                A implantação pode começar pelo básico e crescer com o tempo. A escola entra com a organização
                inicial e a equipe passa a trabalhar dentro de um fluxo único.
              </p>
            </div>

            <div className="grid gap-4">
              {steps.map((step) => (
                <article key={step.n} className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black">
                    {step.n}
                  </div>
                  <div>
                    <h3 className="text-base font-black">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground font-medium leading-relaxed">{step.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contato" className="container mx-auto px-4 md:px-6 pb-20">
          <div className="rounded-[2rem] border border-border bg-card p-8 md:p-10 shadow-xl">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">
                  <Clock3 size={14} />
                  Pronto para apresentar
                </div>
                <h2 className="mt-4 text-2xl md:text-3xl font-black tracking-tight">
                  Quer oferecer o sistema para outra escola ou brinquedoteca?
                </h2>
                <p className="mt-3 max-w-2xl text-sm md:text-base text-muted-foreground font-medium leading-relaxed">
                  Use esta página como vitrine do produto. Ela já mostra o que o sistema resolve, como funciona e
                  por que vale a pena para uma instituição que quer profissionalizar a gestão.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href="https://wa.me/5511972090986"
                  className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-black"
                >
                  <CalendarDays size={18} />
                  Agendar reunião
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-6 py-4 text-sm font-black text-foreground hover:bg-accent transition-colors"
                >
                  Acessar sistema
                  <ArrowRight size={18} />
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
