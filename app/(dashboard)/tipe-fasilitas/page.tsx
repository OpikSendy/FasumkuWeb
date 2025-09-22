// app/(dashboard)/tipe-fasilitas/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Icons from 'lucide-react'
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  MoreVertical,
  Building,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  Loader2,
  Info,
} from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import type { FacilityType, FacilityTypeInsert } from '@/types/database.types'

// Types
interface FacilityTypeFormData {
  name: string
  description: string
  icon: string
  color: string
  is_active: boolean
}

// Facility Type service functions
const facilityTypeService = {
  async getAll(): Promise<FacilityType[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('facility_types')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(facilityTypeData: FacilityTypeInsert): Promise<FacilityType> {
    const supabase = createClient()
   
    // Cast to any to bypass type checking issues
    const { data, error } = await (supabase as any)
      .from('facility_types')
      .insert([facilityTypeData])
      .select()
      .single()

    if (error) throw error
    return data as FacilityType
  },

  async update(id: number, facilityTypeData: Partial<FacilityTypeInsert>): Promise<FacilityType> {
    const supabase = createClient()
   
    const updateData = {
      ...facilityTypeData,
      updated_at: new Date().toISOString()
    }

    // Cast to any to bypass type checking issues
    const { data, error } = await (supabase as any)
      .from('facility_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as FacilityType
  },

  async delete(id: number): Promise<void> {
    const supabase = createClient()
    const { error } = await (supabase as any)
      .from('facility_types')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getFacilitiesCount(facilityTypeId: number): Promise<number> {
    const supabase = createClient()
    const { count, error } = await (supabase as any)
      .from('facilities')
      .select('id', { count: 'exact', head: true })
      .eq('facility_type_id', facilityTypeId)

    if (error) throw error
    return count || 0
  }
}

// Form validation
const validateFacilityTypeForm = (data: FacilityTypeFormData): Record<string, string> => {
  const errors: Record<string, string> = {}

  // Name validation
  if (!data.name?.trim()) {
    errors.name = 'Nama tipe fasilitas wajib diisi'
  } else if (data.name.length < 2) {
    errors.name = 'Nama tipe fasilitas minimal 2 karakter'
  } else if (data.name.length > 50) {
    errors.name = 'Nama tipe fasilitas maksimal 50 karakter'
  }

  // Description validation
  if (!data.description?.trim()) {
    errors.description = 'Deskripsi wajib diisi'
  } else if (data.description.length < 10) {
    errors.description = 'Deskripsi minimal 10 karakter'
  } else if (data.description.length > 200) {
    errors.description = 'Deskripsi maksimal 200 karakter'
  }

  // Icon validation
  if (!data.icon?.trim()) {
    errors.icon = 'Icon wajib diisi'
  }

  // Color validation (optional but if provided should be valid hex)
  if (data.color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(data.color)) {
    errors.color = 'Format warna tidak valid'
  }

  return errors
}

const commonIconSuggestions = ['🏢', '🏥', '🏫', '🏪', '🏛️', '⛪', '🏗️', '🏭', '🏦', '🎭']

// Facility Type Form Component
interface FacilityTypeFormProps {
  facilityType?: FacilityType
  onSubmit: (data: FacilityTypeFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

function FacilityTypeForm({ facilityType, onSubmit, onCancel, loading }: FacilityTypeFormProps) {
  const [formData, setFormData] = useState<FacilityTypeFormData>({
    name: facilityType?.name || '',
    description: facilityType?.description || '',
    icon: facilityType?.icon || '',
    color: facilityType?.color || '#3B82F6',
    is_active: facilityType?.is_active ?? true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
   
    const validationErrors = validateFacilityTypeForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const updateField = (field: keyof FacilityTypeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nama Tipe Fasilitas *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
            dark:bg-gray-700 dark:text-gray-100 ${
            errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Contoh: Rumah Sakit"
          maxLength={50}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">{formData.name.length}/50 karakter</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Deskripsi *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
            dark:bg-gray-700 dark:text-gray-100 ${
            errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Deskripsi detail tentang tipe fasilitas ini..."
          maxLength={200}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">{formData.description.length}/200 karakter</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Icon (Emoji) *
          </label>
          <input
            type="text"
            value={formData.icon}
            onChange={(e) => updateField('icon', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              dark:bg-gray-700 dark:text-gray-100 ${
              errors.icon ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="🏢"
            maxLength={5}
          />
          {errors.icon && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.icon}</p>
          )}
         
          {/* Icon suggestions */}
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Saran icon:</p>
            <div className="flex flex-wrap gap-1">
              {commonIconSuggestions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => updateField('icon', icon)}
                  className="w-8 h-8 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Warna
          </label>
          <input
            type="color"
            value={formData.color}
            onChange={(e) => updateField('color', e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600"
          />
          <p className="mt-1 text-xs text-gray-500">Pilih warna untuk tipe fasilitas</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => updateField('is_active', e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tipe fasilitas aktif dan dapat digunakan
        </label>
      </div>

      {/* Preview */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</h4>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{ backgroundColor: `${formData.color}20` }}
          >
            {formData.icon || '❓'}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {formData.name || 'Nama Tipe Fasilitas'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formData.description || 'Deskripsi tipe fasilitas...'}
            </p>
            <Badge variant={formData.is_active ? 'success' : 'warning'} className="mt-1">
              {formData.is_active ? 'Aktif' : 'Nonaktif'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Batal
        </Button>
        <Button type="submit" loading={loading} className="min-w-24">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {facilityType ? 'Perbarui' : 'Buat'} Tipe Fasilitas
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

// Delete Confirmation Component
interface DeleteConfirmationProps {
  facilityType: FacilityType
  onConfirm: () => Promise<void>
  onCancel: () => void
  loading?: boolean
}

function DeleteConfirmation({ facilityType, onConfirm, onCancel, loading }: DeleteConfirmationProps) {
  const [facilitiesCount, setFacilitiesCount] = useState<number | null>(null)

  useEffect(() => {
    facilityTypeService.getFacilitiesCount(facilityType.id)
      .then(setFacilitiesCount)
      .catch(console.error)
  }, [facilityType.id])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-red-600">
        <AlertTriangle className="h-6 w-6" />
        <h3 className="text-lg font-semibold">Konfirmasi Hapus</h3>
      </div>

      <p className="text-gray-600 dark:text-gray-400">
        Apakah Anda yakin ingin menghapus tipe fasilitas "{facilityType.name}"?
      </p>

      {facilitiesCount !== null && (
        <div className={`p-4 rounded-lg border ${
          facilitiesCount > 0
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            {facilitiesCount > 0 ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <Info className="h-4 w-4 text-blue-600" />
            )}
            <span className="text-sm font-medium">
              {facilitiesCount > 0
                ? `Peringatan: ${facilitiesCount} fasilitas menggunakan tipe ini`
                : 'Aman untuk dihapus: Tidak ada fasilitas yang menggunakan tipe ini'
              }
            </span>
          </div>
          {facilitiesCount > 0 && (
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Fasilitas yang terkait akan kehilangan referensi tipe setelah dihapus.
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Batal
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          loading={loading}
          className="min-w-24"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menghapus...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Ya, Hapus
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Facility Type Card Component
interface FacilityTypeCardProps {
  facilityType: FacilityType
  onEdit: (facilityType: FacilityType) => void
  onDelete: (facilityType: FacilityType) => void
  onToggleStatus: (facilityType: FacilityType) => void
}

function FacilityTypeIcon({ name }: { name: string }) {
  const LucideIcon = (Icons as any)[name.charAt(0).toUpperCase() + name.slice(1)]
  if (!LucideIcon) {
    return <span>❓</span> // fallback kalau nama icon salah
  }
  return <LucideIcon className="h-6 w-6" />
}

function FacilityTypeCard({ facilityType, onEdit, onDelete, onToggleStatus }: FacilityTypeCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-6 hover:shadow-lg transition-all duration-200 relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shadow-sm"
              style={{ backgroundColor: `${facilityType.color}20`, color: facilityType.color?.toString() || '#000' }}
            >
              <FacilityTypeIcon name={facilityType.icon || ''} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                {facilityType.name}
              </h3>
              <Badge variant={facilityType.is_active ? 'success' : 'warning'} className="mt-1">
                {facilityType.is_active ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10"
                  onBlur={() => setShowMenu(false)}
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onEdit(facilityType)
                        setShowMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Tipe Fasilitas
                    </button>
                   
                    <button
                      onClick={() => {
                        onToggleStatus(facilityType)
                        setShowMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {facilityType.is_active ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Nonaktifkan
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Aktifkan
                        </>
                      )}
                    </button>
                   
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                   
                    <button
                      onClick={() => {
                        onDelete(facilityType)
                        setShowMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus Tipe Fasilitas
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
          {facilityType.description}
        </p>

        <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
          <p>Dibuat: {new Date(facilityType.created_at || '').toLocaleDateString('id-ID')}</p>
          {facilityType.updated_at && facilityType.updated_at !== facilityType.created_at && (
            <p>Diperbarui: {new Date(facilityType.updated_at).toLocaleDateString('id-ID')}</p>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

// Main Component
export default function TipeFasilitasPage() {
  const [facilityTypes, setFacilityTypes] = useState<FacilityType[]>([])
  const [filteredFacilityTypes, setFilteredFacilityTypes] = useState<FacilityType[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedFacilityType, setSelectedFacilityType] = useState<FacilityType | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const { toast } = useToast()

  // Load facility types
  const loadFacilityTypes = useCallback(async () => {
    try {
      setLoading(true)
      const data = await facilityTypeService.getAll()
      setFacilityTypes(data)
    } catch (error) {
      console.error('Error loading facility types:', error)
      toast({
        title: 'Error',
        message: 'Gagal memuat data tipe fasilitas',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Filter facility types
  useEffect(() => {
    let filtered = facilityTypes

    if (searchQuery) {
      filtered = filtered.filter(facilityType =>
        facilityType.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        facilityType.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(facilityType =>
        filterStatus === 'active' ? facilityType.is_active : !facilityType.is_active
      )
    }

    setFilteredFacilityTypes(filtered)
  }, [facilityTypes, searchQuery, filterStatus])

  // Load data on mount
  useEffect(() => {
    loadFacilityTypes()
  }, [loadFacilityTypes])

  // Handlers
  const handleCreateFacilityType = async (data: FacilityTypeFormData) => {
    try {
      setActionLoading(true)
     
      // Prepare facility type data with proper types
      const facilityTypeData: FacilityTypeInsert = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        icon: data.icon?.trim() || null,
        color: data.color || null,
        is_active: data.is_active ?? true
      }
   
      await facilityTypeService.create(facilityTypeData)
   
      toast({
        title: 'Berhasil',
        message: 'Tipe fasilitas berhasil dibuat',
        type: 'success'
      })
   
      setShowCreateDialog(false)
      await loadFacilityTypes()
    } catch (error: any) {
      console.error('Error creating facility type:', error)
      toast({
        title: 'Error',
        message: error?.message || 'Gagal membuat tipe fasilitas',
        type: 'error'
      })
      throw error
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditFacilityType = async (data: FacilityTypeFormData) => {
    if (!selectedFacilityType) return
 
    try {
      setActionLoading(true)
     
      // Prepare update data with proper types
      const updateData: Partial<FacilityTypeInsert> = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        icon: data.icon?.trim() || null,
        color: data.color || null,
        is_active: data.is_active
      }
   
      await facilityTypeService.update(selectedFacilityType.id, updateData)
   
      toast({
        title: 'Berhasil',
        message: 'Tipe fasilitas berhasil diperbarui',
        type: 'success'
      })
   
      setShowEditDialog(false)
      setSelectedFacilityType(null)
      await loadFacilityTypes()
    } catch (error: any) {
      console.error('Error updating facility type:', error)
      toast({
        title: 'Error',
        message: error?.message || 'Gagal memperbarui tipe fasilitas',
        type: 'error'
      })
      throw error
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteFacilityType = async () => {
    if (!selectedFacilityType) return
 
    try {
      setActionLoading(true)
      await facilityTypeService.delete(selectedFacilityType.id)
   
      toast({
        title: 'Berhasil',
        message: 'Tipe fasilitas berhasil dihapus',
        type: 'success'
      })
   
      setShowDeleteDialog(false)
      setSelectedFacilityType(null)
      await loadFacilityTypes()
    } catch (error: any) {
      console.error('Error deleting facility type:', error)
      toast({
        title: 'Error',
        message: error?.message || 'Gagal menghapus tipe fasilitas',
        type: 'error'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleStatus = async (facilityType: FacilityType) => {
    try {
      const updateData: Partial<FacilityTypeInsert> = {
        is_active: !facilityType.is_active
      }
     
      await facilityTypeService.update(facilityType.id, updateData)
   
      toast({
        title: 'Berhasil',
        message: `Tipe fasilitas ${!facilityType.is_active ? 'diaktifkan' : 'dinonaktifkan'}`,
        type: 'success'
      })
   
      await loadFacilityTypes()
    } catch (error: any) {
      console.error('Error toggling status:', error)
      toast({
        title: 'Error',
        message: error?.message || 'Gagal mengubah status tipe fasilitas',
        type: 'error'
      })
    }
  }

  const closeAllDialogs = () => {
    setShowCreateDialog(false)
    setShowEditDialog(false)
    setShowDeleteDialog(false)
    setSelectedFacilityType(null)
  }

  // Stats
  const activeCount = facilityTypes.filter(c => c.is_active).length
  const inactiveCount = facilityTypes.filter(c => !c.is_active).length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
          </div>
        </div>
       
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse dark:bg-gray-700 mb-4" />
              <div className="h-16 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
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
              Manajemen Tipe Fasilitas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Kelola tipe fasilitas untuk mengkategorikan berbagai jenis fasilitas umum
            </p>
          </div>
         
          <Button onClick={() => setShowCreateDialog(true)} className="shrink-0">
            <Plus className="h-4 w-4" />
            Tambah Tipe Fasilitas
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Tipe Fasilitas
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {facilityTypes.length}
                </p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <Building className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tipe Aktif
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {activeCount}
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
                  Tipe Nonaktif
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {inactiveCount}
                </p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 text-white">
                <EyeOff className="h-6 w-6" />
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
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari tipe fasilitas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                />
              </div>
             
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Facility Types Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {filteredFacilityTypes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredFacilityTypes.map((facilityType) => (
                  <FacilityTypeCard
                    key={facilityType.id}
                    facilityType={facilityType}
                    onEdit={(ft) => {
                      setSelectedFacilityType(ft)
                      setShowEditDialog(true)
                    }}
                    onDelete={(ft) => {
                      setSelectedFacilityType(ft)
                      setShowDeleteDialog(true)
                    }}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchQuery || filterStatus !== 'all'
                  ? 'Tidak ada tipe fasilitas yang sesuai'
                  : 'Belum ada tipe fasilitas'
                }
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery || filterStatus !== 'all'
                  ? 'Coba ubah filter pencarian atau buat tipe fasilitas baru'
                  : 'Mulai dengan membuat tipe fasilitas pertama untuk mengkategorikan fasilitas'
                }
              </p>
              {(!searchQuery && filterStatus === 'all') && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Buat Tipe Fasilitas Pertama
                </Button>
              )}
            </Card>
          )}
        </motion.div>

        {/* Create Dialog */}
        <Dialog
          open={showCreateDialog}
          onOpenChange={(open) => !open && closeAllDialogs()}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Tipe Fasilitas Baru</DialogTitle>
              <DialogClose onClick={closeAllDialogs} />
            </DialogHeader>
           
            <FacilityTypeForm
              onSubmit={handleCreateFacilityType}
              onCancel={closeAllDialogs}
              loading={actionLoading}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          open={showEditDialog}
          onOpenChange={(open) => !open && closeAllDialogs()}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Tipe Fasilitas</DialogTitle>
              <DialogClose onClick={closeAllDialogs} />
            </DialogHeader>
           
            {selectedFacilityType && (
              <FacilityTypeForm
                facilityType={selectedFacilityType}
                onSubmit={handleEditFacilityType}
                onCancel={closeAllDialogs}
                loading={actionLoading}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={showDeleteDialog}
          onOpenChange={(open) => !open && closeAllDialogs()}
        >
          <DialogContent className="max-w-md">
            <DialogClose onClick={closeAllDialogs} />
           
            {selectedFacilityType && (
              <DeleteConfirmation
                facilityType={selectedFacilityType}
                onConfirm={handleDeleteFacilityType}
                onCancel={closeAllDialogs}
                loading={actionLoading}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}