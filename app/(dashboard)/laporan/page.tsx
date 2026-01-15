// admin-panel/app/(dashboard)/laporan/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Search,
  Filter,
  Calendar,
  MapPin,
  User,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Image as ImageIcon,
  MessageCircle,
  TrendingUp,
  AlertTriangle,
  Info,
  X,
  ZoomIn,
  Settings
} from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/laporan/status-badge'
import { createClient } from '@/lib/supabase/client'
import { formatDate, truncateText } from '@/lib/utils'
import type { ReportWithRelations, ReportStatus, ReportUpdate, ReportFacilityPriority } from '@/types/database.types'

// Types
interface ReportStats {
  total_reports: number
  new_reports: number
  pending_reports: number
  in_progress_reports: number
  completed_reports: number
  high_priority_reports: number
}

interface ReportFilters {
  search: string
  status: ReportStatus | 'all'
  priority: string
  category: number | 'all'
  date_from: string
  date_to: string
}

// Helper functions (sama seperti sebelumnya)
const getSupabaseImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return '/placeholder-image.png'
  }

  const supabase = createClient()
 
  let cleanPath = imagePath.trim()
  cleanPath = cleanPath.replace(/^\/+/, '')
 
  if (!cleanPath) {
    return '/placeholder-image.png'
  }
 
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath
  }
 
  try {
    const { data } = supabase.storage
      .from('facility-images')
      .getPublicUrl(cleanPath)
   
    return data.publicUrl
  } catch (error) {
    console.error('Error getting image URL:', error)
    return '/placeholder-image.png'
  }
}

const parseImageArray = (imageData: any): string[] => {
  if (!imageData) return []
 
  if (Array.isArray(imageData)) {
    return imageData.filter(img => img && typeof img === 'string')
  }
 
  if (typeof imageData === 'string') {
    try {
      const parsed = JSON.parse(imageData)
      if (Array.isArray(parsed)) {
        return parsed.filter(img => img && typeof img === 'string')
      }
    } catch (e) {
      return [imageData]
    }
  }
 
  return []
}

