import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mundo Mágico | Brinquedoteca & Escola Infantil',
  description: 'O melhor espaço para o seu pequeno aprender e brincar em Cajamar.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
}

import { Providers } from '../components/Providers'
import { CookieBanner } from '../components/CookieBanner'
import { AnalyticsTracker } from '../components/AnalyticsTracker'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth" suppressHydrationWarning>
      <body className="font-fredoka antialiased text-gray-900 bg-white selection:bg-primary/20 selection:text-primary">
        <Providers>
          {children}
          <CookieBanner />
          <AnalyticsTracker />
        </Providers>
      </body>
    </html>
  )
}
