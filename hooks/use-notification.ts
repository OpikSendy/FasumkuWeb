// hooks/useAdminNotifications.ts

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAdminNotifications() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial count
    const fetchCount = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .in('type', ['new_report', 'urgent_report', 'report_status_change'])
        .eq('is_read', false)

      if (!error) {
        setUnreadCount(data?.length || 0)
      }
    }

    fetchCount()

    // Subscribe untuk real-time updates
    const subscription = supabase
      .channel('admin_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: 'type=in.(new_report,urgent_report,report_status_change)'
      }, () => {
        fetchCount() // Refresh count
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { unreadCount, notifications }
}