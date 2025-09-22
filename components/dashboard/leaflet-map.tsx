// admin-panel/components/dashboard/leaflet-map.tsx

'use client'

import { useEffect, useState } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface LeafletMapProps {
  reports: Array<{
    id: string
    title: string
    latitude: number
    longitude: number
    status: string
    category: string
  }>
}

// Status colors for markers
const statusColors = {
  'Baru': '#3B82F6',
  'Menunggu': '#F59E0B', 
  'Diproses': '#F97316',
  'Selesai': '#10B981'
}

export default function LeafletMap({ reports }: LeafletMapProps) {
  const [map, setMap] = useState<L.Map | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initialize map
    const mapInstance = L.map('map', {
      center: [-7.7956, 110.3695], // Yogyakarta coordinates
      zoom: 13,
      zoomControl: true,
    })

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance)

    setMap(mapInstance)

    return () => {
      mapInstance.remove()
    }
  }, [])

  useEffect(() => {
    if (!map || !reports.length) return

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer)
      }
    })

    // Add markers for each report
    const markers: L.Marker[] = []
    
    reports.forEach((report) => {
      if (report.latitude && report.longitude) {
        // Create custom icon based on status
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: ${statusColors[report.status as keyof typeof statusColors] || '#6B7280'};
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              color: white;
              font-weight: bold;
            ">
              ${report.category.charAt(0)}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        const marker = L.marker([report.latitude, report.longitude], {
          icon: customIcon
        }).addTo(map)

        // Add popup
        marker.bindPopup(`
          <div style="max-width: 200px;">
            <h4 style="margin: 0 0 8px 0; font-weight: 600; color: #111827;">
              ${report.title}
            </h4>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6B7280;">
              Kategori: ${report.category}
            </p>
            <p style="margin: 0; font-size: 12px;">
              Status: <span style="
                background-color: ${statusColors[report.status as keyof typeof statusColors]}20;
                color: ${statusColors[report.status as keyof typeof statusColors]};
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 500;
              ">${report.status}</span>
            </p>
          </div>
        `)

        markers.push(marker)
      }
    })

    // Fit map to markers if there are any
    if (markers.length > 0) {
      const group = L.featureGroup(markers)
      map.fitBounds(group.getBounds().pad(0.1))
    }

  }, [map, reports])

  return <div id="map" style={{ height: '100%', width: '100%' }} />
}