// admin-panel/app/api/export/routes.ts

import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import type { FacilityWithRelationsShip } from '@/types/database.types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'xlsx'
  const fromDate = searchParams.get('from')
  const toDate = searchParams.get('to')

  const supabase = await createServerClient()

  // ✅ Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ✅ Query facilities dengan relasi
  let query = supabase
    .from('facilities')
    .select(`
      id,
      name,
      description,
      address,
      created_at,
      updated_at,
      users (name, phone),
      categories (name),
      facility_types (name)
    `)
    .order('created_at', { ascending: false })

  if (fromDate) query = query.gte('created_at', fromDate)
  if (toDate) query = query.lte('created_at', toDate)

  // ✅ Cast hasil query supaya tidak jadi never
  const { data: facilities, error } = await query as unknown as {
    data: FacilityWithRelationsShip[] | null
    error: any
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ✅ Format data untuk export
  const exportData = facilities?.map(facility => ({
    ID: facility.id,
    Nama: facility.name ?? '',
    Deskripsi: facility.description ?? '',
    Alamat: facility.address ?? '',
    'Kategori Fasilitas': facility.categories?.name ?? '',
    'Tipe Fasilitas': facility.facility_types?.name ?? '',
    'Dibuat Oleh': facility.users?.name ?? '',
    'No. HP Pembuat': facility.users?.phone ?? '',
    'Tanggal Dibuat': facility.created_at
      ? new Date(facility.created_at).toLocaleString()
      : '',
    'Tanggal Diperbarui': facility.updated_at
      ? new Date(facility.updated_at).toLocaleString()
      : '',
  })) ?? []

  // ✅ Handle export XLSX
  if (format === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Fasilitas')

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="laporan-fasilitas-${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })
  }

  // ✅ Handle export CSV
  if (format === 'csv') {
    const ws = XLSX.utils.json_to_sheet(exportData)
    const csv = XLSX.utils.sheet_to_csv(ws)

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="laporan-fasilitas-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  }

  return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
}
