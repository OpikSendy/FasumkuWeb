// components/laporan/report-table.tsx

'use client'

import { useState } from 'react'
import { 
  Eye, Edit, Trash2, MapPin, User, Calendar, 
  ChevronLeft, ChevronRight, AlertTriangle, FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/laporan/status-badge'
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table'
import { formatDate, truncateText } from '@/lib/utils'
import type { ReportWithRelations } from '@/types/database.types'
import { motion } from 'framer-motion'
import type { Enums } from "@/types/database.types"


// Tambahkan helper type agar sesuai dengan StatusBadge
export type ReportStatus = Enums<"report_status">

interface ReportTableProps {
  reports: ReportWithRelations[]
  onViewDetail: (report: ReportWithRelations) => void
  onUpdateStatus: (report: ReportWithRelations) => void
  onDelete: (reportId: number) => void
}

const ITEMS_PER_PAGE = 10

const priorityColors = {
  'Rendah': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  'Sedang': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'Tinggi': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Mendesak': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export function ReportTable({ reports, onViewDetail, onUpdateStatus, onDelete }: ReportTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'created_at' | 'status' | 'priority'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Sort reports
  const sortedReports = [...reports].sort((a, b) => {
    let aValue: any = a[sortBy]
    let bValue: any = b[sortBy]

    if (sortBy === 'created_at') {
      aValue = aValue ? new Date(aValue).getTime() : 0
      bValue = bValue ? new Date(bValue).getTime() : 0
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedReports.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentReports = sortedReports.slice(startIndex, endIndex)

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Tidak ada laporan
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Belum ada laporan yang sesuai dengan filter yang dipilih.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>
                <button onClick={() => handleSort('created_at')} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-gray-100">
                  Laporan
                  {sortBy === 'created_at' && <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </TableHead>
              <TableHead>Pelapor</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>
                <button onClick={() => handleSort('priority')} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-gray-100">
                  Prioritas
                  {sortBy === 'priority' && <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort('status')} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-gray-100">
                  Status
                  {sortBy === 'status' && <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
              </TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentReports.map((report, index) => (
              <motion.tr
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <TableCell className="font-medium text-gray-500 dark:text-gray-400">
                  {startIndex + index + 1}
                </TableCell>

                {/* Laporan */}
                <TableCell>
                  <div className="space-y-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                      {report.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {truncateText(report.description ?? '', 80)}
                    </p>
                    {report.location_name && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-32">{report.location_name}</span>
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Pelapor */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-medium">
                      {report.user?.name?.charAt(0) || report.user?.email?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {report.user?.name || 'Pengguna'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                        {report.user?.email}
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* Kategori */}
                <TableCell>
                  <Badge variant="default" className="text-xs">
                    {report.category?.name ?? 'Tidak ada kategori'}
                  </Badge>
                </TableCell>

                {/* Prioritas */}
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    priorityColors[report.priority as keyof typeof priorityColors]
                  }`}>
                    {report.priority === 'Mendesak' && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {report.priority}
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge status={(report.status as ReportStatus) ?? 'Baru'} />
                </TableCell>

                {/* Tanggal */}
                <TableCell>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {report.created_at ? formatDate(report.created_at) : "-"}
                    </div>
                  </div>
                </TableCell>

                {/* Aksi */}
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetail(report)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Lihat Detail"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdateStatus(report)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Update Status"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(report.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Menampilkan {startIndex + 1} - {Math.min(endIndex, reports.length)} dari {reports.length} laporan
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber
                if (totalPages <= 5) {
                  pageNumber = i + 1
                } else if (currentPage <= 3) {
                  pageNumber = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i
                } else {
                  pageNumber = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNumber}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNumber}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1"
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
