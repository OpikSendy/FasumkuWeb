// admin-panel/components/laporan/update-status-form.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { StatusBadge, type ReportStatus } from '@/components/laporan/status-badge'
import { AlertCircle, CheckCircle, Clock, Play } from 'lucide-react'
import { motion } from 'framer-motion'

// Props type
interface UpdateStatusFormProps {
  report: {
    id: number
    title: string
    status: string | null
    admin_notes: string | null
    category?: { name: string } | null
  }
  onSubmit: (reportId: number, status: ReportStatus, notes?: string) => Promise<void>
  onCancel: () => void
}

// Helper untuk konversi status string/null → ReportStatus
function safeStatus(status: string | null): ReportStatus {
  if (status === 'Menunggu' || status === 'Diproses' || status === 'Selesai') {
    return status
  }
  return 'Baru'
}

// Pilihan status
const statusOptions: {
  value: ReportStatus
  label: string
  description: string
  icon: any
  color: string
}[] = [
  {
    value: 'Baru',
    label: 'Baru',
    description: 'Laporan baru masuk dan belum diproses',
    icon: AlertCircle,
    color: 'text-blue-600 dark:text-blue-400'
  },
  {
    value: 'Menunggu',
    label: 'Menunggu',
    description: 'Laporan sedang menunggu tindakan atau verifikasi',
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400'
  },
  {
    value: 'Diproses',
    label: 'Diproses',
    description: 'Laporan sedang dalam proses penanganan',
    icon: Play,
    color: 'text-orange-600 dark:text-orange-400'
  },
  {
    value: 'Selesai',
    label: 'Selesai',
    description: 'Laporan telah selesai ditangani',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400'
  }
]

export function UpdateStatusForm({ report, onSubmit, onCancel }: UpdateStatusFormProps) {
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus>(safeStatus(report.status))
  const [adminNotes, setAdminNotes] = useState(report.admin_notes ?? '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedStatus === safeStatus(report.status) && adminNotes === (report.admin_notes ?? '')) {
      onCancel()
      return
    }

    setLoading(true)
    try {
      await onSubmit(report.id, selectedStatus, adminNotes.trim() || undefined)
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Report Info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
          {report.title}
        </h4>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>ID: {report.id.toString()}</span>
          <span>•</span>
          <span>Kategori: {report.category?.name ?? 'Tidak ada kategori'}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <span>Status saat ini:</span>
            <StatusBadge status={safeStatus(report.status)} />
          </div>
        </div>
      </div>

      {/* Status Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Pilih Status Baru
        </label>
        <div className="grid grid-cols-1 gap-3">
          {statusOptions.map((option, index) => {
            const Icon = option.icon
            const isSelected = selectedStatus === option.value
            const isCurrentStatus = safeStatus(report.status) === option.value

            return (
              <motion.div
                key={option.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <label className="relative">
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => setSelectedStatus(option.value)}
                    className="sr-only"
                  />
                  <div
                    className={`
                      flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                      ${isCurrentStatus ? 'bg-gray-100 dark:bg-gray-800' : ''}
                    `}
                  >
                    <div className={`flex-shrink-0 mt-0.5 ${option.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          {option.label}
                        </h5>
                        {isCurrentStatus && (
                          <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                            Status Saat Ini
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {option.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Admin Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Catatan Admin (Opsional)
        </label>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={4}
          placeholder="Tambahkan catatan..."
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 resize-none"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Catatan ini akan terlihat oleh pelapor dan admin lainnya
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Batal
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={
            loading ||
            (selectedStatus === safeStatus(report.status) &&
              adminNotes === (report.admin_notes ?? ''))
          }
        >
          {loading ? 'Memperbarui...' : 'Perbarui Status'}
        </Button>
      </div>

      {/* Status Change Preview */}
      {selectedStatus !== safeStatus(report.status) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Perubahan Status</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400">Dari:</span>
              <StatusBadge status={safeStatus(report.status)} />
            </div>
            <span className="text-gray-400">→</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400">Ke:</span>
              <StatusBadge status={selectedStatus} />
            </div>
          </div>
        </motion.div>
      )}
    </form>
  )
}
