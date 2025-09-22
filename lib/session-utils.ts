// // admin-panel/lib/session-utils.ts

// import { createClient } from '@/lib/supabase/client'

// export interface UserSession {
//   id: string
//   auth_id: string
//   name: string
//   email: string
//   phone: string
//   role: 'admin' | 'moderator'
//   isLoggedIn: boolean
//   loginTime: string
// }

// // Get current session dari localStorage
// export const getSession = (): UserSession | null => {
//   if (typeof window === 'undefined') return null
  
//   try {
//     const sessionData = localStorage.getItem('user_session')
//     const isLoggedIn = localStorage.getItem('is_logged_in')
    
//     if (sessionData && isLoggedIn === 'true') {
//       const session = JSON.parse(sessionData) as UserSession
      
//       // Validasi struktur session
//       if (session.id && session.auth_id && session.role && session.name && session.phone) {
//         return session
//       }
//     }
//   } catch (error) {
//     console.error('Error getting session:', error)
//     // Clear corrupted session
//     clearSession()
//   }
  
//   return null
// }

// // Set session setelah login berhasil
// export const setSession = (userData: Omit<UserSession, 'isLoggedIn' | 'loginTime'>): UserSession => {
//   const sessionData: UserSession = {
//     ...userData,
//     isLoggedIn: true,
//     loginTime: new Date().toISOString()
//   }

//   if (typeof window !== 'undefined') {
//     // Set localStorage (mirip SharedPreferences di Flutter)
//     localStorage.setItem('user_session', JSON.stringify(sessionData))
//     localStorage.setItem('is_logged_in', 'true')
//   }

//   return sessionData
// }

// // Clear session untuk logout
// export const clearSession = (): void => {
//   if (typeof window !== 'undefined') {
//     // Clear localStorage
//     localStorage.removeItem('user_session')
//     localStorage.removeItem('is_logged_in')
//     localStorage.removeItem('darkMode')
//   }
// }

// // Check if user is authenticated
// export const isAuthenticated = (): boolean => {
//   const session = getSession()
//   return session !== null && session.isLoggedIn === true
// }

// // Check if user has admin access
// export const hasAdminAccess = (): boolean => {
//   const session = getSession()
//   return session !== null && ['admin', 'moderator'].includes(session.role)
// }

// // Get user role
// export const getUserRole = (): string | null => {
//   const session = getSession()
//   return session?.role || null
// }

// // Get user info
// export const getUserInfo = () => {
//   const session = getSession()
//   return session ? {
//     id: session.id,
//     auth_id: session.auth_id,
//     name: session.name,
//     email: session.email,
//     phone: session.phone,
//     role: session.role
//   } : null
// }

// // Require authentication (redirect jika tidak login)
// export const requireAuth = (): boolean => {
//   if (!isAuthenticated()) {
//     if (typeof window !== 'undefined') {
//       window.location.href = '/login'
//     }
//     return false
//   }
//   return true
// }

// // Validate session dengan Supabase
// export const validateSession = async (): Promise<UserSession | null> => {
//   try {
//     const supabase = createClient()
//     const { data: { session: authSession } } = await supabase.auth.getSession()
    
//     if (!authSession) {
//       clearSession()
//       return null
//     }

//     // Get user data from database
//     const { data: userData, error } = await supabase
//       .from('users')
//       .select('*')
//       .eq('auth_id', authSession.user.id)
//       .single()

//     if (error || !userData) {
//       clearSession()
//       return null
//     }

//     // Check if user has admin/moderator access
//     if (!['admin', 'moderator'].includes(userData.role)) {
//       clearSession()
//       return null
//     }

//     // Update session in localStorage
//     const sessionData = setSession({
//       id: userData.id.toString(),
//       auth_id: userData.auth_id,
//       name: userData.name || userData.email,
//       email: userData.email,
//       phone: userData.phone || '',
//       role: userData.role as 'admin' | 'moderator'
//     })

//     return sessionData
//   } catch (error) {
//     console.error('Error validating session:', error)
//     clearSession()
//     return null
//   }
// }

// // Logout user
// export const logout = async (): Promise<void> => {
//   try {
//     const supabase = createClient()
//     await supabase.auth.signOut()
//   } catch (error) {
//     console.error('Error during logout:', error)
//   } finally {
//     clearSession()
//     if (typeof window !== 'undefined') {
//       window.location.href = '/login'
//     }
//   }
// }

// // Format phone untuk display (sama seperti di aplikasi)
// export const formatPhoneForDisplay = (phone: string): string => {
//   if (phone.startsWith('+62')) {
//     return '0' + phone.slice(3)
//   }
//   return phone
// }

// // Mask phone number for privacy
// export const maskPhoneNumber = (phone: string): string => {
//   const display = formatPhoneForDisplay(phone)
//   if (display.length < 7) return display
  
//   const start = display.slice(0, 4) // 0xxx
//   const end = display.slice(-3) // xxx
//   const middle = '*'.repeat(display.length - 7)
  
//   return start + middle + end
// }

// // Check session expiry
// export const isSessionExpired = (): boolean => {
//   const session = getSession()
//   if (!session) return true
  
//   const loginTime = new Date(session.loginTime)
//   const now = new Date()
//   const hoursDifference = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
  
//   // Session expires after 24 hours
//   return hoursDifference > 24
// }

// // Refresh session if expired
// export const refreshSessionIfNeeded = async (): Promise<boolean> => {
//   if (isSessionExpired()) {
//     const validSession = await validateSession()
//     return validSession !== null
//   }
//   return true
// }