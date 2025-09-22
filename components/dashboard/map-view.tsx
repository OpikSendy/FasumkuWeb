// components/dashboard/map-view.tsx
'use client'

import { Card } from '@/components/ui/card'
import { MapPin, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import untuk menghindari SSR issues dengan Leaflet
const LeafletMap = dynamic(() => import('./leaflet-map'), { 
  ssr: false,
  loading: () => (
    <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  )
})

interface MapViewProps {
  reports: Array<{
    id: string
    title: string
    latitude: number
    longitude: number
    status: string
    category: string
  }>
  loading?: boolean
}

export function MapView({ reports, loading = false }: MapViewProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse dark:bg-gray-700 mb-4" />
        <div className="h-80 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Peta Laporan
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="h-4 w-4" />
          {reports.length} lokasi
        </div>
      </div>
      
      <div className="h-80 rounded-lg overflow-hidden">
        <LeafletMap reports={reports} />
      </div>
    </Card>
  )
}