function ImageWithFallback({
  src,
  alt,
  className,
  onClick
}: {
  src: string
  alt: string
  className?: string
  onClick?: () => void
}) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
 
  useEffect(() => {
    setImageError(false)
    setImageLoading(true)
  }, [src])
 
  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }
 
  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  if (imageError || !src || src === '/placeholder-image.png') {
    return (
      <div
        className={`${className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center cursor-pointer`}
        onClick={onClick}
      >
        <div className="text-center text-gray-500">
          <ImageIcon className="h-8 w-8 mx-auto mb-2" />
          <p className="text-xs">Gambar tidak dapat dimuat</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {imageLoading && (
        <div className={`${className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center animate-pulse absolute inset-0 z-10`}>
          <div className="text-center text-gray-400">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-transparent mx-auto"></div>
            <p className="text-xs mt-2">Memuat...</p>
          </div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity`}
        onClick={onClick}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ opacity: imageLoading ? 0 : 1 }}
      />
    </div>
  )
}

// Image Modal Component (sama seperti sebelumnya)
function ImageModal({
  images,
  initialIndex = 0,
  onClose
}: {
  images: { src: string; alt: string }[] | string
  initialIndex?: number
  onClose: () => void
}) {
  const imageList = typeof images === 'string'
    ? [{ src: images, alt: 'Gambar Laporan' }]
    : images

  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const currentImage = imageList[currentIndex]

  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
    setIsZoomed(false)
  }, [currentIndex])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && imageList.length > 1) {
        e.preventDefault()
        setCurrentIndex(prev => prev === 0 ? imageList.length - 1 : prev - 1)
      } else if (e.key === 'ArrowRight' && imageList.length > 1) {
        e.preventDefault()
        setCurrentIndex(prev => prev === imageList.length - 1 ? 0 : prev + 1)
      } else if (e.key === ' ' || e.key === 'z') {
        e.preventDefault()
        setIsZoomed(!isZoomed)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isZoomed, onClose, imageList.length])

  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageLoaded(false)
    setImageError(true)
  }

  const nextImage = () => {
    setCurrentIndex(prev => prev === imageList.length - 1 ? 0 : prev + 1)
  }

  const prevImage = () => {
    setCurrentIndex(prev => prev === 0 ? imageList.length - 1 : prev - 1)
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-7xl max-h-[95vh] p-0 overflow-hidden">
        <div className="relative bg-black/95 min-h-[70vh] flex flex-col">
          <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <h3 className="font-medium">{currentImage.alt}</h3>
                {imageList.length > 1 && (
                  <span className="text-sm text-gray-300">
                    {currentIndex + 1} dari {imageList.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="text-white hover:bg-white/20"
                  disabled={!imageLoaded}
                >
                  {isZoomed ? 'Zoom Out' : 'Zoom In'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {imageList.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 text-white hover:bg-black/70 w-12 h-12 rounded-full"
                disabled={!imageLoaded}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 text-white hover:bg-black/70 w-12 h-12 rounded-full"
                disabled={!imageLoaded}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          <div className="flex-1 flex items-center justify-center p-6 pt-20">
            {!imageLoaded && !imageError && (
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent mx-auto mb-4"></div>
                <p>Memuat gambar...</p>
              </div>
            )}

            {imageError && (
              <div className="text-center text-white">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="mb-4">Gagal memuat gambar</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setImageError(false)
                    setImageLoaded(false)
                  }}
                >
                  Coba Lagi
                </Button>
              </div>
            )}

            {!imageError && (
              <div
                className={`relative transition-all duration-300 cursor-pointer ${
                  isZoomed ? 'scale-150 overflow-auto' : ''
                }`}
                onClick={() => imageLoaded && setIsZoomed(!isZoomed)}
                style={{
                  maxWidth: isZoomed ? 'none' : '100%',
                  maxHeight: isZoomed ? 'none' : '100%'
                }}
              >
                <img
                  src={currentImage.src}
                  alt={currentImage.alt}
                  className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Report service functions
const reportService = {
  async getAll(filters: ReportFilters, page: number = 1, limit: number = 10) {
    const supabase = createClient()
    let query = supabase
      .from('reports')
      .select(`
        *,
        user:users!reports_user_id_fkey(*),
        reported_by_user:users!reports_reported_by_fkey(*),
        category:categories(*)
      `, { count: 'exact' })

    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location_name.ilike.%${filters.search}%`)
    }

    if (filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority)
    }

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category_id', filters.category)
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    // Process image data untuk setiap report
    const processedReports = (data as ReportWithRelations[]).map(report => ({
      ...report,
      images: parseImageArray(report.images),
      processedImages: parseImageArray(report.images).length > 0
        ? parseImageArray(report.images)
        : report.complaint_image_path
          ? [report.complaint_image_path]
          : []
    }))

    return {
      reports: processedReports,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  },

  async getStats(): Promise<ReportStats> {
    const supabase = createClient()
   
    const { data, error } = await supabase
      .from('reports')
      .select('status, priority')

    if (error) throw error

    const reports = data as { status: string; priority: string }[] || []
    const total = reports.length
   
    const newReports = reports.filter(r => r.status === 'Baru').length
    const pending = reports.filter(r => r.status === 'Menunggu').length
    const inProgress = reports.filter(r => r.status === 'Diproses').length
    const completed = reports.filter(r => r.status === 'Selesai').length
    const highPriority = reports.filter(r => r.priority === 'Tinggi' || r.priority === 'Mendesak').length

    return {
      total_reports: total,
      new_reports: newReports,
      pending_reports: pending,
      in_progress_reports: inProgress,
      completed_reports: completed,
      high_priority_reports: highPriority
    }
  },

  async updateStatus(reportId: number, status: ReportStatus, priority: ReportFacilityPriority, adminNotes?: string) {
    const supabase = createClient()
   
    const updateData: {
      status: ReportStatus
      priority: ReportFacilityPriority
      updated_at: string
      admin_notes?: string
      resolved_at?: string
    } = {
      status,
      priority,
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
        user:users!reports_user_id_fkey(*),
        category:categories(*),
        reported_by_user:users!reports_reported_by_fkey(*)
      `)
      .single()

    if (error) throw error

    return data as ReportWithRelations
  },

  async getCategories() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
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

// PERBAIKAN: Report Detail Modal dengan penanganan gambar yang diperbaiki
function ReportDetailModal({
  report,
  onClose,
  onStatusUpdate
}: {
  report: ReportWithRelations & { processedImages?: string[] }
  onClose: () => void
  onStatusUpdate: (reportId: number, status: ReportStatus, priority: ReportFacilityPriority, notes?: string) => Promise<void>
}) {
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState<ReportStatus>(report.status as ReportStatus || 'Baru')
  const [newPriority, setNewPriority] = useState<ReportFacilityPriority>(report.priority as ReportFacilityPriority || 'Normal')
  const [adminNotes, setAdminNotes] = useState(report.admin_notes || '')
  const [selectedImage, setSelectedImage] = useState<{ images: { src: string; alt: string }[], initialIndex: number } | null>(null)

  const handleStatusUpdate = async () => {
    try {
      setUpdating(true)
      await onStatusUpdate(report.id, newStatus, newPriority, adminNotes)
      onClose()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Gagal mengupdate status laporan')
    } finally {
      setUpdating(false)
    }
  }

  // Menggunakan processedImages atau fallback ke images/complaint_image_path
  const imagesToShow = report.processedImages?.length
    ? report.processedImages
    : parseImageArray(report.images).length > 0
      ? parseImageArray(report.images)
      : report.complaint_image_path
        ? [report.complaint_image_path]
        : []

  return (
    <>
      <div className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Detail Laporan</DialogTitle>
          <DialogClose onClick={onClose} />
        </DialogHeader>
        <div className="space-y-6 mt-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Informasi Laporan</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Judul</label>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{report.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Deskripsi</label>
                  <p className="text-gray-700 dark:text-gray-300">{report.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                    <div className="mt-1">
                      <StatusBadge status={report.status as ReportStatus || 'Baru'} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Prioritas</label>
                    <div className="mt-1">
                      <PriorityBadge priority={report.priority || undefined} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Kategori</label>
                  <p className="text-gray-700 dark:text-gray-300">{report.category?.name || 'Tidak ada kategori'}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Informasi Pelapor</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nama</label>
                  <p className="text-gray-900 dark:text-gray-100">{report.user?.name || 'Pengguna'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                  <p className="text-gray-700 dark:text-gray-300">{report.user?.email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Telepon</label>
                  <p className="text-gray-700 dark:text-gray-300">{report.user?.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Tanggal Laporan</label>
                  <p className="text-gray-700 dark:text-gray-300">{formatDate(report.created_at || '')}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Location Info */}
          {(report.location_name || report.latitude || report.longitude) && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Informasi Lokasi</h3>
              <div className="space-y-3">
                {report.location_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nama Lokasi</label>
                    <p className="text-gray-700 dark:text-gray-300">{report.location_name}</p>
                  </div>
                )}
                {(report.latitude && report.longitude) && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Koordinat</label>
                    <p className="text-gray-700 dark:text-gray-300">
                      {report.latitude}, {report.longitude}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Images dengan penanganan yang lebih baik dan hover effects */}
          {imagesToShow.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Gambar Laporan ({imagesToShow.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {imagesToShow.map((imagePath, index) => {
                  const imageUrl = getSupabaseImageUrl(imagePath)
                 
                  return (
                    <div
                      key={index}
                      className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-gray-200 hover:border-blue-500 transition-all duration-200 hover:shadow-lg"
                      onClick={() => setSelectedImage({ images: imagesToShow.map(img => ({
                        src: getSupabaseImageUrl(img),
                        alt: 'Gambar Laporan'
                      })), initialIndex: index })}
                    >
                      <ImageWithFallback
                        src={imageUrl}
                        alt={`Gambar ${index + 1}`}
                        className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                      />
                     
                      {/* Hover overlay dengan informasi */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <div className="flex items-center justify-between text-white">
                            <span className="text-sm font-medium">
                              Gambar {index + 1}
                            </span>
                            <ZoomIn className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Loading indicator khusus untuk setiap gambar */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-black/70 rounded-full p-2">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
             
              {/* Info tambahan */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <Info className="h-4 w-4" />
                  <span>Klik pada gambar untuk melihat dalam ukuran penuh</span>
                </div>
              </div>
            </Card>
          )}

          {/* Admin Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tindakan Admin</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Ubah Status
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
                  Prioritas Laporan
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as ReportFacilityPriority)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                >
                  <option value="Normal">Normal</option>
                  <option value="Rendah">Rendah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Tinggi">Tinggi</option>
                  <option value="Mendesak">Mendesak</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Tambahkan catatan untuk laporan ini..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Batal
                </Button>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={updating}
                  className="min-w-[120px]"
                >
                  {updating ? 'Mengupdate...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          images={selectedImage.images}
          initialIndex={selectedImage.initialIndex}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  )
}

// Main Component dengan perbaikan pada display gambar di tabel dan 2 tombol aksi
export default function LaporanPage() {
  const router = useRouter()
  const [reports, setReports] = useState<(ReportWithRelations & { processedImages?: string[] })[]>([])
  const [stats, setStats] = useState<ReportStats>({
    total_reports: 0,
    new_reports: 0,
    pending_reports: 0,
    in_progress_reports: 0,
    completed_reports: 0,
    high_priority_reports: 0
  })

  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Filters and pagination
  const [filters, setFilters] = useState<ReportFilters>({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    date_from: '',
    date_to: ''
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalReports, setTotalReports] = useState(0)
  const reportsPerPage = 10

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<(ReportWithRelations & { processedImages?: string[] }) | null>(null)

  // Load data
  const loadReports = useCallback(async () => {
    try {
      setLoading(true)
      const result = await reportService.getAll(filters, currentPage, reportsPerPage)
      setReports(result.reports)
      setTotalPages(result.totalPages)
      setTotalReports(result.total)
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, currentPage])

  const loadStats = useCallback(async () => {
    try {
      const data = await reportService.getStats()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const data = await reportService.getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }, [])

  useEffect(() => {
    loadStats()
    loadCategories()
  }, [loadStats, loadCategories])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  // Handlers
  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const exportReports = async () => {
    try {
      // Get all reports with filters applied
      const result = await reportService.getAll(filters, 1, 10000) // Get all data
      
      if (!result.reports.length) {
        alert('Tidak ada data untuk diekspor')
        return
      }

      // Prepare data for CSV
      const exportData = result.reports.map(report => ({
        'ID': report.id,
        'Judul': report.title,
        'Deskripsi': report.description || '',
        'Status': report.status || 'Baru',
        'Prioritas': report.priority || 'Normal',
        'Kategori': report.category?.name || '-',
        'Nama Pelapor': report.user?.name || '-',
        'Email Pelapor': report.user?.email || '-',
        'Telepon Pelapor': report.user?.phone || '-',
        'Lokasi': report.location_name || '-',
        'Latitude': report.latitude || '',
        'Longitude': report.longitude || '',
        'Tanggal Laporan': formatDate(report.created_at || ''),
        'Tanggal Selesai': report.resolved_at ? formatDate(report.resolved_at) : '-',
        'Catatan Admin': report.admin_notes || '-',
        'Jumlah Gambar': report.processedImages?.length || 0
      }))

      // Convert to CSV
      const csv = convertToCSV(exportData)
      
      // Download file
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `laporan_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      alert('Data laporan berhasil diekspor')
    } catch (error) {
      console.error('Error exporting reports:', error)
      alert('Gagal mengekspor data laporan')
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

  const handleStatusUpdate = async (reportId: number, status: ReportStatus, priority: ReportFacilityPriority, notes?: string) => {
    try {
      setActionLoading(true)
      await reportService.updateStatus(reportId, status, priority, notes)
      await loadReports()
      await loadStats()
    } catch (error) {
      console.error('Error updating status:', error)
      throw error
    } finally {
      setActionLoading(false)
    }
  }

  const openDetailModal = (report: ReportWithRelations & { processedImages?: string[] }) => {
    setSelectedReport(report)
    setShowDetailModal(true)
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedReport(null)
  }

  // PERBAIKAN: Fungsi untuk navigasi ke halaman detail
  const viewReportDetail = (reportId: number) => {
    router.push(`/laporan/${reportId}`)
  }

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      category: 'all',
      date_from: '',
      date_to: ''
    })
    setCurrentPage(1)
  }

  if (loading && currentPage === 1) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
          </div>
        </div>
       
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse dark:bg-gray-700 mb-4" />
              <div className="h-8 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Manajemen Laporan
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Kelola semua laporan yang masuk dari masyarakat
            </p>
          </div>
         
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => loadReports()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportReports}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-5 gap-6"
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
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Laporan Baru
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {stats.new_reports}
                </p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Sedang Diproses
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {stats.in_progress_reports}
                </p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Selesai
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {stats.completed_reports}
                </p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Prioritas Tinggi
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {stats.high_priority_reports}
                </p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari laporan..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="all">Semua Status</option>
                <option value="Baru">Baru</option>
                <option value="Menunggu">Menunggu</option>
                <option value="Diproses">Diproses</option>
                <option value="Selesai">Selesai</option>
              </select>

              {/* Priority Filter */}
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="all">Semua Prioritas</option>
                <option value="Rendah">Rendah</option>
                <option value="Sedang">Sedang</option>
                <option value="Tinggi">Tinggi</option>
                <option value="Mendesak">Mendesak</option>
              </select>

              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Reset Button */}
              <Button variant="outline" onClick={resetFilters}>
                Reset Filter
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Reports Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Daftar Laporan ({totalReports} total)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Laporan</TableHead>
                    <TableHead>Pelapor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => {
                    const imageCount = report.processedImages?.length || 0
                   
                    return (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {truncateText(report.title, 50)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {truncateText(report.description || '', 60)}
                            </p>
                            {imageCount > 0 && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <ImageIcon className="h-3 w-3" />
                                {imageCount} gambar
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                              {report.user?.name?.charAt(0) || report.user?.email?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {report.user?.name || 'Pengguna'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {report.user?.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={report.status as ReportStatus || 'Baru'} />
                        </TableCell>

                        <TableCell>
                          <PriorityBadge priority={report.priority || undefined} />
                        </TableCell>

                        <TableCell>
                          <Badge variant="default">
                            {report.category?.name || 'Tidak ada kategori'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm">
                            <p className="text-gray-900 dark:text-gray-100">
                              {formatDate(report.created_at || '')}
                            </p>
                            {report.location_name && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <MapPin className="h-3 w-3" />
                                {truncateText(report.location_name, 20)}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          {/* PERBAIKAN: 2 tombol aksi - Detail dan Edit/Admin */}
                          <div className="flex items-center gap-2">
                            {/* Tombol untuk melihat detail (navigasi ke halaman detail) */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewReportDetail(report.id)}
                              className="h-8 w-8 p-0"
                              title="Lihat Detail"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {/* Tombol untuk tindakan admin (buka modal) */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailModal(report)}
                              className="h-8 w-8 p-0"
                              title="Tindakan Admin"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {reports.length === 0 && !loading && (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Tidak ada laporan ditemukan
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Coba ubah filter atau kriteria pencarian
                  </p>
                  <Button onClick={resetFilters}>
                    Reset Filter
                  </Button>
                </div>
              )}

              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Memuat data...</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Menampilkan {((currentPage - 1) * reportsPerPage) + 1} - {Math.min(currentPage * reportsPerPage, totalReports)} dari {totalReports} laporan
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Sebelumnya
                    </Button>
                   
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                       
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "primary" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Report Detail Modal untuk Tindakan Admin */}
      <Dialog open={showDetailModal} onOpenChange={(open) => !open && closeDetailModal()}>
        <DialogContent className="max-w-6xl">
          {selectedReport && (
            <ReportDetailModal
              report={selectedReport}
              onClose={closeDetailModal}
              onStatusUpdate={handleStatusUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}