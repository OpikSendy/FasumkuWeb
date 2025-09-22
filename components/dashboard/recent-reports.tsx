// components/dashboard/recent-reports.tsx
'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/laporan/status-badge'
import { formatDate } from '@/lib/utils'
import { FileText, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import type { ReportWithRelations } from '@/types/database.types'

// Sama seperti di report-table.tsx
type ReportStatus = "Baru" | "Menunggu" | "Diproses" | "Selesai"

interface RecentReportsProps {
  reports: ReportWithRelations[]
  loading?: boolean
}

export function RecentReports({ reports, loading = false }: RecentReportsProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 border rounded-lg border-gray-200 dark:border-gray-700"
            >
              <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
                <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Laporan Terbaru
        </h3>
        <Link
          href="/laporan"
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Lihat Semua
        </Link>
      </div>

      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada laporan</p>
          </div>
        ) : (
          reports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/laporan/${report.id}`}>
                <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                      {report.category?.name?.charAt(0) ?? "?"}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {report.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {report.created_at ? formatDate(report.created_at) : "-"}
                      </span>
                      {report.location_name && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-24">
                            {report.location_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={(report.status as ReportStatus) ?? "Baru"} />
                    <Badge variant="default" className="text-xs">
                      {report.category?.name ?? "Tidak ada kategori"}
                    </Badge>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </Card>
  )
}
