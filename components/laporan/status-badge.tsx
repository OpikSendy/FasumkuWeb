// components/laporan/status-badge.tsx

import { Badge } from '@/components/ui/badge'
import { Clock, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react'

interface StatusBadgeProps {
  status: 'Baru' | 'Menunggu' | 'Diproses' | 'Selesai'
  showIcon?: boolean
}
export type ReportStatus = StatusBadgeProps['status']

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Baru':
        return {
          variant: 'info' as const,
          icon: AlertCircle,
          text: 'Baru',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
        }
      case 'Menunggu':
        return {
          variant: 'warning' as const,
          icon: Clock,
          text: 'Menunggu',
          className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
        }
      case 'Diproses':
        return {
          variant: 'default' as const,
          icon: TrendingUp,
          text: 'Diproses',
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
        }
      case 'Selesai':
        return {
          variant: 'success' as const,
          icon: CheckCircle,
          text: 'Selesai',
          className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        }
      default:
        return {
          variant: 'default' as const,
          icon: AlertCircle,
          text: status,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.text}
    </span>
  )
}