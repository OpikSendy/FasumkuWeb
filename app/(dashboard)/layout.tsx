// app/(dashboard)/layout.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  Home,
  FileText,
  Users,
  Settings,
  LogOut,
  Sun,
  Moon,
  Bell,
  Search,
  ChevronDown,
  Shield,
  BarChart3,
  Tags,
  Building
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPhoneForDisplay } from '@/lib/phone-utils'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface MenuItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home
  },
  {
    id: 'laporan',
    label: 'Laporan',
    href: '/laporan',
    icon: FileText,
    badge: 0
  },
  {
    id: 'rekap',
    label: 'Rekap & Analisis',
    href: '/rekap',
    icon: BarChart3
  },
  {
    id: 'kategori',
    label: 'Kategori',
    href: '/kategori',
    icon: Tags
  },
  {
    id: 'tipe-fasilitas',
    label: 'Tipe fasilitas',
    href: '/tipe-fasilitas',
    icon: Building
  },
  {
    id: 'pengguna',
    label: 'Pengguna',
    href: '/pengguna',
    icon: Users
  }
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifications, setNotifications] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // New state for sidebar collapse
  const supabase = createClient()

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          console.log('No session found, redirecting to login')
          router.push('/login')
          return
        }

        setUser(session.user)

        // Check dark mode preference
        const isDark = localStorage.getItem('darkMode') === 'true' ||
          (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
        
        setIsDarkMode(isDark)
        
        // Apply dark mode class
        if (isDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }

        // Check sidebar collapse preference
        const collapsed = localStorage.getItem('sidebarCollapsed') === 'true'
        setSidebarCollapsed(collapsed)

        setIsLoading(false)
      } catch (error) {
        console.error('Error initializing app:', error)
        router.push('/login')
      }
    }

    initializeApp()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          router.push('/login')
        } else if (session) {
          setUser(session.user)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showUserMenu && !target.closest('[data-user-menu]')) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [pathname])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false) // Close mobile sidebar on desktop
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem('darkMode', newMode.toString())
    
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', newState.toString())
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Error during logout:', error)
      // Force navigation even if there's an error
      router.push('/login')
    }
  }

  const handleMenuClick = (href: string) => {
    router.push(href)
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  const isActiveMenu = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => isActiveMenu(item.href))
    return currentItem?.label || 'Dashboard'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-64'
  const mainPadding = sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar Overlay - Mobile Only */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className={`fixed top-0 left-0 h-full ${sidebarWidth} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 hidden lg:flex lg:flex-col transition-all duration-300 ease-in-out`}>
        {/* Sidebar Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <h2 className="font-bold text-gray-900 dark:text-gray-100 truncate">
                    Fasumku
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    Admin Panel
                  </p>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebarCollapse}
                className="p-1 h-8 w-8 flex-shrink-0"
                aria-label="Collapse sidebar"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
              </Button>
            )}
          </div>
          {sidebarCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebarCollapse}
              className="w-full mt-2 p-1 h-8"
              aria-label="Expand sidebar"
            >
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = isActiveMenu(item.href)
            
            return (
              <motion.button
                key={item.id}
                whileHover={{ x: sidebarCollapsed ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMenuClick(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                aria-label={`Navigate to ${item.label}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge variant="default" className="text-xs flex-shrink-0">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
                {sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {item.badge}
                  </span>
                )}
                {/* Tooltip for collapsed sidebar */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.label}
                    {item.badge !== undefined && item.badge > 0 && ` (${item.badge})`}
                  </div>
                )}
              </motion.button>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : '-100%'
        }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl z-50 lg:hidden"
      >
        {/* Mobile Sidebar Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-gray-100">
                  Fasumku
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Admin Panel
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="p-1"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = isActiveMenu(item.href)
            
            return (
              <motion.button
                key={item.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMenuClick(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                aria-label={`Navigate to ${item.label}`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge variant="default" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </motion.button>
            )
          })}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${mainPadding}`}>
        {/* Header */}
        <header className="flex-shrink-0 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between p-4 max-w-none">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 h-9 w-9"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Desktop page title */}
              <div className="hidden lg:block">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {getCurrentPageTitle()}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Kelola dan pantau sistem dengan mudah
                </p>
              </div>

              {/* Mobile page title */}
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 lg:hidden">
                {getCurrentPageTitle()}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="p-2 h-9 w-9"
                aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-yellow-400" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600" />
                )}
              </Button>

              {/* <Button
                variant="ghost"
                size="sm"
                className="relative p-2 h-9 w-9"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                    {notifications}
                  </span>
                )}
              </Button> */}

              <div className="relative" data-user-menu>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                    {(user?.user_metadata?.full_name || user?.email || 'A').charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="h-4 w-4 hidden sm:block" />
                </Button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
                    >
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {user?.user_metadata?.full_name || 'Admin'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {user?.email || ''}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-b-lg flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 xl:p-8 min-w-0">
          <div className="max-w-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}