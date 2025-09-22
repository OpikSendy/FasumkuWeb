// components/dashboard/stats-card.tsx
'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { motion } from 'framer-motion'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: React.ReactNode
  color?: string
  loading?: boolean
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  color = 'blue',
  loading = false
}: StatsCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
  }

  const changeIcon = {
    increase: <TrendingUp className="h-4 w-4" />,
    decrease: <TrendingDown className="h-4 w-4" />,
    neutral: <Minus className="h-4 w-4" />,
  }

  const changeColor = {
    increase: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    decrease: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
    neutral: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30',
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
          </div>
          <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse dark:bg-gray-700" />
        </div>
        {change !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
          </div>
        )}
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
            </p>
          </div>
          <div className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r text-white shadow-lg",
            colorClasses[color as keyof typeof colorClasses]
          )}>
            {icon}
          </div>
        </div>
        
        {change !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              changeColor[changeType]
            )}>
              {changeIcon[changeType]}
              {Math.abs(change)}%
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              dari bulan lalu
            </span>
          </div>
        )}
      </Card>
    </motion.div>
  )
}