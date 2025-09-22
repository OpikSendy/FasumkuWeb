// hooks/use-realtime-typed.ts
'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database, Tables } from '@/types/database.types'

// Menggunakan TypeScript Generics untuk membuat hook ini type-safe
type TableName = keyof Database['public']['Tables']

interface UseRealtimeOptions<T extends TableName> {
  table: T
  filter?: string
  // Callback sekarang menerima record dengan tipe yang benar, bukan 'any'
  onInsert?: (newRecord: Tables<T>) => void
  onUpdate?: (newRecord: Tables<T>) => void
  onDelete?: (oldRecord: Tables<T>) => void
}

export function useRealtime<T extends TableName>({
  table,
  filter,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeOptions<T>) {
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    // Menetapkan tipe payload secara spesifik
    const handleChanges = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
      switch (payload.eventType) {
        case 'INSERT':
          // Kita kirim 'payload.new' yang sudah memiliki tipe yang benar
          onInsert?.(payload.new as Tables<T>)
          break
        case 'UPDATE':
          onUpdate?.(payload.new as Tables<T>)
          break
        case 'DELETE':
          // Untuk DELETE, Supabase menyediakan data lama di 'payload.old'
          onDelete?.(payload.old as Tables<T>)
          break
      }
    }

    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter,
        },
        handleChanges // Menggunakan fungsi handler yang sudah di-type
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [supabase, table, filter, onInsert, onUpdate, onDelete])

  return channelRef.current
}