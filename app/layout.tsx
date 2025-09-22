// app/layout.tsx

'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { useToast } from '@/hooks/use-toast'
import { ToastProvider } from '@/components/ui/toast'
import { createContext, useContext } from 'react'

const inter = Inter({ subsets: ['latin'] })

// Toast Context untuk global access
const ToastContext = createContext<ReturnType<typeof useToast> | null>(null)

export function useToastContext() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within ToastContextProvider')
  }
  return context
}

function ToastContextProvider({ children }: { children: React.ReactNode }) {
  const toastHook = useToast()

  return (
    <ToastContext.Provider value={toastHook}>
      {children}
      <ToastProvider 
        toasts={toastHook.toasts} 
        onDismiss={toastHook.dismiss} 
      />
    </ToastContext.Provider>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ToastContextProvider>
          {children}
        </ToastContextProvider>
      </body>
    </html>
  )
}