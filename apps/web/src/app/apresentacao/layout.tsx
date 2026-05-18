import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Apresentação Interativa | Mundo Mágico',
  description: 'Conheça o sistema Mundo Mágico: Envio de relatórios no WhatsApp, agendamento de avisos, calendário de eventos e muito mais com design interativo.',
}

export default function ApresentacaoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
