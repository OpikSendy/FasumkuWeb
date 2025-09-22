// admin-panel/hooks/useAuth.ts

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'
import type { User as UserProfile } from '@/types/database.types' // alias tipe User dari Supabase

// Tipe user + flag login
export type MergedUser = UserProfile & { isLoggedIn: boolean }

interface UseAuthReturn {
  user: MergedUser | null
  loading: boolean
  isAuthenticated: boolean
  hasAdminAccess: boolean
  login: (phone: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<MergedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Ambil profil user dari DB
  const fetchUserProfile = useCallback(
    async (session: Session | null) => {
      if (!session) {
        setUser(null)
        return
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .single()

        const userProfile = data as UserProfile | null

        if (error || !userProfile) {
          throw new Error('User profile not found or access denied.')
        }

        // Hanya admin & moderator yang boleh login
        if (!['admin', 'moderator'].includes(userProfile.role ?? '')) {
          await supabase.auth.signOut()
          setUser(null)
          router.push('/login?error=access-denied')
          return
        }

        setUser({ ...userProfile, isLoggedIn: true })
      } catch (err) {
        console.error('Auth Error:', err)
        await supabase.auth.signOut()
        setUser(null)
      }
    },
    [supabase, router]
  )

  // Listener autentikasi
  useEffect(() => {
    setLoading(true)

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserProfile(session).finally(() => setLoading(false))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setLoading(true)
        fetchUserProfile(session).finally(() => setLoading(false))
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchUserProfile, supabase])

  // Login pakai nomor HP
  const login = useCallback(
    async (phone: string, password: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('email, role, auth_id')
        .eq('phone', phone)
        .single()

      const userData = data as Pick<UserProfile, 'email' | 'role' | 'auth_id'> | null

      if (error || !userData) {
        throw new Error('Nomor telepon tidak terdaftar')
      }

      if (!['admin', 'moderator'].includes(userData.role ?? '')) {
        throw new Error('Akses ditolak. Hanya admin & moderator yang dapat mengakses panel ini.')
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Kredensial login salah')
        }
        throw authError
      }
    },
    [supabase]
  )

  // Logout
  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/login')
  }, [supabase, router])

  return {
    user,
    loading,
    isAuthenticated: !!user,
    hasAdminAccess: user?.role === 'admin' || user?.role === 'moderator',
    login,
    logout,
  }
}
