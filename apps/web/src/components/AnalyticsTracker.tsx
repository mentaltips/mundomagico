'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Envia o registro de visita para a API
    const trackVisit = async () => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: pathname })
        })
      } catch (e) {
        // Ignora erros de rede para não afetar o usuário
      }
    }

    trackVisit()
  }, [pathname])

  return null // Este componente não renderiza nada visualmente
}
