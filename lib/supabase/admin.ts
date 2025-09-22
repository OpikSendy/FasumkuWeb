// admin-panel/lib/supabase/admin.ts

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

type ReportRow = Database['public']['Tables']['reports']['Row']
type UserRow = Database['public']['Tables']['users']['Row']

// Create a Supabase client with service role key for admin operations
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Admin utilities
export const adminOperations = {
  // User management
  async getAllUsers() {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async updateUserRole(userId: string, role: 'admin' | 'user' | 'moderator') {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role, updated_at: new Date().toISOString() }) // 'as any' tidak lagi diperlukan
      // PERBAIKAN: Menggunakan 'auth_id' (string/UUID) untuk mencocokkan user, bukan 'id' (number).
      .eq('auth_id', userId) 
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteUser(userId: string) {
    // Fungsi ini sudah benar karena supabaseAdmin.auth.admin.deleteUser menggunakan auth_id (UUID string)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) throw error
  },

  // Report management
  async getAllReports() {
    const { data, error } = await supabaseAdmin
      .from('reports')
      .select(`
        *,
        user:users(*),
        category:categories(*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async updateReportStatus(
    // PERBAIKAN: reportId adalah number sesuai skema database.
    reportId: number, 
    status: 'Baru' | 'Menunggu' | 'Diproses' | 'Selesai',
    adminNotes?: string
  ) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (adminNotes) {
      updateData.admin_notes = adminNotes
    }

    if (status === 'Selesai') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('reports')
      .update(updateData)
      .eq('id', reportId)
      .select(`
        *,
        user:users(*),
        category:categories(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async deleteReport(reportId: number) { // PERBAIKAN: reportId adalah number.
    const { error } = await supabaseAdmin
      .from('reports')
      .delete()
      .eq('id', reportId)
    
    if (error) throw error
  },

  // Category management
  async getAllCategories() {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data
  },

  async createCategory(category: {
    name: string
    description?: string
    icon?: string
    color?: string
  }) {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({
        ...category,
        is_active: true,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateCategory(categoryId: number, updates: { // PERBAIKAN: categoryId adalah number.
    name?: string
    description?: string
    icon?: string
    color?: string
    is_active?: boolean
  }) {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', categoryId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteCategory(categoryId: number) { // PERBAIKAN: categoryId adalah number.
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', categoryId)
    
    if (error) throw error
  },

  // Analytics
  async getDashboardStats() {
    const [reportsResult, usersResult] = await Promise.all([
      supabaseAdmin.from('reports').select('status, created_at'),
      supabaseAdmin.from('users').select('id, created_at'),
    ])

    if (reportsResult.error) throw reportsResult.error
    if (usersResult.error) throw usersResult.error

    const reports = reportsResult.data as ReportRow[]
    const users = usersResult.data as UserRow[]

    const totalReports = reports.length
    const totalUsers = users.length
    const pendingReports = reports.filter(r => r.status !== 'Selesai').length
    const resolvedReports = reports.filter(r => r.status === 'Selesai').length

    // Reports this month
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const reportsThisMonth = reports.filter(
      r => r.created_at ? new Date(r.created_at) >= firstDayOfMonth : false
    ).length

    const resolutionRate = totalReports > 0 
      ? Math.round((resolvedReports / totalReports) * 100) 
      : 0

    return {
      total_reports: totalReports,
      pending_reports: pendingReports,
      resolved_reports: resolvedReports,
      total_users: totalUsers,
      reports_this_month: reportsThisMonth,
      resolution_rate: resolutionRate,
    }
  },


  async getReportsByCategory() {
    const { data, error } = await supabaseAdmin
      .from('reports')
      .select(`
        category:categories(name),
        status
      `)

    if (error) throw error

    const reports = data as (Pick<ReportRow, 'status'> & {
      category: { name: string | null } | null
    })[]

    const categoryStats = reports.reduce((acc, report) => {
      const categoryName = report.category?.name || 'Tidak Ada Kategori'
      if (!acc[categoryName]) {
        acc[categoryName] = { total: 0, resolved: 0, pending: 0 }
      }
      acc[categoryName].total++
      if (report.status === 'Selesai') {
        acc[categoryName].resolved++
      } else {
        acc[categoryName].pending++
      }
      return acc
    }, {} as Record<string, { total: number; resolved: number; pending: number }>)

    return Object.entries(categoryStats).map(([name, stats]) => ({
      name,
      ...stats,
    }))
  },


  async getReportsTrend(days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabaseAdmin
      .from('reports')
      .select('created_at, status')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error

    const reports = data as Pick<ReportRow, 'created_at' | 'status'>[]

    // Group by day
    const dailyStats = reports.reduce((acc, report) => {
      const date = report.created_at
        ? new Date(report.created_at).toISOString().split('T')[0]
        : 'unknown'

      if (!acc[date]) {
        acc[date] = { date, total: 0, resolved: 0 }
      }
      acc[date].total++
      if (report.status === 'Selesai') {
        acc[date].resolved++
      }
      return acc
    }, {} as Record<string, { date: string; total: number; resolved: number }>)

    return Object.values(dailyStats)
  },


  // Notifications
  async createNotification(notification: {
    // PERBAIKAN: user_id adalah number.
    user_id: number 
    title: string
    message: string
    type?: 'info' | 'success' | 'warning' | 'error'
    data?: any
  }) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        ...notification,
        type: notification.type || 'info',
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async broadcastNotification(notification: {
    title: string
    message: string
    type?: 'info' | 'success' | 'warning' | 'error'
    data?: any
  }) {
    // Get all users
    // Fungsi ini sudah benar karena mengambil 'id' (number) dari tabel users.
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id')
    
    if (usersError) throw usersError

    // Create notification for each user
    const notifications = users.map(user => ({
      user_id: user.id, // user.id di sini adalah number
      ...notification,
      type: notification.type || 'info',
    }))

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)
      .select()
    
    if (error) throw error
    return data
  },
}