'use client'

import { useState, useEffect, useRef } from 'react'
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
  History,
  ZoomIn,
  Eye,
  Upload,
  Trash2,
  Plus
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/laporan/status-badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { ReportWithRelations, ReportStatus, ReportFacilityPriority } from '@/types/database.types'

// Types
interface Comment {
  id: number
  text: string
  created_at: string
  user_id: number
  report_id: number
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

// Upload image to supabase storage and return the public url
const uploadImageToSupabase = async (file: File): Promise<string | null> => {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `repair_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `repairs/${fileName}`
  
  const { data, error } = await supabase.storage
    .from('facility-images')
    .upload(filePath, file)
    
  if (error) {
    console.error('Error uploading repair image:', error)
    return null
  }
  
  const { data: publicData } = supabase.storage
    .from('facility-images')
    .getPublicUrl(filePath)
    
  return publicData.publicUrl
}

// Submit multiple repair images
const submitRepairImages = async (files: FileList): Promise<string[]> => {
  const uploadPromises = Array.from(files).map(file => uploadImageToSupabase(file))
  const uploadedUrls = await Promise.all(uploadPromises)
  return uploadedUrls.filter(url => url !== null) as string[]
}

// Helper function untuk mendapatkan URL gambar Supabase
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

// Fungsi untuk parsing array gambar dari database
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

// Komponen ImageWithFallback
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

// Enhanced Image Modal dengan carousel
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

// NEW: Repair Images Upload Component
function RepairImagesUpload({
  repairImages,
  onImagesChange,
  uploading,
  onRemoveImage
}: {
  repairImages: string[]
  onImagesChange: (images: string[]) => void
  uploading: boolean
  onRemoveImage: (index: number) => void
}) {
  const [dragOver, setDragOver] = useState(false)
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    try {
      const uploadedUrls = await submitRepairImages(files)
      if (uploadedUrls.length > 0) {
        onImagesChange([...repairImages, ...uploadedUrls])
      }
    } catch (error) {
      console.error('Error uploading repair images:', error)
      alert('Gagal mengunggah gambar. Silakan coba lagi.')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={(ref) => setFileInputRef(ref)}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <div className="space-y-3">
          <Upload className="h-12 w-12 mx-auto text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {uploading ? 'Mengunggah gambar...' : 'Upload Foto Perbaikan'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Drag & drop gambar atau klik untuk memilih file
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Format: JPG, PNG, GIF (Maks. 5MB per file)
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef?.click()}
            disabled={uploading}
            className="mt-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600 mr-2"></div>
                Mengunggah...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Pilih Gambar
              </>
            )}
          </Button>
        </div>
      </div>

      {repairImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Gambar Perbaikan ({repairImages.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {repairImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all">
                  <ImageWithFallback
                    src={imageUrl}
                    alt={`Foto perbaikan ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemoveImage(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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
        user:users!reports_user_id_fkey(*),
        reported_by_user:users!reports_reported_by_fkey(*),
        category:categories(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    return data as ReportWithRelations
  },

  async updateStatus(
    reportId: number, 
    status: ReportStatus, 
    priority: ReportFacilityPriority,
    adminNotes?: string,
    repairImages?: string[]
  ) {
    const supabase = createClient()
   
    const updateData: any = {
      status,
      priority,
      updated_at: new Date().toISOString()
    }

    if (adminNotes) {
      updateData.admin_notes = adminNotes
    }

    // Jika ada repair images, kita perlu menggabungkan dengan images yang sudah ada
    if (repairImages && repairImages.length > 0) {
      // Get current report to merge images
      const { data: currentReport } = await supabase
        .from('reports')
        .select('images')
        .eq('id', reportId)
        .single()
  
      const existingImages = parseImageArray(currentReport ? (currentReport as { images: any }).images : null) || []
      const allImages = [...existingImages, ...repairImages]
      updateData.images = allImages
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
        reported_by_user:users!reports_reported_by_fkey(*),
        category:categories(*)
      `)
      .single()

    if (error) throw error

    return data as ReportWithRelations
  },

  // NEW: Method to add repair images specifically
  async addRepairImages(reportId: number, repairImages: string[]): Promise<ReportWithRelations> {
    const supabase = createClient()

    // Get current images
    const { data: currentReport } = await supabase
      .from('reports')
      .select('images')
      .eq('id', reportId)
      .single()

    const existingImages = parseImageArray(currentReport ? (currentReport as { images: any }).images : null) || []
    
    // Add repair images with metadata to distinguish them
    const imagesWithMetadata = repairImages.map(img => ({
      url: img,
      type: 'repair',
      uploaded_at: new Date().toISOString()
    }))

    // For backward compatibility, we'll store just URLs in the images array
    // but you could modify this to store metadata if needed
    const allImages = [...existingImages, ...repairImages]

    const { data, error } = await (supabase as any)
      .from('reports')
      .update({
        images: allImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select(`
        *,
        user:users!reports_user_id_fkey(*),
        reported_by_user:users!reports_reported_by_fkey(*),
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
      .eq('report_id', reportId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return data as Comment[]
  },

  async addComment(reportId: number, text: string, userId: number): Promise<Comment> {
    const supabase = createClient()

    const { data, error } = await (supabase as any)
      .from('comments')
      .insert({
        report_id: reportId,
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
  const [selectedImage, setSelectedImage] = useState<{ images: { src: string; alt: string }[], initialIndex: number } | null>(null)
  const [uploadingRepairImages, setUploadingRepairImages] = useState(false)
 
  // Form states
  const [newStatus, setNewStatus] = useState<ReportStatus>('Baru')
  const [newPriority, setNewPriority] = useState<ReportFacilityPriority | ''>('Sedang')
  const [adminNotes, setAdminNotes] = useState('')
  const [newComment, setNewComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)
  const [repairImages, setRepairImages] = useState<string[]>([])

  // Process image data
  const [originalImages, setOriginalImages] = useState<string[]>([])
  const [processedRepairImages, setProcessedRepairImages] = useState<string[]>([])

  // Helper function to separate original and repair images
  const separateImages = (allImages: string[], originalImagePath?: string) => {
    const images = parseImageArray(allImages)
    const original: string[] = []
    const repairs: string[] = []

    images.forEach(img => {
      // If image path contains 'repairs/' it's a repair image
      // Or if it was uploaded after the original complaint_image_path
      if (img.includes('/repairs/') || img.includes('repair_')) {
        repairs.push(img)
      } else {
        original.push(img)
      }
    })

    // If no images in original array but we have complaint_image_path, use that
    if (original.length === 0 && originalImagePath) {
      original.push(originalImagePath)
    }

    return { original, repairs }
  }

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
        setNewPriority(reportData.priority as ReportFacilityPriority || 'Sedang')
        setAdminNotes(reportData.admin_notes || '')

        // Separate original and repair images
        const allImages = parseImageArray(reportData.images) || []
        const { original, repairs } = separateImages(allImages, reportData.complaint_image_path ?? undefined)
        
        setOriginalImages(original)
        setProcessedRepairImages(repairs)
        setRepairImages(repairs)

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
      
      // Only pass new repair images (not all repair images)
      const newRepairImages = repairImages.filter(img => !processedRepairImages.includes(img))
      
      const updatedReport = await reportDetailService.updateStatus(
        report.id,
        newStatus,
        newPriority as ReportFacilityPriority,
        adminNotes,
        newRepairImages.length > 0 ? newRepairImages : undefined
      )
      
      setReport(updatedReport)
      
      // Update the processed repair images with all repair images
      const { repairs } = separateImages(parseImageArray(updatedReport.images), updatedReport.complaint_image_path ?? undefined)
      setProcessedRepairImages(repairs)
      
      setEditingStatus(false)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Gagal mengupdate status. Silakan coba lagi.')
    } finally {
      setUpdating(false)
    }
  }

  const handleAddComment = async () => {
    if (!report || !newComment.trim()) return

    try {
      setAddingComment(true)
      const userId = 1 // Should come from authenticated user
      const comment = await reportDetailService.addComment(report.id, newComment.trim(), userId)
      setComments(prev => [...prev, comment])
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setAddingComment(false)
    }
  }

  const handleRepairImagesChange = (newImages: string[]) => {
    setUploadingRepairImages(true)
    setTimeout(() => {
      setRepairImages(newImages)
      setUploadingRepairImages(false)
    }, 1000) // Simulate upload delay
  }

  const handleRemoveRepairImage = (index: number) => {
    const newImages = repairImages.filter((_, i) => i !== index)
    setRepairImages(newImages)
  }

  const cancelStatusEdit = () => {
    setEditingStatus(false)
    setNewStatus(report?.status as ReportStatus || 'Baru')
    setNewPriority(report?.priority as ReportFacilityPriority || 'Sedang')
    setAdminNotes(report?.admin_notes || '')
    setRepairImages(processedRepairImages) // Reset to original repair images
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
    <>
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

            {/* Original Report Images */}
            {originalImages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Gambar Laporan ({originalImages.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {originalImages.map((imagePath, index) => {
                      const imageUrl = getSupabaseImageUrl(imagePath)
                     
                      return (
                        <div
                          key={index}
                          className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-gray-200 hover:border-blue-500 transition-all duration-200 hover:shadow-lg"
                          onClick={() => setSelectedImage({ 
                            images: originalImages.map(img => ({
                              src: getSupabaseImageUrl(img),
                              alt: 'Gambar Laporan'
                            })), 
                            initialIndex: index 
                          })}
                        >
                          <ImageWithFallback
                            src={imageUrl}
                            alt={`Gambar ${index + 1}`}
                            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                          />
                         
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
                          
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-black/70 rounded-full p-2">
                              <Eye className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                 
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                      <Info className="h-4 w-4" />
                      <span>Klik pada gambar untuk melihat dalam ukuran penuh</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* NEW: Repair Images Section */}
            {processedRepairImages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Foto Perbaikan ({processedRepairImages.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {processedRepairImages.map((imagePath, index) => {
                      const imageUrl = getSupabaseImageUrl(imagePath)
                     
                      return (
                        <div
                          key={index}
                          className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-green-200 hover:border-green-500 transition-all duration-200 hover:shadow-lg"
                          onClick={() => setSelectedImage({ 
                            images: processedRepairImages.map(img => ({
                              src: getSupabaseImageUrl(img),
                              alt: 'Foto Perbaikan'
                            })), 
                            initialIndex: index 
                          })}
                        >
                          <ImageWithFallback
                            src={imageUrl}
                            alt={`Foto Perbaikan ${index + 1}`}
                            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                          />
                         
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <div className="flex items-center justify-between text-white">
                                <span className="text-sm font-medium">
                                  Perbaikan {index + 1}
                                </span>
                                <ZoomIn className="h-5 w-5" />
                              </div>
                            </div>
                          </div>
                          
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-black/70 rounded-full p-2">
                              <Eye className="h-4 w-4 text-white" />
                            </div>
                          </div>

                          {/* Badge untuk menandakan foto perbaikan */}
                          <div className="absolute top-2 left-2">
                            <Badge variant="success" className="text-xs">
                              Perbaikan
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                 
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                      <CheckCircle className="h-4 w-4" />
                      <span>Foto-foto dokumentasi perbaikan yang telah dilakukan</span>
                    </div>
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
                      disabled={!newComment.trim() || addingComment}
                    >
                      {addingComment ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                      {addingComment ? 'Menambah...' : 'Tambah Komentar'}
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
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Prioritas
                      </label>
                      <PriorityBadge priority={report.priority as ReportFacilityPriority || 'Sedang'} />
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
                    {/* NEW: Repair Images Upload Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Upload Foto Perbaikan
                      </label>
                      <RepairImagesUpload
                        repairImages={repairImages}
                        onImagesChange={handleRepairImagesChange}
                        uploading={uploadingRepairImages}
                        onRemoveImage={handleRemoveRepairImage}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Upload foto dokumentasi perbaikan yang telah dilakukan (opsional)
                      </p>
                    </div>

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
                        Prioritas
                      </label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as ReportFacilityPriority)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      >
                        <option value="Sedang">Sedang</option>
                        <option value="Rendah">Rendah</option>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 resize-none"
                        placeholder="Tambahkan catatan tentang status ini..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleStatusUpdate}
                        disabled={updating}
                        className="flex-1"
                      >
                        {updating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {updating ? 'Menyimpan...' : 'Simpan'}
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

                  {/* Repair Images Added */}
                  {processedRepairImages.length > 0 && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Foto perbaikan ditambahkan ({processedRepairImages.length} foto)
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(report.updated_at || '')}
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
                    <Upload className="h-4 w-4" />
                    Upload Foto Perbaikan
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