// admin-panel/app/%28dashboard%29/kategori/page.tsx

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
  Tag,
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
import type { Category, CategoryInsert, CategoryUpdate } from '@/types/database.types'

// Types
interface CategoryFormData {
  name: string
  description: string
  icon: string
  color: string
  is_active: boolean
}

// Category service functions
const categoryService = {
  async getAll(): Promise<Category[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(categoryData: CategoryInsert): Promise<Category> {
    const supabase = createClient()
    
    // Cast to any to bypass type checking issues
    const { data, error } = await (supabase as any)
      .from('categories')
      .insert([categoryData])
      .select()
      .single()

    if (error) throw error
    return data as Category
  },

  async update(id: number, categoryData: Partial<CategoryUpdate>): Promise<Category> {
    const supabase = createClient()
    
    const updateData = {
      ...categoryData,
      updated_at: new Date().toISOString()
    }

    // Cast to any to bypass type checking issues
    const { data, error } = await (supabase as any)
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Category
  },

  async delete(id: number): Promise<void> {
    const supabase = createClient()
    const { error } = await (supabase as any)
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getReportsCount(categoryId: number): Promise<number> {
    const supabase = createClient()
    const { count, error } = await (supabase as any)
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId)

    if (error) throw error
    return count || 0
  }
}

// Form validation
const validateCategoryForm = (data: CategoryFormData): Record<string, string> => {
  const errors: Record<string, string> = {}

  // Name validation
  if (!data.name?.trim()) {
    errors.name = 'Nama kategori wajib diisi'
  } else if (data.name.length < 2) {
    errors.name = 'Nama kategori minimal 2 karakter'
  } else if (data.name.length > 50) {
    errors.name = 'Nama kategori maksimal 50 karakter'
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

const commonIconSuggestions = ['🏗️', '🚧', '💡', '🌿', '🚗', '📋', '⚠️', '🔧', '🏠', '🎯']

// Category Form Component
interface CategoryFormProps {
  category?: Category
  onSubmit: (data: CategoryFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

function CategoryForm({ category, onSubmit, onCancel, loading }: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || '',
    description: category?.description || '',
    icon: category?.icon || '',
    color: category?.color || '#3B82F6',
    is_active: category?.is_active ?? true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationErrors = validateCategoryForm(formData)
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

  const updateField = (field: keyof CategoryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const commonIconSuggestions = ['🏗️', '🚧', '💡', '🌿', '🚗', '📋', '⚠️', '🔧', '🏠', '🎯']

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nama Kategori *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent 
            dark:bg-gray-700 dark:text-gray-100 ${
            errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Contoh: Infrastruktur Jalan"
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
          placeholder="Deskripsi detail tentang kategori ini..."
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
            placeholder="🏗️"
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
          <p className="mt-1 text-xs text-gray-500">Pilih warna untuk kategori</p>
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
          Kategori aktif dan dapat digunakan
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
              {formData.name || 'Nama Kategori'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formData.description || 'Deskripsi kategori...'}
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
              {category ? 'Perbarui' : 'Buat'} Kategori
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

// Delete Confirmation Component
interface DeleteConfirmationProps {
  category: Category
  onConfirm: () => Promise<void>
  onCancel: () => void
  loading?: boolean
}

function DeleteConfirmation({ category, onConfirm, onCancel, loading }: DeleteConfirmationProps) {
  const [reportsCount, setReportsCount] = useState<number | null>(null)

  useEffect(() => {
    categoryService.getReportsCount(category.id)
      .then(setReportsCount)
      .catch(console.error)
  }, [category.id])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-red-600">
        <AlertTriangle className="h-6 w-6" />
        <h3 className="text-lg font-semibold">Konfirmasi Hapus</h3>
      </div>

      <p className="text-gray-600 dark:text-gray-400">
        Apakah Anda yakin ingin menghapus kategori "{category.name}"?
      </p>

      {reportsCount !== null && (
        <div className={`p-4 rounded-lg border ${
          reportsCount > 0 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            {reportsCount > 0 ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <Info className="h-4 w-4 text-blue-600" />
            )}
            <span className="text-sm font-medium">
              {reportsCount > 0 
                ? `Peringatan: ${reportsCount} laporan menggunakan kategori ini`
                : 'Aman untuk dihapus: Tidak ada laporan yang menggunakan kategori ini'
              }
            </span>
          </div>
          {reportsCount > 0 && (
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Laporan yang terkait akan kehilangan referensi kategori setelah dihapus.
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

// Category Card Component
interface CategoryCardProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onToggleStatus: (category: Category) => void
}

function CategoryIcon({ name }: { name: string }) {
  const LucideIcon = (Icons as any)[name.charAt(0).toUpperCase() + name.slice(1)]
  if (!LucideIcon) {
    return <span>❓</span> // fallback kalau nama icon salah
  }
  return <LucideIcon className="h-6 w-6" />
}

function CategoryCard({ category, onEdit, onDelete, onToggleStatus }: CategoryCardProps) {
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
            style={{ backgroundColor: `${category.color}20`, color: category.color?.toString() || '#000' }}
          >
            <CategoryIcon name={category.icon || ''} />
          </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                {category.name}
              </h3>
              <Badge variant={category.is_active ? 'success' : 'warning'} className="mt-1">
                {category.is_active ? 'Aktif' : 'Nonaktif'}
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
                        onEdit(category)
                        setShowMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Kategori
                    </button>
                    
                    <button
                      onClick={() => {
                        onToggleStatus(category)
                        setShowMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {category.is_active ? (
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
                        onDelete(category)
                        setShowMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus Kategori
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
          {category.description}
        </p>

        <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
          <p>Dibuat: {new Date(category.created_at || '').toLocaleDateString('id-ID')}</p>
          {category.updated_at && category.updated_at !== category.created_at && (
            <p>Diperbarui: {new Date(category.updated_at).toLocaleDateString('id-ID')}</p>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

// Main Component
export default function KategoriPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const { toast } = useToast()

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      const data = await categoryService.getAll()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
      toast({
        title: 'Error',
        message: 'Gagal memuat data kategori',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Filter categories
  useEffect(() => {
    let filtered = categories

    if (searchQuery) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(category =>
        filterStatus === 'active' ? category.is_active : !category.is_active
      )
    }

    setFilteredCategories(filtered)
  }, [categories, searchQuery, filterStatus])

  // Load data on mount
  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // Handlers
  const handleCreateCategory = async (data: CategoryFormData) => {
    try {
      setActionLoading(true)
      
      // Prepare category data with proper types
      const categoryData: CategoryInsert = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        icon: data.icon?.trim() || null,
        color: data.color || null,
        is_active: data.is_active ?? true
      }
    
      await categoryService.create(categoryData)
    
      toast({
        title: 'Berhasil',
        message: 'Kategori berhasil dibuat',
        type: 'success'
      })
    
      setShowCreateDialog(false)
      await loadCategories()
    } catch (error: any) {
      console.error('Error creating category:', error)
      toast({
        title: 'Error',
        message: error?.message || 'Gagal membuat kategori',
        type: 'error'
      })
      throw error
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditCategory = async (data: CategoryFormData) => {
    if (!selectedCategory) return
  
    try {
      setActionLoading(true)
      
      // Prepare update data with proper types
      const updateData: CategoryUpdate = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        icon: data.icon?.trim() || null,
        color: data.color || null,
        is_active: data.is_active
      }
    
      await categoryService.update(selectedCategory.id, updateData)
    
      toast({
        title: 'Berhasil',
        message: 'Kategori berhasil diperbarui',
        type: 'success'
      })
    
      setShowEditDialog(false)
      setSelectedCategory(null)
      await loadCategories()
    } catch (error: any) {
      console.error('Error updating category:', error)
      toast({
        title: 'Error',
        message: error?.message || 'Gagal memperbarui kategori',
        type: 'error'
      })
      throw error
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return
  
    try {
      setActionLoading(true)
      await categoryService.delete(selectedCategory.id)
    
      toast({
        title: 'Berhasil',
        message: 'Kategori berhasil dihapus',
        type: 'success'
      })
    
      setShowDeleteDialog(false)
      setSelectedCategory(null)
      await loadCategories()
    } catch (error: any) {
      console.error('Error deleting category:', error)
      toast({
        title: 'Error',
        message: error?.message || 'Gagal menghapus kategori',
        type: 'error'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleStatus = async (category: Category) => {
    try {
      const updateData: CategoryUpdate = {
        is_active: !category.is_active
      }
      
      await categoryService.update(category.id, updateData)
    
      toast({
        title: 'Berhasil',
        message: `Kategori ${!category.is_active ? 'diaktifkan' : 'dinonaktifkan'}`,
        type: 'success'
      })
    
      await loadCategories()
    } catch (error: any) {
      console.error('Error toggling status:', error)
      toast({
        title: 'Error',
        message: error?.message || 'Gagal mengubah status kategori',
        type: 'error'
      })
    }
  }

  const closeAllDialogs = () => {
    setShowCreateDialog(false)
    setShowEditDialog(false)
    setShowDeleteDialog(false)
    setSelectedCategory(null)
  }

  // Stats
  const activeCount = categories.filter(c => c.is_active).length
  const inactiveCount = categories.filter(c => !c.is_active).length

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
              Manajemen Kategori
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Kelola kategori laporan untuk mengorganisir masukan dari masyarakat
            </p>
          </div>
          
          <Button onClick={() => setShowCreateDialog(true)} className="shrink-0">
            <Plus className="h-4 w-4" />
            Tambah Kategori
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
                  Total Kategori
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {categories.length}
                </p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <Tag className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Kategori Aktif
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
                  Kategori Nonaktif
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
                  placeholder="Cari kategori..."
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

        {/* Categories Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={(cat) => {
                      setSelectedCategory(cat)
                      setShowEditDialog(true)
                    }}
                    onDelete={(cat) => {
                      setSelectedCategory(cat)
                      setShowDeleteDialog(true)
                    }}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Tidak ada kategori yang sesuai'
                  : 'Belum ada kategori'
                }
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery || filterStatus !== 'all'
                  ? 'Coba ubah filter pencarian atau buat kategori baru'
                  : 'Mulai dengan membuat kategori pertama untuk mengorganisir laporan'
                }
              </p>
              {(!searchQuery && filterStatus === 'all') && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Buat Kategori Pertama
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
              <DialogTitle>Tambah Kategori Baru</DialogTitle>
              <DialogClose onClick={closeAllDialogs} />
            </DialogHeader>
            
            <CategoryForm
              onSubmit={handleCreateCategory}
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
              <DialogTitle>Edit Kategori</DialogTitle>
              <DialogClose onClick={closeAllDialogs} />
            </DialogHeader>
            
            {selectedCategory && (
              <CategoryForm
                category={selectedCategory}
                onSubmit={handleEditCategory}
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
            
            {selectedCategory && (
              <DeleteConfirmation
                category={selectedCategory}
                onConfirm={handleDeleteCategory}
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