// admin-panel/lib/constans.ts

export const REPORT_STATUS = {
  BARU: 'Baru',
  MENUNGGU: 'Menunggu',
  DIPROSES: 'Diproses',
  SELESAI: 'Selesai',
} as const

export const REPORT_CATEGORIES = {
  INFRASTRUKTUR: 'Infrastruktur',
  KEBERSIHAN: 'Kebersihan',
  KEAMANAN: 'Keamanan',
  TRANSPORTASI: 'Transportasi',
  LINGKUNGAN: 'Lingkungan',
  LAINNYA: 'Lainnya',
} as const

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
} as const

export const PRIORITY_LEVELS = {
  LOW: 'Rendah',
  MEDIUM: 'Sedang',
  HIGH: 'Tinggi',
  URGENT: 'Mendesak',
} as const

export const STATUS_COLORS = {
  [REPORT_STATUS.BARU]: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-400',
    icon: '🆕',
  },
  [REPORT_STATUS.MENUNGGU]: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-400',
    icon: '⏳',
  },
  [REPORT_STATUS.DIPROSES]: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-800 dark:text-orange-400',
    icon: '🔧',
  },
  [REPORT_STATUS.SELESAI]: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-400',
    icon: '✅',
  },
} as const

export const PRIORITY_COLORS = {
  [PRIORITY_LEVELS.LOW]: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-800 dark:text-gray-400',
  },
  [PRIORITY_LEVELS.MEDIUM]: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-400',
  },
  [PRIORITY_LEVELS.HIGH]: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-800 dark:text-orange-400',
  },
  [PRIORITY_LEVELS.URGENT]: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-400',
  },
} as const

export const ITEMS_PER_PAGE = 20
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export const API_ENDPOINTS = {
  REPORTS: '/api/reports',
  CATEGORIES: '/api/categories',
  USERS: '/api/users',
  EXPORT: '/api/export',
  UPLOAD: '/api/upload',
  NOTIFICATIONS: '/api/notifications',
} as const