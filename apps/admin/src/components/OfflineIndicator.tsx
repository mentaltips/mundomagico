'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    setIsOffline(!navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-destructive text-destructive-foreground rounded-full shadow-2xl flex items-center gap-3 font-black text-sm uppercase tracking-widest"
        >
          <WifiOff size={18} className="animate-pulse" />
          Você está offline
        </motion.div>
      )}
    </AnimatePresence>
  )
}
