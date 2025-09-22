// app/(dashboard)/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  Calendar,
  MapPin,
  Eye,
  Edit,
  ChevronRight
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/laporan/status-badge'
import { createClient } from '@/lib/supabase/client'
import { formatDate, truncateText } from '@/lib/utils'
import type { Database } from '@/types/database.types'
import { useRouter } from 'next/navigation'
import type { ReportWithRelations } from '@/types/database.types'

interface DashboardStats {
  total_reports: number
  pending_reports: number
  resolved_reports: number
  total_users: number
  reports_this_month: number
  resolution_rate: number
}

type ReportStatus = 'Selesai' | 'Baru' | 'Menunggu' | 'Diproses'

interface RecentActivity {
  id: string
  type: 'new_report' | 'status_change' | 'user_joined'
  title: string
  description: string
  time: string
  user?: string
  status?: ReportStatus
}

type ReportStatsRow = Pick<Database['public']['Tables']['reports']['Row'], 'status' | 'created_at'>
type UserStatsRow = Pick<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    total_reports: 0,
    pending_reports: 0,
    resolved_reports: 0,
    total_users: 0,
    reports_this_month: 0,
    resolution_rate: 0
  })
  const [recentReports, setRecentReports] = useState<ReportWithRelations[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [userSession, setUserSession] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.push('/login')
          return
        }

        setUserSession(session.user)
        await loadDashboardData()
      } catch (err) {
        console.error('Error checking session:', err)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [router, supabase])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [_, reportsData] = await Promise.all([
        loadDashboardStats(),
        loadRecentReports()
      ])
      generateRecentActivity(reportsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardStats = async () => {
    try {
      // ✅ ketik hasil query agar TIDAK jadi 'never'
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('status, created_at')
        .returns<ReportStatsRow[]>()

      if (reportsError) throw reportsError

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, created_at')
        .returns<UserStatsRow[]>()

      if (usersError) throw usersError

      const reportsArr = reports ?? []
      const usersArr = users ?? []

      const totalReports = reportsArr.length
      const totalUsers = usersArr.length
      const pendingReports = reportsArr.filter(r => (r.status ?? 'Baru') !== 'Selesai').length
      const resolvedReports = reportsArr.filter(r => r.status === 'Selesai').length

      const thisMonth = new Date()
      thisMonth.setDate(1)
      const reportsThisMonth = reportsArr.filter(r =>
        r.created_at ? new Date(r.created_at) >= thisMonth : false
      ).length

      const resolutionRate = totalReports > 0
        ? Math.round((resolvedReports / totalReports) * 100)
        : 0

      const statsData: DashboardStats = {
        total_reports: totalReports,
        pending_reports: pendingReports,
        resolved_reports: resolvedReports,
        total_users: totalUsers,
        reports_this_month: reportsThisMonth,
        resolution_rate: resolutionRate
      }

      setStats(statsData)
      return statsData
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      return null
    }
  }

  const loadRecentReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          user:users!reports_user_id_fkey(*),
          category:categories(*),
          reported_by_user:users!reports_reported_by_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(5)
        .returns<ReportWithRelations[]>()

      if (error) throw error

      setRecentReports(data ?? [])
      return data ?? []
    } catch (error) {
      console.error('Error loading recent reports:', error)
      return []
    }
  }

  const generateRecentActivity = (reports: ReportWithRelations[]) => {
    const activity: RecentActivity[] = reports.map(report => ({
      id: report.id.toString(),
      type: 'new_report',
      title: `Laporan baru: ${report.title}`,
      description: truncateText(report.description ?? '', 60),
      time: report.created_at ?? new Date().toISOString(),
      user: report.user?.name || 'Pengguna',
      status: (report.status as ReportStatus) ?? 'Baru'
    }))

    setRecentActivity(activity)
  }

  const navigateToReports = () => {
    router.push('/laporan')
  }

  const navigateToUsers = () => {
    router.push('/pengguna')
  }

  const viewReportDetail = (reportId: string) => {
    router.push(`/laporan/${reportId}`)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Selamat datang, {userSession?.user_metadata?.full_name || userSession?.email || 'Admin'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(new Date())}</span>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={navigateToReports}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Laporan
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {stats.total_reports}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Bulan ini: {stats.reports_this_month}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Menunggu Proses
                </p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                  {stats.pending_reports}
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Perlu perhatian segera
              </span>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Selesai
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {stats.resolved_reports}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Tingkat penyelesaian: {stats.resolution_rate}%
              </span>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={navigateToUsers}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Pengguna
                </p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                  {stats.total_users}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Pengguna terdaftar
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Laporan Terbaru
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToReports}
                className="text-blue-600 dark:text-blue-400"
              >
                Lihat Semua
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-4">
              {recentReports.length > 0 ? (
                recentReports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => viewReportDetail(report.id.toString())}
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {report.user?.name?.charAt(0) || report.user?.email?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {report.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {truncateText(report.description ?? '', 60)}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                              <Users className="h-3 w-3" />
                              {report.user?.name || 'Pengguna'}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {formatDate(report.created_at ?? new Date().toISOString())}
                            </div>
                            {report.location_name && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-20">{report.location_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-2">
                          <StatusBadge status={(report.status as ReportStatus) ?? 'Baru'} />
                          <Badge variant="default" className="text-xs">
                            {report.category?.name ?? 'Tidak ada kategori'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Belum ada laporan terbaru
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Aktivitas Terbaru
              </h2>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      {activity.type === 'new_report' && <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      {activity.type === 'status_change' && <Edit className="h-4 w-4 text-green-600 dark:text-green-400" />}
                      {activity.type === 'user_joined' && <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        {activity.user && (
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            oleh {activity.user}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {formatDate(activity.time)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Belum ada aktivitas terbaru
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Aksi Cepat
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
              onClick={navigateToReports}
            >
              <Eye className="h-5 w-5" />
              <span className="text-sm">Lihat Laporan</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
              onClick={() => router.push('/kategori')}
            >
              <FileText className="h-5 w-5" />
              <span className="text-sm">Kelola Kategori</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
              onClick={navigateToUsers}
            >
              <Users className="h-5 w-5" />
              <span className="text-sm">Kelola Pengguna</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
              onClick={() => router.push('/rekap')}
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm">Lihat Rekap</span>
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
