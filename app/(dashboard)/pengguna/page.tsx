// app/(dashboard)/pengguna/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Download,
  Upload,
  Eye,
  Key,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { formatDate, cn } from '@/lib/utils'
import { formatPhoneForDisplay, formatPhoneNumber } from '@/lib/phone-utils'
import { useToast } from '@/hooks/use-toast'
import type { User, UserRole, UserUpdate } from '@/types/database.types'

interface UserWithStats extends User {
  total_reports?: number
  last_activity?: string
  reports?: { count: number }[]
}

interface UserForm {
    name: string
    email: string
    phone: string
    role: UserRole
    is_phone_verified: boolean
}

interface FilterState {
  search: string
  role: 'all' | UserRole
  status: 'all' | 'verified' | 'unverified'
  sortBy: 'name' | 'email' | 'created_at' | 'role'
  sortOrder: 'asc' | 'desc'
}

const roleConfig = {
  admin: {
    label: 'Admin',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    icon: Shield
  },
  moderator: {
    label: 'Moderator',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: UserCheck
  },
  user: {
    label: 'User',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    icon: Users
  }
}

export default function PenggunaPage() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: 'all',
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user' as UserRole,
    is_phone_verified: false
  })
  const [showFilters, setShowFilters] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  
  const { toast: showToast } = useToast()
  const supabase = createClient()
  const itemsPerPage = 10
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [currentPage, filters.role, filters.status, filters.sortBy, filters.sortOrder])

  const loadUsers = async () => {
    try {
      setLoading(true)
      console.log('Loading users with filters:', filters)
      
      // First, try a simple query to see if we can get any users at all
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('*')
        // .limit(5)

      console.log('Test query result:', { testData, testError })

      // Build main query
    //   let query = supabase
    //     .from('users')
    //     .select(`
    //       *,
    //       reports:reports(count)
    //     `, { count: 'exact' })


    let query = supabase
    .from('users')
    .select('*', { count: 'exact' }
    )

      // Apply role filter
      if (filters.role !== 'all') {
        query = query.eq('role', filters.role)
        console.log('Applied role filter:', filters.role)
      }

      // Apply verification status filter
      if (filters.status === 'verified') {
        query = query.eq('is_phone_verified', true)
        console.log('Applied verified filter')
      } else if (filters.status === 'unverified') {
        query = query.eq('is_phone_verified', false)
        console.log('Applied unverified filter')
      }

      // Apply sorting
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' })

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)

      console.log('Executing main query with pagination:', { from, to, currentPage })

      const { data, error, count } = await query

      console.log('Query result:', { data, error, count, dataLength: data?.length })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      // Process users with report counts
      const processedUsers = (data as UserWithStats[] || []).map(user => ({
        ...user,
        total_reports: user.reports?.[0]?.count || 0
      }))

      console.log('Processed users:', processedUsers.length)

      setUsers(processedUsers)
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error('Error loading users:', error)
      showToast({
        type: 'error',
        message: 'Gagal memuat data pengguna'
      })
    } finally {
      setLoading(false)
    }
  }

  const UserService = {
    async update(id: number, updates: Partial<UserUpdate>): Promise<User> {
        const supabase = createClient()

        const updateData = {
            ...updates,
            updated_at: new Date().toISOString()
        }

        const { data, error } = await (supabase as any)
            .from('users')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()
        if (error) throw error
        return data as User
        },
    
    async getById(id: number): Promise<User | null> {
        const supabase = createClient()
        const { data, error } = await (supabase as any)
            .from('users')
            .select('*')
            .eq('id', id)
            .single()
        if (error) {
            if (error.code === 'PGRST116') return null // Not found
            throw error
        }
        return data as User
    },

    async delete(id: number): Promise<void> {
        const supabase = createClient()
        const { error } = await (supabase as any)
            .from('users')
            .delete()
            .eq('id', id)
        if (error) throw error
    },

    async create(user: Partial<User>): Promise<User> {
        const supabase = createClient()
        const { data, error } = await (supabase as any)
            .from('users')
            .insert(user)
            .select()
            .single()
        if (error) throw error
        return data as User
    }

    }

  const handleUpadateUser = async (data: UserForm) => {
    if (!selectedUser) return
    
    try {
      setActionLoading(true)
      
      const updateUser: UserUpdate = {
        name: data.name.trim(),
        phone: data.phone ? formatPhoneNumber(data.phone) : null,
        role: data.role.trim() as UserRole,
        is_phone_verified: data.is_phone_verified
      }

      await UserService.update(selectedUser.id, updateUser)

      showToast({
        type: 'success',
        message: 'Pengguna berhasil diperbarui'
      })
      
      setShowEditModal(false)
      loadUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      showToast({
        type: 'error',
        message: 'Gagal memperbarui pengguna'
      })
    } finally {
      setActionLoading(false)
    }
    }

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!filters.search) return users
    
    const searchLower = filters.search.toLowerCase()
    return users.filter(user =>
      user.name?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.phone?.includes(filters.search)
    )
  }, [users, filters.search])

  const handleViewDetail = (user: UserWithStats) => {
    setSelectedUser(user)
    setShowDetailModal(true)
  }

  const handleEditUser = (user: UserWithStats) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      role: user.role || 'user',
      is_phone_verified: user.is_phone_verified || false
    })
    setShowEditModal(true)
  }

  const handleDeleteUser = (user: UserWithStats) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const confirmDeleteUser = async () => {
    if (!selectedUser) return
    
    try {
      setActionLoading(true)
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', selectedUser.id)

      if (error) throw error

      showToast({
        type: 'success',
        message: 'Pengguna berhasil dihapus'
      })
      
      setShowDeleteModal(false)
      loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      showToast({
        type: 'error',
        message: 'Gagal menghapus pengguna'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const exportUsers = async () => {
    try {
      // Get all users for export
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Convert to CSV
      const csv = convertToCSV(data || [])
      
      // Download file
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      showToast({
        type: 'success',
        message: 'Data pengguna berhasil diekspor'
      })
    } catch (error) {
      console.error('Error exporting users:', error)
      showToast({
        type: 'error',
        message: 'Gagal mengekspor data pengguna'
      })
    }
  }

  const convertToCSV = (data: any[]) => {
    if (!data.length) return ''
    
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => 
      Object.values(row).map(v => 
        typeof v === 'string' ? `"${v}"` : v
      ).join(',')
    )
    
    return [headers, ...rows].join('\n')
  }

  const getRoleBadge = (role: UserRole | null) => {
    if (!role) return null
    const config = roleConfig[role]
    const Icon = config.icon
    
    return (
      <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', config.color)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    )
  }

  const getVerificationBadge = (isVerified: boolean | null) => {
    if (isVerified) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="h-3 w-3" />
          Verified
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        <XCircle className="h-3 w-3" />
        Unverified
      </span>
    )
  }

  if (loading && users.length === 0) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Manajemen Pengguna
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Kelola semua pengguna aplikasi
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportUsers}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {/* <Button */}
            {/* variant="primary" */}
            {/* size="sm" */}
          {/* > */}
            {/* <Plus className="h-4 w-4 mr-2" /> */}
            {/* Tambah Pengguna */}
          {/* </Button> */}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pengguna</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Admin</p>
              <p className="text-2xl font-bold">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Moderator</p>
              <p className="text-2xl font-bold">
                {users.filter(u => u.role === 'moderator').length}
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Verified</p>
              <p className="text-2xl font-bold">
                {users.filter(u => u.is_phone_verified).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama, email, atau nomor telepon..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Extended Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <select
                    value={filters.role}
                    onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">Semua</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="user">User</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">Semua</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Urutkan
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="created_at">Tanggal Daftar</option>
                    <option value="name">Nama</option>
                    <option value="email">Email</option>
                    <option value="role">Role</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Order
                  </label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="desc">Terbaru</option>
                    <option value="asc">Terlama</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pengguna</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Laporan</TableHead>
              <TableHead>Bergabung</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {user.name || 'Nama tidak tersedia'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {user.id}
                      </p>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">
                        {user.email}
                      </span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatPhoneForDisplay(user.phone)}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  {getRoleBadge(user.role)}
                </TableCell>
                
                <TableCell>
                  {getVerificationBadge(user.is_phone_verified)}
                </TableCell>
                
                <TableCell>
                  <span className="text-gray-900 dark:text-gray-100">
                    {user.total_reports || 0}
                  </span>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {formatDate(user.created_at || new Date().toISOString())}
                  </div>
                </TableCell>
                
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetail(user)}
                      className="p-1"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      className="p-1"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              Tidak ada pengguna yang ditemukan
            </p>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Halaman {currentPage} dari {totalPages}
          </p>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const page = i + 1
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              )
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pengguna</DialogTitle>
            <DialogClose onClick={() => setShowDetailModal(false)} />
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-medium">
                  {(selectedUser.name || selectedUser.email).charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {selectedUser.name || 'Nama tidak tersedia'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedUser.email}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {getRoleBadge(selectedUser.role)}
                    {getVerificationBadge(selectedUser.is_phone_verified)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">User ID</p>
                  <p className="font-medium">{selectedUser.id}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Auth ID</p>
                  <p className="font-medium">{selectedUser.auth_id || '-'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nomor Telepon</p>
                  <p className="font-medium">
                    {selectedUser.phone ? formatPhoneForDisplay(selectedUser.phone) : '-'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Laporan</p>
                  <p className="font-medium">{selectedUser.total_reports || 0}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bergabung</p>
                  <p className="font-medium">
                    {formatDate(selectedUser.created_at || new Date().toISOString())}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Terakhir Diperbarui</p>
                  <p className="font-medium">
                    {formatDate(selectedUser.updated_at || new Date().toISOString())}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailModal(false)}
                >
                  Tutup
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowDetailModal(false)
                    handleEditUser(selectedUser)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Pengguna
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogClose onClick={() => setShowEditModal(false)} />
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="+62 812-3456-7890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_phone_verified}
                    onChange={(e) => setEditForm(prev => ({ ...prev, is_phone_verified: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nomor Telepon Terverifikasi
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={actionLoading}
                >
                  Batal
                </Button>
                <Button
                type="button"
                variant="primary"
                onClick={() => handleUpadateUser(editForm)}
                loading={actionLoading}
                >
                Simpan Perubahan
                </Button>

              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogClose onClick={() => setShowDeleteModal(false)} />
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Apakah Anda yakin ingin menghapus pengguna <strong>{selectedUser.name || selectedUser.email}</strong>?
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={actionLoading}
                >
                  Batal
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmDeleteUser}
                  loading={actionLoading}
                >
                  Hapus Pengguna
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}