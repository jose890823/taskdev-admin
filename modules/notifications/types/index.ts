// Notification Types - Admin Module

export type NotificationType =
  | 'enrollment_created' | 'enrollment_confirmed' | 'enrollment_expired' | 'enrollment_expiring_soon'
  | 'payment_received' | 'payment_failed' | 'payment_reminder' | 'refund_processed'
  | 'evaluation_available' | 'evaluation_graded' | 'evaluation_deadline'
  | 'certificate_issued' | 'certificate_expiring'
  | 'workshop_reminder' | 'workshop_registration' | 'workshop_cancelled' | 'workshop_certificate'
  | 'achievement_earned' | 'course_completed' | 'module_completed'
  | 'system_announcement' | 'account_security' | 'password_changed'
  | 'referral_used' | 'referral_reward'
  | 'welcome' | 'custom'

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push'
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
export type BroadcastAudience = 'all_users' | 'active_clients' | 'specific_users'

export interface Notification {
  id: string
  systemCode?: string
  userId: string
  type: NotificationType
  channel: NotificationChannel
  priority: NotificationPriority
  status: NotificationStatus
  title: string
  message: string
  actionUrl?: string | null
  actionText?: string | null
  icon?: string | null
  isRead: boolean
  readAt?: string | null
  sentAt?: string | null
  deliveredAt?: string | null
  failureReason?: string | null
  retryCount: number
  referenceId?: string | null
  referenceType?: string | null
  metadata?: Record<string, any> | null
  expiresAt?: string | null
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

// DTOs
export interface CreateNotificationDto {
  userId: string
  type: NotificationType
  title: string
  message: string
  channel?: NotificationChannel
  priority?: NotificationPriority
  actionUrl?: string
  actionText?: string
  icon?: string
  referenceId?: string
  referenceType?: string
  metadata?: Record<string, any>
}

export interface SendBroadcastDto {
  title: string
  message: string
  audience: BroadcastAudience
  courseId?: string
  userIds?: string[]
  priority?: NotificationPriority
  actionUrl?: string
  actionText?: string
  sendEmail?: boolean
}

export interface NotificationQueryDto {
  type?: NotificationType
  status?: NotificationStatus
  isRead?: boolean
  page?: number
  limit?: number
}

// Responses
export interface NotificationListResponse {
  data: Notification[]
  total: number
  unreadCount: number
  page: number
  limit: number
  totalPages: number
}

export interface BroadcastResponse {
  queued: number
  audience: string
}

export interface CleanExpiredResponse {
  deleted: number
}
