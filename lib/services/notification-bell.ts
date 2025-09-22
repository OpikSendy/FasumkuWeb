// // lib/services/notification.service.ts

// // import { createClient } from '@/lib/supabase/client'
// import type { NotificationInsert } from '@/types/database.types'
// import { createClient } from '../supabase/client'

// export class NotificationService {
//   private supabase = createClient()

//   async createReportNotification(reportData: {
//     id: number
//     title: string
//     user_name?: string
//     priority?: string
//     location?: string
//   }) {
//     const isUrgent = reportData.priority === 'Mendesak' || reportData.priority === 'Tinggi'
    
//     const notification: NotificationInsert = {
//       title: isUrgent ? '🚨 Laporan Mendesak Masuk!' : '📝 Laporan Baru Masuk',
//       message: `${reportData.title} - Dilaporkan oleh ${reportData.user_name || 'Pengguna'} ${reportData.location ? `di ${reportData.location}` : ''}`,
//       type: isUrgent ? 'urgent_report' : 'new_report',
//       data: {
//         report_id: reportData.id,
//         priority: reportData.priority,
//         location: reportData.location
//       },
//       is_read: false
//     }

//     const { error } = await this.supabase
//       .from('notifications')
//       .insert(notification)

//     if (error) {
//       console.error('Error creating notification:', error)
//     }
//   }

//   async createStatusChangeNotification(reportData: {
//     id: number
//     title: string
//     old_status: string
//     new_status: string
//     changed_by?: string
//   }) {
//     const notification: NotificationInsert = {
//       title: '🔄 Status Laporan Diubah',
//       message: `"${reportData.title}" diubah dari ${reportData.old_status} ke ${reportData.new_status} ${reportData.changed_by ? `oleh ${reportData.changed_by}` : ''}`,
//       type: 'report_status_change',
//       data: {
//         report_id: reportData.id,
//         old_status: reportData.old_status,
//         new_status: reportData.new_status
//       },
//       is_read: false
//     }

//     const { error } = await this.supabase
//       .from('notifications')
//       .insert(notification)

//     if (error) {
//       console.error('Error creating status change notification:', error)
//     }
//   }

//   // Untuk memanggil dari edge function atau trigger
//   static async createFromTrigger(notificationData: NotificationInsert) {
//     const supabase = createClient()
    
//     const { error } = await supabase
//       .from('notifications')
//       .insert(notificationData)

//     return { error }
//   }
// }
