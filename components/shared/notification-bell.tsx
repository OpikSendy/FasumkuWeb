// // 1. Update notification-bell.tsx untuk admin
// 'use client'

// import { Bell } from 'lucide-react'
// import { cn } from '@/lib/utils'
// import { useState, useEffect, useRef } from 'react'
// import { createClient } from '@/lib/supabase/client'
// import { usePathname } from 'next/navigation'
// import { Badge } from '@/components/ui/badge'
// import { Button } from '@/components/ui/button'
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuTrigger,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuItem,
// } from '@/components/ui/dropdown-menu'

// interface NotificationItem {
//   id: number
//   title: string
//   message: string
//   type: string
//   data: any
//   is_read: boolean
//   created_at: string
// }

// export function AdminNotificationBell() {
//   const [notifications, setNotifications] = useState<NotificationItem[]>([])
//   const [unreadCount, setUnreadCount] = useState(0)
//   const [isOpen, setIsOpen] = useState(false)
//   const supabase = useRef(createClient())
//   const pathname = usePathname()
//   const channelRef = useRef<string | null>(null)
//   const subscriptionRef = useRef<any>(null)

//   useEffect(() => {
//     const fetchNotifications = async () => {
//       // Ambil notifikasi khusus untuk admin (laporan baru, status change, dll)
//       const { data, error } = await supabase.current
//         .from('notifications')
//         .select('*')
//         .in('type', ['new_report', 'report_status_change', 'urgent_report'])
//         .order('created_at', { ascending: false })
//         .limit(10)

//       if (error) {
//         console.error('Error fetching notifications:', error)
//       } else {
//         setNotifications(data || [])
//         setUnreadCount(data?.filter(n => !n.is_read).length || 0)
//       }
//     }

//     fetchNotifications()

//     // Subscribe untuk real-time notifications
//     const channel = `admin:notifications`
//     channelRef.current = channel

//     subscriptionRef.current = supabase.current
//       .channel(channel)
//       .on(
//         'postgres_changes',
//         { 
//           event: 'INSERT', 
//           schema: 'public', 
//           table: 'notifications',
//           filter: 'type=in.(new_report,report_status_change,urgent_report)'
//         },
//         (payload) => {
//           const newNotification = payload.new as NotificationItem
//           setNotifications(prev => [newNotification, ...prev.slice(0, 9)])
//           setUnreadCount(count => count + 1)
          
//           // Tampilkan browser notification jika diizinkan
//           if (Notification.permission === 'granted') {
//             new Notification(newNotification.title, {
//               body: newNotification.message,
//               icon: '/favicon.ico'
//             })
//           }
//         }
//       )
//       .subscribe()

//     // Request notification permission
//     if (Notification.permission === 'default') {
//       Notification.requestPermission()
//     }

//     return () => {
//       if (subscriptionRef.current) {
//         supabase.current.removeChannel(subscriptionRef.current)
//       }
//       channelRef.current = null
//       subscriptionRef.current = null
//     }
//   }, [])

//   const markAsRead = async (notificationId: number) => {
//     const { error } = await supabase.current
//       .from('notifications')
//       .update({ is_read: true })
//       .eq('id', notificationId)

//     if (!error) {
//       setNotifications(prev => 
//         prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
//       )
//       setUnreadCount(prev => Math.max(0, prev - 1))
//     }
//   }

//   const markAllAsRead = async () => {
//     const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    
//     if (unreadIds.length === 0) return

//     const { error } = await supabase.current
//       .from('notifications')
//       .update({ is_read: true })
//       .in('id', unreadIds)

//     if (!error) {
//       setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
//       setUnreadCount(0)
//     }
//   }

//   const getNotificationIcon = (type: string) => {
//     switch (type) {
//       case 'new_report': return '📝'
//       case 'urgent_report': return '🚨'
//       case 'report_status_change': return '🔄'
//       default: return '📢'
//     }
//   }

//   const handleNotificationClick = (notification: NotificationItem) => {
//     markAsRead(notification.id)
    
//     // Navigate berdasarkan tipe notifikasi
//     if (notification.data?.report_id) {
//       window.location.href = `/laporan/${notification.data.report_id}`
//     }
    
//     setIsOpen(false)
//   }

