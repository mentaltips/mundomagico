import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '../components/AuthProvider'
import { QueryProvider } from '../components/QueryProvider'
import { CookieBanner } from '../components/CookieBanner'
import { AnalyticsTracker } from '../components/AnalyticsTracker'

import { ThemeProvider } from '../components/ThemeProvider'

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
      <body className="font-sans bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
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
