// app/(dashboard)/rekap/page.tsx

'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  Award,
  Activity,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  MapPin,
  Calendar as CalendarIcon,
  RefreshCw
} from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { 
  Database, 
  ReportWithRelations, 
  Category,
  ReportStatus,
  ReportFacilityPriority as ReportFacility
} from '@/types/database.types'

// Types untuk analytics
interface DashboardStats {
  total_reports: number
  pending_reports: number
  resolved_reports: number
  total_users: number
  reports_this_month: number
  resolution_rate: number
}

interface CategoryStats {
  name: string
  total: number
  resolved: number
  pending: number
  percentage: number
}

interface TimeSeriesData {
  date: string
  masuk: number
  selesai: number
  pending: number
}

interface PriorityStats {
  priority: ReportFacility
  count: number
  resolved: number
  percentage: number
}

interface PerformanceMetrics {
  avg_resolution_time: number
  fastest_resolution: number
  slowest_resolution: number
  this_month_improvement: number
}

// Chart colors
const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  indigo: '#6366F1',
  pink: '#EC4899',
  teal: '#14B8A6',
}

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function RekapPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total_reports: 0,
    pending_reports: 0,
    resolved_reports: 0,
    total_users: 0,
    reports_this_month: 0,
    resolution_rate: 0
  })
  
  const [reports, setReports] = useState<ReportWithRelations[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'categories' | 'performance'>('overview')

  const supabase = createClient()

  // Computed analytics data
  const analytics = useMemo(() => {
    if (!reports.length) return null

    // Category statistics
    const categoryStats: CategoryStats[] = categories.map(category => {
      const categoryReports = reports.filter(r => r.category_id === category.id)
      const resolved = categoryReports.filter(r => r.status === 'Selesai').length
      const total = categoryReports.length
      
      return {
        name: category.name,
        total,
        resolved,
        pending: total - resolved,
        percentage: total > 0 ? Math.round((resolved / total) * 100) : 0
      }
    }).filter(stat => stat.total > 0)

    // Priority statistics
    const priorities: ReportFacility[] = ['Rendah', 'Sedang', 'Tinggi', 'Mendesak']
    const priorityStats: PriorityStats[] = priorities.map(priority => {
      const priorityReports = reports.filter(r => r.priority === priority)
      const resolved = priorityReports.filter(r => r.status === 'Selesai').length
      const count = priorityReports.length
      
      return {
        priority,
        count,
        resolved,
        percentage: count > 0 ? Math.round((resolved / count) * 100) : 0
      }
    }).filter(stat => stat.count > 0)

    // Time series data (last 30 days)
    const timeSeriesData: TimeSeriesData[] = []
    const now = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayReports = reports.filter(r => {
        if (!r.created_at) return false
        const reportDate = new Date(r.created_at).toISOString().split('T')[0]
        return reportDate === dateStr
      })
      
      const resolvedToday = reports.filter(r => {
        if (!r.resolved_at) return false
        const resolvedDate = new Date(r.resolved_at).toISOString().split('T')[0]
        return resolvedDate === dateStr
      })
      
      timeSeriesData.push({
        date: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        masuk: dayReports.length,
        selesai: resolvedToday.length,
        pending: dayReports.filter(r => r.status !== 'Selesai').length
      })
    }

    // Performance metrics
    const resolvedReports = reports.filter(r => r.status === 'Selesai' && r.resolved_at && r.created_at)
    const resolutionTimes = resolvedReports.map(r => {
      const created = new Date(r.created_at!).getTime()
      const resolved = new Date(r.resolved_at!).getTime()
      return Math.round((resolved - created) / (1000 * 60 * 60 * 24)) // days
    })

    const performanceMetrics: PerformanceMetrics = {
      avg_resolution_time: resolutionTimes.length > 0 ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) : 0,
      fastest_resolution: resolutionTimes.length > 0 ? Math.min(...resolutionTimes) : 0,
      slowest_resolution: resolutionTimes.length > 0 ? Math.max(...resolutionTimes) : 0,
      this_month_improvement: 0 // Would need historical data to calculate
    }

    return {
      categoryStats,
      priorityStats,
      timeSeriesData,
      performanceMetrics
    }
  }, [reports, categories])

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        const [statsData, reportsData, categoriesData] = await Promise.all([
          loadDashboardStats(),
          loadReports(),
          loadCategories()
        ])
        
        setStats(statsData)
        setReports(reportsData)
        setCategories(categoriesData)
      } catch (error) {
        console.error('Error loading recap data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dateRange])

  const loadDashboardStats = async (): Promise<DashboardStats> => {
    const supabase = createClient()
    const { data: reportsData } = await (supabase as any)
      .from('reports')
      .select('id, status, created_at')
    
    const { data: usersData } = await (supabase as any)
      .from('users')
      .select('id')

    const total_reports = reportsData ? reportsData.length : 0
    const pending_reports = reportsData ? reportsData.filter((r: { status: string }) => r.status === 'Menunggu').length : 0
    const resolved_reports = reportsData ? reportsData.filter((r: { status: string }) => r.status === 'Selesai').length : 0
    const total_users = usersData ? usersData.length : 0

    // Reports this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const reports_this_month = reportsData ? reportsData.filter((r: { created_at: string | number | Date }) => {
      if (!r.created_at) return false
      const createdDate = new Date(r.created_at)
      return createdDate >= startOfMonth && createdDate <= now
    }).length : 0

    const resolution_rate = total_reports > 0 ? Math.round((resolved_reports / total_reports) * 100) : 0

    return {
      total_reports,
      pending_reports,
      resolved_reports,
      total_users,
      reports_this_month,
      resolution_rate
    }
  }

  const exportData = async () => {
    try {
      // Prepare different export formats based on active tab
      let exportData: any[] = []
      let filename = ''

      switch (activeTab) {
        case 'overview':
          // Export summary statistics
          exportData = [
            {
              'Metrik': 'Total Laporan',
              'Nilai': stats.total_reports,
              'Keterangan': 'Semua laporan yang pernah dibuat'
            },
            {
              'Metrik': 'Laporan Selesai',
              'Nilai': stats.resolved_reports,
              'Keterangan': 'Laporan yang sudah diselesaikan'
            },
            {
              'Metrik': 'Laporan Pending',
              'Nilai': stats.pending_reports,
              'Keterangan': 'Laporan yang menunggu proses'
            },
            {
              'Metrik': 'Total Pengguna',
              'Nilai': stats.total_users,
              'Keterangan': 'Jumlah pengguna terdaftar'
            },
            {
              'Metrik': 'Laporan Bulan Ini',
              'Nilai': stats.reports_this_month,
              'Keterangan': 'Laporan di bulan berjalan'
            },
            {
              'Metrik': 'Tingkat Penyelesaian',
              'Nilai': `${stats.resolution_rate}%`,
              'Keterangan': 'Persentase laporan selesai'
            },
            {
              'Metrik': 'Rata-rata Waktu Penyelesaian',
              'Nilai': `${analytics?.performanceMetrics.avg_resolution_time} hari`,
              'Keterangan': 'Waktu rata-rata dari laporan masuk hingga selesai'
            }
          ]
          filename = 'rekap_overview'
          break

        case 'trends':
          // Export time series data
          exportData = (analytics?.timeSeriesData || []).map(item => ({
            'Tanggal': item.date,
            'Laporan Masuk': item.masuk,
            'Laporan Selesai': item.selesai,
            'Laporan Pending': item.pending
          }))
          filename = 'rekap_tren_waktu'
          break

        case 'categories':
          // Export category statistics
          exportData = (analytics?.categoryStats || []).map(cat => ({
            'Kategori': cat.name,
            'Total Laporan': cat.total,
            'Laporan Selesai': cat.resolved,
            'Laporan Pending': cat.pending,
            'Persentase Selesai': `${cat.percentage}%`
          }))
          filename = 'rekap_per_kategori'
          break

        case 'performance':
          // Export performance metrics and priority stats
          const performanceData = [
            {
              'Metrik': 'Rata-rata Waktu Penyelesaian',
              'Nilai': `${analytics?.performanceMetrics.avg_resolution_time} hari`,
              'Target': '≤ 5 hari',
              'Status': (analytics?.performanceMetrics.avg_resolution_time || 0) <= 5 ? 'Tercapai' : 'Belum Tercapai'
            },
            {
              'Metrik': 'Penyelesaian Tercepat',
              'Nilai': `${analytics?.performanceMetrics.fastest_resolution} hari`,
              'Target': '-',
              'Status': 'Info'
            },
            {
              'Metrik': 'Penyelesaian Terlama',
              'Nilai': `${analytics?.performanceMetrics.slowest_resolution} hari`,
              'Target': '-',
              'Status': 'Info'
            }
          ]

          // Add priority statistics
          const priorityData = (analytics?.priorityStats || []).map(p => ({
            'Metrik': `Laporan ${p.priority}`,
            'Nilai': `${p.count} laporan`,
            'Target': `${p.resolved} selesai`,
            'Status': `${p.percentage}% selesai`
          }))

          exportData = [...performanceData, ...priorityData]
          filename = 'rekap_performa'
          break

        default:
          exportData = []
      }

      if (!exportData.length) {
        alert('Tidak ada data untuk diekspor')
        return
      }

      // Convert to CSV
      const csv = convertToCSV(exportData)
      
      // Download file
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      alert('Data berhasil diekspor')
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Gagal mengekspor data')
    }
  }

  const convertToCSV = (data: any[]) => {
    if (!data.length) return ''
    
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => 
      Object.values(row).map(v => {
        if (v === null || v === undefined) return ''
        const str = String(v)
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(',')
    )
    
    return [headers, ...rows].join('\n')
  }

  const loadReports = async (): Promise<ReportWithRelations[]> => {
    const { data } = await supabase
      .from('reports')
      .select(`
        *,
        user:users!reports_user_id_fkey(*),
        category:categories(*),
        reported_by_user:users!reports_reported_by_fkey(*)
      `)
      .order('created_at', { ascending: false })

    return data || []
  }

  const loadCategories = async (): Promise<Category[]> => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)

    return data || []
  }

  const refreshData = async () => {
    setLoading(true)
    const [statsData, reportsData, categoriesData] = await Promise.all([
      loadDashboardStats(),
      loadReports(),
      loadCategories()
    ])
    
    setStats(statsData)
    setReports(reportsData)
    setCategories(categoriesData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Rekap & Analisis
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Dashboard analisis komprehensif untuk monitoring performa penanganan laporan
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          >
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d">30 Hari Terakhir</option>
            <option value="90d">90 Hari Terakhir</option>
            <option value="1y">1 Tahun Terakhir</option>
          </select>
          
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button onClick={exportData}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card className="p-6">
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
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                +{stats.reports_this_month} bulan ini
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tingkat Penyelesaian
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {stats.resolution_rate}%
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats.resolution_rate}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Waktu Rata-rata
              </p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                {analytics?.performanceMetrics.avg_resolution_time || 0}
              </p>
              <span className="text-sm text-gray-500">hari</span>
            </div>
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
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
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4">
            <Badge variant="warning" className="text-xs">
              Perlu Perhatian
            </Badge>
          </div>
        </Card>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-2">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'trends', label: 'Tren Waktu', icon: LineChartIcon },
              { id: 'categories', label: 'Per Kategori', icon: PieChartIcon },
              { id: 'performance', label: 'Performa', icon: Award }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </Card>
      </motion.div>

      {/* Content Sections */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Status Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Distribusi Status Laporan
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Selesai', value: stats.resolved_reports, color: COLORS.success },
                        { name: 'Diproses', value: reports.filter(r => r.status === 'Diproses').length, color: COLORS.warning },
                        { name: 'Menunggu', value: reports.filter(r => r.status === 'Menunggu').length, color: COLORS.danger },
                        { name: 'Baru', value: reports.filter(r => r.status === 'Baru').length, color: COLORS.primary }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[0, 1, 2, 3].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Priority Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Distribusi Prioritas
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.priorityStats || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS.primary} name="Total" />
                    <Bar dataKey="resolved" fill={COLORS.success} name="Selesai" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'trends' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Tren Laporan 30 Hari Terakhir
            </h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.timeSeriesData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="masuk" stackId="1" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="selesai" stackId="2" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.3} />
                  <Line type="monotone" dataKey="pending" stroke={COLORS.warning} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Performa per Kategori
              </h3>
              <div className="space-y-4">
                {analytics?.categoryStats.map((category, index) => (
                  <div key={category.name} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {category.name}
                      </h4>
                      <Badge variant="info" className="text-xs">
                        {category.percentage}% selesai
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Total: </span>
                        <span className="font-semibold">{category.total}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Selesai: </span>
                        <span className="font-semibold text-green-600">{category.resolved}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Pending: </span>
                        <span className="font-semibold text-orange-600">{category.pending}</span>
                      </div>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Metrik Performa
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Rata-rata Penyelesaian</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {analytics?.performanceMetrics.avg_resolution_time} hari
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400">Penyelesaian Tercepat</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {analytics?.performanceMetrics.fastest_resolution} hari
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-400">Penyelesaian Terlama</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                      {analytics?.performanceMetrics.slowest_resolution} hari
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Target & Pencapaian
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tingkat Penyelesaian</span>
                    <span className="text-sm font-semibold">{stats.resolution_rate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        stats.resolution_rate >= 80 ? 'bg-green-600' : 
                        stats.resolution_rate >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(stats.resolution_rate, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Target: 80%</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Respons Time (Target: ≤5 hari)</span>
                    <span className="text-sm font-semibold">{analytics?.performanceMetrics.avg_resolution_time} hari</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        (analytics?.performanceMetrics.avg_resolution_time || 0) <= 5 ? 'bg-green-600' : 
                        (analytics?.performanceMetrics.avg_resolution_time || 0) <= 10 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ 
                        width: `${Math.max(0, 100 - ((analytics?.performanceMetrics.avg_resolution_time || 0) * 20))}%`
                      }}
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="h-6 w-6 text-blue-600" />
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Status Keseluruhan</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.resolution_rate >= 80 
                      ? "Performa sangat baik! Target penyelesaian tercapai."
                      : stats.resolution_rate >= 60 
                      ? "Performa cukup baik, masih bisa ditingkatkan."
                      : "Performa perlu ditingkatkan untuk mencapai target."
                    }
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </motion.div>

      {/* Recent Activity Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Ringkasan Aktivitas Terbaru
            </h3>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/laporan'}>
              Lihat Detail
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Laporan Hari Ini</h4>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {reports.filter(r => {
                  if (!r.created_at) return false
                  const today = new Date().toDateString()
                  return new Date(r.created_at).toDateString() === today
                }).length}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Diselesaikan Hari Ini</h4>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {reports.filter(r => {
                  if (!r.resolved_at) return false
                  const today = new Date().toDateString()
                  return new Date(r.resolved_at).toDateString() === today
                }).length}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Rata-rata Response</h4>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {analytics?.performanceMetrics.avg_resolution_time || 0}
                <span className="text-sm text-gray-500 ml-1">hari</span>
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Action Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Rekomendasi Tindakan
          </h3>
          <div className="space-y-3">
            {stats.pending_reports > 10 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Banyak Laporan Menunggu
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Ada {stats.pending_reports} laporan yang masih menunggu diproses. Prioritaskan penanganan.
                  </p>
                </div>
              </div>
            )}
            
            {stats.resolution_rate < 60 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-400">
                <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Tingkat Penyelesaian Rendah
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Tingkat penyelesaian {stats.resolution_rate}% di bawah target 80%. Perlu evaluasi proses.
                  </p>
                </div>
              </div>
            )}
            
            {(analytics?.performanceMetrics.avg_resolution_time || 0) > 7 && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-400">
                <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Waktu Penyelesaian Terlalu Lama
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    Rata-rata {analytics?.performanceMetrics.avg_resolution_time} hari. Target maksimal 7 hari.
                  </p>
                </div>
              </div>
            )}
            
            {stats.resolution_rate >= 80 && (analytics?.performanceMetrics.avg_resolution_time || 0) <= 5 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-400">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Performa Sangat Baik
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Tingkat penyelesaian dan waktu response sudah memenuhi target. Pertahankan kinerja ini!
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}