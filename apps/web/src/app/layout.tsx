import type { Metadata } from 'next'
import { Inter, Fredoka } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const fredoka = Fredoka({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-fredoka' })

export const metadata: Metadata = {
  title: 'Mundo Mágico | Brinquedoteca & Escola Infantil',
  description: 'O melhor espaço para o seu pequeno aprender e brincar em Cajamar.',
}

import { Providers } from '../components/Providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${fredoka.variable} scroll-smooth`}>
      <body className="font-sans antialiased text-gray-900 bg-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
