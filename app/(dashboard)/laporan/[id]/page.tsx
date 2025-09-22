// app/(dashboard)/laporan/[id]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Edit,
  Save,
  X,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Tag,
  AlertTriangle,
  Info,
  History
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/laporan/status-badge'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { ReportWithRelations, ReportStatus } from '@/types/database.types'

// Types
interface Comment {
  id: number
  text: string
  created_at: string
  user_id: number
  facility_id: number
  user?: {
    name: string
    email: string
  }
}

interface StatusHistory {
  id: number
  status: string
  notes?: string
  changed_at: string
  changed_by: number
  changed_by_user?: {
    name: string
    email: string
  }
}

// Priority Badge Component
function PriorityBadge({ priority }: { priority?: string }) {
  const getPriorityConfig = (priority?: string) => {
    switch (priority) {
      case 'Mendesak':
        return { variant: 'danger' as const, icon: AlertTriangle, text: 'Mendesak' }
      case 'Tinggi':
        return { variant: 'warning' as const, icon: AlertCircle, text: 'Tinggi' }
      case 'Sedang':
        return { variant: 'info' as const, icon: Info, text: 'Sedang' }
      case 'Rendah':
        return { variant: 'default' as const, icon: CheckCircle, text: 'Rendah' }
      default:
        return { variant: 'default' as const, icon: Info, text: 'Normal' }
    }
  }

  const config = getPriorityConfig(priority)
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.text}
    </Badge>
  )
}