//   return (
//     <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
//       <DropdownMenuTrigger asChild>
//         <Button 
//           variant="ghost" 
//           size="sm"
//           className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
//         >
//           <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
//           {unreadCount > 0 && (
//             <Badge 
//               className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600 hover:bg-red-600"
//             >
//               {unreadCount > 9 ? '9+' : unreadCount}
//             </Badge>
//           )}
//         </Button>
//       </DropdownMenuTrigger>
      
//       <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
//         <div className="flex items-center justify-between px-4 py-2">
//           <DropdownMenuLabel>Notifikasi Admin</DropdownMenuLabel>
//           {unreadCount > 0 && (
//             <Button 
//               variant="ghost" 
//               size="sm" 
//               onClick={markAllAsRead}
//               className="text-xs"
//             >
//               Tandai Semua Dibaca
//             </Button>
//           )}
//         </div>
        
//         <DropdownMenuSeparator />
        
//         {notifications.length === 0 ? (
//           <div className="px-4 py-8 text-center text-gray-500">
//             Tidak ada notifikasi
//           </div>
//         ) : (
//           notifications.map((notification) => (
//             <DropdownMenuItem
//               key={notification.id}
//               className={cn(
//                 "flex flex-col items-start gap-1 p-4 cursor-pointer",
//                 !notification.is_read && "bg-blue-50 dark:bg-blue-950/50"
//               )}
//               onClick={() => handleNotificationClick(notification)}
//             >
//               <div className="flex items-start gap-2 w-full">
//                 <span className="text-lg">{getNotificationIcon(notification.type)}</span>
//                 <div className="flex-1 min-w-0">
//                   <p className={cn(
//                     "text-sm font-medium truncate",
//                     !notification.is_read && "font-semibold"
//                   )}>
//                     {notification.title}
//                   </p>
//                   <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
//                     {notification.message}
//                   </p>
//                   <p className="text-xs text-gray-500 mt-1">
//                     {new Date(notification.created_at).toLocaleString('id-ID')}
//                   </p>
//                 </div>
//                 {!notification.is_read && (
//                   <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
//                 )}
//               </div>
//             </DropdownMenuItem>
//           ))
//         )}
//       </DropdownMenuContent>
//     </DropdownMenu>
//   )
// }

// // 2. Service untuk membuat notifikasi otomatis

// // 3. Database Trigger SQL (untuk dijalankan di Supabase)
// /*
// -- Function untuk membuat notifikasi otomatis
// CREATE OR REPLACE FUNCTION create_report_notification()
// RETURNS TRIGGER AS $$
// BEGIN
//   -- Hanya untuk laporan baru
//   IF TG_OP = 'INSERT' THEN
//     INSERT INTO notifications (title, message, type, data, is_read)
//     VALUES (
//       CASE 
//         WHEN NEW.priority IN ('Mendesak', 'Tinggi') THEN '🚨 Laporan Mendesak Masuk!'
//         ELSE '📝 Laporan Baru Masuk'
//       END,
//       NEW.title || ' - ' || COALESCE(NEW.location_name, 'Lokasi tidak diketahui'),
//       CASE 
//         WHEN NEW.priority IN ('Mendesak', 'Tinggi') THEN 'urgent_report'
//         ELSE 'new_report'
//       END,
//       json_build_object(
//         'report_id', NEW.id,
//         'priority', NEW.priority,
//         'location', NEW.location_name,
//         'user_id', NEW.user_id
//       ),
//       false
//     );
//   END IF;

//   -- Untuk perubahan status
//   IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
//     INSERT INTO notifications (title, message, type, data, is_read)
//     VALUES (
//       '🔄 Status Laporan Diubah',
//       '"' || NEW.title || '" diubah dari ' || COALESCE(OLD.status, 'Baru') || ' ke ' || COALESCE(NEW.status, 'Baru'),
//       'report_status_change',
//       json_build_object(
//         'report_id', NEW.id,
//         'old_status', OLD.status,
//         'new_status', NEW.status
//       ),
//       false
//     );
//   END IF;

//   RETURN NEW;
// END;
// $$ LANGUAGE plpgsql;

// -- Trigger untuk laporan baru
// CREATE TRIGGER reports_notification_trigger
//   AFTER INSERT OR UPDATE ON reports
//   FOR EACH ROW
//   EXECUTE FUNCTION create_report_notification();
// */

// // 4. Hook untuk menggunakan notifikasi
