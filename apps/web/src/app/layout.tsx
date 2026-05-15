import type { Metadata } from 'next'
import { Inter, Fredoka, Baloo_2 } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const fredoka = Fredoka({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-fredoka' })
const baloo = Baloo_2({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-baloo' })

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
    <html lang="pt-BR" className={`${inter.variable} ${fredoka.variable} ${baloo.variable} scroll-smooth`} suppressHydrationWarning>
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