// Service functions
const reportDetailService = {
  async getById(id: number): Promise<ReportWithRelations> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        user:users(*),
        category:categories(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as ReportWithRelations
  },

  async updateStatus(reportId: number, status: ReportStatus, adminNotes?: string) {
    const supabase = createClient()
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (adminNotes) {
      updateData.admin_notes = adminNotes
    }

    if (status === 'Selesai') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data, error } = await (supabase as any)
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
    return data as ReportWithRelations
  },

  async getComments(reportId: number): Promise<Comment[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users(name, email)
      `)
      .eq('facility_id', reportId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as Comment[]
  },

  async addComment(reportId: number, text: string, userId: number): Promise<Comment> {
    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('comments')
      .insert({
        facility_id: reportId,
        text,
        user_id: userId
      })
      .select(`
        *,
        user:users(name, email)
      `)
      .single()

    if (error) throw error
    return data as Comment
  }
}

export default function LaporanDetailPage() {
  const router = useRouter()
  const params = useParams()
  const reportId = params.id as string

  const [report, setReport] = useState<ReportWithRelations | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [editingStatus, setEditingStatus] = useState(false)
  
  // Form states
  const [newStatus, setNewStatus] = useState<ReportStatus>('Baru')
  const [adminNotes, setAdminNotes] = useState('')
  const [newComment, setNewComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [reportData, commentsData] = await Promise.all([
          reportDetailService.getById(parseInt(reportId)),
          reportDetailService.getComments(parseInt(reportId))
        ])
        
        setReport(reportData)
        setComments(commentsData)
        setNewStatus(reportData.status as ReportStatus || 'Baru')
        setAdminNotes(reportData.admin_notes || '')
      } catch (error) {
        console.error('Error loading report details:', error)
        router.push('/laporan')
      } finally {
        setLoading(false)
      }
    }

    if (reportId) {
      loadData()
    }
  }, [reportId, router])

  // Handlers
  const handleStatusUpdate = async () => {
    if (!report) return

    try {
      setUpdating(true)
      const updatedReport = await reportDetailService.updateStatus(
        report.id, 
        newStatus, 
        adminNotes
      )
      setReport(updatedReport)
      setEditingStatus(false)
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleAddComment = async () => {
    if (!report || !newComment.trim()) return

    try {
      setAddingComment(true)
      // Note: In real implementation, you'd get current user ID from session
      const userId = 1 // Temporary - should come from authenticated user
      const comment = await reportDetailService.addComment(report.id, newComment.trim(), userId)
      setComments(prev => [...prev, comment])
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setAddingComment(false)
    }
  }

  const cancelStatusEdit = () => {
    setEditingStatus(false)
    setNewStatus(report?.status as ReportStatus || 'Baru')
    setAdminNotes(report?.admin_notes || '')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse dark:bg-gray-700" />
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse dark:bg-gray-700 mb-4" />
                <div className="h-32 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            <Card className="p-6">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse dark:bg-gray-700 mb-4" />
              <div className="h-24 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Laporan tidak ditemukan
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Laporan yang Anda cari tidak ada atau telah dihapus
        </p>
        <Button onClick={() => router.push('/laporan')}>
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Laporan
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/laporan')}
            className="h-10 w-10 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Detail Laporan #{report.id}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Dilaporkan pada {formatDate(report.created_at || '')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          {report.latitude && report.longitude && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://maps.google.com/?q=${report.latitude},${report.longitude}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              Lihat di Map
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {report.title}
                </h2>
                <div className="flex items-center gap-2">
                  <StatusBadge status={report.status as ReportStatus || 'Baru'} />
                  <PriorityBadge priority={report.priority || undefined} />
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {report.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  <span>{report.category?.name || 'Tidak ada kategori'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(report.created_at || '')}</span>
                </div>
                {report.location_name && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{report.location_name}</span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Images */}
          {report.images && report.images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Gambar Laporan ({report.images.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {report.images.map((image, index) => (
                    <div key={index} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden group cursor-pointer">
                      <img 
                        src={image} 
                        alt={`Gambar ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onClick={() => window.open(image, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Comments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Komentar & Catatan ({comments.length})
              </h3>

              {/* Add Comment Form */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Tambahkan komentar atau catatan..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 resize-none"
                />
                <div className="flex justify-end mt-3">
                  <Button 
                    onClick={handleAddComment} 
                    loading={addingComment}
                    disabled={!newComment.trim()}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Tambah Komentar
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {comment.user?.name?.charAt(0) || comment.user?.email?.charAt(0) || 'A'}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {comment.user?.name || 'Admin'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Belum ada komentar</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reporter Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Pelapor
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                    {report.user?.name?.charAt(0) || report.user?.email?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {report.user?.name || 'Pengguna'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {report.user?.role || 'User'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {report.user?.email || '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {report.user?.phone || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Status Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Kelola Status
              </h3>

              {!editingStatus ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Status Saat Ini
                    </label>
                    <StatusBadge status={report.status as ReportStatus || 'Baru'} />
                  </div>

                  {report.admin_notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Catatan Admin
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                        {report.admin_notes}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => setEditingStatus(true)}
                    className="w-full"
                  >
                    <Edit className="h-4 w-4" />
                    Update Status
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Status Baru
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    >
                      <option value="Baru">Baru</option>
                      <option value="Menunggu">Menunggu</option>
                      <option value="Diproses">Diproses</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Catatan Admin
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 resize-none"
                      placeholder="Tambahkan catatan tentang status ini..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleStatusUpdate} 
                      loading={updating}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4" />
                      Simpan
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={cancelStatusEdit}
                      className="flex-1"
                    >
                      <X className="h-4 w-4" />
                      Batal
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Report Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <History className="h-5 w-5" />
                Timeline Laporan
              </h3>

              <div className="space-y-4">
                {/* Report Created */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Laporan dibuat
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(report.created_at || '')}
                    </p>
                  </div>
                </div>

                {/* Last Updated */}
                {report.updated_at && report.updated_at !== report.created_at && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Status diperbarui ke "{report.status}"
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(report.updated_at)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Resolved */}
                {report.resolved_at && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Laporan diselesaikan
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(report.resolved_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Aksi Cepat
              </h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setEditingStatus(true)}
                >
                  <Edit className="h-4 w-4" />
                  Update Status
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => document.querySelector('textarea')?.focus()}
                >
                  <MessageCircle className="h-4 w-4" />
                  Tambah Komentar
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4" />
                  Export Detail
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}