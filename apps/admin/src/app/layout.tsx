import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '../components/AuthProvider'
import { QueryProvider } from '../components/QueryProvider'
import { CookieBanner } from '../components/CookieBanner'
import { AnalyticsTracker } from '../components/AnalyticsTracker'

import { ThemeProvider } from '../components/ThemeProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'Mundo Mágico - Admin',
  description: 'Sistema de gestão para escolas infantis e creches',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <QueryProvider>
              {children}
              <CookieBanner />
              <AnalyticsTracker />
            </QueryProvider>
          </AuthProvider>
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                zIndex: 999999,
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
